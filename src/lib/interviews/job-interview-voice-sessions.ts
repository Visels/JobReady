import { createHash } from "node:crypto";
import {
  Prisma,
  type CreditLedgerEntry,
  type PrismaClient,
} from "@prisma/client";
import { consumeReservation, EntitlementLedgerError } from "@/lib/entitlements";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { JobInterviewReportService } from "./job-interview-reports";
import {
  JobInterviewTextSessionError,
  JobInterviewTextSessionService,
} from "./job-interview-text-sessions";
import {
  JOB_INTERVIEW_VOICE_ALLOWED_TOOLS,
  jobInterviewVoiceSessionStateSchema,
  type JobInterviewVoiceEventInput,
  type JobInterviewVoiceInterruptInput,
  type JobInterviewVoiceProviderUsage,
  type JobInterviewVoiceSessionState,
  type JobInterviewVoiceTranscriptInput,
} from "./job-interview-voice-session-contracts";

const VOICE_SESSION_SCHEMA_VERSION = "job-interview-voice-session.task20.v1";
const REALTIME_PROVIDER = "azure-openai-realtime";

type VoiceSessionErrorCode =
  | "invalid_input"
  | "not_found"
  | "not_voice_mode"
  | "already_completed"
  | "realtime_unavailable"
  | "transcript_incomplete"
  | "turn_conflict"
  | "duplicate_event_conflict"
  | "unauthorized_tool"
  | "evaluation_failed"
  | "entitlement_error";

export class JobInterviewVoiceSessionError extends Error {
  constructor(
    public readonly code: VoiceSessionErrorCode,
    message: string = code,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "JobInterviewVoiceSessionError";
  }
}

type ServiceInput = {
  prisma?: PrismaClient;
  now?: () => Date;
};

export type AzureJobRealtimeConfig = {
  provider: typeof REALTIME_PROVIDER;
  callsUrl: string;
  clientSecretsUrl: string;
  apiKey: string;
  deployment: string;
  voice: string;
  transcriptionModel: string | null;
};

export type AzureJobRealtimeConfigResult =
  | { ok: true; config: AzureJobRealtimeConfig }
  | { ok: false; error: string };

