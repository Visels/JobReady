import { strict as assert } from "node:assert";
import {
  buildJobInterviewSessionRequestFromDraft,
  createDefaultInterviewOnboardingDraft,
  prefillDraftFromPublicTarget,
} from "../src/lib/interviews/interview-onboarding-contracts";
import { createJobInterviewSessionRequestSchema } from "../src/lib/interviews/job-interview-session-contracts";
import { INTERVIEW_DURATION_OPTIONS } from "../src/lib/credits";
import { getCommercialLimits } from "../src/lib/commercial-limits";
import { interviewOnboardingFixture } from "./fixtures/interview-onboarding";

const options = interviewOnboardingFixture();
const defaultDraft = createDefaultInterviewOnboardingDraft(options);
const build = (draft: typeof defaultDraft) =>
  buildJobInterviewSessionRequestFromDraft({
    draft,
    options,
    idempotencyKey: "onboarding-updates-check",
  });

assert.equal(defaultDraft.targetSelection, "site");
assert.equal(defaultDraft.interviewMode, "voice");
assert.deepEqual(INTERVIEW_DURATION_OPTIONS, [15, 30, 60]);
assert.equal(getCommercialLimits().realtimeAudioSeconds, 3600);
assert.equal(getCommercialLimits().extendedInterviewMinutes, 60);
const missingJob = build(defaultDraft);
assert.equal(missingJob.ok, false);
if (!missingJob.ok) assert.ok(missingJob.fieldErrors.publicJobPostingVersionId);

const publicDraft = prefillDraftFromPublicTarget(defaultDraft, options, "public-v1");
const publicResult = build({ ...publicDraft, durationMinutes: 60 });
assert.equal(publicResult.ok, true);
if (publicResult.ok) {
  assert.equal(publicResult.input.target.type, "public_job");
  assert.equal(publicResult.input.interviewMode, "voice");
  assert.equal(publicResult.input.durationMinutes, 60);
}

const manualDraft = {
  ...defaultDraft,
  entryPath: "standalone" as const,
  targetSelection: "manual" as const,
  companyId: "",
  manualJobTitle: "Product Manager",
  otherCompanyName: "Mwangaza Studio",
  manualJobDescription: "Lead customer research and prioritize the product roadmap with the team.",
  candidateDocumentChoice: "use" as const,
  candidateDocumentVersionId: "cv-v1",
};
const manualResult = build(manualDraft);
assert.equal(manualResult.ok, true);
if (manualResult.ok) {
  assert.deepEqual(manualResult.input.target, {
    type: "manual_job",
    roleTitle: manualDraft.manualJobTitle,
    companyName: manualDraft.otherCompanyName,
    description: manualDraft.manualJobDescription,
  });
  assert.equal(manualResult.input.candidateDocument?.versionId, "cv-v1");
  assert.equal(createJobInterviewSessionRequestSchema.safeParse(manualResult.input).success, true);
}

const shortDescription = build({ ...manualDraft, manualJobDescription: "Too short" });
assert.equal(shortDescription.ok, false);
if (!shortDescription.ok) assert.ok(shortDescription.fieldErrors.manualJobDescription);

const oldDuration = build({ ...manualDraft, durationMinutes: 45 });
assert.equal(oldDuration.ok, false);
if (!oldDuration.ok) assert.ok(oldDuration.fieldErrors.durationMinutes);

console.log("Interview onboarding updates: passed");
