import type { Message } from "@prisma/client";
import OpenAI, { AzureOpenAI } from "openai";
import { z } from "zod";
import { formatHistory } from "@/lib/context";
import {
  answerEvaluationSchema,
  DEFAULT_QUESTION_GUIDANCE,
  questionPromptSchema,
  toAnswerEvaluation,
  toQuestionPrompt,
} from "@/lib/interview-turns";
import { clampPercent, parseJsonObject } from "@/lib/json";
import {
  assembleInterviewPrompt,
  type InterviewPromptSession,
} from "@/lib/prompt/assembleInterviewPrompt";
import { assessReportEvidence } from "@/lib/report-evidence";
import type { AnswerEvaluation, QuestionPrompt } from "@/types/interview";

type InterviewContext = InterviewPromptSession;

export { answerEvaluationSchema, questionPromptSchema };

export const finalReportSchema = answerEvaluationSchema
  .omit({
    answer_summary: true,
    improved_answer: true,
    answer_feedback: true,
    riskFlags: true,
  })
  .extend({
    score: z.number().min(0).max(100),
    summary: z.string().min(1),
    keyWeaknesses: z.array(z.string()).min(1).max(6),
    suggestions: z.array(z.string()).min(1).max(6),
  });

export type FinalReport = z.infer<typeof finalReportSchema>;

interface LlmProvider {
  generateNextQuestion(
    context: InterviewContext,
    history: Message[],
  ): Promise<QuestionPrompt>;
  evaluateAnswer(
    answer: string,
    context: InterviewContext,
    history: Message[],
  ): Promise<AnswerEvaluation>;
  generateFinalReport(
    session: InterviewPromptSession & { messages: Message[] },
  ): Promise<FinalReport>;
}

type ChatClient = OpenAI | AzureOpenAI;

type AzureConfig = {
  endpoint: string;
  deployment: string;
  apiVersion: string;
};

function directOpenAiClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for interview generation.");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function deepseekClient() {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is required for DeepSeek.");
  }

  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  });
}

function normalizeAzureConfig(): AzureConfig {
  const rawEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const envDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const envApiVersion = process.env.AZURE_OPENAI_API_VERSION;

  if (!rawEndpoint) {
    throw new Error("AZURE_OPENAI_ENDPOINT is required for Azure AI Foundry.");
  }

  try {
    const url = new URL(rawEndpoint);
    const deploymentFromUrl = url.pathname.match(
      /\/deployments\/([^/]+)\/?/,
    )?.[1];
    const apiVersionFromUrl = url.searchParams.get("api-version") ?? undefined;

    return {
      endpoint: `${url.origin}/`,
      deployment: envDeployment || deploymentFromUrl || "",
      apiVersion: normalizeAzureApiVersion(
        envApiVersion || apiVersionFromUrl || "2025-01-01-preview",
      ),
    };
  } catch {
    return {
      endpoint: rawEndpoint,
      deployment: envDeployment || "",
      apiVersion: normalizeAzureApiVersion(
        envApiVersion || "2025-01-01-preview",
      ),
    };
  }
}

function normalizeAzureApiVersion(apiVersion: string) {
  if (apiVersion === "2024-07-18") {
    throw new Error(
      'AZURE_OPENAI_API_VERSION="2024-07-18" is the GPT-4o mini model version, not an Azure OpenAI API version. Use the api-version from your Azure endpoint URL, for example "2025-01-01-preview".',
    );
  }

  return apiVersion;
}

function azureFoundryClient() {
  if (!process.env.AZURE_OPENAI_API_KEY) {
    throw new Error("AZURE_OPENAI_API_KEY is required for Azure AI Foundry.");
  }

  const config = normalizeAzureConfig();

  if (!config.deployment) {
    throw new Error("AZURE_OPENAI_DEPLOYMENT is required for Azure AI Foundry.");
  }

  return new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: config.endpoint,
    deployment: config.deployment,
    apiVersion: config.apiVersion,
  });
}

