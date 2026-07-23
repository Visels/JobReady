import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/ui/AuthForm";
import { AuthCenteredShell } from "@/components/ui/AuthCenteredShell";
import {
  AuthLegalFootnote,
} from "@/components/ui/AuthScreenShell";
import { getCurrentUser } from "@/lib/auth";
import { normalizeAuthReturnPath } from "@/lib/auth-redirect";
import { generateSEO } from "@/lib/seo";

export const metadata: Metadata = generateSEO({
  title: "Log In to VisaInterview",
  description:
    "Log in to your private VisaInterview account to practice visa interview sessions.",
  slug: "/login",
  noIndex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const callbackUrl = (await searchParams)?.callbackUrl;
  const user = await getCurrentUser();

  if (user) {
    redirect(normalizeAuthReturnPath(callbackUrl));
  }

  return (
    <AuthCenteredShell footer={<AuthLegalFootnote action="signing in" />}>
      <AuthForm callbackUrl={callbackUrl} initialMode="signin" />
    </AuthCenteredShell>
  );
}
