ALTER TABLE "Purchase" ALTER COLUMN "provider" DROP DEFAULT;

ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";

CREATE TYPE "PaymentProvider" AS ENUM ('stripe', 'flutterwave');

ALTER TABLE "Purchase"
ALTER COLUMN "provider" TYPE "PaymentProvider"
USING "provider"::text::"PaymentProvider";

ALTER TABLE "Purchase" ALTER COLUMN "provider" SET DEFAULT 'flutterwave';

DROP TYPE "PaymentProvider_old";

ALTER TABLE "Purchase"
ADD COLUMN "flutterwaveTxRef" TEXT,
ADD COLUMN "flutterwaveTransactionId" TEXT;

CREATE UNIQUE INDEX "Purchase_flutterwaveTxRef_key" ON "Purchase"("flutterwaveTxRef");

CREATE UNIQUE INDEX "Purchase_flutterwaveTransactionId_key" ON "Purchase"("flutterwaveTransactionId");
