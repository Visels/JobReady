import {
  paidPlanDefinition,
  paidPlanFromValue,
  type PaidPlan,
} from "@/lib/plans";

type EnvLike = Record<string, string | undefined>;

export type CommercialLimits = {
  standardInterviewMinutes: number;
  extendedInterviewMinutes: number;
  monthlyCandidateInterviewUnits: number;
  monthlyCandidateTailoringUnits: number;
  realtimeAudioSeconds: number;
  textAnswerCharacters: number;
  aiBudgetUsdPerInterview: string;
  aiBudgetUsdPerTailoring: string;
};

function intFromEnv(
  env: EnvLike,
  key: string,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number(env[key]);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function decimalFromEnv(env: EnvLike, key: string, fallback: string) {
  const parsed = Number(env[key]);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed.toFixed(4).replace(/\.?0+$/, "");
}

export function getCommercialLimits(env: EnvLike = process.env): CommercialLimits {
  return {
    standardInterviewMinutes: intFromEnv(
      env,
      "JOBREADY_STANDARD_INTERVIEW_MINUTES",
      20,
      5,
      45,
    ),
    extendedInterviewMinutes: intFromEnv(
      env,
      "JOBREADY_EXTENDED_INTERVIEW_MINUTES",
      45,
      10,
      90,
    ),
    monthlyCandidateInterviewUnits: intFromEnv(
      env,
      "JOBREADY_MONTHLY_CANDIDATE_INTERVIEW_UNITS",
      8,
      1,
      40,
    ),
    monthlyCandidateTailoringUnits: intFromEnv(
      env,
      "JOBREADY_MONTHLY_CANDIDATE_TAILORING_UNITS",
      4,
      1,
      20,
    ),
    realtimeAudioSeconds: intFromEnv(
      env,
      "JOBREADY_REALTIME_AUDIO_SECONDS",
      2700,
      300,
      7200,
    ),
    textAnswerCharacters: intFromEnv(
      env,
      "JOBREADY_TEXT_ANSWER_CHARACTERS",
      2400,
      400,
      8000,
    ),
    aiBudgetUsdPerInterview: decimalFromEnv(
      env,
      "JOBREADY_AI_BUDGET_USD_PER_INTERVIEW",
      "0.085",
    ),
    aiBudgetUsdPerTailoring: decimalFromEnv(
      env,
      "JOBREADY_AI_BUDGET_USD_PER_TAILORING",
      "0.075",
    ),
  };
}

export function durationLimitMinutesForPlan(
  plan: PaidPlan,
  env: EnvLike = process.env,
) {
  const definition = paidPlanDefinition(plan);
  const limits = getCommercialLimits(env);

  if (plan === "interview-extended") return limits.extendedInterviewMinutes;
  if (definition.category === "subscription") return limits.standardInterviewMinutes;

  return definition.durationLimitMinutes ?? limits.standardInterviewMinutes;
}

export function budgetLimitUsdForPlan(plan: PaidPlan, env: EnvLike = process.env) {
  const definition = paidPlanDefinition(plan);
  const limits = getCommercialLimits(env);

  if (definition.category === "tailoring") return limits.aiBudgetUsdPerTailoring;
  if (definition.category === "bundle") return definition.budgetLimitUsd;
  if (definition.category === "subscription") return definition.budgetLimitUsd;

  return definition.budgetLimitUsd || limits.aiBudgetUsdPerInterview;
}

export function commercialLimitsForPlan(
  value: unknown,
  env: EnvLike = process.env,
) {
  const plan = paidPlanFromValue(value) ?? "interview-standard";

  return {
    plan,
    durationLimitMinutes: durationLimitMinutesForPlan(plan, env),
    budgetLimitUsd: budgetLimitUsdForPlan(plan, env),
  };
}
