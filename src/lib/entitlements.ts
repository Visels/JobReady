import { Prisma, type CreditLedgerEntry } from "@prisma/client";
import { publicProductConfig } from "@/config/public";
import { prisma } from "@/lib/prisma";

export type LedgerProductActionName = "interview" | "tailoring";
export type PaidPreparationAction = LedgerProductActionName;
export type FreeJobAction =
  | "browse_jobs"
  | "save_job"
  | "track_application"
  | "open_application_link";

export const PAID_PREPARATION_ACTIONS = ["interview", "tailoring"] as const;
export const FREE_JOB_ACTIONS = [
  "browse_jobs",
  "save_job",
  "track_application",
  "open_application_link",
] as const;

type LedgerActionName =
  | "grant"
  | "reserve"
  | "consume"
  | "release"
  | "refund"
  | "expire"
  | "adjust";

type TransactionClient = Prisma.TransactionClient;

type LedgerEntryForReconciliation = Pick<
  CreditLedgerEntry,
  | "id"
  | "action"
  | "productAction"
  | "units"
  | "balanceAfter"
  | "relatedEntryId"
  | "expiresAt"
  | "createdAt"
>;

type BaseLedgerInput = {
  userId: string;
  productAction: LedgerProductActionName;
  units: number;
  idempotencyKey: string;
  purchaseId?: string | null;
  interviewSessionId?: string | null;
  tailoringRunId?: string | null;
  expiresAt?: Date | null;
  metadata?: Prisma.InputJsonValue;
};

type AdjustmentInput = Omit<BaseLedgerInput, "units"> & {
  units: number;
  reason: string;
};

type ReservationInput = BaseLedgerInput & {
  expiresAt: Date;
};

type RelatedLedgerInput = {
  userId: string;
  productAction: LedgerProductActionName;
  idempotencyKey: string;
  relatedEntryId: string;
  metadata?: Prisma.InputJsonValue;
};

type ExpireLedgerInput = RelatedLedgerInput & {
  units: number;
};

type LedgerOperationResult = {
  entry: CreditLedgerEntry;
  reconciliation: EntitlementReconciliation;
  created: boolean;
};

export type EntitlementReconciliation = {
  userId: string;
  productAction: LedgerProductActionName;
  balance: number;
  displayedBalance: number;
  totals: {
    granted: number;
    reserved: number;
    consumed: number;
    released: number;
    refunded: number;
    expired: number;
    adjusted: number;
  };
  openReservationUnits: number;
  openReservationCount: number;
  entryCount: number;
  lastBalanceAfter: number | null;
};

export class EntitlementLedgerError extends Error {
  constructor(
    public readonly code:
      | "invalid_input"
      | "user_not_found"
      | "idempotency_conflict"
      | "insufficient_balance"
      | "reservation_not_found"
      | "reservation_closed"
      | "consumption_not_found",
    message: string,
  ) {
    super(message);
    this.name = "EntitlementLedgerError";
  }
}

function assertProductAction(value: LedgerProductActionName) {
  if (!PAID_PREPARATION_ACTIONS.includes(value)) {
    throw new EntitlementLedgerError(
      "invalid_input",
      `Unsupported paid preparation action: ${value}`,
    );
  }
}

function assertPositiveUnits(units: number, label = "units") {
  if (!Number.isInteger(units) || units <= 0) {
    throw new EntitlementLedgerError(
      "invalid_input",
      `${label} must be a positive integer.`,
    );
  }
}

function assertAdjustmentUnits(units: number) {
  if (!Number.isInteger(units) || units === 0) {
    throw new EntitlementLedgerError(
      "invalid_input",
      "Adjustment units must be a non-zero integer.",
    );
  }
}

function assertIdempotencyKey(idempotencyKey: string) {
  if (!idempotencyKey.trim()) {
    throw new EntitlementLedgerError(
      "invalid_input",
      "An idempotency key is required for every ledger mutation.",
    );
  }
}

function normalizeMetadata(
  metadata: Prisma.InputJsonValue | undefined,
  defaults?: Prisma.InputJsonObject,
) {
  if (!metadata && !defaults) return undefined;

  return {
    ...(defaults ?? {}),
    ...((metadata ?? {}) as Prisma.InputJsonObject),
  };
}

