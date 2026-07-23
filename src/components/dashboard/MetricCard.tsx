import type { DashboardMetric } from "@/types/dashboard";

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <article
      className={`rounded-lg border border-hairline p-4 ${metric.surfaceClassName}`}
    >
      <p className="text-[12px] font-medium leading-4 text-muted">
        {metric.label}
      </p>
      <p className={`mt-3 text-2xl font-medium leading-none ${metric.valueClassName}`}>
        {metric.value}
      </p>
      {metric.score !== null ? (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted-line">
          <div
            className={`h-full rounded-full ${metric.progressClassName}`}
            style={{ width: `${metric.score}%` }}
          />
        </div>
      ) : null}
    </article>
  );
}
