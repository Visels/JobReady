# Task 15 - Behavioral and STAR Evaluation

Date: 2026-07-27

## Outcome

Task 15 adds a separate behavioral evaluator for persisted Jobready interview
turns that use the `behavioral_star` framework.

The evaluator now:

- Evaluates only an existing persisted `InterviewTurn`.
- Refuses incompatible frameworks instead of applying STAR universally.
- Scores Situation, Task, Action, and Result independently with
  `StarComponentStatus` values and 0-5 scores.
- Scores each attached competency independently with evidence excerpts.
- Requires provider output to pass a Zod schema before persistence.
- Stores the current answer and structured evaluation on the turn.
- Stores reproducible STAR evidence in `StarScore`.
- Stores per-competency evidence in `CompetencyScore`.
- Writes a deterministic `InterviewReport` snapshot for the evaluated turn.
- Handles non-answers, irrelevance, team-only claims, vague action, missing
  result, unsupported CV/profile references, and adversarial instruction
  attempts.
- Generates improvement guidance, missing-fact prompts, and a first-person
  improved answer that uses candidate-supplied excerpts or explicit placeholders.

No CV/resume or profile facts are credited as answer evidence. If the candidate
points to CV/profile context instead of saying the evidence in the answer, the
evaluation is flagged as unsupported and scores are capped.

## Files Changed

- `src/lib/interviews/behavioral-evaluation.ts`
  - Added the behavioral STAR evaluator service, deterministic provider-output
    rules, Zod validation schema, risk flags, missing-fact prompts, and
    persistence flow.
  - Added stop-word-filtered relevance checks so generic filler words do not
    make unrelated answers look relevant.
- `src/lib/interviews/index.ts`
  - Exported the behavioral evaluator.
- `scripts/test-behavioral-evaluation.ts`
  - Added DB-backed weak, medium, strong, incomplete, non-answer, adversarial,
    team-only, unsupported CV/profile evidence, complete-STAR-low-competency,
    current-answer-only, and incompatible-framework fixtures.
- `package.json`
  - Added `npm run test:behavioral-evaluation`.
- `JOB_INTERVIEW_PLATFORM_MIGRATION_TODO.md`
  - Marked Task 15 complete and added the completion-log row.

## Persistence

The evaluator reuses the schema introduced in earlier additive migrations. No
new migration was required.

Persisted data for a behavioral evaluation:

- `InterviewTurn.candidateAnswer` stores the current answer only.
- `InterviewTurn.structuredEvaluation` stores the validated Task 15 evaluation.
- `InterviewTurn.startedAt` and `InterviewTurn.answeredAt` are set when the
  answer is evaluated.
- `InterviewReport` version 1 stores a deterministic report snapshot for the
  session and evaluated turn.
- `StarScore` stores STAR status, score, and evidence for the turn.
- `CompetencyScore` stores one score row per attached competency on the report.

Re-evaluating the same turn replaces the previous STAR evidence row for that
turn and overwrites the report/turn snapshots with the current answer, proving
that previous answers are not credited.

## Validation Results

Passed:

- `npx tsc --noEmit`.
- `npm run lint`.
- `npx prisma validate` with the existing Prisma 7 config deprecation warning.
- `npx prisma migrate deploy` on a clean disposable PostgreSQL 16 Docker
  database.
- `npm run test:behavioral-evaluation` on the disposable PostgreSQL database.
- `npm run test:question-selection` on the same disposable PostgreSQL database
  as a Task 14 regression.
- `npm run test:job-interviews` on the same disposable PostgreSQL database as a
  Task 13 regression.
- `git diff --check`.

Focused Task 15 assertions proved:

- Strong behavioral answers receive complete evidence-backed STAR and competency
  scores.
- Medium answers can have usable structure without receiving strong scores.
- Weak answers with vague action are not inflated.
- Incomplete answers with missing result are classified as incomplete and prompt
  for result evidence.
- Non-answers receive zero score, insufficient evidence status, no praise, and
  explicit missing-fact prompts.
- Adversarial instruction attempts receive zero score and unsupported evidence
  status.
- Team-only claims are flagged and personal-action scores are capped.
- CV/profile-only evidence is not credited and lowers scores.
- A complete STAR structure does not guarantee a high competency or overall
  score when the answer is unrelated to the attached competencies.
- Re-evaluating a turn scores only the current answer.
- STAR evaluation is rejected for `technical_concept` turns.
- Improved answers do not add fixture-invented facts.

## Decisions

- Behavioral evaluation lives in a dedicated service, not in the interview
  delivery/session-creation service.
- The initial evaluator is deterministic and provider-labeled as
  `jobready-behavioral-star-rules-v1`, giving reproducible fixtures before
  introducing LLM-backed evaluation behavior.
- Zod validation is the provider-output boundary even for deterministic output,
  so an LLM provider can be swapped in later behind the same schema.
- No schema migration was added because `InterviewTurn`, `InterviewReport`,
  `StarScore`, and `CompetencyScore` already support the Task 15 persistence
  needs.

## Risks and Follow-ups

- `CompetencyScore` is report-scoped, while `InterviewTurn.structuredEvaluation`
  contains the per-turn competency detail. Task 19 should decide whether the
  final aggregate report needs turn-scoped competency score rows.
- The deterministic keyword evaluator is intentionally conservative. A future
  LLM-backed evaluator can improve nuance as long as it keeps the same evidence,
  validation, and no-invention guarantees.
- Task 18 and Task 20 should call this service only for persisted
  `behavioral_star` turns during text and voice delivery.

## Next Task

Task 16 - Role-Specific Evaluation Frameworks.
