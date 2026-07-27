import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { SessionStatus } from "@prisma/client";
import { PlayCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSEO } from "@/lib/seo";
import { realtimeDurationMinutes } from "@/lib/realtime-transcript";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Private Visa Interview Sessions",
  description:
    "Private session history for authenticated VisaInterview users.",
  slug: "/sessions",
  noIndex: true,
});

const statusClasses: Record<SessionStatus, string> = {
  ongoing: "bg-[#fff0d4] text-[#9b5a00]",
  completed: "bg-[#dff4e7] text-[#006b4f]",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function scoreClasses(score: number | null) {
  if (score === null) return "bg-[#eef2f0] text-[#65716d]";
  if (score >= 75) return "bg-[#dff4e7] text-[#006b4f]";
  if (score >= 65) return "bg-[#fff0d4] text-[#9b5a00]";
  return "bg-[#ffe5df] text-[#d73521]";
}

function durationMinutes(messages: Array<{ createdAt: Date }>) {
  const first = messages[0]?.createdAt;
  const last = messages.at(-1)?.createdAt;
  if (!first || !last) return null;

  return Math.max(1, Math.round((last.getTime() - first.getTime()) / 60000));
}

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: user.id, sessionKind: "legacy_visa" },
    orderBy: { createdAt: "desc" },
    include: {
      report: { select: { score: true, evidenceStatus: true } },
      visaType: {
        select: {
          name: true,
          destinationCountry: { select: { name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      },
      realtimeInterview: {
        select: {
          startedAt: true,
          endedAt: true,
          durationSeconds: true,
        },
      },
    },
  });

  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#fbfcfb] px-1 py-2 text-primary md:px-3">
      <div className="mx-auto max-w-[1180px]">
        <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[13px] font-semibold leading-5 text-[#697671]">
              Sessions
            </p>
            <h1 className="mt-1 font-serif text-[30px] font-semibold leading-tight tracking-[-0.02em] text-primary">
              My sessions
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-[#52605b]">
              Review every practice interview, continue unfinished sessions, and
              open completed reports.
            </p>
          </div>
          <Link
            href="/practice"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[13px] font-semibold text-white shadow-[0_14px_28px_rgba(240,106,93,0.2)] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef513f] active:scale-press"
          >
            <PlayCircle className="h-4 w-4" strokeWidth={1.8} />
            Start practice
          </Link>
        </header>

        <section className="overflow-hidden rounded-xl border border-[#dfe6e3] bg-white shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf1ef] bg-[#f8fbfa] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#697671]">
                  <th className="px-4 py-3">Visa</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1ef]">
                {sessions.length > 0 ? (
                  sessions.map((item) => {
                    if (!item.visaType) return null;

                    const score =
                      item.report?.evidenceStatus === "complete"
                        ? item.report.score
                        : item.report
                          ? null
                          : item.score;
                    const completed = item.status === "completed";
                    const href = completed
                      ? `/session/${item.id}/report`
                      : `/session/${item.id}`;
                    const duration =
                      realtimeDurationMinutes(item.realtimeInterview) ??
                      durationMinutes(item.messages);

                    return (
                      <tr
                        key={item.id}
                        className="text-[13px] leading-5 text-primary transition hover:bg-[#fbfcfb]"
                      >
                        <td className="px-4 py-3">
                          <span className="font-semibold">
                            {item.visaType.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#52605b]">
                          {item.visaType.destinationCountry.name}
                        </td>
                        <td className="px-4 py-3 text-[#52605b]">
                          {item.difficulty}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold capitalize leading-none ${statusClasses[item.status]}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-md px-2 py-1 text-[12px] font-semibold leading-none tabular-nums ${scoreClasses(score)}`}
                          >
                            {score === null ? "Not scored" : `${score}/100`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#52605b]">
                          {duration ? `${duration} min` : "In progress"}
                        </td>
                        <td className="px-4 py-3 text-[#52605b]">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={href}
                            className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-[12px] font-semibold transition duration-300 ease-soft active:scale-press ${
                              completed
                                ? "border border-primary/35 bg-white text-primary hover:bg-[#f8fbfa]"
                                : "bg-primary text-white hover:bg-primary/92"
                            }`}
                          >
                            {completed ? "View report" : "Resume"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-[14px] font-semibold text-[#52605b]"
                    >
                      No sessions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
