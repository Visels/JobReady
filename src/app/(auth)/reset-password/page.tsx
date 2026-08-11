import type { Metadata } from "next";
import {
  AuthLegalFootnote,
  AuthScreenShell,
} from "@/components/ui/AuthScreenShell";
import { AuthResetPasswordForm } from "@/components/ui/AuthResetPasswordForm";
import { generateSEO } from "@/lib/seo";

export const metadata: Metadata = generateSEO({
  title: "Reset your Jiandae password",
  description:
    "Create a new password for your private Jiandae workspace.",
  slug: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <AuthScreenShell footer={<AuthLegalFootnote action="resetting your password" />}>
      <AuthResetPasswordForm />
    </AuthScreenShell>
  );
}
