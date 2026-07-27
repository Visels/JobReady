import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import {
  adjustEntitlement,
  consumeReservation,
  EntitlementLedgerError,
  expireEntitlement,
  getEntitlementReconciliation,
  grantEntitlement,
  isFreeJobAction,
  legacyVisaCreditsForDisplay,
  refundConsumption,
  releaseReservation,
  requiresPaidEntitlement,
  reserveEntitlement,
} from "../src/lib/entitlements";
import { prisma } from "../src/lib/prisma";

function assertLocalDatabase() {
  assert.equal(
    process.env.JOBREADY_ALLOW_DB_TESTS,
    "true",
    "Set JOBREADY_ALLOW_DB_TESTS=true to run ledger database tests.",
  );

  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for ledger database tests.");

  const parsed = new URL(databaseUrl);
  assert.ok(
    ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname),
    `Refusing to run ledger database tests against non-local host: ${parsed.hostname}`,
  );
}

function assertInsufficientBalance(result: PromiseSettledResult<unknown>) {
  assert.equal(result.status, "rejected");
  assert.ok(result.reason instanceof EntitlementLedgerError);
  assert.equal(result.reason.code, "insufficient_balance");
}

async function createFixtureUser() {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      name: "Ledger Test Candidate",
      email: `ledger-test-${randomUUID()}@example.test`,
      credits: 2,
    },
    select: { id: true, credits: true },
  });
}

