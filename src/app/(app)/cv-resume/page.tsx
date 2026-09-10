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
import { CvResumeBuilder } from "@/components/cv/CvResumeBuilder";
import { CvEditor } from "@/components/cv/CvEditor";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { searchPublicJobs } from "@/lib/jobs";
import { generateSEO } from "@/lib/seo";
import type {
  WorkspaceDocument,
  WorkspaceTailoredVersion,
} from "@/types/dashboard";

type CvResumePageProps = {
  searchParams: Promise<{
    view?: string;
    job?: string;
    applicationId?: string;
    document?: string;
  }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "CV and Resume Workspace",
  description:
    "Private Jiandae CV and resume workspace for base documents and tailored versions.",
  slug: "/cv-resume",
  noIndex: true,
});

const views = [
  { value: "all", label: "All" },
  { value: "base", label: "Base documents" },
  { value: "tailored", label: "Tailored versions" },
  { value: "needs-review", label: "Needs review" },
];

function statusTone(status: string) {
  if (status === "completed" || status === "parsed" || status === "exported") {
    return "success" as const;
  }
  if (["queued", "running", "needs_user_input"].includes(status)) {
    return "warning" as const;
  }
  if (["failed", "cancelled", "deleted"].includes(status)) {
    return "danger" as const;
  }
  return "neutral" as const;
}

function BaseDocumentCard({ document }: { document: WorkspaceDocument }) {
  return (
    <article className="rounded-xl border border-muted-line bg-surface-soft p-3.5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <WorkspaceBadge tone={statusTone(document.status)}>
            {document.status}
          </WorkspaceBadge>
          <h2 className="mt-2 text-[14px] font-semibold tracking-[-0.02em] text-foreground">
            {document.title}
          </h2>
          <p className="mt-1 text-[10px] leading-4 text-muted">
            {document.kind} version{" "}
            {document.currentVersionNumber ?? "unavailable"} /{" "}
            {document.factCount} allowlisted fact
            {document.factCount === 1 ? "" : "s"} / updated{" "}
            {formatWorkspaceDate(document.updatedAt)}
          </p>
        </div>
        <WorkspaceTextLink
          href={`/cv-resume?document=${encodeURIComponent(document.id)}`}
        >
          Edit CV
        </WorkspaceTextLink>
      </div>
    </article>
  );
}

