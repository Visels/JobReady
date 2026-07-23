CREATE TYPE "RealtimeInterviewStatus" AS ENUM ('pending', 'active', 'finalizing', 'completed', 'failed');

CREATE TABLE "RealtimeInterview" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "openingQuestion" TEXT NOT NULL,
    "status" "RealtimeInterviewStatus" NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "completionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealtimeInterview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RealtimeTranscriptTurn" (
    "id" TEXT NOT NULL,
    "realtimeInterviewId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "evaluation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealtimeTranscriptTurn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RealtimeInterviewEvent" (
    "id" TEXT NOT NULL,
    "realtimeInterviewId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealtimeInterviewEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RealtimeInterview_sessionId_key" ON "RealtimeInterview"("sessionId");
CREATE INDEX "RealtimeInterview_status_createdAt_idx" ON "RealtimeInterview"("status", "createdAt");
CREATE UNIQUE INDEX "RealtimeTranscriptTurn_realtimeInterviewId_sequence_key" ON "RealtimeTranscriptTurn"("realtimeInterviewId", "sequence");
CREATE INDEX "RealtimeTranscriptTurn_realtimeInterviewId_createdAt_idx" ON "RealtimeTranscriptTurn"("realtimeInterviewId", "createdAt");
CREATE UNIQUE INDEX "RealtimeInterviewEvent_realtimeInterviewId_sequence_key" ON "RealtimeInterviewEvent"("realtimeInterviewId", "sequence");
CREATE INDEX "RealtimeInterviewEvent_realtimeInterviewId_createdAt_idx" ON "RealtimeInterviewEvent"("realtimeInterviewId", "createdAt");

ALTER TABLE "RealtimeInterview" ADD CONSTRAINT "RealtimeInterview_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RealtimeTranscriptTurn" ADD CONSTRAINT "RealtimeTranscriptTurn_realtimeInterviewId_fkey" FOREIGN KEY ("realtimeInterviewId") REFERENCES "RealtimeInterview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RealtimeInterviewEvent" ADD CONSTRAINT "RealtimeInterviewEvent_realtimeInterviewId_fkey" FOREIGN KEY ("realtimeInterviewId") REFERENCES "RealtimeInterview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
