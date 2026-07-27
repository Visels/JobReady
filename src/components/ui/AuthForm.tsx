"use client";

import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CANONICAL_SITE_URL, getSiteUrl } from "@/lib/site-url";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const fieldShellClass =
  "mt-2 flex h-12 items-center rounded-lg border border-[#ccd6d2] bg-white px-4 transition duration-300 ease-soft focus-within:border-[#00533f] focus-within:ring-4 focus-within:ring-[#00533f]/10";

const inputClass =
  "min-w-0 flex-1 bg-transparent text-[0.95rem] font-medium text-[#071512] outline-none placeholder:text-[#8a96a5]";

type AuthMode = "signin" | "signup";

const passwordMinimumLength = 8;

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
      <path
        className="fill-accent-provider-one"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        className="fill-accent-provider-two"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        className="fill-accent-provider-three"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        className="fill-accent-provider-four"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function normalizeReturnPath(value?: string) {
  if (value === "/interview/new") return "/interviews/new";
  if (value === "/dashboard") return "/practice";
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

function callbackUrl(returnPath: string) {
  const origin =
    process.env.NODE_ENV === "production" ? getSiteUrl() : window.location.origin;

  return new URL(
    `/auth/callback?next=${encodeURIComponent(returnPath)}`,
    origin,
  ).toString();
}

export function AuthForm({
  callbackUrl: rawCallbackUrl,
  initialMode = "signin",
}: {
  callbackUrl?: string;
  initialMode?: AuthMode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const returnPath = normalizeReturnPath(rawCallbackUrl);
  const isSignup = mode === "signup";
  const passwordIsLongEnough = password.length >= passwordMinimumLength;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (isSignup && (!acceptedTerms || !acceptedPrivacy)) {
      setError("Please accept the Terms and Conditions and Privacy Policy to create an account.");
      setLoading(false);
      return;
    }

    if (isSignup && !passwordIsLongEnough) {
      setError(`Password must be at least ${passwordMinimumLength} characters long.`);
      setLoading(false);
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const normalizedEmail = email.toLowerCase().trim();

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              name: name.trim() || undefined,
              full_name: name.trim() || undefined,
              accepted_terms: acceptedTerms,
              accepted_privacy: acceptedPrivacy,
              terms_accepted_at: new Date().toISOString(),
              privacy_accepted_at: new Date().toISOString(),
            },
            emailRedirectTo: callbackUrl(returnPath),
          },
        });

        if (error) throw error;

        if (!data.session) {
          setNotice("Check your email to confirm your account, then come back to sign in.");
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) throw error;
      }

      router.push(returnPath);
      router.refresh();
    } catch {
      setError(
        isSignup
          ? "Could not create account. Please check your details and try again."
          : "Invalid email or password.",
      );
      setLoading(false);
    }
  }

  async function submitForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const supabase = createBrowserSupabaseClient();
      const origin =
        process.env.NODE_ENV === "production" ? getSiteUrl() : window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: new URL(
            `/auth/callback?next=${encodeURIComponent("/reset-password")}`,
            origin,
          ).toString(),
        },
      );

      if (error) throw error;

      setNotice("Check your email for a password reset link.");
    } catch {
      setError("Could not send a reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl(returnPath),
        },
      });

      if (error) {
        console.error("Could not start Google sign in.", error);
        setError("Could not start Google sign in.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Could not start Google sign in.", error);
      setError("Could not start Google sign in.");
      setLoading(false);
    }
  }

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setShowForgotPassword(false);
    setError("");
    setNotice("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="reveal-up w-full">
      <div
        className="grid grid-cols-2 border-b border-[#dfe5e2]"
        role="tablist"
        aria-label="Authentication mode"
      >
        {(["signin", "signup"] as const).map((tabMode) => {
          const isActive = mode === tabMode && (!showForgotPassword || tabMode === "signin");
          return (
            <button
              key={tabMode}
              type="button"
              onClick={() => selectMode(tabMode)}
              disabled={loading}
              className={`relative h-12 text-sm font-bold transition duration-300 ease-soft focus:outline-none focus-visible:ring-4 focus-visible:ring-[#00533f]/15 disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? "text-[#00533f]"
                  : "text-[#667385] hover:text-[#172333]"
              }`}
              role="tab"
              aria-selected={isActive}
            >
              {tabMode === "signin" ? "Sign in" : "Create account"}
              <span
                className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#00533f] transition duration-300 ease-soft ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <h1 className="mt-[clamp(1.5rem,4vh,2.25rem)] text-[clamp(2rem,5vh,2.45rem)] font-bold leading-tight tracking-normal text-[#071512]">
          {showForgotPassword
            ? "Reset your password"
            : isSignup
              ? "Create your account"
              : "Welcome back"}
        </h1>
        <p className="mt-2 text-[0.95rem] font-medium leading-6 text-[#5c6878]">
          {showForgotPassword
            ? "Enter your email and we will send a secure reset link."
            : isSignup
              ? "Start practicing with a private VisaInterview workspace."
              : "Sign in to your account to continue."}
        </p>
      </div>

      {showForgotPassword ? (
        <form onSubmit={submitForgotPassword} className="mt-[clamp(1.75rem,4vh,2.5rem)] space-y-[clamp(0.875rem,2.2vh,1.125rem)]">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-bold text-[#172333]">
              Email address
            </label>
            <div className={fieldShellClass}>
              <Mail className="mr-3 h-5 w-5 flex-none text-[#778498]" strokeWidth={1.8} />
              <input
                id="forgot-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {notice ? (
            <p className="rounded-lg bg-[#e9f4ef] px-4 py-2 text-sm font-semibold leading-5 text-[#00533f]" aria-live="polite">
              {notice}
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
            {loading ? "Sending link" : "Send reset link"}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(false);
              setError("");
              setNotice("");
            }}
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[#c7d1cd] bg-white px-5 text-[0.95rem] font-bold text-[#00533f] transition duration-300 ease-soft hover:border-[#9fb3ab] hover:bg-[#fbfaf7] active:scale-press disabled:cursor-not-allowed disabled:opacity-60"
          >
            Back to sign in
          </button>
        </form>
      ) : (
        <>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="mt-[clamp(1.75rem,4.4vh,2.5rem)] inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[#c7d1cd] bg-white px-5 text-[0.95rem] font-bold text-[#172333] transition duration-300 ease-soft hover:border-[#9fb3ab] hover:bg-[#fbfaf7] active:scale-press disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-[clamp(1.25rem,3.2vh,2rem)] flex items-center gap-5">
            <div className="h-px flex-1 bg-[#d9dee5]" />
            <span className="text-sm font-medium text-[#5c6878]">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-[#d9dee5]" />
          </div>

          <form onSubmit={submit} className="space-y-[clamp(0.875rem,2.2vh,1.125rem)]">
            {isSignup ? (
              <div>
                <label htmlFor="auth-name" className="block text-sm font-bold text-[#172333]">
                  Full name
                </label>
                <div className={fieldShellClass}>
                  <User className="mr-3 h-5 w-5 flex-none text-[#778498]" strokeWidth={1.8} />
                  <input
                    id="auth-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputClass}
                    autoComplete="name"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label htmlFor="auth-email" className="block text-sm font-bold text-[#172333]">
                Email address
              </label>
              <div className={fieldShellClass}>
                <Mail className="mr-3 h-5 w-5 flex-none text-[#778498]" strokeWidth={1.8} />
                <input
                  id="auth-email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="auth-password" className="block text-sm font-bold text-[#172333]">
                  Password
                </label>
                {!isSignup ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError("");
                      setNotice("");
                    }}
                    className="text-xs font-bold text-[#00533f] transition duration-300 ease-soft hover:text-[#043b30] hover:underline"
                  >
                    Forgot password?
                  </button>
                ) : null}
              </div>
              <div className={fieldShellClass}>
                <Lock className="mr-3 h-5 w-5 flex-none text-[#778498]" strokeWidth={1.8} />
                <input
                  id="auth-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                  type={showPassword ? "text" : "password"}
                  minLength={isSignup ? passwordMinimumLength : undefined}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder={isSignup ? "Create a password" : "Enter your password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="grid h-8 w-8 flex-none place-items-center rounded-full text-[#6f7a8c] transition duration-300 ease-soft hover:bg-[#f2f5f6] hover:text-[#00533f]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" strokeWidth={1.8} />
                  ) : (
                    <Eye className="h-5 w-5" strokeWidth={1.8} />
                  )}
                </button>
              </div>
              {isSignup ? (
                <p className={`mt-1.5 text-xs font-semibold ${
                  password.length === 0 || passwordIsLongEnough
                    ? "text-[#5c6878]"
                    : "text-[#b3263a]"
                }`}>
                  Password must be at least {passwordMinimumLength} characters long.
                </p>
              ) : null}
            </div>

            {!isSignup ? (
              <div className="flex items-center gap-3 pt-1">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-[#b8c1cc] accent-[#00533f]"
                />
                <label htmlFor="remember-me" className="text-sm font-semibold text-[#4b596b]">
                  Remember me
                </label>
              </div>
            ) : null}

            {isSignup ? (
              <div>
                <label htmlFor="auth-confirm-password" className="block text-sm font-bold text-[#172333]">
                  Confirm password
                </label>
                <div className={fieldShellClass}>
                  <Lock className="mr-3 h-5 w-5 flex-none text-[#778498]" strokeWidth={1.8} />
                  <input
                    id="auth-confirm-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={inputClass}
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={passwordMinimumLength}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="grid h-8 w-8 flex-none place-items-center rounded-full text-[#6f7a8c] transition duration-300 ease-soft hover:bg-[#f2f5f6] hover:text-[#00533f]"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" strokeWidth={1.8} />
                    ) : (
                      <Eye className="h-5 w-5" strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {isSignup ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-3">
                  <input
                    id="accept-terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 rounded border-[#b8c1cc] accent-[#00533f]"
                  />
                  <label htmlFor="accept-terms" className="text-xs font-medium leading-5 text-[#4b596b]">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="font-bold text-[#00533f] hover:text-[#043b30] hover:underline"
                    >
                      Terms and Conditions
                    </Link>
                    .
                  </label>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    id="accept-privacy"
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(event) => setAcceptedPrivacy(event.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 rounded border-[#b8c1cc] accent-[#00533f]"
                  />
                  <label htmlFor="accept-privacy" className="text-xs font-medium leading-5 text-[#4b596b]">
                    I agree to the{" "}
                    <Link
                      href="/privacy"
                      className="font-bold text-[#00533f] hover:text-[#043b30] hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>
              </div>
            ) : null}

            {notice ? (
              <p className="rounded-lg bg-[#e9f4ef] px-4 py-2 text-sm font-semibold leading-5 text-[#00533f]" aria-live="polite">
                {notice}
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
              {loading
                ? "Please wait"
                : isSignup
                  ? "Create account"
                  : "Sign in with Email"}
            </button>
          </form>

          {!isSignup ? (
            <div className="mt-4 text-center">
              <Link
                href={`/magic-link?callbackUrl=${encodeURIComponent(returnPath)}`}
                className="text-sm font-bold text-[#00533f] transition duration-300 ease-soft hover:text-[#043b30] hover:underline"
              >
                Email me a magic link instead
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
