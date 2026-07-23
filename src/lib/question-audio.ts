import OpenAI, { AzureOpenAI } from "openai";
import type { QuestionAudio } from "@/types/interview";

type QuestionAudioProvider =
  | "disabled"
  | "openai"
  | "azure-openai"
  | "elevenlabs";

const defaultVoiceInstructions = [
  "Speak as a calm, professional visa officer.",
  "Use a direct interview tone, clear pacing, and natural pauses.",
  "Read only the supplied question text without adding commentary.",
].join(" ");

function selectedProvider(): QuestionAudioProvider {
  const configured = process.env.QUESTION_AUDIO_PROVIDER?.trim().toLowerCase();

  if (
    configured === "disabled" ||
    configured === "openai" ||
    configured === "azure-openai" ||
    configured === "elevenlabs"
  ) {
    return configured;
  }

  return process.env.OPENAI_API_KEY ? "openai" : "disabled";
}

function normalizeAudioInput(question: string) {
  return question.replace(/\s+/g, " ").trim().slice(0, 1600);
}

function numberFromEnv(name: string) {
  const raw = process.env[name];
  if (!raw) return undefined;

  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function getOpenAiClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for OpenAI question audio.");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getAzureTtsClient() {
  const endpoint =
    process.env.AZURE_OPENAI_TTS_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_TTS_DEPLOYMENT;
  const apiVersion =
    process.env.AZURE_OPENAI_TTS_API_VERSION ||
    process.env.AZURE_OPENAI_API_VERSION ||
    "2025-01-01-preview";
  const apiKey =
    process.env.AZURE_OPENAI_TTS_API_KEY || process.env.AZURE_OPENAI_API_KEY;

  if (!apiKey || !endpoint || !deployment) {
    throw new Error(
      "AZURE_OPENAI_TTS_API_KEY, AZURE_OPENAI_TTS_ENDPOINT, and AZURE_OPENAI_TTS_DEPLOYMENT are required for Azure question audio.",
    );
  }

  return {
    client: new AzureOpenAI({
      apiKey,
      endpoint,
      deployment,
      apiVersion,
    }),
    deployment,
  };
}

async function speechResponseToAudioData(response: Response) {
  return response.arrayBuffer();
}

async function fetchAudioData(response: Response) {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `Audio provider returned ${response.status}.`);
  }

  return response.arrayBuffer();
}

async function generateWithOpenAi(question: string): Promise<QuestionAudio> {
  const client = getOpenAiClient();
  const input = normalizeAudioInput(question);
  const response = await client.audio.speech.create({
    model: process.env.QUESTION_AUDIO_MODEL || "gpt-4o-mini-tts",
    voice: process.env.QUESTION_AUDIO_VOICE || "cedar",
    input,
    instructions: process.env.QUESTION_AUDIO_INSTRUCTIONS || defaultVoiceInstructions,
    response_format: "mp3",
  });

  return {
    status: "ready",
    provider: "openai",
    format: "mp3",
    contentType: "audio/mpeg",
    data: await speechResponseToAudioData(response),
    transcript: input,
  };
}

async function generateWithAzureOpenAi(question: string): Promise<QuestionAudio> {
  const { client, deployment } = getAzureTtsClient();
  const input = normalizeAudioInput(question);
  const response = await client.audio.speech.create({
    model: deployment,
    voice: process.env.QUESTION_AUDIO_VOICE || "cedar",
    input,
    instructions: process.env.QUESTION_AUDIO_INSTRUCTIONS || defaultVoiceInstructions,
    response_format: "mp3",
  });

  return {
    status: "ready",
    provider: "azure-openai",
    format: "mp3",
    contentType: "audio/mpeg",
    data: await speechResponseToAudioData(response),
    transcript: input,
  };
}

async function generateWithElevenLabs(question: string): Promise<QuestionAudio> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
  const outputFormat =
    process.env.ELEVENLABS_OUTPUT_FORMAT || "mp3_44100_128";
  const baseUrl =
    process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io";

  if (!apiKey || !voiceId) {
    throw new Error(
      "ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID are required for ElevenLabs question audio.",
    );
  }

  const input = normalizeAudioInput(question);
  const url = new URL(
    `/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
    baseUrl,
  );
  url.searchParams.set("output_format", outputFormat);

  const voiceSettings: Record<string, number | boolean> = {};
  const stability = numberFromEnv("ELEVENLABS_STABILITY");
  const similarityBoost = numberFromEnv("ELEVENLABS_SIMILARITY_BOOST");
  const style = numberFromEnv("ELEVENLABS_STYLE");
  const speed = numberFromEnv("ELEVENLABS_SPEED");

  if (stability !== undefined) voiceSettings.stability = stability;
  if (similarityBoost !== undefined) {
    voiceSettings.similarity_boost = similarityBoost;
  }
  if (style !== undefined) voiceSettings.style = style;
  if (speed !== undefined) voiceSettings.speed = speed;
  if (process.env.ELEVENLABS_USE_SPEAKER_BOOST) {
    voiceSettings.use_speaker_boost =
      process.env.ELEVENLABS_USE_SPEAKER_BOOST === "true";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: input,
      model_id: modelId,
      ...(Object.keys(voiceSettings).length > 0
        ? { voice_settings: voiceSettings }
        : {}),
    }),
  });

  return {
    status: "ready",
    provider: "elevenlabs",
    format: "mp3",
    contentType: "audio/mpeg",
    data: await fetchAudioData(response),
    transcript: input,
  };
}

export async function generateQuestionAudio(question: string): Promise<QuestionAudio> {
  const provider = selectedProvider();

  if (provider === "disabled") {
    return { status: "disabled" };
  }

  try {
    if (provider === "azure-openai") {
      return await generateWithAzureOpenAi(question);
    }

    if (provider === "elevenlabs") {
      return await generateWithElevenLabs(question);
    }

    return await generateWithOpenAi(question);
  } catch (error) {
    console.error("Failed to generate question audio", {
      provider,
      error,
    });

    return {
      status: "failed",
      provider,
      error: "Question audio is unavailable right now.",
    };
  }
}
