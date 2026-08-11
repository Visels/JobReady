import type { Metadata } from "next";
import {
  WorkspaceCard,
  WorkspacePageFrame,
  WorkspaceSectionTitle,
  WorkspaceTextLink,
} from "@/components/workspace/WorkspacePage";
import { publicProductConfig } from "@/config/public";
import { generateSEO } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Privacy and Data",
  description: "Private Jiandae privacy and data controls page.",
  slug: "/privacy-data",
  noIndex: true,
});

const privateDataItems = [
  {
    title: "Saved jobs",
    body: "Saved job records are private and scoped by your user id. Public job pages never expose your shortlist.",
    href: "/saved-jobs",
    label: "Review saved jobs",
  },
  {
    title: "Applications",
    body: "Application status, notes, reminders, and linked documents remain private. Official apply opens do not claim submission.",
    href: "/applications",
    label: "Review tracker",
  },
  {
    title: "CV/resume files",
    body: "Document versions, parsed facts, derived outputs, and exports are private artifacts. Object keys avoid personal identifiers.",
    href: "/cv-resume",
    label: "Review documents",
  },
  {
    title: "Interview reports",
    body: "Reports are private coaching records and are not hiring predictions or public proof of readiness.",
    href: "/reports",
    label: "Review reports",
  },
];

export default function PrivacyDataPage() {
  return (
    <WorkspacePageFrame
      eyebrow="Privacy"
      title="Your job-search workspace is private by default."
      body={`For privacy questions, contact ${publicProductConfig.legal.supportEmail}. Deeper deletion and export automation is scheduled for a later hardening task.`}
      action={{ href: "/privacy", label: "Public policy" }}
    >
      <WorkspaceCard>
        <WorkspaceSectionTitle
          eyebrow="Private data areas"
          title="What stays scoped to your account"
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {privateDataItems.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.35rem] border border-muted-line bg-surface-soft p-5"
            >
              <h2 className="text-[18px] font-black tracking-[-0.04em] text-foreground">
                {item.title}
              </h2>
              <p className="mt-3 text-[13px] leading-6 text-muted">
                {item.body}
              </p>
              <div className="mt-5">
                <WorkspaceTextLink href={item.href}>{item.label}</WorkspaceTextLink>
              </div>
            </article>
          ))}
        </div>
      </WorkspaceCard>
    </WorkspacePageFrame>
  );
}
