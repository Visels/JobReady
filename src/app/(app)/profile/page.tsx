import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  WorkspaceCard,
  WorkspacePageFrame,
  WorkspaceSectionTitle,
  WorkspaceTextLink,
} from "@/components/workspace/WorkspacePage";
import { getCurrentUser } from "@/lib/auth";
import { generateSEO } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Profile and Preferences",
  description: "Private Jobready profile and optional preferences page.",
  slug: "/profile",
  noIndex: true,
});

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <WorkspacePageFrame
      eyebrow="Optional"
      title="Profile preferences are helpful, not mandatory."
      body="Add lightweight role and location context when useful. You can still find jobs, tailor a CV/resume, track applications, or practise without completing this."
      action={{ href: "/dashboard", label: "Skip for now" }}
    >
      <WorkspaceCard>
        <WorkspaceSectionTitle
          eyebrow="Preferences"
          title="Role and location context"
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-[12px] font-black text-foreground">
            Display name
            <input
              defaultValue={user.name ?? ""}
              placeholder="Your name"
              className="min-h-12 rounded-2xl border border-muted-line bg-surface-soft px-4 text-[13px] font-semibold text-foreground outline-none transition duration-300 ease-soft placeholder:text-muted-subtle focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/15 motion-reduce:transition-none"
            />
          </label>
          <label className="grid gap-2 text-[12px] font-black text-foreground">
            Email
            <input
              defaultValue={user.email ?? ""}
              readOnly
              className="min-h-12 rounded-2xl border border-muted-line bg-surface-soft px-4 text-[13px] font-semibold text-muted outline-none"
            />
          </label>
          <label className="grid gap-2 text-[12px] font-black text-foreground">
            Target role
            <input
              placeholder="Product Manager, Software Engineer, Analyst"
              className="min-h-12 rounded-2xl border border-muted-line bg-surface-soft px-4 text-[13px] font-semibold text-foreground outline-none transition duration-300 ease-soft placeholder:text-muted-subtle focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/15 motion-reduce:transition-none"
            />
          </label>
          <label className="grid gap-2 text-[12px] font-black text-foreground">
            Preferred location
            <input
              placeholder="Nairobi, Mombasa, remote, East Africa"
              className="min-h-12 rounded-2xl border border-muted-line bg-surface-soft px-4 text-[13px] font-semibold text-foreground outline-none transition duration-300 ease-soft placeholder:text-muted-subtle focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/15 motion-reduce:transition-none"
            />
          </label>
        </div>
        <p className="mt-4 rounded-2xl border border-muted-line bg-surface-soft p-4 text-[12px] leading-5 text-muted">
          Saving preference data is intentionally deferred until the profile
          persistence model is introduced. For now, these fields document the
          intended non-blocking profile surface.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <WorkspaceTextLink href="/dashboard">Back to workspace</WorkspaceTextLink>
          <WorkspaceTextLink href="/find-jobs">Find jobs</WorkspaceTextLink>
        </div>
      </WorkspaceCard>
    </WorkspacePageFrame>
  );
}
