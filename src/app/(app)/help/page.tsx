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
  title: "Help",
  description: "Private Jiandae help and support page.",
  slug: "/help",
  noIndex: true,
});

const helpTopics = [
  {
    title: "Saving and tracking jobs",
    body: "Save from verified listings, then start a private application record when you decide the role is worth tracking.",
    href: "/find-jobs",
    label: "Find jobs",
  },
  {
    title: "CV and resume tailoring",
    body: "Tailored versions should stay truthful and linked to their exact public job or private target.",
    href: "/cv-resume",
    label: "Open CV workspace",
  },
  {
    title: "Mock interviews",
    body: "You can practise without a CV or public job. Use text first, then voice when you want spoken pressure.",
    href: "/interviews/new",
    label: "Set up interview",
  },
];

export default function HelpPage() {
  return (
    <WorkspacePageFrame
      eyebrow="Support"
      title="Help without leaving your workspace."
      body={`For account or data questions, contact ${publicProductConfig.legal.supportEmail}. Keep sensitive CV content out of email unless support asks for a secure route.`}
      action={{
        href: `mailto:${publicProductConfig.legal.supportEmail}`,
        label: "Email support",
      }}
    >
      <WorkspaceCard>
        <WorkspaceSectionTitle eyebrow="Common paths" title="Quick help" />
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {helpTopics.map((topic) => (
            <article
              key={topic.title}
              className="rounded-[1.35rem] border border-muted-line bg-surface-soft p-5"
            >
              <h2 className="text-[18px] font-black tracking-[-0.04em] text-foreground">
                {topic.title}
              </h2>
              <p className="mt-3 text-[13px] leading-6 text-muted">
                {topic.body}
              </p>
              <div className="mt-5">
                <WorkspaceTextLink href={topic.href}>
                  {topic.label}
                </WorkspaceTextLink>
              </div>
            </article>
          ))}
        </div>
      </WorkspaceCard>
    </WorkspacePageFrame>
  );
}
