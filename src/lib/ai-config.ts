import OpenAI from "openai";

// Server-side AI configuration shared by CVs, interviews, and speech.
export const OPENAI_API_BASE_URL = "https://api.openai.com/v1";
export const OPENAI_PROVIDER = "openai" as const;
export const OPENAI_REALTIME_PROVIDER = "openai-realtime" as const;

export function getOpenAiApiKey(env: NodeJS.ProcessEnv = process.env) {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for AI features.");
  return apiKey;
}

export function getOpenAiClient() {
  return new OpenAI({
    apiKey: getOpenAiApiKey(),
    baseURL: OPENAI_API_BASE_URL,
  });
}

export function getOpenAiTextModel(env: NodeJS.ProcessEnv = process.env) {
  return env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export function getOpenAiRealtimeModel(env: NodeJS.ProcessEnv = process.env) {
  return env.OPENAI_REALTIME_MODEL?.trim() || "gpt-realtime-mini";
}

export function getOpenAiRealtimeConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    apiKey: getOpenAiApiKey(env),
    model: getOpenAiRealtimeModel(env),
    voice: env.OPENAI_REALTIME_VOICE?.trim() || "alloy",
    transcriptionModel:
      env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "gpt-4o-mini-transcribe",
  };
}

/** The backend exchanges the offer; the API key never reaches the browser. */
export async function createOpenAiRealtimeCall(
  apiKey: string,
  sdp: string,
  session: Record<string, unknown>,
) {
  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", JSON.stringify(session));
  return fetch(`${OPENAI_API_BASE_URL}/realtime/calls`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
  });
}
