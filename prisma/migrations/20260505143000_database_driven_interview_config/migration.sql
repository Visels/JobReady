-- Existing interview rows depend on the flat session columns being removed.
-- This is intentionally a greenfield migration for interview data.
DELETE FROM "InterviewSession";

-- CreateEnum
CREATE TYPE "OnboardingInputType" AS ENUM ('text', 'textarea', 'select', 'multiselect', 'number');

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isoCode" TEXT NOT NULL,
    "flagEmoji" TEXT,
    "originProfile" TEXT,
    "isDestination" BOOLEAN NOT NULL DEFAULT false,
    "isOrigin" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "VisaCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaType" (
    "id" TEXT NOT NULL,
    "destinationCountryId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "basePrompt" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VisaType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingField" (
    "id" TEXT NOT NULL,
    "visaCategoryId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,
    "inputType" "OnboardingInputType" NOT NULL DEFAULT 'textarea',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OnboardingField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequiredDocument" (
    "id" TEXT NOT NULL,
    "visaTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RequiredDocument_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "InterviewSession"
DROP COLUMN "visaType",
DROP COLUMN "country",
DROP COLUMN "destinationCountry",
DROP COLUMN "role",
DROP COLUMN "institutionDetails",
ADD COLUMN "visaTypeId" TEXT NOT NULL,
ADD COLUMN "originCountryId" TEXT NOT NULL,
ADD COLUMN "onboardingData" JSONB NOT NULL DEFAULT '{}';

-- CreateIndex
CREATE UNIQUE INDEX "Country_isoCode_key" ON "Country"("isoCode");

-- CreateIndex
CREATE UNIQUE INDEX "VisaCategory_slug_key" ON "VisaCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VisaType_destinationCountryId_name_key" ON "VisaType"("destinationCountryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingField_visaCategoryId_key_key" ON "OnboardingField"("visaCategoryId", "key");

-- CreateIndex
CREATE INDEX "OnboardingField_visaCategoryId_displayOrder_idx" ON "OnboardingField"("visaCategoryId", "displayOrder");

-- CreateIndex
CREATE INDEX "RequiredDocument_visaTypeId_displayOrder_idx" ON "RequiredDocument"("visaTypeId", "displayOrder");

-- AddForeignKey
ALTER TABLE "VisaType" ADD CONSTRAINT "VisaType_destinationCountryId_fkey" FOREIGN KEY ("destinationCountryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaType" ADD CONSTRAINT "VisaType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VisaCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingField" ADD CONSTRAINT "OnboardingField_visaCategoryId_fkey" FOREIGN KEY ("visaCategoryId") REFERENCES "VisaCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequiredDocument" ADD CONSTRAINT "RequiredDocument_visaTypeId_fkey" FOREIGN KEY ("visaTypeId") REFERENCES "VisaType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_visaTypeId_fkey" FOREIGN KEY ("visaTypeId") REFERENCES "VisaType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_originCountryId_fkey" FOREIGN KEY ("originCountryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;
