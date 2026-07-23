import type { DashboardTone } from "@/types/dashboard";

const toneClass: Record<DashboardTone | "info", string> = {
  success: "text-accent-success",
  warning: "text-accent-warning",
  danger: "text-accent-danger",
  info: "text-info-text",
};

export function ReadinessRing({
  score,
  tone = "info",
}: {
  score: number;
  tone?: DashboardTone | "info";
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className="relative h-20 w-20 flex-none">
      <svg
        aria-hidden="true"
        viewBox="0 0 80 80"
        className="h-20 w-20 -rotate-90"
      >
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          className="text-muted-line"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={toneClass[tone]}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-[18px] font-medium leading-none ${toneClass[tone]}`}>
          {score}
        </span>
        <span className="mt-0.5 text-[9px] leading-none text-muted">/100</span>
      </div>
    </div>
  );
}
