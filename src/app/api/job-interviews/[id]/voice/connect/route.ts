import { NextResponse } from "next/server";
import {
  getJobInterviewSessionParamsSchema,
  JobInterviewVoiceSessionService,
  resolveAzureJobRealtimeConfig,
} from "@/lib/interviews";
import { requireUser } from "@/lib/session-guards";
import { jsonJobInterviewError } from "../../../route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const service = new JobInterviewVoiceSessionService();

function clientSecretValue(raw: string) {
  try {
    const parsed = JSON.parse(raw) as {
      value?: string;
      client_secret?: { value?: string };
    };
    return parsed.value || parsed.client_secret?.value || "";
  } catch {
    return "";
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const realtimeConfig = resolveAzureJobRealtimeConfig();
  if (!realtimeConfig.ok) {
    return NextResponse.json(
      { error: realtimeConfig.error, code: "realtime_unavailable" },
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
      model: realtimeConfig.config.deployment,
      voice: realtimeConfig.config.voice,
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
    if (realtimeConfig.config.transcriptionModel) {
      audioInput.transcription = {
        model: realtimeConfig.config.transcriptionModel,
        language: prepared.state.session.language,
      };
    }

    const session = {
      type: "realtime",
      model: realtimeConfig.config.deployment,
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
          voice: realtimeConfig.config.voice,
        },
      },
    };

    const secretResponse = await fetch(realtimeConfig.config.clientSecretsUrl, {
      method: "POST",
      headers: {
        "api-key": realtimeConfig.config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session }),
      cache: "no-store",
    });
    const secretBody = await secretResponse.text();

    if (!secretResponse.ok) {
      console.error("Azure OpenAI job voice client secret failed", {
        sessionId: id,
        status: secretResponse.status,
        body: secretBody,
      });
      return NextResponse.json(
        { error: "Could not authorize the voice interviewer." },
        { status: 502 },
      );
    }

    const clientSecret = clientSecretValue(secretBody);
    if (!clientSecret) {
      console.error("Azure OpenAI job voice returned no client secret", {
        sessionId: id,
      });
      return NextResponse.json(
        { error: "Azure did not return a voice interview token." },
        { status: 502 },
      );
    }

    const realtimeResponse = await fetch(realtimeConfig.config.callsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clientSecret}`,
        "Content-Type": "application/sdp",
      },
      body: sdp,
      cache: "no-store",
    });
    const body = await realtimeResponse.text();

    if (!realtimeResponse.ok) {
      console.error("Azure OpenAI job voice connection failed", {
        sessionId: id,
        status: realtimeResponse.status,
        body,
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
        "X-Jobready-Voice-Limit-Seconds": String(
          prepared.durationLimitSeconds,
        ),
      },
    });
  } catch (error) {
    return jsonJobInterviewError(error);
  }
}
