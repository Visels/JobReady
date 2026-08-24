import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/ui/AuthForm";
import {
  AuthLegalFootnote,
  AuthScreenShell,
} from "@/components/ui/AuthScreenShell";
import { getCurrentUser } from "@/lib/auth";
import { normalizeAuthReturnPath } from "@/lib/auth-redirect";
import { generateSEO } from "@/lib/seo";

export const metadata: Metadata = generateSEO({
  title: "Sign In to Jiandae",
  description:
    "Sign in to your private Jiandae workspace for jobs, CV/resume tailoring, interview practice, and application tracking.",
  slug: "/login",
  noIndex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl;
  const initialMode = params?.mode === "signup" ? "signup" : "signin";
  const user = await getCurrentUser();

  if (user) {
    redirect(normalizeAuthReturnPath(callbackUrl));
  }

  return (
    <AuthScreenShell
      showDefaultNavigation={false}
      footer={initialMode === "signup" ? <AuthLegalFootnote action="creating an account" /> : undefined}
    >
      <AuthForm callbackUrl={callbackUrl} initialMode={initialMode} />
    </AuthScreenShell>
  );
}
