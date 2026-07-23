"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Send } from "lucide-react";
import { REFERRAL_REWARD_LABEL } from "@/lib/referrals";

type ReferralConversion = {
  id: string;
  buyer: string;
  plan: string;
  purchasedAt: string;
  rewardDisplay: string;
};

type ReferralInvitePageProps = {
  referralLink: string;
  displayName: string;
  userEmail: string | null;
  conversions: ReferralConversion[];
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "there";
}

function ReferralTable({
  conversions,
}: {
  conversions: ReferralConversion[];
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#dfe6e3] bg-white shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
      <div className="border-b border-[#edf1ef] px-4 py-3">
        <h2 className="text-[15px] font-semibold leading-5 text-primary">
          Referral table
        </h2>
      </div>

      {conversions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="bg-[#f8fbfa] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#697671]">
              <tr>
                <th className="px-4 py-3">Friend</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Your cut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1ef]">
              {conversions.map((conversion) => (
                <tr key={conversion.id} className="text-[12px] leading-5">
                  <td className="px-4 py-3 font-semibold text-primary">
                    {conversion.buyer}
                  </td>
                  <td className="px-4 py-3 text-[#52605b]">
                    {conversion.plan}
                  </td>
                  <td className="px-4 py-3 text-[#52605b]">
                    {conversion.purchasedAt}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#006b4f]">
                    {conversion.rewardDisplay}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-8">
          <p className="text-[13px] font-semibold text-primary">
            No paid referrals yet
          </p>
          <p className="mt-1 text-[12px] leading-5 text-[#5f6b67]">
            Paid referrals will appear here after someone uses your link and
            completes checkout.
          </p>
        </div>
      )}
    </section>
  );
}

export function ReferralInvitePage({
  referralLink,
  displayName,
  userEmail,
  conversions,
}: ReferralInvitePageProps) {
  const [emails, setEmails] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const parsedEmails = useMemo(() => parseEmails(emails), [emails]);
  const invalidEmails = parsedEmails.filter((email) => !emailPattern.test(email));
  const ownEmail = userEmail?.toLowerCase().trim() || "";

  async function copyLink() {
    setError("");
    setNotice("");

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the link. Select and copy it manually.");
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (parsedEmails.length === 0) {
      setError("Add at least one email address.");
      return;
    }

    if (invalidEmails.length > 0) {
      setError(`Check these email addresses: ${invalidEmails.join(", ")}`);
      return;
    }

    if (ownEmail && parsedEmails.includes(ownEmail)) {
      setError("Remove your own email address from the invite list.");
      return;
    }

    const subject = encodeURIComponent(
      `${firstName(displayName)} invited you to VisaInterview`,
    );
    const body = encodeURIComponent(
      `I thought VisaInterview could help you practice for your visa interview.\n\nUse my referral link:\n${referralLink}`,
    );

    window.open(
      `mailto:${parsedEmails.join(",")}?subject=${subject}&body=${body}`,
      "_self",
    );
    setNotice(
      `Email draft opened for ${parsedEmails.length} ${parsedEmails.length === 1 ? "person" : "people"}.`,
    );
  }

  return (
    <div className="mx-auto max-w-[920px] space-y-4">
      <header>
        <p className="text-[13px] font-semibold leading-5 text-[#697671]">
          Refer friends
        </p>
        <h1 className="mt-1 text-[30px] font-semibold leading-tight text-primary md:text-[34px]">
          Invite friends
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#52605b]">
          Send your referral link to friends preparing for visa interviews.
        </p>
      </header>

      <section className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
        <form onSubmit={submit} className="grid gap-4">
          <div>
            <label
              htmlFor="referral-emails"
              className="text-[12px] font-semibold leading-4 text-primary"
            >
              Friend emails
            </label>
            <textarea
              id="referral-emails"
              value={emails}
              onChange={(event) => setEmails(event.target.value)}
              rows={3}
              placeholder="alex@example.com, maya@example.com"
              className="mt-2 w-full resize-none rounded-lg border border-[#ccd9d4] bg-white px-3 py-3 text-[13px] font-medium leading-5 text-primary outline-none transition duration-300 ease-soft placeholder:text-[#8a9691] focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <p className="mt-1.5 text-[11px] leading-4 text-[#697671]">
              Separate multiple emails with commas, spaces, or new lines.
            </p>
          </div>

          <div>
            <label
              htmlFor="referral-link"
              className="text-[12px] font-semibold leading-4 text-primary"
            >
              Referral link
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                id="referral-link"
                value={referralLink}
                readOnly
                className="min-h-11 rounded-lg border border-[#ccd9d4] bg-[#f8fbfa] px-3 text-[12px] font-medium text-[#52605b] outline-none"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#cfdbd7] bg-white px-4 text-[13px] font-semibold text-primary transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#f8fbfa] active:scale-press"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-[#006b4f]" strokeWidth={1.8} />
                ) : (
                  <Copy className="h-4 w-4" strokeWidth={1.8} />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <p className="rounded-lg bg-[#f8fbfa] px-3 py-2 text-[12px] leading-5 text-[#52605b]">
            Share your link; when a referred friend pays, their checkout is
            tracked to your account for {REFERRAL_REWARD_LABEL}.
          </p>

          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-[#fff4f1] px-3 py-2 text-[12px] font-semibold leading-5 text-[#9b3a2f]"
            >
              {error}
            </p>
          ) : null}
          {notice ? (
            <p
              aria-live="polite"
              className="rounded-lg bg-[#eef8f1] px-3 py-2 text-[12px] font-semibold leading-5 text-[#006b4f]"
            >
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[13px] font-semibold text-white shadow-[0_14px_28px_rgba(240,106,93,0.2)] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef513f] active:scale-press sm:w-fit"
          >
            <Send className="h-4 w-4" strokeWidth={1.8} />
            Open email draft
          </button>
        </form>
      </section>

      <ReferralTable conversions={conversions} />
    </div>
  );
}
