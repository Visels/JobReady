# Shared OpenAI configuration

All AI features use one server-side `OPENAI_API_KEY`: CV revisions, interview question generation and coaching reports, job and visa voice interviews, transcription, and spoken questions. Reuse the existing key from the server environment or set it once in the local `.env` or deployment secrets. No CV, interview, realtime, or TTS-specific key is needed. Never prefix this key with `NEXT_PUBLIC_`.

Optional settings, all using that same key:

| Setting | Default | Used by |
| --- | --- | --- |
| `OPENAI_MODEL` | `gpt-4o-mini` | CV revisions and AI interview text/report generation |
| `OPENAI_REALTIME_MODEL` | `gpt-realtime-mini` | Job and visa voice interviews |
| `OPENAI_REALTIME_VOICE` | `alloy` for job interviews; officer profile voice for visa interviews | Realtime speech; when set, overrides both defaults |
| `OPENAI_TRANSCRIPTION_MODEL` | `gpt-4o-mini-transcribe` | Interview speech transcription |
| `OPENAI_TTS_MODEL` | `gpt-4o-mini-tts` | Spoken questions |
| `OPENAI_TTS_VOICE` | `cedar` | Spoken questions |
| `QUESTION_AUDIO_ENABLED` | `true` | Set `false` to disable spoken question playback |

Visa officer voices can optionally be overridden with `OPENAI_REALTIME_VOICE_BEGINNER`, `OPENAI_REALTIME_VOICE_REALISTIC`, and `OPENAI_REALTIME_VOICE_BRUTAL`. Existing question selection and scoring rules remain in place; deterministic job-interview evaluators do not make AI requests.

`src/lib/ai-config.ts` is the shared configuration module. Requests go directly to `https://api.openai.com/v1`. The old `LLM_PROVIDER`, `CV_LLM_PROVIDER`, `QUESTION_AUDIO_PROVIDER`, Azure/Foundry, DeepSeek, and ElevenLabs settings are no longer read. Old credentials can be removed from deployment settings; they cannot redirect requests. Restart an existing server after changing environment variables.

Voice connections use the [OpenAI WebRTC server interface](https://developers.openai.com/api/docs/guides/voice-webrtc): the authenticated backend submits the browser's SDP offer and interview configuration to `/realtime/calls` using the shared key. Only the SDP answer returns to the browser. No permanent API key or temporary provider token is exposed to the client.

Run `npm run test:ai-config` for synthetic integration coverage of shared credentials, request destinations, CV revisions, interview generation, speech, both voice routes, and missing-key/upstream-error handling. The test mocks authentication, persistence, and provider responses; it makes no network requests.

Optional live checks use the same existing key and synthetic data:

```powershell
$env:CV_AI_LIVE_TEST='true'
npm run test:cv-ai-live
$env:AI_VOICE_LIVE_TEST='true'
npm run test:ai-voice-live
```

The voice check requires Chrome, establishes a real WebRTC connection, waits for `session.created`, then closes it. It does not read the microphone, generate a conversation, or access application records.
