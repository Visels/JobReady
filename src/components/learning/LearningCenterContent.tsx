"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  MapPinned,
  MessageSquareText,
  ShieldCheck,
  Target,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  REGION_TIPS,
  VISA_KEYS,
  VISA_RESOURCES,
  type VisaKey,
} from "@/lib/visa-resource-content";

function VisaTabs({
  activeVisa,
  onChange,
}: {
  activeVisa: VisaKey;
  onChange: (visa: VisaKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Learning visa type"
      className="grid gap-2 rounded-xl border border-[#dfe6e3] bg-white p-2 shadow-[0_16px_38px_rgba(15,47,40,0.04)] sm:grid-cols-2 lg:grid-cols-4"
    >
      {VISA_KEYS.map((visaKey) => {
        const visa = VISA_RESOURCES[visaKey];
        const active = activeVisa === visaKey;

        return (
          <button
            key={visa.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(visaKey)}
            className={`min-h-12 rounded-lg px-3 text-left transition duration-300 ease-soft active:scale-press ${
              active
                ? "bg-primary text-white shadow-[0_12px_26px_rgba(0,75,63,0.18)]"
                : "bg-[#f8fbfa] text-primary hover:bg-[#eef5f1]"
            }`}
          >
            <span className="block text-[13px] font-semibold leading-5">
              {visa.label}
            </span>
            <span
              className={`mt-0.5 block text-[11px] leading-4 ${
                active ? "text-white/78" : "text-[#697671]"
              }`}
            >
              {visa.shortLabel} prep track
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  tone = "green",
  eyebrow,
  title,
  body,
}: {
  icon: LucideIcon;
  tone?: "green" | "coral" | "gold";
  eyebrow: string;
  title: string;
  body: string;
}) {
  const toneClass =
    tone === "coral"
      ? "bg-[#ffe5df] text-accent"
      : tone === "gold"
        ? "bg-[#fff0d4] text-[#9b5a00]"
        : "bg-[#eef5f1] text-primary";

  return (
    <div className="flex items-start gap-3">
      <span className={`grid h-10 w-10 flex-none place-items-center rounded-full ${toneClass}`}>
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#697671]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[16px] font-semibold leading-6 text-primary">
          {title}
        </h2>
        <p className="mt-1 text-[12px] leading-5 text-[#697671]">{body}</p>
      </div>
    </div>
  );
}

export function LearningCenterContent() {
  const [activeVisa, setActiveVisa] = useState<VisaKey>("f1");
  const visa = VISA_RESOURCES[activeVisa];

  return (
    <div className="space-y-3">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[13px] font-semibold leading-5 text-[#697671]">
            Learning center
          </p>
          <h1 className="mt-1 font-serif text-[30px] font-semibold leading-tight tracking-[-0.02em] text-primary">
            Build officer-ready answers
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-[#52605b]">
            Practice interview technique, answer structure, phrase discipline,
            and risk fixes across F1, H1B, B1/B2, and O1 visa interviews.
          </p>
        </div>
        <Link
          href="/practice"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-[13px] font-semibold text-white shadow-[0_14px_28px_rgba(240,106,93,0.2)] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef513f] active:scale-press"
        >
          Practice this visa
          <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
        </Link>
      </header>

      <VisaTabs activeVisa={activeVisa} onChange={setActiveVisa} />

      <section className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#eef5f1] text-primary">
              <GraduationCap className="h-6 w-6" strokeWidth={1.7} />
            </span>
            <div>
              <h2 className="text-[16px] font-semibold leading-6 text-primary">
                {visa.label}
              </h2>
              <p className="text-[12px] leading-5 text-[#697671]">
                {visa.tagline}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-[#f8fbfa] px-3 py-2 text-[12px] font-semibold text-primary">
            {visa.commonQuestions.length} question groups
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <SectionHeader
            icon={MessageSquareText}
            tone="green"
            eyebrow="Interview techniques"
            title="Answer with control"
            body="Confident answering, tough questions, body language, and tone."
          />
          <div className="mt-4 grid gap-2">
            {visa.interviewTechniques.map((technique) => (
              <div key={technique.title} className="rounded-lg bg-[#f8fbfa] p-3">
                <h3 className="text-[13px] font-semibold leading-5 text-primary">
                  {technique.title}
                </h3>
                <p className="mt-1 text-[12px] leading-5 text-[#52605b]">
                  {technique.body}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <SectionHeader
            icon={ClipboardCheck}
            tone="coral"
            eyebrow="Mock interview guides"
            title="Know the room before you enter"
            body="What the real interview feels like and what consulates expect."
          />
          <div className="mt-4 grid gap-2">
            <p className="rounded-lg bg-[#f8fbfa] p-3 text-[12px] leading-5 text-[#52605b]">
              <span className="font-semibold text-primary">Setting: </span>
              {visa.mockInterview.setting}
            </p>
            <p className="rounded-lg bg-[#f8fbfa] p-3 text-[12px] leading-5 text-[#52605b]">
              <span className="font-semibold text-primary">Pace: </span>
              {visa.mockInterview.pace}
            </p>
            {visa.mockInterview.expectations.map((expectation) => (
              <div key={expectation} className="flex gap-3 rounded-lg bg-[#f8fbfa] p-3">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 flex-none text-[#006b4f]"
                  strokeWidth={1.8}
                />
                <p className="text-[12px] leading-5 text-[#52605b]">
                  {expectation}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
        <SectionHeader
          icon={BookOpen}
          tone="green"
          eyebrow="Common questions library"
          title={`${visa.label} question patterns`}
          body="Each category includes an example strong answer and a weak answer to avoid."
        />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {visa.commonQuestions.map((item) => (
            <article key={item.question} className="rounded-lg border border-[#edf1ef] bg-[#fbfcfb] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#697671]">
                {item.category}
              </p>
              <h3 className="mt-2 text-[14px] font-semibold leading-5 text-primary">
                {item.question}
              </h3>
              <div className="mt-3 grid gap-2">
                <div className="rounded-lg bg-white p-3">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-[#006b4f]">
                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
                    Strong answer
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-[#52605b]">
                    {item.strong}
                  </p>
                </div>
                <div className="rounded-lg bg-[#fff4f1] p-3">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-[#9b3a2f]">
                    <XCircle className="h-4 w-4" strokeWidth={1.8} />
                    Weak answer
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-[#7a4741]">
                    {item.weak}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <SectionHeader
            icon={FileText}
            tone="gold"
            eyebrow="Vocabulary and phrases"
            title="Use precise visa language"
            body="Phrases that land well with officers and words that create risk."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-[#f8fbfa] p-3">
              <h3 className="text-[13px] font-semibold leading-5 text-primary">
                Phrases to use
              </h3>
              <ul className="mt-2 grid gap-2">
                {visa.phrases.use.map((phrase) => (
                  <li key={phrase} className="flex gap-2 text-[12px] leading-5 text-[#52605b]">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 flex-none text-[#006b4f]"
                      strokeWidth={1.8}
                    />
                    <span>{phrase}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-[#fff4f1] p-3">
              <h3 className="text-[13px] font-semibold leading-5 text-[#8b3d31]">
                Words to avoid
              </h3>
              <ul className="mt-2 grid gap-2">
                {visa.phrases.avoid.map((phrase) => (
                  <li key={phrase} className="flex gap-2 text-[12px] leading-5 text-[#7a4741]">
                    <XCircle
                      className="mt-0.5 h-4 w-4 flex-none text-accent"
                      strokeWidth={1.8}
                    />
                    <span>{phrase}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <SectionHeader
            icon={ShieldCheck}
            tone="coral"
            eyebrow="Mistake analysis"
            title="Fix the failure points"
            body="Common reasons applicants lose credibility, with direct repair steps."
          />
          <div className="mt-4 grid gap-2">
            {visa.mistakes.map((mistake) => (
              <div key={mistake.issue} className="grid gap-2 rounded-lg bg-[#f8fbfa] p-3 sm:grid-cols-[0.72fr_1fr]">
                <div className="flex gap-2">
                  <Target
                    className="mt-0.5 h-4 w-4 flex-none text-accent"
                    strokeWidth={1.8}
                  />
                  <p className="text-[12px] font-semibold leading-5 text-primary">
                    {mistake.issue}
                  </p>
                </div>
                <p className="text-[12px] leading-5 text-[#52605b]">
                  {mistake.fix}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
        <SectionHeader
          icon={MapPinned}
          tone="green"
          eyebrow="Country-specific tips"
          title="Adjust for the consulate environment"
          body="Regional post differences can change pacing, document handling, and the follow-up questions you hear."
        />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {REGION_TIPS.map((region) => (
            <article key={region.region} className="rounded-lg border border-[#edf1ef] bg-[#fbfcfb] p-3">
              <h3 className="text-[14px] font-semibold leading-5 text-primary">
                {region.region}
              </h3>
              <p className="mt-1 text-[12px] leading-5 text-[#697671]">
                {region.note}
              </p>
              <ul className="mt-3 grid gap-2">
                {region.tips.map((tip) => (
                  <li key={tip} className="flex gap-2 text-[12px] leading-5 text-[#52605b]">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 flex-none text-[#006b4f]"
                      strokeWidth={1.8}
                    />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
