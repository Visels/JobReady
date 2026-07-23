-- CreateTable
CREATE TABLE "ConcernOption" (
    "id" TEXT NOT NULL,
    "visaTypeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConcernOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConcernOption_visaTypeId_label_key" ON "ConcernOption"("visaTypeId", "label");

-- CreateIndex
CREATE INDEX "ConcernOption_visaTypeId_displayOrder_idx" ON "ConcernOption"("visaTypeId", "displayOrder");

-- AddForeignKey
ALTER TABLE "ConcernOption" ADD CONSTRAINT "ConcernOption_visaTypeId_fkey" FOREIGN KEY ("visaTypeId") REFERENCES "VisaType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
