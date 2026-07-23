import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LearningCenterContent } from "@/components/learning/LearningCenterContent";
import { getCurrentUser } from "@/lib/auth";
import { generateSEO } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateSEO({
  title: "Private Visa Interview Learning Center",
  description:
    "Private learning center for authenticated VisaInterview users preparing for F1, H1B, B1/B2, and O1 visa interviews.",
  slug: "/learning",
  noIndex: true,
});

export default async function LearningPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#fbfcfb] px-1 py-2 text-primary md:px-3">
      <div className="mx-auto max-w-[1180px]">
        <LearningCenterContent />
      </div>
    </main>
  );
}
