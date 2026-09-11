import { NextResponse } from "next/server";
import {
  getJobInterviewSessionParamsSchema,
  JobInterviewVoiceSessionService,
} from "@/lib/interviews";
import { createOpenAiRealtimeCall, getOpenAiRealtimeConfig } from "@/lib/ai-config";
import { requireUser } from "@/lib/session-guards";
import { jsonJobInterviewError } from "../../../route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new JobInterviewVoiceSessionService();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  let realtimeConfig: ReturnType<typeof getOpenAiRealtimeConfig>;
  try {
    realtimeConfig = getOpenAiRealtimeConfig();
  } catch {
    return NextResponse.json(
      { error: "AI interviews are not configured yet. Set the shared OPENAI_API_KEY.", code: "realtime_unavailable" },
      { status: 503 },
    );
  }

  try {
    const { id } = getJobInterviewSessionParamsSchema.parse(
      await context.params,
    );
    const sdp = await request.text();
    if (!sdp.trim()) {
      return NextResponse.json(
        { error: "Missing WebRTC offer.", code: "invalid_input" },
        { status: 400 },
      );
    }

    const prepared = await service.prepareConnection({
      userId: user.id,
      sessionId: id,
      model: realtimeConfig.model,
      voice: realtimeConfig.voice,
    });
    const audioInput: Record<string, unknown> = {
      turn_detection: {
        type: "server_vad",
        threshold: 0.45,
        prefix_padding_ms: 300,
        silence_duration_ms: 650,
        create_response: true,
        interrupt_response: true,
      },
    };
    if (realtimeConfig.transcriptionModel) {
      audioInput.transcription = {
        model: realtimeConfig.transcriptionModel,
        language: prepared.state.session.language,
      };
    }

    const session = {
      type: "realtime",
      model: realtimeConfig.model,
      instructions: prepared.instructions,
      tools: [
        {
          type: "function",
          name: "complete_interview",
          description:
            "End the job interview after the selected questions are covered, the candidate ends, or the duration limit is reached. Return the ordered question-and-answer transcript.",
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                description:
                  "Short internal reason the voice interview is complete.",
              },
              transcript: {
                type: "array",
                description:
                  "Ordered transcript for each answered selected question, exactly once.",
                items: {
                  type: "object",
                  properties: {
                    question: {
                      type: "string",
                      description: "The interviewer question as spoken.",
                    },
                    answer: {
                      type: "string",
                      description: "The candidate answer as spoken.",
                    },
                  },
                  required: ["question", "answer"],
                  additionalProperties: false,
                },
              },
            },
            required: ["reason", "transcript"],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: "auto",
      audio: {
        input: audioInput,
        output: {
          voice: realtimeConfig.voice,
        },
      },
    };

    const realtimeResponse = await createOpenAiRealtimeCall(realtimeConfig.apiKey, sdp, session);
    const body = await realtimeResponse.text();

    if (!realtimeResponse.ok) {
      console.error("OpenAI job voice connection failed", {
        sessionId: id,
        status: realtimeResponse.status,
      });
      return NextResponse.json(
        { error: "Could not start the voice interviewer." },
        { status: 502 },
      );
    }

    await service.markConnected(user.id, id);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp",
        "Cache-Control": "private, no-store",
        "X-Jiandae-Voice-Limit-Seconds": String(
          prepared.durationLimitSeconds,
        ),
      },
    });
  } catch (error) {
    return jsonJobInterviewError(error);
  }
}