export function ledgerBalanceEffect(entry: {
  action: LedgerActionName;
  units: number;
  relatedEntryId?: string | null;
}) {
  switch (entry.action) {
    case "grant":
      return entry.units;
    case "reserve":
      return -entry.units;
    case "consume":
      return entry.relatedEntryId ? 0 : -entry.units;
    case "release":
    case "refund":
      return entry.units;
    case "expire":
      return -entry.units;
    case "adjust":
      return entry.units;
  }
}

function reconcileEntries(
  userId: string,
  productAction: LedgerProductActionName,
  entries: LedgerEntryForReconciliation[],
): EntitlementReconciliation {
  const closedReservationIds = new Set(
    entries
      .filter(
        (entry) =>
          (entry.action === "consume" || entry.action === "release") &&
          entry.relatedEntryId,
      )
      .map((entry) => entry.relatedEntryId as string),
  );

  let balance = 0;
  const totals = {
    granted: 0,
    reserved: 0,
    consumed: 0,
    released: 0,
    refunded: 0,
    expired: 0,
    adjusted: 0,
  };
  let openReservationUnits = 0;
  let openReservationCount = 0;

  for (const entry of entries) {
    balance += ledgerBalanceEffect(entry);

    switch (entry.action) {
      case "grant":
        totals.granted += entry.units;
        break;
      case "reserve":
        totals.reserved += entry.units;
        if (!closedReservationIds.has(entry.id)) {
          openReservationUnits += entry.units;
          openReservationCount += 1;
        }
        break;
      case "consume":
        totals.consumed += entry.units;
        break;
      case "release":
        totals.released += entry.units;
        break;
      case "refund":
        totals.refunded += entry.units;
        break;
      case "expire":
        totals.expired += entry.units;
        break;
      case "adjust":
        totals.adjusted += entry.units;
        break;
    }
  }

  const lastEntry = entries.at(-1);

  return {
    userId,
    productAction,
    balance,
    displayedBalance: balance,
    totals,
    openReservationUnits,
    openReservationCount,
    entryCount: entries.length,
    lastBalanceAfter: lastEntry?.balanceAfter ?? null,
  };
}

