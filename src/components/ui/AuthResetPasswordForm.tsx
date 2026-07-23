"use client";

import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const fieldShellClass =
  "mt-2 flex h-12 items-center rounded-lg border border-[#ccd6d2] bg-white px-4 transition duration-300 ease-soft focus-within:border-[#00533f] focus-within:ring-4 focus-within:ring-[#00533f]/10";

const inputClass =
  "min-w-0 flex-1 bg-transparent text-[0.95rem] font-medium text-[#071512] outline-none placeholder:text-[#8a96a5]";

const passwordMinimumLength = 8;

export function AuthResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const passwordIsLongEnough = password.length >= passwordMinimumLength;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (!passwordIsLongEnough) {
      setError(`Password must be at least ${passwordMinimumLength} characters long.`);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setNotice("Your password has been updated. Taking you to practice.");
      router.push("/practice");
      router.refresh();
    } catch {
      setError("Could not update your password. Please request a new reset link.");
      setLoading(false);
    }
  }

  return (
    <div className="reveal-up w-full">
      <div className="text-center">
        <h1 className="text-[clamp(2rem,5vh,2.45rem)] font-bold leading-tight tracking-normal text-[#071512]">
          Create a new password
        </h1>
        <p className="mt-2 text-[0.95rem] font-medium leading-6 text-[#5c6878]">
          Choose a secure password for your VisaInterview account.
        </p>
      </div>

      <form onSubmit={submit} className="mt-[clamp(1.75rem,4vh,2.5rem)] space-y-[clamp(0.875rem,2.2vh,1.125rem)]">
        <div>
          <label htmlFor="reset-password" className="block text-sm font-bold text-[#172333]">
            New password
          </label>
          <div className={fieldShellClass}>
            <Lock className="mr-3 h-5 w-5 flex-none text-[#778498]" strokeWidth={1.8} />
            <input
              id="reset-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              type={showPassword ? "text" : "password"}
              minLength={passwordMinimumLength}
              autoComplete="new-password"
              placeholder="Create a password"
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
          <p className={`mt-1.5 text-xs font-semibold ${
            password.length === 0 || passwordIsLongEnough
              ? "text-[#5c6878]"
              : "text-[#b3263a]"
          }`}>
            Password must be at least {passwordMinimumLength} characters long.
          </p>
        </div>

        <div>
          <label htmlFor="reset-confirm-password" className="block text-sm font-bold text-[#172333]">
            Confirm password
          </label>
          <div className={fieldShellClass}>
            <Lock className="mr-3 h-5 w-5 flex-none text-[#778498]" strokeWidth={1.8} />
            <input
              id="reset-confirm-password"
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
          {loading ? "Updating password" : "Update password"}
        </button>
      </form>

      <div className="mt-[clamp(1.25rem,3vh,1.75rem)] text-center">
        <Link
          href="/login"
          className="text-sm font-bold text-[#00533f] transition duration-300 ease-soft hover:text-[#043b30] hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
