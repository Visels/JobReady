import Link from "next/link";
import type { DashboardSession, DashboardTone } from "@/types/dashboard";

const scoreClasses: Record<DashboardTone, string> = {
  success: "bg-primary-soft text-accent-success",
  warning: "bg-accent-warning-surface text-accent-warning",
  danger: "bg-accent-surface text-accent-danger",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function SessionRow({ session }: { session: DashboardSession }) {
  const complete = session.status === "completed";
  const href = complete ? `/session/${session.id}/report` : `/session/${session.id}`;
  const duration = session.durationMinutes
    ? `${session.durationMinutes} min`
    : complete
      ? "Duration unavailable"
      : "In progress";

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 border-b border-hairline py-3 last:border-b-0 active:scale-press"
    >
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium leading-5 text-primary">
          {session.visaType} - {session.difficulty}
        </span>
        <span className="mt-0.5 block text-[11px] leading-4 text-muted">
          {formatDate(session.createdAt)} - {duration}
        </span>
      </span>
      <span className="flex flex-none items-center gap-2">
        {session.score !== null ? (
          <span
            className={`rounded-md px-2 py-1 text-[10px] font-semibold leading-none ${scoreClasses[session.tone]}`}
          >
            {session.score}/100
          </span>
        ) : null}
        <span
          className={`rounded-lg px-3 py-2 text-[11px] font-semibold leading-none transition ${
            complete
              ? "border border-hairline bg-surface text-primary group-hover:scale-[1.03] group-hover:bg-surface-2"
              : "bg-accent text-white group-hover:scale-[1.03] group-hover:bg-accent/90"
          }`}
        >
          {complete ? "View" : "Resume"}
        </span>
      </span>
    </Link>
  );
}