function azureModel() {
  return normalizeAzureConfig().deployment || "gpt-4o-mini";
}

function directOpenAiModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

function deepseekModel() {
  return process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
}

function fallbackQuestionPrompt(question: string): QuestionPrompt {
  return {
    question,
    question_guidance: DEFAULT_QUESTION_GUIDANCE,
  };
}

function normalizeQuestionPromptOutput(value: unknown): QuestionPrompt | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const question =
    typeof record.question === "string"
      ? record.question.trim()
      : typeof record.content === "string"
        ? record.content.trim()
        : "";
  const questionGuidance = Array.isArray(record.question_guidance)
    ? record.question_guidance.filter(
        (tip): tip is string => typeof tip === "string" && tip.trim().length > 0,
      )
    : typeof record.question_guidance === "string"
      ? [record.question_guidance]
      : [];

  if (!question) return null;

  return {
    question,
    question_guidance: questionGuidance,
  };
}

function sanitizeQuestionPrompt(value: QuestionPrompt): QuestionPrompt {
  const questionGuidance = value.question_guidance
    .map((tip) => tip.trim())
    .filter(Boolean)
    .slice(0, 5);

  return {
    question: value.question.trim(),
    question_guidance:
      questionGuidance.length > 0 ? questionGuidance : DEFAULT_QUESTION_GUIDANCE,
  };
}

function fallbackEvaluation(answer: string): AnswerEvaluation {
  return {
    answer_summary: `You said: ${answer.slice(0, 170)}`,
    improved_answer:
      "I am traveling for a clear, temporary purpose, my funding is already planned, and I have specific commitments that require me to return home after the trip.",
    answer_feedback: [
      "You gave an answer, but you need a clearer link between your purpose, funding, and return plans.",
      "You missed the specific evidence that would make your answer easier to trust.",
    ],
    answerConsistency: 50,
    homeTiesStrength: 50,
    returnIntentClarity: 50,
    financialClarity: 50,
    studyPurpose: 50,
    composureUnderPressure: 50,
    riskFlags: [],
  };
}

function normalizeEvaluationOutput(value: unknown): AnswerEvaluation | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const scores =
    record.scores && typeof record.scores === "object"
      ? (record.scores as Record<string, unknown>)
      : {};

  const numberFrom = (...keys: string[]) => {
    for (const key of keys) {
      const raw = record[key] ?? scores[key];
      const valueAsNumber =
        typeof raw === "number"
          ? raw
          : typeof raw === "string"
            ? Number(raw)
            : Number.NaN;

      if (Number.isFinite(valueAsNumber)) return valueAsNumber;
    }

    return 50;
  };

  const stringFrom = (...keys: string[]) => {
    for (const key of keys) {
      const raw = record[key];
      if (typeof raw === "string" && raw.trim()) return raw.trim();
    }

    return "";
  };

  const listFrom = (...keys: string[]) => {
    for (const key of keys) {
      const raw = record[key];
      if (Array.isArray(raw)) {
        const list = raw
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);

        if (list.length > 0) return list;
      }

      if (typeof raw === "string" && raw.trim()) return [raw.trim()];
    }

    return [];
  };

  const answerSummary = stringFrom("answer_summary", "answerSummary", "summary");
  const improvedAnswer = stringFrom(
    "improved_answer",
    "improvedAnswer",
    "ideal_response",
    "idealResponse",
  );
  const answerFeedback = listFrom(
    "answer_feedback",
    "answerFeedback",
    "feedback",
    "tips",
  );

  if (!answerSummary || !improvedAnswer || answerFeedback.length === 0) {
    return null;
  }

  const riskFlags = Array.isArray(record.riskFlags)
    ? record.riskFlags.filter((flag): flag is string => typeof flag === "string")
    : [];

  return {
    answer_summary: answerSummary,
    improved_answer: improvedAnswer,
    answer_feedback: answerFeedback,
    answerConsistency: numberFrom("answerConsistency", "answer_consistency"),
    homeTiesStrength: numberFrom("homeTiesStrength", "home_ties_strength"),
    returnIntentClarity: numberFrom(
      "returnIntentClarity",
      "return_intent_clarity",
    ),
    financialClarity: numberFrom("financialClarity", "financial_clarity"),
    studyPurpose: numberFrom("studyPurpose", "study_purpose"),
    composureUnderPressure: numberFrom(
      "composureUnderPressure",
      "composure_under_pressure",
    ),
    riskFlags,
  };
}

