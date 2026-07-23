import type {
  Country,
  InterviewSession,
  OnboardingField,
  Prisma,
  VisaCategory,
  VisaType,
} from "@prisma/client";

type PromptVisaType = VisaType & {
  destinationCountry: Country;
  category?: (VisaCategory & { fields?: OnboardingField[] }) | null;
};

export type InterviewPromptSession = InterviewSession & {
  visaType: PromptVisaType;
  originCountry: Country;
};

function onboardingRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readableValue(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) return "";
  return JSON.stringify(value);
}

function fallbackLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatOnboardingAnswers(session: InterviewPromptSession) {
  const answers = onboardingRecord(session.onboardingData);
  const fields = session.visaType.category?.fields ?? [];
  const labels = new Map(fields.map((field) => [field.key, field.label]));

  return Object.entries(answers)
    .map(([key, value]) => {
      const rendered = readableValue(value);
      if (!rendered) return null;
      return `${labels.get(key) ?? fallbackLabel(key)}: ${rendered}`;
    })
    .filter((line): line is string => Boolean(line));
}

const difficultyInstructions: Record<string, string> = {
  Beginner:
    "friendly and guiding; still realistic, but give you space to clarify",
  Realistic:
    "neutral interview tone; direct, concise, and skeptical where your application is weak",
  Brutal:
    "strict, skeptical, and high pressure; probe contradictions, weak funding, and unclear return plans",
};

export function assembleInterviewPrompt(session: InterviewPromptSession) {
  const difficulty = difficultyInstructions[session.difficulty]
    ? `${session.difficulty} - ${difficultyInstructions[session.difficulty]}`
    : session.difficulty;

  const onboardingAnswers = formatOnboardingAnswers(session);
  const previousRejectionsKnown =
    session.previousRejections !== "Not collected before interview";
  const userContext = [
    "--- Your interview context ---",
    `Visa: ${session.visaType.name}`,
    `Destination country: ${session.visaType.destinationCountry.name}`,
    `Applying from: ${session.originCountry.name}`,
    ...onboardingAnswers,
    onboardingAnswers.length === 0
      ? "Applicant details: Not pre-collected. Discover relevant facts naturally."
      : "",
    previousRejectionsKnown
      ? `Previous rejections: ${session.previousRejections}`
      : "Previous rejections: Not pre-collected; ask only if relevant.",
    session.concerns
      ? `Declared concerns: ${session.concerns}`
      : "Declared concerns: Not pre-collected; discover material concerns naturally.",
    `Difficulty: ${difficulty}`,
  ].filter(Boolean).join("\n");

  return [
    session.visaType.basePrompt.trim(),
    session.originCountry.originProfile?.trim(),
    userContext,
  ]
    .filter(Boolean)
    .join("\n\n");
}