const voiceSessionInclude = {
  market: true,
  company: true,
  roleFamily: true,
  jobRole: true,
  seniorityLevel: true,
  interviewStage: true,
  jobPostingVersion: {
    include: {
      posting: {
        include: {
          company: true,
          market: true,
          roleFamily: true,
          jobRole: true,
        },
      },
    },
  },
  privateJobTargetVersion: {
    include: {
      privateJobTarget: {
        include: {
          company: true,
          market: true,
          jobRole: true,
        },
      },
    },
  },
  candidateDocumentVersion: {
    include: {
      document: true,
    },
  },
  interviewPlan: {
    include: {
      modules: {
        include: {
          competency: true,
          evaluationFramework: true,
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  },
  creditLedgerEntries: {
    where: {
      productAction: "interview",
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
  realtimeInterview: {
    include: {
      turns: {
        orderBy: { sequence: "asc" },
      },
      events: {
        orderBy: { sequence: "asc" },
      },
    },
  },
  interviewTurns: {
    orderBy: { sequence: "asc" },
    include: {
      evaluationFramework: true,
      question: {
        include: {
          competencies: {
            include: {
              competency: true,
            },
            orderBy: { weight: "desc" },
          },
        },
      },
      rubric: {
        include: {
          criteria: {
            include: {
              competency: true,
            },
            orderBy: { displayOrder: "asc" },
          },
        },
      },
    },
  },
} satisfies Prisma.InterviewSessionInclude;

type VoiceSessionRecord = Prisma.InterviewSessionGetPayload<{
  include: typeof voiceSessionInclude;
}>;

type VoiceTurnRecord = VoiceSessionRecord["interviewTurns"][number];
type PersistedTurnAnswerResult = Awaited<
  ReturnType<JobInterviewTextSessionService["recordPersistedTurnAnswer"]>
>;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string | null | undefined, maxLength: number) {
  const normalized = normalizeWhitespace(value ?? "");
  if (!normalized) return "";
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}...`
    : normalized;
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function asRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function jsonInput(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function jsonObject(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}

function readVoiceLifecycle(session: Pick<VoiceSessionRecord, "onboardingData">) {
  const root = asRecord(session.onboardingData);
  return asRecord(root.jobInterviewVoice as Prisma.JsonValue);
}

function mergeVoiceLifecycle(
  session: Pick<VoiceSessionRecord, "onboardingData">,
  patch: Record<string, unknown>,
  now: Date,
) {
  const root = asRecord(session.onboardingData);
  const existing = asRecord(root.jobInterviewVoice as Prisma.JsonValue);

  return jsonObject({
    ...root,
    jobInterviewVoice: {
      ...existing,
      ...patch,
      schemaVersion: VOICE_SESSION_SCHEMA_VERSION,
      rawAudioRetention: "none",
      updatedAt: now.toISOString(),
    },
  });
}

function lifecycleString(
  session: Pick<VoiceSessionRecord, "onboardingData">,
  key: string,
) {
  const value = readVoiceLifecycle(session)[key];
  return typeof value === "string" ? value : null;
}

function durationMinutes(session: Pick<VoiceSessionRecord, "onboardingData">) {
  const jobInterview = asRecord(
    asRecord(session.onboardingData).jobInterview as Prisma.JsonValue,
  );
  return typeof jobInterview.durationMinutes === "number"
    ? jobInterview.durationMinutes
    : 30;
}

function durationLimitSeconds(session: Pick<VoiceSessionRecord, "onboardingData">) {
  return Math.max(300, Math.min(7200, durationMinutes(session) * 60));
}

function focusMode(
  value: VoiceSessionRecord["focusMode"],
): JobInterviewVoiceSessionState["session"]["focusMode"] {
  if (
    value === "recommended" ||
    value === "behavioral_focus" ||
    value === "role_specific_focus"
  ) {
    return value;
  }

  return "recommended";
}

function frameworkLabel(key: string, fallback?: string | null) {
  if (fallback) return fallback;

  return key
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function targetType(
  session: VoiceSessionRecord,
): JobInterviewVoiceSessionState["context"]["targetType"] {
  if (session.jobPostingVersion) return "public_job";
  if (session.privateJobTargetVersion) return "private_job";
  return "none";
}

function targetTitle(session: VoiceSessionRecord) {
  if (session.jobPostingVersion) {
    return `${session.jobPostingVersion.title} at ${session.jobPostingVersion.posting.company.displayName}`;
  }

  if (session.privateJobTargetVersion) {
    return `${session.privateJobTargetVersion.roleTitle}${
      session.privateJobTargetVersion.companyName
        ? ` at ${session.privateJobTargetVersion.companyName}`
        : ""
    }`;
  }

  const role =
    session.jobRole?.name ??
    session.roleFamily?.name ??
    "Job interview";
  const company = session.company?.displayName;
  return company ? `${role} at ${company}` : `${role} interview`;
}

function safeContextNote(session: VoiceSessionRecord) {
  if (session.jobPostingVersion) {
    return session.useCandidateDocumentContext
      ? "Uses reviewed public job context and allowlisted CV/resume facts only."
      : "Uses reviewed public job context only. CV/resume context was skipped.";
  }

  if (session.privateJobTargetVersion) {
    return session.useCandidateDocumentContext
      ? "Uses your private target details and allowlisted CV/resume facts only. Private notes and raw documents stay hidden."
      : "Uses your private target title and requirements only. Private notes and raw documents stay hidden.";
  }

  return session.useCandidateDocumentContext
    ? "Uses the selected company/role setup and allowlisted CV/resume facts only."
    : "Uses only the selected company, role, market, and seniority setup.";
}

function turnCompetencies(turn: VoiceTurnRecord) {
  const fromQuestion =
    turn.question?.competencies.map((item) => item.competency) ?? [];
  if (fromQuestion.length > 0) return fromQuestion;

  return (
    turn.rubric?.criteria
      .map((criterion) => criterion.competency)
      .filter((competency): competency is NonNullable<typeof competency> =>
        Boolean(competency),
      ) ?? []
  );
}

function voiceTurnState(turn: VoiceTurnRecord) {
  const frameworkKey = turn.evaluationFramework?.key ?? "unknown";

  return {
    id: turn.id,
    sequence: turn.sequence,
    question: turn.renderedQuestion,
    answer: turn.candidateAnswer,
    framework: {
      key: frameworkKey,
      label: frameworkLabel(frameworkKey, turn.evaluationFramework?.name),
    },
    competencies: turnCompetencies(turn).map((competency) => ({
      id: competency.id,
      slug: competency.slug,
      name: competency.name,
    })),
  };
}

function eventPayloadWithTool(input: JobInterviewVoiceEventInput) {
  return jsonInput({
    ...(input.payload ?? {}),
    ...(input.toolName ? { toolName: input.toolName } : {}),
  });
}

function hashRequestId(value: string | undefined) {
  if (!value) return undefined;
  return createHash("sha256").update(value).digest("hex");
}

function providerUsageAudioSeconds(
  usage: JobInterviewVoiceProviderUsage | undefined,
  durationSecondsValue: number,
) {
  return usage?.audioSeconds ?? durationSecondsValue;
}

function getDeploymentFromEndpoint(url: URL) {
  return (
    url.searchParams.get("model") ??
    url.searchParams.get("deployment") ??
    undefined
  );
}

export function resolveAzureJobRealtimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): AzureJobRealtimeConfigResult {
  const rawEndpoint = env.AZURE_OPENAI_REALTIME_ENDPOINT;
  if (!rawEndpoint) {
    return {
      ok: false,
      error:
        "Set AZURE_OPENAI_REALTIME_ENDPOINT to the Azure OpenAI Realtime endpoint.",
    };
  }

  let endpoint: URL;
  try {
    endpoint = new URL(rawEndpoint);
  } catch {
    return {
      ok: false,
      error: "AZURE_OPENAI_REALTIME_ENDPOINT must be a valid URL.",
    };
  }

  const generalEndpoint = env.AZURE_OPENAI_ENDPOINT;
  const generalEndpointMatches = (() => {
    if (!generalEndpoint) return false;
    try {
      return new URL(generalEndpoint).hostname === endpoint.hostname;
    } catch {
      return false;
    }
  })();
  const apiKey =
    env.AZURE_OPENAI_REALTIME_API_KEY ||
    (generalEndpointMatches ? env.AZURE_OPENAI_API_KEY : undefined);
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Set AZURE_OPENAI_REALTIME_API_KEY, or point AZURE_OPENAI_ENDPOINT at the same resource and set AZURE_OPENAI_API_KEY.",
    };
  }

  const deployment =
    env.AZURE_OPENAI_REALTIME_DEPLOYMENT || getDeploymentFromEndpoint(endpoint);
  if (!deployment) {
    return {
      ok: false,
      error:
        "Set AZURE_OPENAI_REALTIME_DEPLOYMENT, or include ?model=YOUR_REALTIME_DEPLOYMENT in AZURE_OPENAI_REALTIME_ENDPOINT.",
    };
  }

  endpoint.pathname = "/openai/v1/realtime/calls";
  endpoint.search = "";

  const clientSecretsUrl = new URL(endpoint);
  clientSecretsUrl.pathname = "/openai/v1/realtime/client_secrets";

  return {
    ok: true,
    config: {
      provider: REALTIME_PROVIDER,
      callsUrl: endpoint.toString(),
      clientSecretsUrl: clientSecretsUrl.toString(),
      apiKey,
      deployment,
      voice: env.AZURE_OPENAI_REALTIME_VOICE || "alloy",
      transcriptionModel: env.AZURE_OPENAI_REALTIME_TRANSCRIPTION_MODEL || null,
    },
  };
}

export class JobInterviewVoiceSessionService {
  private readonly prisma: PrismaClient;
  private readonly now: () => Date;
  private readonly textService: JobInterviewTextSessionService;
  private readonly reportService: JobInterviewReportService;

  constructor(input: ServiceInput = {}) {
    this.prisma = input.prisma ?? defaultPrisma;
    this.now = input.now ?? (() => new Date());
    this.textService = new JobInterviewTextSessionService({
      prisma: this.prisma,
      now: this.now,
    });
    this.reportService = new JobInterviewReportService({
      prisma: this.prisma,
      now: this.now,
    });
  }

  async getState(userId: string, sessionId: string) {
    const session = await this.loadSession(userId, sessionId);
    this.assertVoiceSession(session);

    return this.toState(session);
  }

  async prepareConnection(input: {
    userId: string;
    sessionId: string;
    model: string;
    voice: string;
  }) {
    const session = await this.loadSession(input.userId, input.sessionId);
    this.assertVoiceSession(session);
    this.assertCanConnect(session);

    const currentTurn = this.currentTurn(session);
    if (!currentTurn) {
      throw new JobInterviewVoiceSessionError(
        "transcript_incomplete",
        "There is no remaining question for this voice interview.",
      );
    }

    await this.ensureRealtimeInterview({
      session,
      model: input.model,
      voice: input.voice,
      openingQuestion: currentTurn.renderedQuestion,
    });

    const refreshed = await this.loadSession(input.userId, input.sessionId);

    return {
      state: this.toState(refreshed),
      instructions: this.buildRealtimeInstructions(refreshed),
      durationLimitSeconds: durationLimitSeconds(refreshed),
    };
  }

  async markConnected(userId: string, sessionId: string) {
    const session = await this.loadSession(userId, sessionId);
    this.assertVoiceSession(session);
    this.assertCanConnect(session);

    const realtime = session.realtimeInterview;
    if (!realtime) {
      throw new JobInterviewVoiceSessionError(
        "realtime_unavailable",
        "The realtime interview has not been prepared.",
      );
    }

    const connectedAt = this.now();
    const nextSequence = await this.nextEventSequence(realtime.id);
    const wasStarted = Boolean(realtime.startedAt);
    await this.prisma.$transaction([
      this.prisma.realtimeInterview.update({
        where: { id: realtime.id },
        data: {
          status: "active",
          startedAt: realtime.startedAt ?? connectedAt,
        },
      }),
      this.prisma.realtimeInterviewEvent.create({
        data: {
          realtimeInterviewId: realtime.id,
          sequence: nextSequence,
          type: wasStarted ? "webrtc_reconnected" : "webrtc_connected",
          payload: {
            rawAudioRetention: "none",
          },
        },
      }),
    ]);

    return this.getState(userId, sessionId);
  }

  async recordClientEvent(
    userId: string,
    sessionId: string,
    input: JobInterviewVoiceEventInput,
  ) {
    this.assertAllowedTool(input.toolName);
    const session = await this.loadSession(userId, sessionId);
    this.assertVoiceSession(session);

    const realtime = session.realtimeInterview;
    if (!realtime) {
      throw new JobInterviewVoiceSessionError(
        "realtime_unavailable",
        "The realtime interview has not been prepared.",
      );
    }

    const sequence = input.sequence ?? (await this.nextEventSequence(realtime.id));
    const existing = await this.prisma.realtimeInterviewEvent.findUnique({
      where: {
        realtimeInterviewId_sequence: {
          realtimeInterviewId: realtime.id,
          sequence,
        },
      },
    });

    if (existing) {
      if (existing.type === input.type) {
        return { recorded: true, idempotent: true, sequence };
      }

      throw new JobInterviewVoiceSessionError(
        "duplicate_event_conflict",
        "A different realtime event already uses this sequence.",
        { sequence, existingType: existing.type, receivedType: input.type },
      );
    }

    await this.prisma.realtimeInterviewEvent.create({
      data: {
        realtimeInterviewId: realtime.id,
        sequence,
        type: input.type,
        payload: eventPayloadWithTool(input),
      },
    });

    return { recorded: true, idempotent: false, sequence };
  }

  async finalizeTranscript(
    userId: string,
    sessionId: string,
    input: JobInterviewVoiceTranscriptInput,
  ) {
    this.assertAllowedTool(input.toolName);
    const session = await this.loadSession(userId, sessionId);
    this.assertVoiceSession(session);

    const realtime = session.realtimeInterview;
    if (!realtime) {
      throw new JobInterviewVoiceSessionError(
        "realtime_unavailable",
        "The realtime interview has not been prepared.",
      );
    }

    if (
      session.status === "completed" &&
      realtime.status === "completed" &&
      realtime.turns.length > 0
    ) {
      return {
        state: this.toState(session),
        report: null,
        idempotent: true,
      };
    }

    const transcriptTurns = this.resolveTranscriptTurns(session, input);
    const persistedResults: PersistedTurnAnswerResult[] = [];
    for (const item of transcriptTurns) {
      try {
        persistedResults.push(
          await this.textService.recordPersistedTurnAnswer({
            userId,
            sessionId,
            turnId: item.turn.id,
            answer: item.answer,
            expectedMode: "voice",
          }),
        );
      } catch (error) {
        if (error instanceof JobInterviewTextSessionError) {
          throw new JobInterviewVoiceSessionError(
            error.code === "turn_conflict" ? "turn_conflict" : "evaluation_failed",
            error.message,
            error.details,
          );
        }

        throw error;
      }
    }

    const refreshedAfterAnswers = await this.loadSession(userId, sessionId);
    const endedAt = this.now();
    const startedAt =
      refreshedAfterAnswers.realtimeInterview?.startedAt ??
      realtime.startedAt ??
      refreshedAfterAnswers.createdAt;
    const measuredDuration = Math.max(
      0,
      Math.round((endedAt.getTime() - startedAt.getTime()) / 1000),
    );
    const storedDuration = Math.min(
      durationLimitSeconds(refreshedAfterAnswers),
      input.durationSeconds ?? measuredDuration,
    );
    const hasRealtimeTranscript = realtime.turns.length > 0;
    const nextSequence = await this.nextEventSequence(realtime.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.realtimeInterview.update({
        where: { id: realtime.id },
        data: {
          status: "completed",
          endedAt,
          durationSeconds: storedDuration,
          completionReason: input.completionReason,
        },
      });

      if (!hasRealtimeTranscript) {
        await tx.realtimeTranscriptTurn.createMany({
          data: transcriptTurns.map((item, index) => ({
            realtimeInterviewId: realtime.id,
            sequence: index,
            question: item.spokenQuestion || item.turn.renderedQuestion,
            answer: item.answer,
            createdAt: new Date(endedAt.getTime() + index),
          })),
        });
      }

      await tx.realtimeInterviewEvent.create({
        data: {
          realtimeInterviewId: realtime.id,
          sequence: nextSequence,
          type: "tool_completion_transcript_saved",
          payload: {
            toolName: input.toolName,
            completionReason: input.completionReason,
            turnCount: transcriptTurns.length,
            persistedTurnIds: transcriptTurns.map((item) => item.turn.id),
            rawAudioRetention: "none",
          },
        },
      });

      await tx.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: "completed",
          onboardingData: mergeVoiceLifecycle(
            refreshedAfterAnswers,
            {
              completedAt: endedAt.toISOString(),
              completionReason: input.completionReason,
              answeredTurnCount: transcriptTurns.length,
              idempotentTurnCount: persistedResults.filter(
                (result) => result.idempotent,
              ).length,
              interruptedAt: null,
              interruptionReason: null,
            },
            endedAt,
          ),
        },
      });

      if (input.providerUsage || storedDuration > 0) {
        await tx.modelUsage.create({
          data: {
            userId,
            interviewSessionId: sessionId,
            productAction: "interview",
            preparationMode: "voice",
            provider: REALTIME_PROVIDER,
            model: realtime.model,
            operation: "realtime_session",
            modality: "audio",
            inputTokens: input.providerUsage?.inputTokens,
            outputTokens: input.providerUsage?.outputTokens,
            cachedInputTokens: input.providerUsage?.cachedInputTokens,
            audioSeconds: providerUsageAudioSeconds(
              input.providerUsage,
              storedDuration,
            ),
            requestIdHash: hashRequestId(input.providerUsage?.requestId),
          },
        });
      }
    });

    const reserve = refreshedAfterAnswers.creditLedgerEntries.find(
      (entry): entry is CreditLedgerEntry => entry.action === "reserve",
    );
    if (reserve) {
      await this.consumeInterviewReservation({
        userId,
        sessionId,
        reserve,
        reason: input.completionReason,
      });
    }

    const report = await this.reportService.generateReport(userId, sessionId);
    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: { score: report.snapshot.evidence.readinessScore },
    });

    return {
      state: await this.getState(userId, sessionId),
      report,
      idempotent: false,
    };
  }

  async interruptSession(
    userId: string,
    sessionId: string,
    input: JobInterviewVoiceInterruptInput,
  ) {
    const session = await this.loadSession(userId, sessionId);
    this.assertVoiceSession(session);

    if (session.status === "completed") {
      return this.toState(session);
    }

    const endedAt = this.now();
    const realtime = session.realtimeInterview;
    const startedAt = realtime?.startedAt ?? session.createdAt;
    const storedDuration = Math.min(
      durationLimitSeconds(session),
      input.durationSeconds ??
        Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)),
    );
    const interruptionSequence = realtime
      ? await this.nextEventSequence(realtime.id)
      : null;

    await this.prisma.$transaction(async (tx) => {
      if (realtime) {
        await tx.realtimeInterview.update({
          where: { id: realtime.id },
          data: {
            status: "failed",
            endedAt,
            durationSeconds: storedDuration,
            completionReason: input.reason,
          },
        });

        await tx.realtimeInterviewEvent.create({
          data: {
            realtimeInterviewId: realtime.id,
            sequence: interruptionSequence ?? 0,
            type: "client_interrupted",
            payload: {
              reason: input.reason,
              rawAudioRetention: "none",
            },
          },
        });
      }

      await tx.interviewSession.update({
        where: { id: sessionId },
        data: {
          onboardingData: mergeVoiceLifecycle(
            session,
            {
              interruptedAt: endedAt.toISOString(),
              interruptionReason: input.reason,
            },
            endedAt,
          ),
        },
      });
    });

    return this.getState(userId, sessionId);
  }

  private async loadSession(userId: string, sessionId: string) {
    const session = await this.prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId,
        sessionKind: "job_interview",
      },
      include: voiceSessionInclude,
    });

    if (!session) {
      throw new JobInterviewVoiceSessionError(
        "not_found",
        "Job interview voice session not found.",
      );
    }

    return session;
  }

  private assertVoiceSession(session: VoiceSessionRecord) {
    if (session.interviewMode !== "voice") {
      throw new JobInterviewVoiceSessionError(
        "not_voice_mode",
        "This setup is not a voice interview.",
        { interviewMode: session.interviewMode },
      );
    }

    if (!session.market || !session.roleFamily || !session.seniorityLevel) {
      throw new JobInterviewVoiceSessionError(
        "invalid_input",
        "Interview session is missing required setup context.",
      );
    }

    if (!session.interviewPlan || session.interviewTurns.length === 0) {
      throw new JobInterviewVoiceSessionError(
        "invalid_input",
        "Interview session is missing its reviewed plan or persisted questions.",
      );
    }
  }

  private assertCanConnect(session: VoiceSessionRecord) {
    if (session.status === "completed") {
      throw new JobInterviewVoiceSessionError(
        "already_completed",
        "This interview is already completed.",
      );
    }
  }

  private assertAllowedTool(toolName: string | undefined) {
    if (!toolName) return;
    if (JOB_INTERVIEW_VOICE_ALLOWED_TOOLS.includes(toolName as "complete_interview")) {
      return;
    }

    throw new JobInterviewVoiceSessionError(
      "unauthorized_tool",
      "Realtime voice interviews only allow the complete_interview tool.",
      { toolName },
    );
  }

  private currentTurn(session: VoiceSessionRecord) {
    if (session.status === "completed") return null;
    return session.interviewTurns.find((turn) => !turn.candidateAnswer) ?? null;
  }

  private async ensureRealtimeInterview(input: {
    session: VoiceSessionRecord;
    model: string;
    voice: string;
    openingQuestion: string;
  }) {
    if (!input.session.realtimeInterview) {
      return this.prisma.realtimeInterview.create({
        data: {
          sessionId: input.session.id,
          model: input.model,
          voice: input.voice,
          openingQuestion: input.openingQuestion,
          status: "pending",
          events: {
            create: {
              sequence: 0,
              type: "job_voice_session_attached",
              payload: {
                rawAudioRetention: "none",
              },
            },
          },
        },
      });
    }

    if (input.session.realtimeInterview.status === "completed") {
      throw new JobInterviewVoiceSessionError(
        "already_completed",
        "This voice interview has already completed.",
      );
    }

    return this.prisma.realtimeInterview.update({
      where: { id: input.session.realtimeInterview.id },
      data: {
        model: input.model,
        voice: input.voice,
        openingQuestion: input.openingQuestion,
      },
    });
  }

  private async nextEventSequence(realtimeInterviewId: string) {
    const aggregate = await this.prisma.realtimeInterviewEvent.aggregate({
      where: { realtimeInterviewId },
      _max: { sequence: true },
    });

    return (aggregate._max.sequence ?? -1) + 1;
  }

  private resolveTranscriptTurns(
    session: VoiceSessionRecord,
    input: JobInterviewVoiceTranscriptInput,
  ) {
    if (input.turns.length === 0) {
      throw new JobInterviewVoiceSessionError(
        "transcript_incomplete",
        "The final voice transcript must include at least one candidate answer.",
      );
    }

    const byId = new Map(session.interviewTurns.map((turn) => [turn.id, turn]));
    const seenTurnIds = new Set<string>();

    return input.turns.map((turn, index) => {
      const persistedTurn = turn.turnId
        ? byId.get(turn.turnId)
        : session.interviewTurns[index];
      if (!persistedTurn) {
        throw new JobInterviewVoiceSessionError(
          "transcript_incomplete",
          "The realtime transcript references a question that is not in this interview.",
          { turnId: turn.turnId ?? null, index },
        );
      }
      if (seenTurnIds.has(persistedTurn.id)) {
        throw new JobInterviewVoiceSessionError(
          "transcript_incomplete",
          "The final voice transcript repeats a persisted question.",
          { turnId: persistedTurn.id },
        );
      }
      seenTurnIds.add(persistedTurn.id);

      return {
        turn: persistedTurn,
        spokenQuestion: truncate(turn.question, 2000),
        answer: normalizeWhitespace(turn.answer),
      };
    });
  }

  private buildRealtimeInstructions(session: VoiceSessionRecord) {
    const currentTurn = this.currentTurn(session);
    const selectedQuestions = session.interviewTurns
      .map((turn) => {
        const frameworkKey = turn.evaluationFramework?.key ?? "unknown";
        const competencyNames = turnCompetencies(turn)
          .map((competency) => competency.name)
          .slice(0, 4)
          .join(", ");

        return [
          `${turn.sequence}. ${turn.renderedQuestion}`,
          `Framework: ${frameworkLabel(frameworkKey, turn.evaluationFramework?.name)} (${frameworkKey}).`,
          competencyNames ? `Competency context: ${competencyNames}.` : "",
          turn.candidateAnswer
            ? `Already answered: ${truncate(turn.candidateAnswer, 500)}`
            : "",
        ]
          .filter(Boolean)
          .join(" ");
      })
      .join("\n");
    const planModules =
      session.interviewPlan?.modules
        .map((module) =>
          [
            module.evaluationFramework.name,
            module.competency?.name,
          ]
            .filter(Boolean)
            .join(" / "),
        )
        .join("; ") || "Reviewed interview plan";
    const targetContext = this.targetContext(session);
    const cvContext = this.candidateDocumentContext(session);
    const answeredHistory = session.interviewTurns
      .filter((turn) => turn.candidateAnswer)
      .map(
        (turn) =>
          `Interviewer: ${turn.renderedQuestion}\nCandidate: ${turn.candidateAnswer}`,
      )
      .join("\n\n");

    return [
      "You are a professional job interviewer conducting a spoken practice interview for candidates applying for jobs in Kenya and across Africa.",
      "Use interviewer/candidate language only. Keep employer hiring practice framing throughout the interview.",
      "Ask exactly one concise spoken question per turn. Prefer one sentence and stay under 18 spoken words.",
      "Use the persisted selected questions in order. Do not invent a new question while a persisted selected question remains unanswered.",
      "Use the current selected question, role, company, market, seniority, stage, focus mode, reviewed plan, and framework context to choose tone and wording.",
      "If an answer is behavioral, listen for STAR evidence internally, but do not coach, score, praise, or explain STAR during the live interview.",
      "For technical, functional, product, analytics, situational, or role-knowledge answers, evaluate internally against that framework only. Do not force STAR onto those answers.",
      "Do not analyze or comment on accent, emotion, personality, protected traits, age, gender, ethnicity, disability, religion, tribe, nationality, or family status.",
      "Do not request video. Do not claim to record raw audio. Raw audio retention is disabled; only transcript text, duration, realtime events, and provider usage may be saved.",
      "After each candidate answer, either ask the next persisted selected question immediately or call complete_interview when the plan is covered, the candidate ends, or the duration limit is reached.",
      "When calling complete_interview, include the ordered transcript exactly once for each answered persisted question. Do not call any tool other than complete_interview.",
      `Focus mode: ${focusMode(session.focusMode)}.`,
      `Duration limit: ${Math.round(durationLimitSeconds(session) / 60)} minutes.`,
      `Plan context: ${planModules}.`,
      `Target context: ${targetContext}`,
      `CV/resume context: ${cvContext}`,
      `Selected question plan:\n${selectedQuestions}`,
      answeredHistory ? `Existing transcript:\n${answeredHistory}` : "",
      currentTurn ? `Current selected question: ${currentTurn.renderedQuestion}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  private targetContext(session: VoiceSessionRecord) {
    if (session.jobPostingVersion) {
      return [
        `${session.jobPostingVersion.title} at ${session.jobPostingVersion.posting.company.displayName}.`,
        `Market: ${session.market?.name ?? "selected market"}.`,
        `Responsibilities: ${session.jobPostingVersion.responsibilities
          .slice(0, 5)
          .join("; ") || "not specified"}.`,
        `Requirements: ${session.jobPostingVersion.requirements
          .slice(0, 5)
          .join("; ") || "not specified"}.`,
      ].join(" ");
    }

    if (session.privateJobTargetVersion) {
      return [
        `${session.privateJobTargetVersion.roleTitle}${
          session.privateJobTargetVersion.companyName
            ? ` at ${session.privateJobTargetVersion.companyName}`
            : ""
        }.`,
        `Requirements: ${session.privateJobTargetVersion.requirements
          .slice(0, 5)
          .join("; ") || "not specified"}.`,
        session.privateJobTargetVersion.description
          ? `Description: ${truncate(session.privateJobTargetVersion.description, 700)}.`
          : "",
      ]
        .filter(Boolean)
        .join(" ");
    }

    return "No public or private target was selected; use only the chosen company, role, seniority, stage, and plan.";
  }

  private candidateDocumentContext(session: VoiceSessionRecord) {
    if (!session.useCandidateDocumentContext) {
      return "The candidate did not consent to CV/resume personalization for this session. Do not reference CV/resume facts as known context.";
    }

    const jobInterview = asRecord(
      asRecord(session.onboardingData).jobInterview as Prisma.JsonValue,
    );
    const professionalContext = asRecord(
      jobInterview.professionalContext as Prisma.JsonValue,
    );
    const facts = Array.isArray(professionalContext.facts)
      ? professionalContext.facts
      : [];
    const consentedAt =
      typeof professionalContext.consentedAt === "string"
        ? professionalContext.consentedAt
        : null;
    if (facts.length === 0) {
      return "CV/resume personalization was consented, but no allowlisted facts are available.";
    }

    const factLines = facts
      .map((fact) => asRecord(fact as Prisma.JsonValue))
      .map((fact) =>
        [
          typeof fact.label === "string" ? fact.label : "",
          typeof fact.skillName === "string" && fact.skillName
            ? `Skill: ${fact.skillName}`
            : "",
          typeof fact.sourceExcerpt === "string" && fact.sourceExcerpt
            ? `Evidence: ${fact.sourceExcerpt}`
            : "",
        ]
          .filter(Boolean)
          .join(" / "),
      )
      .filter(Boolean)
      .slice(0, 10);

    return [
      consentedAt ? `Consent recorded at ${consentedAt}.` : "",
      factLines.join("; "),
    ]
      .filter(Boolean)
      .join(" ");
  }

  private async consumeInterviewReservation(input: {
    userId: string;
    sessionId: string;
    reserve: CreditLedgerEntry;
    reason: string;
  }) {
    try {
      await consumeReservation({
        userId: input.userId,
        productAction: "interview",
        relatedEntryId: input.reserve.id,
        idempotencyKey: `job-interview-session:${input.sessionId}:consume:voice-complete`,
        metadata: {
          source: "job_interview_voice_session",
          reason: input.reason,
        },
      });
    } catch (error) {
      if (error instanceof EntitlementLedgerError) {
        throw new JobInterviewVoiceSessionError(
          "entitlement_error",
          error.message,
          { code: error.code },
        );
      }

      throw error;
    }
  }

  private toState(session: VoiceSessionRecord): JobInterviewVoiceSessionState {
    const currentTurn = this.currentTurn(session);
    const turns = session.interviewTurns.map(voiceTurnState);
    const answeredTurns = session.interviewTurns.filter((turn) =>
      Boolean(turn.candidateAnswer),
    );
    const evaluatedTurns = answeredTurns.filter((turn) =>
      Boolean(turn.structuredEvaluation),
    );
    const realtime = session.realtimeInterview;
    const totalTurns = session.interviewTurns.length;
    const state = {
      session: {
        id: session.id,
        status: session.status,
        focusMode: focusMode(session.focusMode),
        durationMinutes: durationMinutes(session),
        durationLimitSeconds: durationLimitSeconds(session),
        language: session.language,
        startedAt: toIso(realtime?.startedAt ?? null),
        completedAt: lifecycleString(session, "completedAt"),
        interruptedAt: lifecycleString(session, "interruptedAt"),
        completionReason: lifecycleString(session, "completionReason"),
      },
      context: {
        title: targetTitle(session),
        market: session.market?.name ?? "Selected market",
        company:
          session.company?.displayName ??
          session.jobPostingVersion?.posting.company.displayName ??
          session.privateJobTargetVersion?.companyName ??
          null,
        role:
          session.jobRole?.name ??
          session.privateJobTargetVersion?.roleTitle ??
          session.roleFamily?.name ??
          "Selected role",
        seniority: session.seniorityLevel?.label ?? "Selected seniority",
        stage: session.interviewStage?.label ?? null,
        targetType: targetType(session),
        safeContextNote: safeContextNote(session),
      },
      realtime: {
        id: realtime?.id ?? null,
        status: realtime?.status ?? null,
        model: realtime?.model ?? null,
        voice: realtime?.voice ?? null,
        openingQuestion: realtime?.openingQuestion ?? null,
        startedAt: toIso(realtime?.startedAt ?? null),
        endedAt: toIso(realtime?.endedAt ?? null),
        durationSeconds: realtime?.durationSeconds ?? null,
        eventCount: realtime?.events.length ?? 0,
        transcriptTurnCount: realtime?.turns.length ?? 0,
      },
      progress: {
        totalTurns,
        answeredTurns: answeredTurns.length,
        evaluatedTurns: evaluatedTurns.length,
        currentSequence: currentTurn?.sequence ?? null,
        percent:
          totalTurns > 0
            ? Math.round((answeredTurns.length / totalTurns) * 100)
            : 0,
        canConnect: session.status !== "completed" && Boolean(currentTurn),
        isComplete: session.status === "completed",
      },
      currentTurn: currentTurn ? voiceTurnState(currentTurn) : null,
      turns,
      transcriptPolicy: {
        rawAudioRetention: "none",
        storedArtifacts: [
          "ordered transcript text",
          "duration seconds",
          "provider usage",
          "realtime control events",
        ],
      },
    } satisfies JobInterviewVoiceSessionState;

    return jobInterviewVoiceSessionStateSchema.parse(state);
  }
}