function TailoredVersionCard({
  version,
}: {
  version: WorkspaceTailoredVersion;
}) {
  return (
    <article className="rounded-xl border border-muted-line bg-surface-soft p-3.5">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <WorkspaceBadge tone={statusTone(version.status)}>
              {version.statusLabel}
            </WorkspaceBadge>
            {version.exportFormats.length > 0 ? (
              <WorkspaceBadge tone="success">
                {version.exportFormats.join(" and ")}
              </WorkspaceBadge>
            ) : null}
          </div>
          <h2 className="mt-2 text-[14px] font-semibold tracking-[-0.02em] text-foreground">
            {version.roleTitle}
          </h2>
          <p className="mt-1 text-[10px] leading-4 text-muted">
            {version.companyName ?? "Company not specified"} /{" "}
            {version.targetLabel} / completed{" "}
            {formatWorkspaceDate(version.completedAt)}
          </p>
          <p className="mt-1.5 text-[10px] leading-4 text-muted">
            Output version:{" "}
            <span className="font-semibold text-foreground">
              {version.outputDocumentVersionId ?? "Not exported yet"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <WorkspaceTextLink href={version.href}>View target</WorkspaceTextLink>
          <WorkspaceTextLink href="/find-jobs">
            Choose another target
          </WorkspaceTextLink>
        </div>
      </div>
    </article>
  );
}

export default async function CvResumePage({
  searchParams,
}: CvResumePageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");

  const activeView = views.some((view) => view.value === params.view)
    ? (params.view ?? "all")
    : "all";
  const [data, publicJobs] = await Promise.all([
    getDashboardData(user.id),
    searchPublicJobs({ searchParams: { pageSize: "12" } }),
  ]);
  const documents =
    activeView === "tailored" || activeView === "needs-review"
      ? []
      : data.documents;
  const tailoredVersions =
    activeView === "base"
      ? []
      : activeView === "needs-review"
        ? data.tailoredVersions.filter((version) =>
            ["queued", "running", "needs_user_input"].includes(version.status),
          )
        : data.tailoredVersions;

  return (
    <WorkspacePageFrame
      eyebrow="Documents"
      title="A CV that sounds like you."
      body="Build your CV, refine it with AI, and make every word your own. Save your progress and download whenever you're ready."
    >
      <CvEditor
        key={params.document ?? "new-cv"}
        documents={data.documents
          .filter((document) => document.currentVersionId)
          .map((document) => ({ id: document.id, title: document.title }))}
        initialDocumentId={params.document}
      />

      <details
        className="mt-5 rounded-xl border border-muted-line bg-surface"
        open={Boolean(params.job || params.applicationId) || undefined}
      >
        <summary className="cursor-pointer px-5 py-4 text-[13px] font-semibold text-foreground">
          Tailor a saved CV to a specific job
        </summary>
        <p className="px-5 pb-4 text-[12px] leading-5 text-muted">
          Compare your experience with a role&apos;s requirements and review
          suggested changes.
        </p>
        <CvResumeBuilder
          documents={data.documents
            .filter((document) => document.currentVersionId)
            .map((document) => ({
              id: document.id,
              title: document.title,
              kind: document.kind,
              currentVersionId: document.currentVersionId!,
              currentVersionNumber: document.currentVersionNumber,
              factCount: document.factCount,
            }))}
          publicTargets={publicJobs.jobs.map((job) => ({
            versionId: job.versionId,
            slug: job.slug,
            title: job.title,
            companyName: job.companyName,
            detailHref: job.detailHref,
            closesAt: job.closesAt.toISOString(),
          }))}
          existingRuns={data.tailoredVersions.map((version) => ({
            runId: version.runId,
            roleTitle: version.roleTitle,
            companyName: version.companyName,
            status: version.status,
            statusLabel: version.statusLabel,
            exportFormats: version.exportFormats,
          }))}
          initialPublicJobSlug={params.job}
          initialApplicationId={params.applicationId}
        />
      </details>

      <WorkspaceCard className="mt-4">
        <WorkspaceSectionTitle
          eyebrow="Filters"
          title="Document and tailoring history"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {views.map((view) => (
            <Link
              key={view.value}
              href={`/cv-resume?view=${view.value}`}
              aria-current={activeView === view.value ? "page" : undefined}
              className={`rounded-lg border px-3 py-2 text-[10px] font-semibold transition duration-200 ease-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none ${
                activeView === view.value
                  ? "border-primary bg-primary text-white"
                  : "border-muted-line bg-surface text-foreground hover:bg-surface-soft"
              }`}
            >
              {view.label}
            </Link>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <section>
            <WorkspaceSectionTitle
              eyebrow="Base"
              title="Current CV/resume documents"
            />
            <div className="mt-3 grid gap-2.5">
              {documents.length > 0 ? (
                documents.map((document) => (
                  <BaseDocumentCard key={document.id} document={document} />
                ))
              ) : (
                <WorkspaceEmptyState
                  title="No base documents in this view"
                  body="When you add or parse a base CV/resume, it appears here with version and allowlisted fact counts."
                  href="/find-jobs"
                  label="Find a role first"
                />
              )}
            </div>
          </section>

          <section>
            <WorkspaceSectionTitle
              eyebrow="Tailored"
              title="Latest target-linked versions"
            />
            <div className="mt-3 grid gap-2.5">
              {tailoredVersions.length > 0 ? (
                tailoredVersions.map((version) => (
                  <TailoredVersionCard key={version.runId} version={version} />
                ))
              ) : (
                <WorkspaceEmptyState
                  title="No tailored versions in this view"
                  body="Tailoring runs appear here only after you start one against a public job, private target, or company-role target."
                  href="/find-jobs"
                  label="Choose a target"
                />
              )}
            </div>
          </section>
        </div>
      </WorkspaceCard>
    </WorkspacePageFrame>
  );
}
