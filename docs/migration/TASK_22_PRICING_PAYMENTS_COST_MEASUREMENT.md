# Task 22 - Pricing, Payments, and Cost Measurement

Date: 2026-07-28

## Outcome

Task 22 replaces legacy unlimited-access commercial assumptions with finite
Jobready preparation products and makes sandbox purchase fulfillment reconcile
from provider payment to immutable ledger grants.

The task also adds cost attribution fields and a p50/p95 reporting helper for
model and storage usage by action, plan, and mode.

## Pricing Catalog

Database-backed products are seeded from `src/lib/plans.ts`:

| Slug | Product | KES hypothesis | Entitlements |
|---|---|---:|---|
| `starter-diagnostic` | Free diagnostic | 0 | 1 starter interview diagnostic, checkout disabled |
| `interview-standard` | Standard interview | 149 | 1 interview credit |
| `interview-extended` | Extended or mixed interview | 249 | 1 interview credit |
| `interview-pack-3` | Three-interview pack | 399 | 3 interview credits |
| `tailoring-single` | CV tailoring | 199 | 1 tailoring credit |
| `job-readiness-bundle` | Readiness bundle | 549 | 1 tailoring credit plus 2 interview credits |
| `candidate-monthly-fair-use` | Monthly candidate fair-use | 899 | 8 interview credits plus 4 tailoring credits |

Legacy `weekly` and `monthly` slugs remain recognizable for old purchase
records, but new checkout is disabled for them.

Country/currency pricing remains database-backed through `PricingPlanPrice`.
The seed includes default USD plus Kenya, Nigeria, South Africa, and Ghana rows,
while retaining historical legacy rows for older weekly/monthly records.

## Schema

Additive migration:

- `20260728100000_task22_pricing_payments_costs`

Added:

- `PricingPlanEntitlement`
- `PricingPlan.checkoutEnabled`
- `PricingPlan.metadata`
- `Purchase.pricingPlanId`
- `Purchase.supportReference`
- `Purchase.providerPaymentStatus`
- `Purchase.settledAt`
- `Purchase.failedAt`
- `Purchase.refundedAt`
- `Purchase.metadata`
- model/storage usage attribution fields:
  - `productAction`
  - `pricingPlanSlug`
  - `preparationMode`
  - `retryCount` on `ModelUsage`

Enum additions:

- `ModelOperation.target_extraction`
- `ModelOperation.generic_parsing`
- `ModelOperation.retry`
- R2, queue, scanner, parser, and export read storage operations.

## Fulfillment

Checkout now snapshots finite entitlements into Stripe/Flutterwave metadata.
Webhook and success-page fulfillment:

- verifies provider payment amount/currency.
- creates or updates one `Purchase`.
- assigns a support reference such as `JRD-FLW-...`.
- grants immutable `CreditLedgerEntry` rows in the same transaction.
- uses stable idempotency keys per purchase/action.
- records failed, pending, fulfilled, and refunded fulfillment states.

Flutterwave remains the default provider. Stripe checkout and webhook handling
remain available as fallback.

No live production keys were enabled by this task.

## Cost Measurement

`src/lib/usage-costs.ts` adds:

- `recordModelUsage`.
- `recordStorageUsage`.
- `getCostDistributionReport`.

The distribution query reports:

- source: model or storage.
- action: interview, tailoring, or unattributed.
- pricing plan slug.
- preparation mode.
- operation.
- sample count.
- total cost.
- p50 cost.
- p95 cost.
- currency.

Existing high-cost paths now annotate usage where available:

- reviewed question selection.
- text answer evaluation.
- behavioral/STAR evaluation.
- role-specific evaluation.
- report generation.
- realtime voice session usage.
- CV tailoring.
- tailoring export/delete storage usage.

Deterministic operations are recorded with zero estimated cost where useful so
cost reports distinguish deterministic work from provider-billed calls.

## Limits

`src/lib/commercial-limits.ts` centralizes budget and duration settings:

- `JOBREADY_STANDARD_INTERVIEW_MINUTES`
- `JOBREADY_EXTENDED_INTERVIEW_MINUTES`
- `JOBREADY_MONTHLY_CANDIDATE_INTERVIEW_UNITS`
- `JOBREADY_MONTHLY_CANDIDATE_TAILORING_UNITS`
- `JOBREADY_REALTIME_AUDIO_SECONDS`
- `JOBREADY_TEXT_ANSWER_CHARACTERS`
- `JOBREADY_AI_BUDGET_USD_PER_INTERVIEW`
- `JOBREADY_AI_BUDGET_USD_PER_TAILORING`

Job-interview session creation rejects durations above configured commercial
limits before reserving credit.

## Billing UI

The private `/billing` page now shows:

- current interview credit balance.
- current CV tailoring credit balance.
- starter diagnostic allowance.
- finite paid Jobready products.
- entitlement summary for each product.
- budget cap and expiry window.
- recent purchase support references.
- provider status and ledger grant summary.

The app shell purchase prompts now point at `interview-standard` and
`job-readiness-bundle`, not legacy unlimited weekly/monthly access.

## Validation

Static validation:

```powershell
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run lint
npm test
npm run build
git diff --check
```

Database validation used disposable local PostgreSQL on `127.0.0.1:55442`.

Setup:

```powershell
npx prisma migrate deploy
npx tsx scripts/seed-pricing-plans.ts
```

Focused Task 22 regression:

```powershell
$env:JOBREADY_ALLOW_DB_TESTS = "true"
npm run test:pricing-payments-costs
```

Result:

- Flutterwave replay could not duplicate grants.
- Payment reconciled to user, purchase, support reference, and ledger.
- Failed payment recorded with no grants.
- Failed payment recovered to fulfilled with one grant.
- Failed preparation released a reserved tailoring credit.
- Localized pricing returned KES 149 for `interview-standard`.
- Bundle entitlements were queryable.
- Cost distribution returned p50/p95 rows by action, plan, and mode.
- Configurable limits honored environment overrides.

Nearby regressions:

```powershell
npm run test:ledger
npm run test:tailoring
npm run test:job-interviews
npm run test:job-interview-text
npm run test:job-interview-reports
npm run test:job-interview-voice
```

All passed sequentially on a clean local database.

## Production Database

Production database changes were applied after local validation.

The configured Supabase pooler caused `npx prisma migrate deploy` and
`npx prisma migrate status` to time out. A native `psql` connection succeeded,
so the following pending additive migrations were applied with `psql` and then
recorded in `_prisma_migrations` using the actual migration SQL SHA-256
checksums:

- `20260727120000_add_role_specific_follow_up_intents`
- `20260728100000_task22_pricing_payments_costs`

The production migration table was verified to include both migration names.

Pricing seed then succeeded through Prisma with the original pooler URL:

- 9 pricing plans.
- 58 pricing rows.
- 9 entitlement rows.

No production payment charge was attempted.

## Follow-Ups

- Refund fulfillment currently records provider refund state and requires
  support review before entitlement adjustment.
- Full support/admin purchase reconciliation UI belongs in Task 23.
- Public pricing/landing-page presentation belongs in Task 25.
- Broader production observability and alerting for cost thresholds belongs in
  Task 27.