function sanitizeEvaluation(value: AnswerEvaluation): AnswerEvaluation {
  return {
    answer_summary: toCoachVoice(value.answer_summary).slice(0, 220),
    improved_answer: value.improved_answer.slice(0, 700),
    answer_feedback: value.answer_feedback
      .map((tip) => toCoachVoice(tip).trim())
      .filter(Boolean)
      .slice(0, 5),
    answerConsistency: clampPercent(value.answerConsistency),
    homeTiesStrength: clampPercent(value.homeTiesStrength),
    returnIntentClarity: clampPercent(value.returnIntentClarity),
    financialClarity: clampPercent(value.financialClarity),
    studyPurpose: clampPercent(value.studyPurpose),
    composureUnderPressure: clampPercent(value.composureUnderPressure),
    riskFlags: value.riskFlags.slice(0, 5),
  };
}

function isNonAnswer(answer: string) {
  const normalized = answer
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");

  return [
    "i don't know",
    "i dont know",
    "i do not know",
    "not sure",
    "i'm not sure",
    "im not sure",
    "no idea",
    "i have no idea",
  ].includes(normalized);
}

function applyLatestAnswerGuard(
  evaluation: AnswerEvaluation,
  answer: string,
): AnswerEvaluation {
  if (!isNonAnswer(answer)) return evaluation;

  return {
    ...evaluation,
    answer_summary: "You said you do not know, so you did not give the officer usable information to assess.",
    answer_feedback: [
      "You did not clearly state anything the officer could rely on in this answer.",
      "You missed the specific facts, reason, or evidence needed to answer the question confidently.",
    ],
    answerConsistency: Math.min(evaluation.answerConsistency, 20),
    homeTiesStrength: Math.min(evaluation.homeTiesStrength, 20),
    returnIntentClarity: Math.min(evaluation.returnIntentClarity, 20),
    financialClarity: Math.min(evaluation.financialClarity, 20),
    studyPurpose: Math.min(evaluation.studyPurpose, 20),
    composureUnderPressure: Math.min(evaluation.composureUnderPressure, 30),
    riskFlags: [...evaluation.riskFlags, "Non-answer"].slice(0, 5),
  };
}

