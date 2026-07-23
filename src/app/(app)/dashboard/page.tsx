import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  History,
  PlayCircle,
} from "lucide-react";
import {
  DashboardBodySkeleton,
  DashboardHeaderSkeleton,
} from "@/components/dashboard/DashboardSkeleton";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { NotificationsPopover } from "@/components/dashboard/NotificationsPopover";
import { CheckoutStatusToast } from "@/components/ui/CheckoutStatusToast";
import { PurchaseButton } from "@/components/ui/PurchaseButton";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { generateSEO } from "@/lib/seo";
import type { DashboardData, DashboardSession } from "@/types/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Private Visa Interview Dashboard",
  description:
    "Private VisaInterview dashboard for visa interview practice, learning materials, and session history.",
  slug: "/dashboard",
  noIndex: true,
});

function displayFirstName(name: string | null) {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.includes("@")) return "there";

  const first = trimmed.split(/\s+/)[0];
  if (!trimmed.includes(" ") && /\d/.test(first)) return "there";

  return `${first.charAt(0).toUpperCase()}${first.slice(1)}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function sessionHref(session: DashboardSession) {
  return session.status === "completed"
    ? `/session/${session.id}/report`
    : `/session/${session.id}`;
}

function nextAction(data: DashboardData) {
  if (data.interviewContext.activeSessionId) {
    return {
      eyebrow: "Resume session",
      title: "Continue your latest interview",
      body: "Pick up where you left off and finish the conversation while the context is still fresh.",
      href: `/session/${data.interviewContext.activeSessionId}`,
      label: "Resume practice",
      icon: PlayCircle,
    };
  }

  if (data.weakestArea) {
    return {
      eyebrow: "Next best step",
      title: `Practice ${data.weakestArea.label.toLowerCase()}`,
      body: "Run a focused interview round on the area that needs the most attention from your reports.",
      href: `/practice?focus=${data.weakestArea.key}`,
      label: "Practice this area",
      icon: GraduationCap,
    };
  }

  return {
    eyebrow: "Start here",
    title: "Take your first mock interview",
    body: "Complete one realistic session, then review your report when it is ready.",
    href: "/practice",
    label: "Start practice",
    icon: PlayCircle,
  };
}

async function DashboardHeader({
  dataPromise,
}: {
  dataPromise: Promise<DashboardData>;
}) {
  const data = await dataPromise;

  return (
    <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="font-serif text-[26px] font-semibold leading-tight tracking-[-0.02em] text-primary md:text-[30px]">
          <DashboardGreeting
            name={displayFirstName(data.user.name)}
            initialGreeting={greeting()}
          />
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#3f504c]">
          Choose what to do next: practice, review a recent session, or learn
          the answer patterns officers expect.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {data.user.daysRemaining > 0 ? null : (
          <>
            <PurchaseButton label="7-day access" plan="weekly" variant="dashboard" />
            <PurchaseButton label="30-day access" plan="monthly" variant="dashboard" />
          </>
        )}
        <NotificationsPopover />
      </div>
    </header>
  );
}

function NextActionCard({ data }: { data: DashboardData }) {
  const action = nextAction(data);
  const Icon = action.icon;

  return (
    <section className="rounded-xl border border-[#dfe6e3] bg-white p-5 shadow-[0_16px_38px_rgba(15,47,40,0.04)] md:p-6">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex gap-4">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-[#eef5f1] text-primary">
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[12px] font-semibold leading-4 text-[#697671]">
              {action.eyebrow}
            </p>
            <h2 className="mt-1 text-[20px] font-semibold leading-7 text-primary md:text-[22px]">
              {action.title}
            </h2>
            <p className="mt-2 max-w-[58ch] text-[13px] leading-5 text-[#52605b]">
              {action.body}
            </p>
          </div>
        </div>

        <Link
          href={action.href}
          className="group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 text-[14px] font-semibold text-white shadow-[0_14px_28px_rgba(240,106,93,0.2)] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef513f] active:scale-press md:w-auto"
        >
          {action.label}
          <ArrowRight
            className="h-4 w-4 transition duration-300 ease-soft group-hover:translate-x-1"
            strokeWidth={1.8}
          />
        </Link>
      </div>
    </section>
  );
}

function RecentSessionRow({ session }: { session: DashboardSession }) {
  const complete = session.status === "completed";
  const action = complete ? "View report" : "Resume";
  const duration = session.durationMinutes
    ? `${session.durationMinutes} min`
    : complete
      ? "Duration unavailable"
      : "In progress";

  return (
    <Link
      href={sessionHref(session)}
      className="group grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-[#edf1ef] bg-[#fbfcfb] px-3 py-3 transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#cfdcd7] hover:bg-white active:scale-press"
    >
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold leading-5 text-primary">
          {session.visaType} - {session.difficulty}
        </span>
        <span className="block text-[11px] leading-4 text-[#6f7875]">
          {formatDate(session.createdAt)} - {duration}
        </span>
      </span>
      <span
        className={`inline-flex min-h-8 min-w-[86px] items-center justify-center rounded-lg px-3 text-[12px] font-semibold transition duration-300 ease-soft group-hover:-translate-y-0.5 ${
          complete
            ? "border border-primary/35 bg-white text-primary"
            : "bg-primary text-white shadow-[0_12px_24px_rgba(0,75,63,0.14)]"
        }`}
      >
        {action}
      </span>
    </Link>
  );
}

function RecentSessions({ sessions }: { sessions: DashboardSession[] }) {
  return (
    <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)] md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[#697671]" strokeWidth={1.8} />
          <h2 className="text-[15px] font-semibold leading-5 text-primary">
            Latest sessions
          </h2>
        </div>
        <Link
          href="/sessions"
          className="text-[12px] font-medium leading-5 text-primary transition hover:text-accent"
        >
          View all
        </Link>
      </div>

      <div className="mt-4 grid gap-2.5">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <RecentSessionRow key={session.id} session={session} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[#d6e0dc] bg-[#f9fbfa] p-6">
            <p className="text-[13px] font-semibold text-primary">
              No sessions yet
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[#5f6b67]">
              Start one realistic interview and your latest sessions will show
              here.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

const learningItems = [
  {
    title: "Learning center",
    body: "Interview techniques, answer structure, phrases, and common mistakes.",
    href: "/learning",
    icon: BookOpen,
  },
  {
    title: "Visa guides",
    body: "Visa-specific requirements and preparation notes before you practice.",
    href: "/visa-guides",
    icon: FileText,
  },
  {
    title: "Practice questions",
    body: "Jump into guided question sets when you want a shorter study block.",
    href: "/practice",
    icon: GraduationCap,
  },
];

function LearningMaterials() {
  return (
    <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)] md:p-5">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#697671]" strokeWidth={1.8} />
        <h2 className="text-[15px] font-semibold leading-5 text-primary">
          Learning
        </h2>
      </div>

      <div className="mt-4 grid gap-2.5">
        {learningItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group grid grid-cols-[36px_1fr_20px] items-center gap-3 rounded-lg border border-[#edf1ef] bg-[#fbfcfb] p-3 transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#cfdcd7] hover:bg-white active:scale-press"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef5f1] text-primary">
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-5 text-primary">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-[#5f6b67]">
                  {item.body}
                </span>
              </span>
              <ArrowRight
                className="h-4 w-4 text-[#8a9692] transition duration-300 ease-soft group-hover:translate-x-1 group-hover:text-accent"
                strokeWidth={1.8}
              />
            </Link>
          );
        })}
      </div>
    </article>
  );
}

function QuickRoutes() {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <Link
        href="/practice"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d6e0dc] bg-white px-4 text-[13px] font-semibold text-primary transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#f8fbfa] active:scale-press"
      >
        <PlayCircle className="h-4 w-4" strokeWidth={1.8} />
        Practice
      </Link>
      <Link
        href="/sessions"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d6e0dc] bg-white px-4 text-[13px] font-semibold text-primary transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#f8fbfa] active:scale-press"
      >
        <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
        Sessions
      </Link>
      <Link
        href="/learning"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d6e0dc] bg-white px-4 text-[13px] font-semibold text-primary transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#f8fbfa] active:scale-press"
      >
        <BookOpen className="h-4 w-4" strokeWidth={1.8} />
        Learning
      </Link>
    </section>
  );
}

async function DashboardBody({
  dataPromise,
}: {
  dataPromise: Promise<DashboardData>;
}) {
  const data = await dataPromise;

  return (
    <div className="space-y-5">
      <NextActionCard data={data} />
      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <RecentSessions sessions={data.recentSessions} />
        <LearningMaterials />
      </section>
      <QuickRoutes />
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const dataPromise = getDashboardData(user.id);

  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#fbfcfb] px-1 py-4 text-primary md:px-3 md:py-5">
      <CheckoutStatusToast status={params.checkout} />
      <div className="mx-auto max-w-[1040px]">
        <Suspense fallback={<DashboardHeaderSkeleton />}>
          <DashboardHeader dataPromise={dataPromise} />
        </Suspense>
        <Suspense fallback={<DashboardBodySkeleton />}>
          <DashboardBody dataPromise={dataPromise} />
        </Suspense>
      </div>
    </main>
  );
}
