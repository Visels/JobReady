ALTER TABLE "Report"
ADD COLUMN "evidenceStatus" TEXT NOT NULL DEFAULT 'complete',
ADD COLUMN "answeredQuestions" INTEGER NOT NULL DEFAULT 0;

WITH answer_counts AS (
  SELECT
    r."id" AS "reportId",
    GREATEST(
      COALESCE((
        SELECT COUNT(*)::INTEGER
        FROM "RealtimeTranscriptTurn" t
        INNER JOIN "RealtimeInterview" ri
          ON ri."id" = t."realtimeInterviewId"
        WHERE ri."sessionId" = r."sessionId"
          AND t."answer" IS NOT NULL
          AND LENGTH(TRIM(t."answer")) > 0
      ), 0),
      COALESCE((
        SELECT COUNT(*)::INTEGER
        FROM "Message" m
        WHERE m."sessionId" = r."sessionId"
          AND m."role" = 'user'
          AND LENGTH(TRIM(m."content")) > 0
      ), 0)
    ) AS answers
  FROM "Report" r
)
UPDATE "Report" r
SET
  "answeredQuestions" = ac.answers,
  "evidenceStatus" = CASE
    WHEN ac.answers = 0 THEN 'insufficient'
    WHEN ac.answers < 4 THEN 'limited'
    ELSE 'complete'
  END,
  "score" = CASE
    WHEN ac.answers = 0 THEN 0
    WHEN ac.answers = 1 THEN LEAST(r."score", 25)
    WHEN ac.answers = 2 THEN LEAST(r."score", 35)
    WHEN ac.answers = 3 THEN LEAST(r."score", 49)
    ELSE r."score"
  END,
  "answerConsistency" = CASE
    WHEN ac.answers = 0 THEN 0
    WHEN ac.answers < 4 THEN LEAST(r."answerConsistency", 49)
    ELSE r."answerConsistency"
  END,
  "homeTiesStrength" = CASE
    WHEN ac.answers = 0 THEN 0
    WHEN ac.answers < 4 THEN LEAST(r."homeTiesStrength", 49)
    ELSE r."homeTiesStrength"
  END,
  "returnIntentClarity" = CASE
    WHEN ac.answers = 0 THEN 0
    WHEN ac.answers < 4 THEN LEAST(r."returnIntentClarity", 49)
    ELSE r."returnIntentClarity"
  END,
  "financialClarity" = CASE
    WHEN ac.answers = 0 THEN 0
    WHEN ac.answers < 4 THEN LEAST(r."financialClarity", 49)
    ELSE r."financialClarity"
  END,
  "studyPurpose" = CASE
    WHEN ac.answers = 0 THEN 0
    WHEN ac.answers < 4 THEN LEAST(r."studyPurpose", 49)
    ELSE r."studyPurpose"
  END,
  "composureUnderPressure" = CASE
    WHEN ac.answers = 0 THEN 0
    WHEN ac.answers < 4 THEN LEAST(r."composureUnderPressure", 49)
    ELSE r."composureUnderPressure"
  END,
  "summary" = CASE
    WHEN ac.answers = 0 THEN
      'This session ended before you provided an answer, so there is not enough evidence to assess your interview readiness.'
    WHEN ac.answers < 4 THEN
      'This was a partial interview with only ' || ac.answers ||
      CASE WHEN ac.answers = 1 THEN ' captured answer. ' ELSE ' captured answers. ' END ||
      r."summary"
    ELSE r."summary"
  END,
  "keyWeaknesses" = CASE
    WHEN ac.answers = 0 THEN ARRAY['No candidate answers were captured.']::TEXT[]
    ELSE r."keyWeaknesses"
  END,
  "suggestions" = CASE
    WHEN ac.answers = 0 THEN ARRAY['Complete a new interview and answer at least four officer questions to receive a readiness score.']::TEXT[]
    ELSE r."suggestions"
  END
FROM answer_counts ac
WHERE r."id" = ac."reportId";
