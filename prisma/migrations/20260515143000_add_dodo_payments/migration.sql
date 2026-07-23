CREATE TYPE "PaymentProvider" AS ENUM ('stripe', 'dodo');

ALTER TABLE "Purchase"
ADD COLUMN "provider" "PaymentProvider" NOT NULL DEFAULT 'stripe',
ADD COLUMN "dodoPaymentId" TEXT,
ADD COLUMN "dodoCheckoutSessionId" TEXT;

ALTER TABLE "Purchase"
ALTER COLUMN "stripeCheckoutSessionId" DROP NOT NULL;

CREATE UNIQUE INDEX "Purchase_dodoPaymentId_key" ON "Purchase"("dodoPaymentId");

CREATE UNIQUE INDEX "Purchase_dodoCheckoutSessionId_key" ON "Purchase"("dodoCheckoutSessionId");
