# Task 05 - Credit Ledger and Entitlement Foundation

Date: 2026-07-25

## Outcome

Task 05 adds a deterministic entitlement ledger service for paid preparation
actions:

- `interview`
- `tailoring`

The service uses immutable `CreditLedgerEntry` rows and keeps legacy
`User.credits` separate for the legacy visa flow.

No live pricing, checkout fulfillment behavior, or production payment behavior
was activated or changed.

## Files

- `src/lib/entitlements.ts`
- `scripts/test-credit-ledger.ts`
- `package.json`
- `docs/migration/TASK_05_CREDIT_LEDGER.md`

## Ledger Actions

All mutations require an idempotency key.

| Action | Balance Effect | Purpose |
|---|---:|---|
| `grant` | `+units` | Adds interview or tailoring units from an approved source such as future purchase fulfillment, promotion, or admin grant. |
| `reserve` | `-units` | Atomically holds units before a paid preparation action starts. |
| `consume` | `0` when tied to a reservation | Marks a reserved action as completed. The unit was already removed from available balance at reservation time. |
| `release` | `+units` | Returns an open reservation after a failed or abandoned action that should not charge the candidate. |
| `refund` | `+units` | Restores a consumed unit after a manual or policy-approved refund. |
| `expire` | `-units` | Removes unused granted units when an entitlement expires. |
| `adjust` | `+/-units` | Administrative correction, with a required reason. |

`balanceAfter` stores the available balance after the entry is created. The
reconciliation helper recomputes totals from immutable rows and verifies the
displayed balance.

## Atomicity and Concurrency

Every ledger mutation:

1. Opens a Prisma transaction.
2. Locks the user row with PostgreSQL `FOR UPDATE`.
3. Reads the current ledger rows for that user and product action.
4. Validates the requested operation.
5. Inserts exactly one immutable ledger entry, unless an idempotent prior entry
   already exists.

This serializes concurrent reservations for the same user and prevents two
requests from spending the same available unit.

## Lifecycle Rules

Interview:

- Reserve before a paid interview/report action starts.
- Consume the reservation when the paid action completes.
- A retry using the same idempotency key returns the existing consume entry.
- A retry using a different idempotency key but the same reservation also
  returns the existing consume entry, so a failed report retry cannot consume a
  second unit.
- Refund a consumed entry only once. Later refund attempts for the same consume
  entry return the existing refund.

Tailoring:

- Reserve before a CV/resume tailoring run starts.
- If the run fails before producing a chargeable result, release the
  reservation.
- The candidate can retry after release because the available tailoring balance
  is restored.
- If a tailoring run completes, consume the reservation.
- If a completed tailoring run is later refunded, create a refund entry related
  to the consume entry.

Expiry:

- Expiry is explicit. A future job can find expired grant entries and call
  `expireEntitlement`.
- Expiry cannot reduce the available balance below zero.

Administrative adjustment:

- Adjustments can add or remove units.
- Negative adjustments cannot make a balance negative.
- Each adjustment includes a reason in metadata.

Free job actions:

- Browsing jobs.
- Saving jobs.
- Tracking applications.
- Opening official application links.

These are represented as free actions by helper functions and do not require
ledger reservation or consumption.

## Legacy Credits Boundary

`User.credits` remains the legacy visa-flow balance. The new helper
`legacyVisaCreditsForDisplay` returns legacy credits only while
`legacyVisaFlow` is enabled.

The Task 05 ledger does not replace legacy visa credit decrement behavior. That
future cutover belongs to later job-interview API work once the new session flow
uses the ledger.

## Validation

Static validation:

```powershell
npx tsc --noEmit
npm test
.\node_modules\.bin\prisma.cmd validate
```

Results:

- TypeScript passed.
- Product config test passed.
- Prisma validate passed with the existing Prisma 7 config deprecation warning.

Database validation:

- Disposable PostgreSQL database: `jobready_task05_ledger`.
- Production was not touched.

Setup:

```powershell
.\node_modules\.bin\prisma.cmd migrate deploy
```

Result: all migrations applied successfully.

Ledger test:

```powershell
$env:JOBREADY_ALLOW_DB_TESTS = "true"
npm run test:ledger
```

Result:

- Concurrent reservations could not overspend one available interview unit.
- Duplicate grant idempotency returned the existing grant.
- Completed interview reservation consumed once.
- Same-key and different-key failed report retries did not create another
  consume entry.
- Refund of a consumed interview restored one unit and duplicate refund did not
  double-restore.
- Expiry reduced only available units.
- Administrative negative and positive adjustments reconciled.
- Failed tailoring run released its reservation.
- Tailoring retry after release could reserve again.
- Ledger totals reconciled to displayed balances.

Final verifier summary:

```json
{
  "interview": {
    "balance": 2,
    "displayedBalance": 2,
    "totals": {
      "granted": 3,
      "reserved": 1,
      "consumed": 1,
      "released": 0,
      "refunded": 1,
      "expired": 1,
      "adjusted": 0
    },
    "openReservationUnits": 0
  },
  "tailoring": {
    "balance": 0,
    "displayedBalance": 0,
    "totals": {
      "granted": 1,
      "reserved": 2,
      "consumed": 0,
      "released": 1,
      "refunded": 0,
      "expired": 0,
      "adjusted": 0
    },
    "openReservationUnits": 1
  }
}
```

## Follow-ups

- Task 13 should reserve/consume `interview` entitlements when creating and
  completing job-interview sessions.
- Task 08 should reserve/release/consume `tailoring` entitlements when the
  tailoring run implementation lands.
- Purchase fulfillment should call `grantEntitlement` only after a later task
  explicitly maps paid plans to interview/tailoring units.
- A future cleanup job should expire matured grants and release abandoned
  reservations according to the product policy.