async function lockUser(tx: TransactionClient, userId: string) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT "id" FROM "User" WHERE "id" = ${userId}::uuid FOR UPDATE`,
  );

  if (rows.length === 0) {
    throw new EntitlementLedgerError("user_not_found", "User not found.");
  }
}

async function getEntries(
  tx: TransactionClient,
  userId: string,
  productAction: LedgerProductActionName,
) {
  return tx.creditLedgerEntry.findMany({
    where: { userId, productAction },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      action: true,
      productAction: true,
      units: true,
      balanceAfter: true,
      relatedEntryId: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}

async function getReconciliationInTransaction(
  tx: TransactionClient,
  userId: string,
  productAction: LedgerProductActionName,
) {
  return reconcileEntries(
    userId,
    productAction,
    await getEntries(tx, userId, productAction),
  );
}

async function getExistingEntry(tx: TransactionClient, idempotencyKey: string) {
  return tx.creditLedgerEntry.findUnique({
    where: { idempotencyKey },
  });
}

function assertExistingEntryMatches(
  entry: CreditLedgerEntry,
  input: { userId: string; productAction: LedgerProductActionName },
  action: LedgerActionName,
) {
  if (
    entry.userId !== input.userId ||
    entry.productAction !== input.productAction ||
    entry.action !== action
  ) {
    throw new EntitlementLedgerError(
      "idempotency_conflict",
      "Idempotency key belongs to a different ledger operation.",
    );
  }
}

async function createEntry(
  tx: TransactionClient,
  input: BaseLedgerInput & {
    action: LedgerActionName;
    balanceAfter: number;
    relatedEntryId?: string | null;
  },
) {
  return tx.creditLedgerEntry.create({
    data: {
      userId: input.userId,
      purchaseId: input.purchaseId ?? undefined,
      interviewSessionId: input.interviewSessionId ?? undefined,
      tailoringRunId: input.tailoringRunId ?? undefined,
      action: input.action,
      productAction: input.productAction,
      units: input.units,
      balanceAfter: input.balanceAfter,
      idempotencyKey: input.idempotencyKey,
      relatedEntryId: input.relatedEntryId ?? undefined,
      expiresAt: input.expiresAt ?? undefined,
      metadata: input.metadata ?? undefined,
    },
  });
}

async function runLedgerTransaction(
  input: { userId: string; productAction: LedgerProductActionName },
  callback: (tx: TransactionClient) => Promise<LedgerOperationResult>,
) {
  assertProductAction(input.productAction);

  return prisma.$transaction(
    async (tx) => {
      await lockUser(tx, input.userId);
      return callback(tx);
    },
    { timeout: 15000 },
  );
}

export async function getEntitlementReconciliation(input: {
  userId: string;
  productAction: LedgerProductActionName;
}) {
  assertProductAction(input.productAction);

  return prisma.$transaction(async (tx) => {
    await lockUser(tx, input.userId);
    return getReconciliationInTransaction(
      tx,
      input.userId,
      input.productAction,
    );
  });
}

export async function grantEntitlement(input: BaseLedgerInput) {
  assertPositiveUnits(input.units);
  assertIdempotencyKey(input.idempotencyKey);

  return runLedgerTransaction(input, async (tx) => {
    const existing = await getExistingEntry(tx, input.idempotencyKey);
    if (existing) {
      assertExistingEntryMatches(existing, input, "grant");
      return {
        entry: existing,
        reconciliation: await getReconciliationInTransaction(
          tx,
          input.userId,
          input.productAction,
        ),
        created: false,
      };
    }

    const before = await getReconciliationInTransaction(
      tx,
      input.userId,
      input.productAction,
    );
    const entry = await createEntry(tx, {
      ...input,
      action: "grant",
      balanceAfter: before.balance + input.units,
    });

    return {
      entry,
      reconciliation: await getReconciliationInTransaction(
        tx,
        input.userId,
        input.productAction,
      ),
      created: true,
    };
  });
}

export async function reserveEntitlement(input: ReservationInput) {
  assertPositiveUnits(input.units);
  assertIdempotencyKey(input.idempotencyKey);

  return runLedgerTransaction(input, async (tx) => {
    const existing = await getExistingEntry(tx, input.idempotencyKey);
    if (existing) {
      assertExistingEntryMatches(existing, input, "reserve");
      return {
        entry: existing,
        reconciliation: await getReconciliationInTransaction(
          tx,
          input.userId,
          input.productAction,
        ),
        created: false,
      };
    }

    const before = await getReconciliationInTransaction(
      tx,
      input.userId,
      input.productAction,
    );

    if (before.balance < input.units) {
      throw new EntitlementLedgerError(
        "insufficient_balance",
        "Insufficient entitlement balance for reservation.",
      );
    }

    const entry = await createEntry(tx, {
      ...input,
      action: "reserve",
      balanceAfter: before.balance - input.units,
    });

    return {
      entry,
      reconciliation: await getReconciliationInTransaction(
        tx,
        input.userId,
        input.productAction,
      ),
      created: true,
    };
  });
}

async function getReservationClosure(
  tx: TransactionClient,
  reservationId: string,
) {
  return tx.creditLedgerEntry.findFirst({
    where: {
      relatedEntryId: reservationId,
      action: { in: ["consume", "release"] },
    },
    orderBy: { createdAt: "asc" },
  });
}

async function getOpenReservation(
  tx: TransactionClient,
  input: RelatedLedgerInput,
) {
  const reservation = await tx.creditLedgerEntry.findFirst({
    where: {
      id: input.relatedEntryId,
      userId: input.userId,
      productAction: input.productAction,
      action: "reserve",
    },
  });

  if (!reservation) {
    throw new EntitlementLedgerError(
      "reservation_not_found",
      "Reservation not found.",
    );
  }

  return reservation;
}

export async function consumeReservation(input: RelatedLedgerInput) {
  assertIdempotencyKey(input.idempotencyKey);

  return runLedgerTransaction(input, async (tx) => {
    const existing = await getExistingEntry(tx, input.idempotencyKey);
    if (existing) {
      assertExistingEntryMatches(existing, input, "consume");
      return {
        entry: existing,
        reconciliation: await getReconciliationInTransaction(
          tx,
          input.userId,
          input.productAction,
        ),
        created: false,
      };
    }

    const reservation = await getOpenReservation(tx, input);
    const closure = await getReservationClosure(tx, reservation.id);
    if (closure) {
      if (closure.action === "consume") {
        return {
          entry: closure,
          reconciliation: await getReconciliationInTransaction(
            tx,
            input.userId,
            input.productAction,
          ),
          created: false,
        };
      }

      throw new EntitlementLedgerError(
        "reservation_closed",
        "Reservation was already released and cannot be consumed.",
      );
    }

    const before = await getReconciliationInTransaction(
      tx,
      input.userId,
      input.productAction,
    );
    const entry = await createEntry(tx, {
      userId: input.userId,
      productAction: input.productAction,
      units: reservation.units,
      idempotencyKey: input.idempotencyKey,
      relatedEntryId: reservation.id,
      metadata: normalizeMetadata(input.metadata, {
        lifecycle: "completed",
      }),
      action: "consume",
      balanceAfter: before.balance,
    });

    return {
      entry,
      reconciliation: await getReconciliationInTransaction(
        tx,
        input.userId,
        input.productAction,
      ),
      created: true,
    };
  });
}

export async function releaseReservation(input: RelatedLedgerInput) {
  assertIdempotencyKey(input.idempotencyKey);

  return runLedgerTransaction(input, async (tx) => {
    const existing = await getExistingEntry(tx, input.idempotencyKey);
    if (existing) {
      assertExistingEntryMatches(existing, input, "release");
      return {
        entry: existing,
        reconciliation: await getReconciliationInTransaction(
          tx,
          input.userId,
          input.productAction,
        ),
        created: false,
      };
    }

    const reservation = await getOpenReservation(tx, input);
    const closure = await getReservationClosure(tx, reservation.id);
    if (closure) {
      if (closure.action === "release") {
        return {
          entry: closure,
          reconciliation: await getReconciliationInTransaction(
            tx,
            input.userId,
            input.productAction,
          ),
          created: false,
        };
      }

      throw new EntitlementLedgerError(
        "reservation_closed",
        "Reservation was already consumed and cannot be released.",
      );
    }

    const before = await getReconciliationInTransaction(
      tx,
      input.userId,
      input.productAction,
    );
    const entry = await createEntry(tx, {
      userId: input.userId,
      productAction: input.productAction,
      units: reservation.units,
      idempotencyKey: input.idempotencyKey,
      relatedEntryId: reservation.id,
      metadata: normalizeMetadata(input.metadata, {
        lifecycle: "failed_or_abandoned",
      }),
      action: "release",
      balanceAfter: before.balance + reservation.units,
    });

    return {
      entry,
      reconciliation: await getReconciliationInTransaction(
        tx,
        input.userId,
        input.productAction,
      ),
      created: true,
    };
  });
}

export async function refundConsumption(input: RelatedLedgerInput) {
  assertIdempotencyKey(input.idempotencyKey);

  return runLedgerTransaction(input, async (tx) => {
    const existing = await getExistingEntry(tx, input.idempotencyKey);
    if (existing) {
      assertExistingEntryMatches(existing, input, "refund");
      return {
        entry: existing,
        reconciliation: await getReconciliationInTransaction(
          tx,
          input.userId,
          input.productAction,
        ),
        created: false,
      };
    }

    const consumption = await tx.creditLedgerEntry.findFirst({
      where: {
        id: input.relatedEntryId,
        userId: input.userId,
        productAction: input.productAction,
        action: "consume",
      },
    });

    if (!consumption) {
      throw new EntitlementLedgerError(
        "consumption_not_found",
        "Consumption entry not found.",
      );
    }

    const existingRefund = await tx.creditLedgerEntry.findFirst({
      where: {
        relatedEntryId: consumption.id,
        action: "refund",
      },
    });
    if (existingRefund) {
      return {
        entry: existingRefund,
        reconciliation: await getReconciliationInTransaction(
          tx,
          input.userId,
          input.productAction,
        ),
        created: false,
      };
    }

    const before = await getReconciliationInTransaction(
      tx,
      input.userId,
      input.productAction,
    );
    const entry = await createEntry(tx, {
      userId: input.userId,
      productAction: input.productAction,
      units: consumption.units,
      idempotencyKey: input.idempotencyKey,
      relatedEntryId: consumption.id,
      metadata: normalizeMetadata(input.metadata, {
        lifecycle: "refunded_after_consumption",
      }),
      action: "refund",
      balanceAfter: before.balance + consumption.units,
    });

    return {
      entry,
      reconciliation: await getReconciliationInTransaction(
        tx,
        input.userId,
        input.productAction,
      ),
      created: true,
    };
  });
}

export async function expireEntitlement(input: ExpireLedgerInput) {
  assertPositiveUnits(input.units);
  assertIdempotencyKey(input.idempotencyKey);

  return runLedgerTransaction(input, async (tx) => {
    const existing = await getExistingEntry(tx, input.idempotencyKey);
    if (existing) {
      assertExistingEntryMatches(existing, input, "expire");
      return {
        entry: existing,
        reconciliation: await getReconciliationInTransaction(
          tx,
          input.userId,
          input.productAction,
        ),
        created: false,
      };
    }

    const grant = await tx.creditLedgerEntry.findFirst({
      where: {
        id: input.relatedEntryId,
        userId: input.userId,
        productAction: input.productAction,
        action: "grant",
      },
    });

    if (!grant) {
      throw new EntitlementLedgerError(
        "reservation_not_found",
        "Grant entry not found for expiry.",
      );
    }

    const existingExpiry = await tx.creditLedgerEntry.findFirst({
      where: {
        relatedEntryId: grant.id,
        action: "expire",
      },
    });
    if (existingExpiry) {
      return {
        entry: existingExpiry,
        reconciliation: await getReconciliationInTransaction(
          tx,
          input.userId,
          input.productAction,
        ),
        created: false,
      };
    }

    const before = await getReconciliationInTransaction(
      tx,
      input.userId,
      input.productAction,
    );

    if (before.balance < input.units) {
      throw new EntitlementLedgerError(
        "insufficient_balance",
        "Cannot expire more units than the current available balance.",
      );
    }

    const entry = await createEntry(tx, {
      userId: input.userId,
      productAction: input.productAction,
      units: input.units,
      idempotencyKey: input.idempotencyKey,
      relatedEntryId: grant.id,
      metadata: normalizeMetadata(input.metadata, {
        lifecycle: "expired",
      }),
      action: "expire",
      balanceAfter: before.balance - input.units,
    });

    return {
      entry,
      reconciliation: await getReconciliationInTransaction(
        tx,
        input.userId,
        input.productAction,
      ),
      created: true,
    };
  });
}

export async function adjustEntitlement(input: AdjustmentInput) {
  assertAdjustmentUnits(input.units);
  assertIdempotencyKey(input.idempotencyKey);

  return runLedgerTransaction(input, async (tx) => {
    const existing = await getExistingEntry(tx, input.idempotencyKey);
    if (existing) {
      assertExistingEntryMatches(existing, input, "adjust");
      return {
        entry: existing,
        reconciliation: await getReconciliationInTransaction(
          tx,
          input.userId,
          input.productAction,
        ),
        created: false,
      };
    }

    const before = await getReconciliationInTransaction(
      tx,
      input.userId,
      input.productAction,
    );
    const nextBalance = before.balance + input.units;

    if (nextBalance < 0) {
      throw new EntitlementLedgerError(
        "insufficient_balance",
        "Adjustment cannot make the entitlement balance negative.",
      );
    }

    const entry = await createEntry(tx, {
      ...input,
      action: "adjust",
      balanceAfter: nextBalance,
      metadata: normalizeMetadata(input.metadata, {
        reason: input.reason,
        lifecycle: "administrative_adjustment",
      }),
    });

    return {
      entry,
      reconciliation: await getReconciliationInTransaction(
        tx,
        input.userId,
        input.productAction,
      ),
      created: true,
    };
  });
}

export function requiresPaidEntitlement(
  action: PaidPreparationAction | FreeJobAction,
) {
  return PAID_PREPARATION_ACTIONS.includes(action as LedgerProductActionName);
}

export function isFreeJobAction(action: PaidPreparationAction | FreeJobAction) {
  return FREE_JOB_ACTIONS.includes(action as FreeJobAction);
}

export function legacyVisaCreditsForDisplay(user: { credits: number } | null) {
  if (!publicProductConfig.features.legacyVisaFlow) return 0;
  return user?.credits ?? 0;
}
