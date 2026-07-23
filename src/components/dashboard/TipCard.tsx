import type { DashboardTone, RecommendedTip } from "@/types/dashboard";

const tipClasses: Record<DashboardTone, string> = {
  success: "border-l-success bg-success-surface",
  warning: "border-l-warning bg-warning-surface",
  danger: "border-l-danger bg-danger-surface",
};

export function TipCard({ tip }: { tip: RecommendedTip }) {
  return (
    <article
      className={`rounded-r-lg border border-l-[3px] border-hairline p-4 ${tipClasses[tip.tone]}`}
    >
      <h3 className="text-[12px] font-bold leading-4 text-primary">
        {tip.title}
      </h3>
      <p className="mt-2 text-[12px] leading-5 text-muted">{tip.body}</p>
    </article>
  );
}
