import type { Metadata } from "next";
import {
  WorkspaceCard,
  WorkspacePageFrame,
  WorkspaceSectionTitle,
  WorkspaceTextLink,
} from "@/components/workspace/WorkspacePage";
import { generateSEO } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Career Resources",
  description:
    "Private Jobready career resources for job seekers in Kenya and Africa.",
  slug: "/career-resources",
  noIndex: true,
});

const resources = [
  {
    title: "Before you apply",
    body: "Confirm the role is active, inspect the official destination, and decide whether the target deserves a tailored CV/resume.",
    href: "/find-jobs",
    label: "Browse verified jobs",
  },
  {
    title: "CV and resume truthfulness",
    body: "Keep tailored versions grounded in your own evidence. Do not invent skills, dates, employers, or outcomes.",
    href: "/cv-resume",
    label: "Open CV workspace",
  },
  {
    title: "Interview practice loop",
    body: "Practise with the role and stage in mind, then use the report priorities for the next session rather than chasing a generic score.",
    href: "/interviews/new",
    label: "Practise interview",
  },
  {
    title: "Application tracker habits",
    body: "Record next actions, follow-ups, and final outcomes privately. Opening an official apply link is not the same as submitting.",
    href: "/applications",
    label: "Open tracker",
  },
];

export default function CareerResourcesPage() {
  return (
    <WorkspacePageFrame
      eyebrow="Resources"
      title="Practical job-search support for Kenya and Africa."
      body="Use these lightweight guides to keep discovery, CV/resume tailoring, applications, and interview preparation connected without forcing one path."
      action={{ href: "/find-jobs", label: "Find jobs" }}
    >
      <WorkspaceCard>
        <WorkspaceSectionTitle
          eyebrow="Career workflow"
          title="Four useful habits"
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {resources.map((resource) => (
            <article
              key={resource.title}
              className="rounded-[1.45rem] border border-muted-line bg-surface-soft p-5"
            >
              <h2 className="text-[22px] font-black tracking-[-0.05em] text-foreground">
                {resource.title}
              </h2>
              <p className="mt-3 text-[13px] leading-6 text-muted">
                {resource.body}
              </p>
              <div className="mt-5">
                <WorkspaceTextLink href={resource.href}>
                  {resource.label}
                </WorkspaceTextLink>
              </div>
            </article>
          ))}
        </div>
      </WorkspaceCard>
    </WorkspacePageFrame>
  );
}
