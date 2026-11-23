-- Automatic interviews retain their immutable structure in onboardingData.
-- Preserve the remaining context requirements and avoid scanning historical rows.
ALTER TABLE "InterviewSession" DROP CONSTRAINT "InterviewSession_job_context_check";

ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_job_context_check" CHECK (
  "sessionKind" <> 'job_interview'
  OR (
    "marketId" IS NOT NULL
    AND "roleFamilyId" IS NOT NULL
    AND "seniorityLevelId" IS NOT NULL
    AND (
      "interviewPlanId" IS NOT NULL
      OR COALESCE(
        "onboardingData" #>> '{jobInterview,plan,source}' = 'template'
        AND jsonb_typeof("onboardingData" #> '{jobInterview,plan,moduleSummary}') = 'array'
        AND "onboardingData" #> '{jobInterview,plan,moduleSummary}' <> '[]'::jsonb,
        false
      )
    )
    AND "focusMode" IS NOT NULL
    AND "interviewMode" IS NOT NULL
    AND "questionSetVersion" IS NOT NULL
    AND "rubricVersion" IS NOT NULL
    AND "promptVersion" IS NOT NULL
  )
) NOT VALID;