async function main() {
  assertLocalDatabase();

  const user = await createFixtureUser();
  const prefix = `ledger-test:${user.id}`;
  const reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  try {
    assert.equal(requiresPaidEntitlement("interview"), true);
    assert.equal(requiresPaidEntitlement("tailoring"), true);
    assert.equal(requiresPaidEntitlement("browse_jobs"), false);
    assert.equal(requiresPaidEntitlement("open_application_link"), false);
    assert.equal(isFreeJobAction("save_job"), true);
    assert.equal(legacyVisaCreditsForDisplay(user), user.credits);

    const grant = await grantEntitlement({
      userId: user.id,
      productAction: "interview",
      units: 1,
      idempotencyKey: `${prefix}:interview:grant:1`,
      metadata: { test: "concurrent-reservation" },
    });
    assert.equal(grant.created, true);
    assert.equal(grant.reconciliation.balance, 1);

    const duplicateGrant = await grantEntitlement({
      userId: user.id,
      productAction: "interview",
      units: 1,
      idempotencyKey: `${prefix}:interview:grant:1`,
      metadata: { test: "concurrent-reservation" },
    });
    assert.equal(duplicateGrant.created, false);
    assert.equal(duplicateGrant.entry.id, grant.entry.id);
    assert.equal(duplicateGrant.reconciliation.balance, 1);

    const concurrentReservations = await Promise.allSettled([
      reserveEntitlement({
        userId: user.id,
        productAction: "interview",
        units: 1,
        idempotencyKey: `${prefix}:interview:reserve:a`,
        expiresAt: reservationExpiresAt,
      }),
      reserveEntitlement({
        userId: user.id,
        productAction: "interview",
        units: 1,
        idempotencyKey: `${prefix}:interview:reserve:b`,
        expiresAt: reservationExpiresAt,
      }),
    ]);

    const successfulReservations = concurrentReservations.filter(
      (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof reserveEntitlement>>> =>
        result.status === "fulfilled",
    );
    const failedReservations = concurrentReservations.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    assert.equal(successfulReservations.length, 1);
    assert.equal(failedReservations.length, 1);
    assertInsufficientBalance(failedReservations[0]);

    const reservation = successfulReservations[0].value.entry;
    assert.equal(successfulReservations[0].value.reconciliation.balance, 0);
    assert.equal(successfulReservations[0].value.reconciliation.openReservationUnits, 1);

    const consume = await consumeReservation({
      userId: user.id,
      productAction: "interview",
      relatedEntryId: reservation.id,
      idempotencyKey: `${prefix}:interview:consume:report`,
      metadata: { operation: "report-generation" },
    });
    assert.equal(consume.created, true);
    assert.equal(consume.reconciliation.balance, 0);
    assert.equal(consume.reconciliation.totals.consumed, 1);
    assert.equal(consume.reconciliation.openReservationUnits, 0);

    const sameConsumeRetry = await consumeReservation({
      userId: user.id,
      productAction: "interview",
      relatedEntryId: reservation.id,
      idempotencyKey: `${prefix}:interview:consume:report`,
      metadata: { operation: "report-generation-retry" },
    });
    assert.equal(sameConsumeRetry.created, false);
    assert.equal(sameConsumeRetry.entry.id, consume.entry.id);
    assert.equal(sameConsumeRetry.reconciliation.totals.consumed, 1);

    const differentConsumeRetry = await consumeReservation({
      userId: user.id,
      productAction: "interview",
      relatedEntryId: reservation.id,
      idempotencyKey: `${prefix}:interview:consume:failed-report-retry`,
      metadata: { operation: "failed-report-retry" },
    });
    assert.equal(differentConsumeRetry.created, false);
    assert.equal(differentConsumeRetry.entry.id, consume.entry.id);
    assert.equal(differentConsumeRetry.reconciliation.totals.consumed, 1);
    assert.equal(differentConsumeRetry.reconciliation.balance, 0);

    const refund = await refundConsumption({
      userId: user.id,
      productAction: "interview",
      relatedEntryId: consume.entry.id,
      idempotencyKey: `${prefix}:interview:refund:1`,
      metadata: { reason: "manual-test-refund" },
    });
    assert.equal(refund.created, true);
    assert.equal(refund.reconciliation.balance, 1);

    const duplicateRefund = await refundConsumption({
      userId: user.id,
      productAction: "interview",
      relatedEntryId: consume.entry.id,
      idempotencyKey: `${prefix}:interview:refund:retry`,
      metadata: { reason: "duplicate-refund-guard" },
    });
    assert.equal(duplicateRefund.created, false);
    assert.equal(duplicateRefund.entry.id, refund.entry.id);
    assert.equal(duplicateRefund.reconciliation.balance, 1);

    const expiryGrant = await grantEntitlement({
      userId: user.id,
      productAction: "interview",
      units: 2,
      idempotencyKey: `${prefix}:interview:grant:expires`,
      expiresAt: new Date(Date.now() - 60_000),
      metadata: { test: "expiry" },
    });
    assert.equal(expiryGrant.reconciliation.balance, 3);

    const expiry = await expireEntitlement({
      userId: user.id,
      productAction: "interview",
      relatedEntryId: expiryGrant.entry.id,
      units: 1,
      idempotencyKey: `${prefix}:interview:expire:1`,
      metadata: { reason: "expired-test-unit" },
    });
    assert.equal(expiry.created, true);
    assert.equal(expiry.reconciliation.balance, 2);

    const negativeAdjustment = await adjustEntitlement({
      userId: user.id,
      productAction: "interview",
      units: -1,
      idempotencyKey: `${prefix}:interview:adjust:-1`,
      reason: "test negative adjustment",
    });
    assert.equal(negativeAdjustment.reconciliation.balance, 1);

    const positiveAdjustment = await adjustEntitlement({
      userId: user.id,
      productAction: "interview",
      units: 1,
      idempotencyKey: `${prefix}:interview:adjust:+1`,
      reason: "test positive adjustment",
    });
    assert.equal(positiveAdjustment.reconciliation.balance, 2);

    const tailoringGrant = await grantEntitlement({
      userId: user.id,
      productAction: "tailoring",
      units: 1,
      idempotencyKey: `${prefix}:tailoring:grant:1`,
      metadata: { test: "failed-tailoring-release" },
    });
    assert.equal(tailoringGrant.reconciliation.balance, 1);

    const tailoringReservation = await reserveEntitlement({
      userId: user.id,
      productAction: "tailoring",
      units: 1,
      idempotencyKey: `${prefix}:tailoring:reserve:1`,
      expiresAt: reservationExpiresAt,
      metadata: { operation: "cv-tailoring" },
    });
    assert.equal(tailoringReservation.reconciliation.balance, 0);
    assert.equal(tailoringReservation.reconciliation.openReservationUnits, 1);

    const tailoringRelease = await releaseReservation({
      userId: user.id,
      productAction: "tailoring",
      relatedEntryId: tailoringReservation.entry.id,
      idempotencyKey: `${prefix}:tailoring:release:failed-run`,
      metadata: { failure: "model-timeout" },
    });
    assert.equal(tailoringRelease.created, true);
    assert.equal(tailoringRelease.reconciliation.balance, 1);
    assert.equal(tailoringRelease.reconciliation.openReservationUnits, 0);

    const tailoringRetryReservation = await reserveEntitlement({
      userId: user.id,
      productAction: "tailoring",
      units: 1,
      idempotencyKey: `${prefix}:tailoring:reserve:retry-after-release`,
      expiresAt: reservationExpiresAt,
    });
    assert.equal(tailoringRetryReservation.created, true);
    assert.equal(tailoringRetryReservation.reconciliation.balance, 0);

    const finalInterviewReconciliation = await getEntitlementReconciliation({
      userId: user.id,
      productAction: "interview",
    });
    assert.equal(
      finalInterviewReconciliation.balance,
      finalInterviewReconciliation.displayedBalance,
    );
    assert.equal(
      finalInterviewReconciliation.balance,
      finalInterviewReconciliation.lastBalanceAfter,
    );
    assert.deepEqual(finalInterviewReconciliation.totals, {
      granted: 3,
      reserved: 1,
      consumed: 1,
      released: 0,
      refunded: 1,
      expired: 1,
      adjusted: 0,
    });
    assert.equal(finalInterviewReconciliation.balance, 2);

    const finalTailoringReconciliation = await getEntitlementReconciliation({
      userId: user.id,
      productAction: "tailoring",
    });
    assert.equal(finalTailoringReconciliation.balance, 0);
    assert.equal(finalTailoringReconciliation.openReservationUnits, 1);
    assert.deepEqual(finalTailoringReconciliation.totals, {
      granted: 1,
      reserved: 2,
      consumed: 0,
      released: 1,
      refunded: 0,
      expired: 0,
      adjusted: 0,
    });

    console.log(
      JSON.stringify(
        {
          userId: user.id,
          interview: finalInterviewReconciliation,
          tailoring: finalTailoringReconciliation,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => null);
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
