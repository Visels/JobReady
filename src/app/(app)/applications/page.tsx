import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  WorkspaceBadge,
  WorkspaceCard,
  WorkspaceEmptyState,
  WorkspacePageFrame,
  WorkspaceSectionTitle,
  WorkspaceTextLink,
  formatWorkspaceDate,
} from "@/components/workspace/WorkspacePage";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { generateSEO } from "@/lib/seo";
import type { WorkspaceApplication } from "@/types/dashboard";

type ApplicationsPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Applications",
  description: "Private Jobready application tracker.",
  slug: "/applications",
  noIndex: true,
});

const statuses = [
  "all",
  "interested",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

function labelStatus(status: string) {
  return status
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function filterApplications(
  applications: WorkspaceApplication[],
  status: string,
) {
  if (status === "all") return applications;
  return applications.filter((application) => application.status === status);
}

function statusTone(status: string) {
  if (status === "offer") return "success" as const;
  if (status === "rejected" || status === "withdrawn") return "danger" as const;
  if (status === "interview" || status === "screening") return "warning" as const;
  return "neutral" as const;
}

function ApplicationCard({
  application,
}: {
  application: WorkspaceApplication;
}) {
  return (
    <article className="rounded-[1.45rem] border border-muted-line bg-surface-soft p-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <WorkspaceBadge tone={statusTone(application.status)}>
              {application.statusLabel}
            </WorkspaceBadge>
            {application.warning ? (
              <WorkspaceBadge tone="warning">Needs review</WorkspaceBadge>
            ) : null}
          </div>
          <h2 className="mt-3 text-[22px] font-black tracking-[-0.05em] text-foreground">
            {application.targetTitle}
          </h2>
          <p className="mt-2 text-[13px] font-bold text-muted">
            {application.companyName ?? "Company not specified"} / updated{" "}
            {formatWorkspaceDate(application.updatedAt)}
          </p>
          <div className="mt-4 grid gap-2 text-[12px] leading-5 text-muted">
            <p>
              Next action:{" "}
              <span className="font-black text-foreground">
                {formatWorkspaceDate(application.nextActionAt)}
              </span>
            </p>
            <p>
              Applied date:{" "}
              <span className="font-black text-foreground">
                {formatWorkspaceDate(application.appliedAt)}
              </span>
            </p>
            <p>
              Linked CV/resume:{" "}
              <span className="font-black text-foreground">
                {application.linkedDocumentTitle ??
                  (application.linkedTailoredVersionId
                    ? `Version ${application.linkedTailoredVersionId}`
                    : "None yet")}
              </span>
            </p>
            <p>
              Linked interview:{" "}
              <span className="font-black text-foreground">
                {application.linkedInterviewId ?? "None yet"}
              </span>
            </p>
          </div>
          {application.warning ? (
            <p className="mt-4 rounded-2xl border border-warning/25 bg-warning-surface p-3 text-[12px] leading-5 text-warning">
              {application.warning}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 xl:max-w-[360px] xl:justify-end">
          <WorkspaceTextLink href={application.targetHref}>
            View target
          </WorkspaceTextLink>
          <WorkspaceTextLink href={application.tailorHref}>
            Tailor CV/resume
          </WorkspaceTextLink>
          <WorkspaceTextLink href={application.practiceHref}>
            Practise interview
          </WorkspaceTextLink>
          {application.linkedInterviewHref ? (
            <WorkspaceTextLink href={application.linkedInterviewHref}>
              Resume interview
            </WorkspaceTextLink>
          ) : null}
          {application.applyHref ? (
            <WorkspaceTextLink href={application.applyHref}>
              Official apply
            </WorkspaceTextLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default async function ApplicationsPage({
  searchParams,
}: ApplicationsPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");

  const status = statuses.includes(params.status ?? "")
    ? (params.status ?? "all")
    : "all";
  const data = await getDashboardData(user.id);
  const applications = filterApplications(data.applications, status);

  return (
    <WorkspacePageFrame
      eyebrow="Private tracker"
      title="Applications stay linked to exact targets."
      body="Track public jobs and private opportunities without implying Jobready submitted anything for you. Marking an application as applied still requires explicit confirmation through the tracker API."
      action={{ href: "/saved-jobs", label: "Use saved job" }}
    >
      <WorkspaceCard>
        <WorkspaceSectionTitle
          eyebrow="Filters"
          title="Status, target, and date filters belong here"
        />
        <div className="mt-5 flex flex-wrap gap-2">
          {statuses.map((item) => (
            <Link
              key={item}
              href={`/applications?status=${item}`}
              aria-current={status === item ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-[12px] font-black transition duration-300 ease-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none ${
                status === item
                  ? "border-primary bg-primary text-white"
                  : "border-muted-line bg-surface text-foreground hover:bg-surface-soft"
              }`}
            >
              {labelStatus(item)}
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-3">
          {applications.length > 0 ? (
            applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
              />
            ))
          ) : (
            <WorkspaceEmptyState
              title="No applications match this filter"
              body="Create a tracker from a public job detail page or from a private target. The dashboard will surface only urgent or resumable application work."
              href="/find-jobs"
              label="Find jobs"
            />
          )}
        </div>
      </WorkspaceCard>
    </WorkspacePageFrame>
  );
}
