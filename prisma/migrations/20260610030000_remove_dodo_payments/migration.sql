ALTER TABLE "Purchase" ALTER COLUMN "provider" DROP DEFAULT;

ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";

CREATE TYPE "PaymentProvider" AS ENUM ('stripe');

ALTER TABLE "Purchase"
ALTER COLUMN "provider" TYPE "PaymentProvider"
USING 'stripe'::"PaymentProvider";

ALTER TABLE "Purchase" ALTER COLUMN "provider" SET DEFAULT 'stripe';

DROP TYPE "PaymentProvider_old";

DROP INDEX IF EXISTS "Purchase_dodoPaymentId_key";
DROP INDEX IF EXISTS "Purchase_dodoCheckoutSessionId_key";

ALTER TABLE "Purchase"
DROP COLUMN IF EXISTS "dodoPaymentId",
DROP COLUMN IF EXISTS "dodoCheckoutSessionId";
