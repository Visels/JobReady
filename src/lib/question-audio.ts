import { getOpenAiClient, OPENAI_PROVIDER } from "@/lib/ai-config";
import type { QuestionAudio } from "@/types/interview";

const defaultVoiceInstructions = [
  "Speak as a calm, professional interviewer.",
  "Use a direct interview tone, clear pacing, and natural pauses.",
  "Read only the supplied question text without adding commentary.",
].join(" ");

export async function generateQuestionAudio(question: string): Promise<QuestionAudio> {
  if (process.env.QUESTION_AUDIO_ENABLED?.trim().toLowerCase() === "false") {
    return { status: "disabled" };
  }

  try {
    const input = question.replace(/\s+/g, " ").trim().slice(0, 1600);
    const response = await getOpenAiClient().audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE?.trim() || "cedar",
      input,
      instructions: process.env.QUESTION_AUDIO_INSTRUCTIONS || defaultVoiceInstructions,
      response_format: "mp3",
    });
    return {
      status: "ready",
      provider: OPENAI_PROVIDER,
      format: "mp3",
      contentType: "audio/mpeg",
      data: await response.arrayBuffer(),
      transcript: input,
    };
  } catch (error) {
    console.error("Failed to generate question audio", {
      provider: OPENAI_PROVIDER,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      status: "failed",
      provider: OPENAI_PROVIDER,
      error: "Question audio is unavailable right now.",
    };
  }
}
