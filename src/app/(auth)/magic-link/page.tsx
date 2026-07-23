import Link from "next/link";
import type { Metadata } from "next";
import {
  AuthLegalFootnote,
  AuthScreenShell,
} from "@/components/ui/AuthScreenShell";
import { MagicLinkForm } from "@/components/ui/MagicLinkForm";
import { generateSEO } from "@/lib/seo";

export const metadata: Metadata = generateSEO({
  title: "VisaInterview Magic Link",
  description:
    "Private passwordless login for VisaInterview accounts.",
  slug: "/magic-link",
  noIndex: true,
});

export default async function MagicLinkPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const callbackUrl = (await searchParams)?.callbackUrl;

  return (
    <AuthScreenShell footer={<AuthLegalFootnote action="requesting a magic link" />}>
      <div className="reveal-up w-full">
        <div className="text-center">
          <h1 className="text-[clamp(2rem,5vh,2.45rem)] font-bold leading-tight tracking-normal text-[#071512]">
            Sign in without a password
          </h1>
          <p className="mt-2 text-[0.95rem] font-medium leading-6 text-[#5c6878]">
            Enter your email and we will send a secure one-time login link.
          </p>
        </div>
        <MagicLinkForm callbackUrl={callbackUrl} />
        <div className="mt-[clamp(1.25rem,3vh,1.75rem)] text-center">
          <Link
            href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            className="text-base font-bold text-[#00533f] transition duration-300 ease-soft hover:text-[#043b30] hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </AuthScreenShell>
  );
}
