"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { CANONICAL_SITE_URL, getSiteUrl } from "@/lib/site-url";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const fieldShellClass =
  "mt-2 flex h-12 items-center rounded-lg border border-[#ccd6d2] bg-white px-4 transition duration-300 ease-soft focus-within:border-[#00533f] focus-within:ring-4 focus-within:ring-[#00533f]/10";

function normalizeReturnPath(value?: string) {
  if (value === "/interview/new" || value === "/dashboard") return "/practice";
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/practice";
  }

  const url = new URL(value, CANONICAL_SITE_URL);
  if (url.origin !== CANONICAL_SITE_URL) return "/practice";
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth/callback")) {
    return "/practice";
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function emailRedirectTo(returnPath: string) {
  const origin =
    process.env.NODE_ENV === "production" ? getSiteUrl() : window.location.origin;

  return new URL(
    `/auth/callback?next=${encodeURIComponent(returnPath)}`,
    origin,
  ).toString();
}

export function MagicLinkForm({ callbackUrl }: { callbackUrl?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const returnPath = normalizeReturnPath(callbackUrl);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: emailRedirectTo(returnPath),
        },
      });

      if (error) throw error;

      setMessage("Check your email for a secure login link.");
    } catch {
      setError("Could not send a magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-[clamp(1.75rem,4vh,2.5rem)] space-y-[clamp(0.875rem,2.2vh,1.125rem)]">
      <div>
        <label htmlFor="magic-link-email" className="block text-sm font-bold text-[#172333]">
          Email address
        </label>
        <div className={fieldShellClass}>
          <input
            id="magic-link-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[0.95rem] font-medium text-[#071512] outline-none placeholder:text-[#8a96a5]"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      {message ? (
        <p className="rounded-lg bg-[#e9f4ef] px-4 py-2 text-sm font-semibold leading-5 text-[#00533f]" aria-live="polite">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-[#fde5ea] px-4 py-2 text-sm font-semibold leading-5 text-[#b3263a]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-[#00533f] px-6 text-[0.95rem] font-bold text-white transition duration-300 ease-soft hover:bg-[#043b30] active:scale-press disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.8} />
        ) : null}
        {loading ? "Sending link" : "Send magic link"}
      </button>
    </form>
  );
}
