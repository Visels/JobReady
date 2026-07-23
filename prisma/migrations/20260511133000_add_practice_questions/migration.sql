CREATE TABLE "PracticeQuestion" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "visaType" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'mcq',
    "question" TEXT NOT NULL,
    "options" TEXT[] NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PracticeQuestion_slug_key" ON "PracticeQuestion"("slug");
CREATE INDEX "PracticeQuestion_visaType_type_isActive_displayOrder_idx" ON "PracticeQuestion"("visaType", "type", "isActive", "displayOrder");
