-- Existing interview and tailoring units become spendable from one shared balance.
UPDATE "CreditLedgerEntry"
SET "productAction" = 'credit',
    "units" = "units" * CASE
      WHEN "productAction" = 'interview' THEN 30
      WHEN "productAction" = 'tailoring' THEN 10
      ELSE 1
    END,
    "balanceAfter" = NULL
WHERE "productAction" IN ('interview', 'tailoring');

UPDATE "Purchase"
SET "productAction" = 'credit'
WHERE "productAction" IN ('interview', 'tailoring');

UPDATE "Purchase" AS purchase
SET "creditsGranted" = grants."units"
FROM (
  SELECT "purchaseId", SUM("units")::integer AS "units"
  FROM "CreditLedgerEntry"
  WHERE "purchaseId" IS NOT NULL AND "action" = 'grant'
  GROUP BY "purchaseId"
) AS grants
WHERE purchase."id" = grants."purchaseId";

-- Replace action-specific plan entitlements with one non-expiring credit grant.
DELETE FROM "PricingPlanEntitlement";

INSERT INTO "PricingPlanEntitlement" (
  "id", "planId", "productAction", "units", "expiresAfterDays", "metadata", "createdAt", "updatedAt"
)
SELECT
  CONCAT('credit_', "id"),
  "id",
  'credit'::"LedgerProductAction",
  CASE "slug"
    WHEN 'starter-diagnostic' THEN 30
    WHEN 'interview-standard' THEN 30
    WHEN 'interview-extended' THEN 60
    WHEN 'interview-pack-3' THEN 100
    WHEN 'tailoring-single' THEN 10
    WHEN 'job-readiness-bundle' THEN 150
    WHEN 'candidate-monthly-fair-use' THEN 300
  END,
  NULL,
  '{"source":"unified_credit_migration"}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "PricingPlan"
WHERE "slug" IN (
  'starter-diagnostic',
  'interview-standard',
  'interview-extended',
  'interview-pack-3',
  'tailoring-single',
  'job-readiness-bundle',
  'candidate-monthly-fair-use'
);

UPDATE "PricingPlan"
SET "productAction" = 'credit',
    "checkoutEnabled" = CASE WHEN "slug" = 'tailoring-single' THEN false ELSE "checkoutEnabled" END,
    "name" = CASE "slug"
      WHEN 'starter-diagnostic' THEN '30 free credits'
      WHEN 'interview-standard' THEN '30 credits'
      WHEN 'interview-extended' THEN '60 credits'
      WHEN 'interview-pack-3' THEN '100 credits'
      WHEN 'tailoring-single' THEN '10 credits'
      WHEN 'job-readiness-bundle' THEN '150 credits'
      WHEN 'candidate-monthly-fair-use' THEN '300 credits'
    END,
    "productName" = CASE "slug"
      WHEN 'starter-diagnostic' THEN 'Jiandae Signup Credits'
      WHEN 'interview-standard' THEN 'Jiandae 30 Credit Pack'
      WHEN 'interview-extended' THEN 'Jiandae 60 Credit Pack'
      WHEN 'interview-pack-3' THEN 'Jiandae 100 Credit Pack'
      WHEN 'tailoring-single' THEN 'Jiandae 10 Credit Pack'
      WHEN 'job-readiness-bundle' THEN 'Jiandae 150 Credit Pack'
      WHEN 'candidate-monthly-fair-use' THEN 'Jiandae 300 Credit Pack'
    END,
    "metadata" = COALESCE("metadata", '{}'::jsonb) || jsonb_build_object(
      'category', CASE WHEN "slug" = 'starter-diagnostic' THEN 'starter' ELSE 'credits' END,
      'description', CASE "slug"
        WHEN 'starter-diagnostic' THEN 'A free signup balance that covers one 15-minute interview or three CV tailoring runs.'
        WHEN 'interview-standard' THEN 'Enough for one 15-minute interview, three CV tailoring runs, or any combination you choose.'
        WHEN 'interview-extended' THEN 'Enough for one 30-minute interview, two 15-minute interviews, or six CV tailoring runs.'
        WHEN 'interview-pack-3' THEN 'A flexible practice balance for longer interviews, CV tailoring, and repeat preparation.'
        WHEN 'tailoring-single' THEN 'A small top-up that covers one truthful CV or resume tailoring run.'
        WHEN 'job-readiness-bundle' THEN 'A larger balance for candidates preparing across several interviews and tailored applications.'
        WHEN 'candidate-monthly-fair-use' THEN 'The best-value balance for active candidates. Credits are spent only when you use a preparation tool.'
      END,
      'modeLabel', CASE "slug"
        WHEN 'starter-diagnostic' THEN 'signup credits'
        WHEN 'interview-standard' THEN 'starter credit pack'
        WHEN 'interview-extended' THEN 'popular credit pack'
        WHEN 'interview-pack-3' THEN 'flex credit pack'
        WHEN 'tailoring-single' THEN 'credit top-up'
        WHEN 'job-readiness-bundle' THEN 'value credit pack'
        WHEN 'candidate-monthly-fair-use' THEN 'best-value credit pack'
      END,
      'durationLimitMinutes', NULL
    )
WHERE "slug" IN (
  'starter-diagnostic',
  'interview-standard',
  'interview-extended',
  'interview-pack-3',
  'tailoring-single',
  'job-readiness-bundle',
  'candidate-monthly-fair-use'
);
