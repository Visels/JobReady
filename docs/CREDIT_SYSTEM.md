# Unified Credit System

Status: implemented

Jiandae uses one shared credit balance for paid preparation. Credits are not
restricted to an interview-only or CV-only wallet.

## Costs

- New-account grant: 30 credits.
- Interview: 2 credits for each selected minute.
- 15-minute interview: 30 credits.
- 25-minute interview: 50 credits.
- 30-minute interview: 60 credits.
- 45-minute interview: 90 credits.
- 60-minute interview: 120 credits.
- CV or resume tailoring: 10 credits per run.

The canonical values and calculation live in `src/lib/credits.ts`.

## Ledger lifecycle

Credits are granted after signup or verified payment. Starting a paid action
creates a reservation for its full cost. Successful completion consumes that
reservation. A failed action releases it, returning the same number of credits
to the shared balance. The immutable grant, reserve, consume, release, refund,
expiry, and adjustment entries remain the source of truth.

## Payments

Checkout products grant a number of general-purpose credits. Payment
fulfillment calculates `creditsGranted` from the verified plan entitlements,
not from client-provided metadata. Purchased credits do not expire.

## Migration

The database retains the old `interview` and `tailoring` enum values for cost
attribution records, while credit-ledger and pricing records use `credit`.
Existing interview ledger units are converted at 30 credits per unit and
existing tailoring units at 10 credits per unit so historical value is carried
into the shared wallet.
