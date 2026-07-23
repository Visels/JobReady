import type { CriterionScore, DashboardTone } from "@/types/dashboard";

const toneClasses: Record<DashboardTone, { fill: string; text: string; badge: string }> = {
  success: {
    fill: "bg-accent-success",
    text: "text-accent-success",
    badge: "bg-primary-soft",
  },
  warning: {
    fill: "bg-accent-warning",
    text: "text-accent-warning",
    badge: "bg-accent-warning-surface",
  },
  danger: {
    fill: "bg-accent-danger",
    text: "text-accent-danger",
    badge: "bg-accent-surface",
  },
};

export function CriterionBar({ criterion }: { criterion: CriterionScore }) {
  const tone = toneClasses[criterion.tone];

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-[12px] leading-4 text-muted">
          {criterion.label}
        </span>
        <span
          className={`flex-none rounded px-1.5 py-0.5 text-[10px] font-semibold leading-4 ${tone.text} ${tone.badge}`}
        >
          {criterion.score}/100
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted-line">
        <div
          className={`h-full rounded-full ${tone.fill}`}
          style={{ width: `${criterion.score}%` }}
        />
      </div>
    </div>
  );
}
