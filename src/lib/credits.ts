export const SIGNUP_CREDITS = 30;
export const INTERVIEW_CREDITS_PER_MINUTE = 2;
export const CV_TAILORING_CREDITS = 10;

export const INTERVIEW_DURATION_OPTIONS = [15, 25, 30, 45, 60] as const;

export function interviewCreditCost(durationMinutes: number) {
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("Interview duration must be a positive whole number of minutes.");
  }

  return durationMinutes * INTERVIEW_CREDITS_PER_MINUTE;
}

export function formatCreditCount(credits: number) {
  return `${credits} credit${credits === 1 ? "" : "s"}`;
}