function toCoachVoice(value: string) {
  return value
    .replace(/\bthe applicant's\b/gi, "your")
    .replace(/\bthe applicant\b/gi, "you")
    .replace(/\ban applicant's\b/gi, "your")
    .replace(/\ban applicant\b/gi, "you")
    .replace(/\bapplicant's\b/gi, "your")
    .replace(/\bapplicant\b/gi, "you");
}

function sanitizeReport(value: FinalReport): FinalReport {
  return {
    score: clampPercent(value.score),
    answerConsistency: clampPercent(value.answerConsistency),
    homeTiesStrength: clampPercent(value.homeTiesStrength),
    returnIntentClarity: clampPercent(value.returnIntentClarity),
    financialClarity: clampPercent(value.financialClarity),
    studyPurpose: clampPercent(value.studyPurpose),
    composureUnderPressure: clampPercent(value.composureUnderPressure),
    summary: toCoachVoice(value.summary),
    keyWeaknesses: value.keyWeaknesses.map(toCoachVoice).slice(0, 6),
    suggestions: value.suggestions.map(toCoachVoice).slice(0, 6),
  };
}

class OpenAiCompatibleProvider implements LlmProvider {
  constructor(
    private readonly createClient: () => ChatClient,
    private readonly modelName: () => string,
  ) {}

  async generateNextQuestion(context: InterviewContext, history: Message[]) {
    const systemPrompt = assembleInterviewPrompt(context);
    const askedCount = history.filter((message) => message.role === "ai").length;
    const client = this.createClient();

    const completion = await client.chat.completions.create({
      model: this.modelName(),
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...formatHistory(history),
        {
          role: "system",
          content: `Ask question ${askedCount + 1} of 8. Use the latest user answer and the full interview history to decide whether the next question should be a direct follow-up, a clarification challenge, or a move to the next required visa topic. Return one valid JSON object only with exact keys "question" and "question_guidance". "question" is the interviewer's next visa interview question. "question_guidance" is an array of 2 short coaching tips addressed directly to the user with "you" language. Do not include post-answer feedback, numbering, or explanations.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      throw new Error("LLM did not return a question.");
    }

    const normalized = normalizeQuestionPromptOutput(
      parseJsonObject<unknown>(raw, null),
    );
    const parsed = questionPromptSchema.safeParse(normalized);

    if (!parsed.success) {
      console.error("Malformed question prompt from LLM", {
        provider: process.env.LLM_PROVIDER || "azure-foundry",
        raw,
        issues: parsed.error.issues,
      });
    }

    return sanitizeQuestionPrompt(
      parsed.success ? toQuestionPrompt(parsed.data) : fallbackQuestionPrompt(raw),
    );
  }

  async evaluateAnswer(
    answer: string,
    context: InterviewContext,
    history: Message[],
  ) {
    const client = this.createClient();
    const latestQuestion =
      [...history].reverse().find((message) => message.role === "ai")?.content ??
      "the current question";
    const completion = await client.chat.completions.create({
      model: this.modelName(),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: assembleInterviewPrompt(context) },
        {
          role: "system",
          content:
            'You are a supportive visa interview coach, not an embassy officer. Return one valid JSON object only. Do not wrap it in markdown. Required exact keys: "answer_summary", "improved_answer", "answer_feedback", "answerConsistency", "homeTiesStrength", "returnIntentClarity", "financialClarity", "studyPurpose", "composureUnderPressure", "riskFlags". All score keys must be numbers from 0 to 100. Interpret "studyPurpose" as visa-purpose or category-fit clarity for non-student visas, and as study-purpose clarity only for student visas. Use direct coaching language. Never refer to "the applicant"; address the user as "you". Ground feedback strictly in the latest raw answer. Do not credit the user for facts from profile context or earlier messages unless the latest raw answer explicitly said them. If the latest raw answer is "I don\'t know", "not sure", or otherwise a non-answer, say that you did not provide usable information and explain what specific type of detail you should add. "answer_summary" must be one concise sentence starting with "You...". "improved_answer" must be an ideal first-person response the user could say aloud, using "I", "my", and "me"; do not invent precise facts such as job offers, family details, schools, employers, or dates unless they are present in the interview context. "answer_feedback" must be an array of 2 short personalized diagnostic notes shown before the best answer. The first note should say what you clearly stated only if the latest raw answer actually stated something useful; otherwise say you did not give enough information. The second note should explain what you missed, made vague, or should add. Use direct wording like "You clearly stated..." and "You missed...".',
        },
        ...formatHistory(history),
        {
          role: "user",
          content: [
            `Current question: ${latestQuestion}`,
            `My latest raw answer: ${answer}`,
            "Evaluate only this raw answer for what I did or did not state.",
          ].join("\n"),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsedObject = parseJsonObject<unknown>(raw, null);
    const normalized = normalizeEvaluationOutput(parsedObject);
    const parsed = answerEvaluationSchema.safeParse(normalized);

    if (!parsed.success) {
      console.error("Malformed answer evaluation from LLM", {
        provider: process.env.LLM_PROVIDER || "azure-foundry",
        raw,
        issues: parsed.error.issues,
      });
    }

    return sanitizeEvaluation(
      applyLatestAnswerGuard(
        parsed.success ? toAnswerEvaluation(parsed.data) : fallbackEvaluation(answer),
        answer,
      ),
    );
  }

  async generateFinalReport(
    session: InterviewPromptSession & { messages: Message[] },
  ) {
    const evidence = assessReportEvidence(session.messages);
    const evidenceInstruction =
      evidence.status === "complete"
        ? `The transcript contains ${evidence.answeredQuestions} candidate answers and qualifies for a readiness score.`
        : `The transcript is incomplete and contains only ${evidence.answeredQuestions} candidate ${evidence.answeredQuestions === 1 ? "answer" : "answers"}. Do not call the performance promising, strong, ready, successful, or likely to succeed. Evaluate only what was actually answered and explicitly state that there is not enough evidence for readiness.`;
    const client = this.createClient();
    const completion = await client.chat.completions.create({
      model: this.modelName(),
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: assembleInterviewPrompt(session) },
        ...formatHistory(session.messages),
        {
          role: "system",
          content: `${evidenceInstruction}\n\nGenerate the final visa interview coaching report as strict JSON with keys: score, answerConsistency, homeTiesStrength, returnIntentClarity, financialClarity, studyPurpose, composureUnderPressure, summary, keyWeaknesses, suggestions. Scores must be integers 0-100. Interpret "studyPurpose" as visa-purpose or category-fit clarity for non-student visas, and as study-purpose clarity only for student visas. Base every finding only on the ordered officer-and-candidate transcript. Do not infer that an unasked topic was weak, and do not invent missing documents, property, family ties, job offers, or other facts. If the officer asked a question but the candidate gave an unrelated answer, state that exact gap. Summary must be one short, plain-language paragraph addressed directly to the user with "you" language. keyWeaknesses must contain at most 3 concrete transcript-grounded points. suggestions must contain at most 3 specific next-session actions, ordered by impact. Do not repeat the same advice across sections. Never write "the applicant".`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = finalReportSchema.safeParse(
      parseJsonObject(raw, {
        score: 50,
        answerConsistency: 50,
        homeTiesStrength: 50,
        returnIntentClarity: 50,
        financialClarity: 50,
        studyPurpose: 50,
        composureUnderPressure: 50,
        summary:
          "The interview was completed, but the report generator returned an incomplete response.",
        keyWeaknesses: ["Report output was incomplete."],
        suggestions: ["Repeat the session with clearer, more specific answers."],
      }),
    );

    if (!parsed.success) {
      throw new Error("LLM final report did not match the required schema.");
    }

    return sanitizeReport(parsed.data);
  }
}

const providers: Record<string, LlmProvider> = {
  "azure-foundry": new OpenAiCompatibleProvider(
    azureFoundryClient,
    azureModel,
  ),
  "azure-openai": new OpenAiCompatibleProvider(
    azureFoundryClient,
    azureModel,
  ),
  deepseek: new OpenAiCompatibleProvider(deepseekClient, deepseekModel),
  openai: new OpenAiCompatibleProvider(directOpenAiClient, directOpenAiModel),
};

function provider() {
  const providerName = process.env.LLM_PROVIDER || "azure-foundry";
  const selected = providers[providerName];

  if (!selected) {
    throw new Error(`Unsupported LLM provider: ${providerName}`);
  }

  return selected;
}

export function generateNextQuestion(
  context: InterviewContext,
  history: Message[],
) {
  return provider().generateNextQuestion(context, history);
}

export function evaluateAnswer(
  answer: string,
  context: InterviewContext,
  history: Message[],
) {
  return provider().evaluateAnswer(answer, context, history);
}

export function generateFinalReport(
  session: InterviewPromptSession & { messages: Message[] },
) {
  return provider().generateFinalReport(session);
}
