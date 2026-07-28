# Task 20 - Realtime Voice Interviews

## Summary

Task 20 adds realtime voice delivery for job interview sessions while preserving
the existing WebRTC and server-side ephemeral-credential architecture. Voice
answers are saved into the same persisted `InterviewTurn` evidence stream used
by text interviews, so Task 19 web/PDF reports work from the same report
snapshot model.

## Official Realtime Verification

- OpenAI Realtime API reference documents WebRTC calls through
  `/v1/realtime/calls`, with `session.type = "realtime"` and the realtime model
  supplied in the session configuration.
- Azure OpenAI Realtime GA documentation documents the current WebRTC
  `client_secrets` and `calls` endpoints under `/openai/v1/realtime`, and says
  `session.model` should be the deployed realtime model name.
- Azure documentation currently lists realtime-capable deployments such as
  `gpt-realtime`, `gpt-realtime-mini`, and `gpt-realtime-1.5`. The implementation
  does not hard-code a model name; it requires
  `AZURE_OPENAI_REALTIME_DEPLOYMENT` or a `?model=` query on
  `AZURE_OPENAI_REALTIME_ENDPOINT`.

References:

- https://platform.openai.com/docs/api-reference/realtime
- https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/realtime-audio-webrtc
- https://learn.microsoft.com/en-us/rest/api/aifoundry/azureopenai/realtime

## Implementation

- Added `JobInterviewVoiceSessionService` and contracts for voice state,
  transcript finalization, realtime event logging, provider usage, and
  interruptions.
- Added authenticated voice APIs:
  - `GET /api/job-interviews/[id]/voice`
  - `POST /api/job-interviews/[id]/voice/connect`
  - `POST /api/job-interviews/[id]/voice/transcript`
  - `POST /api/job-interviews/[id]/voice/event`
  - `POST /api/job-interviews/[id]/voice/interrupt`
- Added `/interviews/[id]/voice` and a microphone-only `JobVoiceInterviewRoom`.
- Updated preparation and text-room handoffs so voice-mode sessions open the
  voice room instead of a Task 20 placeholder.
- Reused the existing text-session evaluator through a new persisted-turn answer
  seam, preserving STAR behavior for behavioral answers and role-specific
  criteria for technical/functional answers.
- Generated the Task 19 report snapshot after voice completion so voice and text
  reports use the same evidence rules.

## Privacy and Retention

- D11 is followed: raw audio is not stored.
- Persisted artifacts are ordered transcript text, realtime control events,
  duration seconds, and provider usage.
- The client requests audio only with `video: false`.
- Prompt instructions forbid protected-trait, accent, emotion, and personality
  analysis.
- CV/resume facts are included in realtime instructions only when the session
  has explicit document-personalization consent.

## Database

No Prisma schema migration was required. Task 20 uses existing models:

- `RealtimeInterview`
- `RealtimeTranscriptTurn`
- `RealtimeInterviewEvent`
- `InterviewTurn`
- `InterviewReport`
- `ModelUsage`

Because no schema migration was introduced, there was no Task 20 production
database migration to apply. Duration and provider usage are recorded through
existing columns.

## Validation

Passed:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npx prisma validate`
- Clean disposable PostgreSQL `prisma migrate deploy`
- `npm run test:job-interview-voice`
- Task 18 regression `npm run test:job-interview-text`
- Task 19 regression `npm run test:job-interview-reports`
- Task 13 regression `npm run test:job-interviews`
- Task 14 regression `npm run test:question-selection`
- Task 15 regression `npm run test:behavioral-evaluation`
- Task 16 regression `npm run test:role-specific-evaluation`
- Task 17 regression `npm run test:interview-onboarding`
- `npm run test:interview-content`
- `npm run build`
- `git diff --check`

Focused Task 20 coverage proves:

- Scenario A recommended voice session completes and produces evidence-backed
  report data.
- Scenario B role-specific public-job voice session completes with target and
  consented CV context.
- Reconnect records a reconnect event and does not duplicate transcript turns.
- Duplicate realtime event sequences are idempotent only for the same event and
  conflict on mismatched payload type.
- Missing transcript finalization is rejected.
- Unauthorized tool calls are rejected.
- Interrupted sessions keep the interview ongoing, mark realtime as failed, and
  do not consume the reserved interview credit.
- Duration seconds and realtime provider usage are stored in existing
  `RealtimeInterview` and `ModelUsage` rows.
