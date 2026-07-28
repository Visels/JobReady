import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminOperationsPanel } from "@/components/admin/AdminOperationsPanel";
import {
  WorkspaceBadge,
  WorkspaceCard,
  WorkspacePageFrame,
  WorkspaceSectionTitle,
  formatWorkspaceDate,
} from "@/components/workspace/WorkspacePage";
import {
  AdminContentOperationsService,
  adminRoleLabel,
  getCurrentAdminActor,
} from "@/lib/admin";
import { generateSEO } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Admin Content Operations",
  description: "Protected Jobready editor operations for content and jobs.",
  slug: "/admin",
  noIndex: true,
});

function queueDate(date: Date | null) {
  return date ? formatWorkspaceDate(date) : "Not set";
}

function QueueList({
  title,
  items,
}: {
  title: string;
  items: Array<{
    id: string;
    label?: string;
    title?: string;
    company?: string;
    status?: string;
    dueAt?: Date | null;
    closesAt?: Date | null;
    riskFlags?: string[];
  }>;
}) {
  return (
    <div className="rounded-[1.35rem] border border-muted-line bg-surface-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[14px] font-black text-foreground">{title}</h3>
        <WorkspaceBadge tone={items.length > 0 ? "warning" : "success"}>
          {items.length}
        </WorkspaceBadge>
      </div>
      <div className="mt-4 grid gap-3">
        {items.length > 0 ? (
          items.slice(0, 5).map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-muted-line bg-surface p-3"
            >
              <p className="text-[13px] font-black text-foreground">
                {item.label ?? item.title}
              </p>
              {item.company ? (
                <p className="mt-1 text-[11px] font-bold uppercase tracking-badge text-muted-subtle">
                  {item.company}
                </p>
              ) : null}
              <p className="mt-2 text-[12px] leading-5 text-muted">
                {item.status ? `Status: ${item.status}. ` : ""}
                {item.dueAt ? `Due: ${queueDate(item.dueAt)}. ` : ""}
                {item.closesAt ? `Closes: ${queueDate(item.closesAt)}. ` : ""}
                {item.riskFlags?.length ? `Flags: ${item.riskFlags.join(", ")}.` : ""}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-muted-line bg-surface p-4 text-[12px] leading-5 text-muted">
            Clear for now.
          </p>
        )}
      </div>
    </div>
  );
}

function CoverageMiniTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<Record<string, string | number | null>>;
}) {
  return (
    <div className="rounded-[1.35rem] border border-muted-line bg-surface-soft p-4">
      <h3 className="text-[14px] font-black text-foreground">{title}</h3>
      <div className="mt-4 grid gap-2">
        {rows.slice(0, 6).map((row) => (
          <div
            key={`${row.id ?? row.slug ?? row.key ?? row.label}`}
            className="grid gap-2 rounded-2xl border border-muted-line bg-surface p-3 text-[12px] md:grid-cols-[1fr_auto]"
          >
            <span className="font-black text-foreground">{row.label}</span>
            <span className="text-muted">
              {Object.entries(row)
                .filter(([key]) => !["id", "slug", "key", "label", "status"].includes(key))
                .map(([key, value]) => `${key}: ${value ?? "none"}`)
                .join(" | ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminPage() {
  const actor = await getCurrentAdminActor();
  if (!actor) notFound();

  const service = new AdminContentOperationsService();
  const dashboard = await service.getDashboard(actor);

  return (
    <WorkspacePageFrame
      eyebrow="Admin"
      title="Content operations with receipts."
      body="Manage reviewed catalog content, job publication states, imports, queues, and audit history without code deployment. Writes are permission-checked server-side and company-specific questions must stay sourced."
      action={{ href: "/dashboard", label: "Back to workspace" }}
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {actor.roles.map((role) => (
          <WorkspaceBadge key={role}>{adminRoleLabel(role)}</WorkspaceBadge>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboard.stats.map((stat) => (
          <WorkspaceCard key={stat.label}>
            <WorkspaceBadge tone={stat.tone}>{stat.label}</WorkspaceBadge>
            <p className="mt-4 text-[42px] font-black tracking-[-0.07em] text-foreground">
              {stat.value.toLocaleString()}
            </p>
          </WorkspaceCard>
        ))}
      </div>

      <WorkspaceCard className="mt-5">
        <WorkspaceSectionTitle
          eyebrow="Operations"
          title="Run safe editor actions and dry-run imports."
        />
        <div className="mt-5">
          <AdminOperationsPanel />
        </div>
      </WorkspaceCard>

      <WorkspaceCard className="mt-5">
        <WorkspaceSectionTitle
          eyebrow="Queues"
          title="Review what needs editor attention."
        />
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <QueueList title="Stale content" items={dashboard.queues.staleContent} />
          <QueueList title="Stale jobs" items={dashboard.queues.staleJobs} />
          <QueueList title="Closing soon" items={dashboard.queues.closingSoonJobs} />
          <QueueList title="Broken links" items={dashboard.queues.brokenLinkJobs} />
          <QueueList
            title="Suspicious links"
            items={dashboard.queues.suspiciousLinkJobs}
          />
          <QueueList title="Duplicates" items={dashboard.queues.duplicateJobs} />
        </div>
      </WorkspaceCard>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <WorkspaceCard>
          <WorkspaceSectionTitle
            eyebrow="Pending jobs"
            title="Drafts and review-ready jobs."
          />
          <div className="mt-5 grid gap-3">
            {dashboard.pendingJobs.length > 0 ? (
              dashboard.pendingJobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-[1.25rem] border border-muted-line bg-surface-soft p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-black text-foreground">
                        {job.title}
                      </p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-badge text-muted-subtle">
                        {job.company}
                      </p>
                    </div>
                    <WorkspaceBadge>{job.status}</WorkspaceBadge>
                  </div>
                  <p className="mt-3 text-[12px] leading-5 text-muted">
                    Closes {queueDate(job.closesAt)}. Risk flags:{" "}
                    {job.riskFlags.length ? job.riskFlags.join(", ") : "none"}.
                  </p>
                </article>
              ))
            ) : (
              <p className="rounded-[1.25rem] border border-dashed border-muted-line bg-surface-soft p-4 text-[13px] leading-6 text-muted">
                No pending job drafts.
              </p>
            )}
          </div>
        </WorkspaceCard>

        <WorkspaceCard>
          <WorkspaceSectionTitle
            eyebrow="Recent reviews"
            title="Content review history."
          />
          <div className="mt-5 grid gap-3">
            {dashboard.recentContentReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-[1.25rem] border border-muted-line bg-surface-soft p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-black text-foreground">
                    {review.target}
                  </p>
                  <WorkspaceBadge>{review.status}</WorkspaceBadge>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-muted">
                  Reviewed {queueDate(review.reviewedAt)}. Next review{" "}
                  {queueDate(review.nextReviewAt)}.
                </p>
                {review.notes ? (
                  <p className="mt-2 text-[12px] leading-5 text-muted">
                    {review.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </WorkspaceCard>
      </div>

      <WorkspaceCard className="mt-5">
        <WorkspaceSectionTitle
          eyebrow="Coverage"
          title="Reference catalog depth by launch dimension."
        />
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <CoverageMiniTable title="Companies" rows={dashboard.coverage.companies} />
          <CoverageMiniTable
            title="Role families"
            rows={dashboard.coverage.roleFamilies}
          />
          <CoverageMiniTable
            title="Seniority"
            rows={dashboard.coverage.seniorityLevels}
          />
          <CoverageMiniTable title="Stages" rows={dashboard.coverage.stages} />
          <CoverageMiniTable
            title="Frameworks and modules"
            rows={dashboard.coverage.frameworks}
          />
          <CoverageMiniTable title="Job roles" rows={dashboard.coverage.jobRoles} />
        </div>
      </WorkspaceCard>

      <WorkspaceCard className="mt-5">
        <WorkspaceSectionTitle eyebrow="Audit" title="Recent admin receipts." />
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {dashboard.recentAudit.map((event) => (
            <article
              key={event.id}
              className="rounded-[1.25rem] border border-muted-line bg-surface-soft p-4"
            >
              <p className="text-[12px] font-black uppercase tracking-badge text-muted-subtle">
                {event.action}
              </p>
              <p className="mt-2 text-[13px] font-black text-foreground">
                {event.summary}
              </p>
              <p className="mt-2 text-[12px] leading-5 text-muted">
                {event.resourceType}
                {event.resourceId ? `:${event.resourceId}` : ""} by{" "}
                {event.actorEmail ?? "unknown"} on {queueDate(event.createdAt)}.
              </p>
            </article>
          ))}
        </div>
      </WorkspaceCard>
    </WorkspacePageFrame>
  );
}
