import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VisaRequirementsExplorer } from "@/components/guides/VisaRequirementsExplorer";
import { getCurrentUser } from "@/lib/auth";
import { generateSEO } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Private Visa Requirement Guides",
  description:
    "Country and visa type requirement guides for authenticated VisaInterview users preparing document packets, forms, interviews, and official checklist verification.",
  slug: "/visa-guides",
  noIndex: true,
});

export default async function VisaRequirementGuidesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#fbfcfb] px-1 py-2 text-primary md:px-3">
      <div className="mx-auto max-w-[1180px]">
        <VisaRequirementsExplorer />
      </div>
    </main>
  );
}
