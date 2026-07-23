import type { Message, Prisma } from "@prisma/client";

type RealtimeTurnSource = {
  id: string;
  question: string;
  answer: string | null;
  evaluation: Prisma.JsonValue | null;
  createdAt: Date;
};

type TranscriptSource = {
  id: string;
  messages: Message[];
  realtimeInterview?: {
    id: string;
    openingQuestion: string;
    startedAt: Date | null;
    endedAt: Date | null;
    durationSeconds: number | null;
    createdAt: Date;
    turns: RealtimeTurnSource[];
  } | null;
};

function syntheticMessage(
  source: TranscriptSource,
  id: string,
  role: "ai" | "user",
  content: string,
  metadata: Prisma.JsonValue | null,
  createdAt: Date,
): Message {
  return {
    id,
    sessionId: source.id,
    role,
    content,
    metadata,
    createdAt,
  };
}

export function transcriptMessagesForSession(source: TranscriptSource): Message[] {
  const realtime = source.realtimeInterview;
  if (!realtime) return source.messages;

  if (realtime.turns.length === 0) {
    return [
      syntheticMessage(
        source,
        `${realtime.id}:opening`,
        "ai",
        realtime.openingQuestion,
        { source: "realtime", question_guidance: [] },
        realtime.startedAt ?? realtime.createdAt,
      ),
    ];
  }

  return realtime.turns.flatMap((turn) => {
    const question = syntheticMessage(
      source,
      `${turn.id}:question`,
      "ai",
      turn.question,
      { source: "realtime-transcript", question_guidance: [] },
      turn.createdAt,
    );
    if (!turn.answer) return [question];

    return [
      question,
      syntheticMessage(
        source,
        `${turn.id}:answer`,
        "user",
        turn.answer,
        turn.evaluation,
        new Date(turn.createdAt.getTime() + 1),
      ),
    ];
  });
}

type RealtimeDurationSource = {
  startedAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number | null;
};

export function realtimeDurationMinutes(realtime: RealtimeDurationSource | null) {
  if (!realtime) return null;
  if (realtime.durationSeconds !== null) {
    return Math.max(1, Math.round(realtime.durationSeconds / 60));
  }
  if (!realtime.startedAt || !realtime.endedAt) return null;
  return Math.max(
    1,
    Math.round(
      (realtime.endedAt.getTime() - realtime.startedAt.getTime()) / 60_000,
    ),
  );
}
