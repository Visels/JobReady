"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  Globe2,
  Landmark,
  ListChecks,
  MapPinned,
  Route,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ALL_VISA_REQUIREMENT_DESTINATIONS,
  type DestinationRequirementGuide,
  type GuideStep,
  type RequirementItem,
  type VisaRequirementGuide,
} from "@/lib/visa-requirement-guides";

const destinationGuides = ALL_VISA_REQUIREMENT_DESTINATIONS;
const defaultDestination = destinationGuides[0];

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="grid gap-2">
      <span className="text-[12px] font-semibold leading-4 text-[#52605b]">
        {label}
      </span>
      <span className="relative block">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 w-full appearance-none rounded-lg border border-[#ccd9d4] bg-white px-3 pr-10 text-[14px] font-semibold leading-5 text-primary outline-none transition duration-300 ease-soft hover:border-[#aebfb9] focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#697671]"
          strokeWidth={1.8}
        />
      </span>
    </label>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#e1e8e5] bg-[#fbfcfb] p-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold leading-4 text-[#697671]">
        <Icon className="h-4 w-4 text-primary" strokeWidth={1.7} />
        {label}
      </div>
      <p className="mt-1 text-[13px] font-semibold leading-5 text-primary">
        {value}
      </p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  body,
  tone = "green",
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  tone?: "green" | "coral" | "gold";
}) {
  const toneClass =
    tone === "coral"
      ? "bg-[#ffe5df] text-accent"
      : tone === "gold"
        ? "bg-[#fff0d4] text-[#9b5a00]"
        : "bg-[#eef5f1] text-primary";

  return (
    <div className="flex items-start gap-3">
      <span
        className={`grid h-10 w-10 flex-none place-items-center rounded-full ${toneClass}`}
      >
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

function RequirementRow({
  item,
  index,
}: {
  item: RequirementItem;
  index: number;
}) {
  return (
    <li className="grid gap-3 rounded-lg border border-[#edf1ef] bg-[#fbfcfb] p-3 sm:grid-cols-[32px_1fr_auto] sm:items-start">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[12px] font-semibold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
        {index + 1}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-5 text-primary">
          {item.title}
        </span>
        <span className="mt-1 block text-[12px] leading-5 text-[#52605b]">
          {item.body}
        </span>
      </span>
      <span
        className={`inline-flex min-h-7 items-center justify-center rounded-md px-2 text-[10px] font-semibold leading-none ${
          item.required
            ? "bg-[#dff4e7] text-[#006b4f]"
            : "bg-white text-[#697671]"
        }`}
      >
        {item.required ? "Required" : "Conditional"}
      </span>
    </li>
  );
}

function GuideStepRow({ step, index }: { step: GuideStep; index: number }) {
  return (
    <li className="grid gap-3 rounded-lg bg-[#f8fbfa] p-3 sm:grid-cols-[38px_1fr]">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[12px] font-semibold text-primary">
        {index + 1}
      </span>
      <span>
        <span className="block text-[13px] font-semibold leading-5 text-primary">
          {step.title}
        </span>
        <span className="mt-1 block text-[12px] leading-5 text-[#52605b]">
          {step.body}
        </span>
      </span>
    </li>
  );
}

function IconList({
  items,
  icon: Icon,
  tone = "green",
}: {
  items: string[];
  icon: LucideIcon;
  tone?: "green" | "coral" | "gold";
}) {
  const colorClass =
    tone === "coral"
      ? "text-accent"
      : tone === "gold"
        ? "text-[#b36b00]"
        : "text-[#006b4f]";

  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-2 rounded-lg bg-[#f8fbfa] p-3 text-[12px] leading-5 text-[#52605b]"
        >
          <Icon
            className={`mt-0.5 h-4 w-4 flex-none ${colorClass}`}
            strokeWidth={1.8}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function OfficialLinks({ guide }: { guide: VisaRequirementGuide }) {
  return (
    <div className="grid gap-2">
      {guide.officialLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="group rounded-lg border border-[#edf1ef] bg-[#fbfcfb] p-3 transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#cbd9d5] active:scale-press"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold leading-5 text-primary">
              {link.title}
            </span>
            <ArrowUpRight
              className="h-4 w-4 flex-none text-[#697671] transition duration-300 ease-soft group-hover:text-accent"
              strokeWidth={1.8}
            />
          </span>
          <span className="mt-1 block text-[12px] leading-5 text-[#52605b]">
            {link.body}
          </span>
        </a>
      ))}
    </div>
  );
}

function VisaOverview({
  destination,
  guide,
}: {
  destination: DestinationRequirementGuide;
  guide: VisaRequirementGuide;
}) {
  const requiredCount = guide.documents.filter((item) => item.required).length;

  return (
    <section className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
      <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold leading-5 text-[#697671]">
              {destination.country} / {guide.category}
            </p>
            <h2 className="mt-1 font-serif text-[26px] font-semibold leading-tight tracking-[-0.02em] text-primary">
              {guide.label}
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#52605b]">
              {guide.summary}
            </p>
          </div>
          <span className="inline-flex min-h-8 w-fit items-center rounded-lg bg-[#eef5f1] px-3 text-[12px] font-semibold text-primary">
            {guide.shortLabel}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <StatPill icon={FileCheck2} label="Documents" value={`${requiredCount} core items`} />
          <StatPill icon={CalendarClock} label="Timing" value={guide.timeline} />
          <StatPill icon={Landmark} label="Mode" value={guide.applicationMode} />
          <StatPill icon={MapPinned} label="Stay" value={guide.stay} />
        </div>
      </article>

      <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
        <SectionHeader
          icon={ShieldCheck}
          eyebrow="Eligibility snapshot"
          title="Before you apply"
          body="These are the facts the application should be ready to prove."
        />
        <div className="mt-4">
          <IconList items={guide.eligibility} icon={CheckCircle2} />
        </div>
      </article>
    </section>
  );
}

export function VisaRequirementsExplorer() {
  const [destinationId, setDestinationId] = useState(defaultDestination.id);
  const [visaId, setVisaId] = useState(defaultDestination.visas[0].id);

  const destination = useMemo(
    () =>
      destinationGuides.find((item) => item.id === destinationId) ??
      defaultDestination,
    [destinationId],
  );

  const guide = useMemo(
    () =>
      destination.visas.find((item) => item.id === visaId) ??
      destination.visas[0],
    [destination, visaId],
  );

  function handleDestinationChange(nextDestinationId: string) {
    const nextDestination =
      destinationGuides.find((item) => item.id === nextDestinationId) ??
      defaultDestination;

    setDestinationId(nextDestination.id);
    setVisaId(nextDestination.visas[0].id);
  }

  return (
    <div className="space-y-3">
      <header className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <p className="text-[13px] font-semibold leading-5 text-[#697671]">
            Visa guides
          </p>
          <h1 className="mt-1 max-w-3xl font-serif text-[30px] font-semibold leading-tight tracking-[-0.02em] text-primary md:text-[34px]">
            Requirements by country and visa type
          </h1>
          <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[#52605b]">
            Select a destination and visa route to review the document packet,
            application flow, interview focus, and official sources.
          </p>
        </div>

        <div className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#fff0d4] text-[#9b5a00]">
              <BadgeCheck className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <div>
              <p className="text-[12px] font-semibold leading-5 text-primary">
                Official check required
              </p>
              <p className="text-[11px] leading-4 text-[#697671]">
                Fees, forms, translations, and appointment rules can change by
                post.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <SelectField
            id="visa-guide-country"
            label="Country"
            value={destination.id}
            onChange={handleDestinationChange}
          >
            {destinationGuides.map((item) => (
              <option key={item.id} value={item.id}>
                {item.country}
              </option>
            ))}
          </SelectField>

          <SelectField
            id="visa-guide-type"
            label="Visa type"
            value={guide.id}
            onChange={setVisaId}
          >
            {destination.visas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </SelectField>

          <div className="rounded-lg bg-[#f8fbfa] px-3 py-2.5 text-[12px] leading-5 text-[#52605b] md:min-w-[178px]">
            <span className="block font-semibold text-primary">
              Reviewed {destination.lastReviewed}
            </span>
            <span>{destination.region}</span>
          </div>
        </div>
      </section>

      <VisaOverview destination={destination} guide={guide} />

      <section className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
        <SectionHeader
          icon={ClipboardCheck}
          tone="coral"
          eyebrow="Required documents"
          title={`${guide.shortLabel} preparation packet`}
          body="Use this as a working checklist, then confirm the exact post-specific list before submission."
        />
        <ol className="mt-4 grid gap-2">
          {guide.documents.map((item, index) => (
            <RequirementRow
              key={`${item.title}-${index}`}
              item={item}
              index={index}
            />
          ))}
        </ol>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <SectionHeader
            icon={Route}
            eyebrow="Application flow"
            title="From eligibility to decision"
            body="A clean sequence helps prevent missing forms, late evidence, and conflicting details."
          />
          <ol className="mt-4 grid gap-2">
            {guide.applicationSteps.map((step, index) => (
              <GuideStepRow
                key={`${step.title}-${index}`}
                step={step}
                index={index}
              />
            ))}
          </ol>
        </article>

        <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <SectionHeader
            icon={ListChecks}
            tone="gold"
            eyebrow="Officer focus"
            title="Prepare these answers"
            body="These are the points most likely to decide whether the story sounds credible."
          />
          <div className="mt-4">
            <IconList items={guide.interviewFocus} icon={CheckCircle2} />
          </div>
        </article>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <SectionHeader
            icon={AlertTriangle}
            tone="coral"
            eyebrow="Common pitfalls"
            title="Avoid these weak points"
            body="Most avoidable refusals come from inconsistency, missing evidence, or unclear intent."
          />
          <div className="mt-4">
            <IconList
              items={guide.commonPitfalls}
              icon={AlertTriangle}
              tone="coral"
            />
          </div>
        </article>

        <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <SectionHeader
            icon={Globe2}
            eyebrow="Country note"
            title={destination.country}
            body={destination.countryNote}
          />
          <div className="mt-4 rounded-lg border border-[#edf1ef] bg-[#fbfcfb] p-3">
            <p className="text-[12px] font-semibold leading-5 text-primary">
              Verification rhythm
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[#52605b]">
              Recheck official instructions before paying a fee, before
              attending biometrics or interview, and again before travelling.
            </p>
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
        <SectionHeader
          icon={Landmark}
          eyebrow="Official sources"
          title="Verify the final checklist"
          body="These links point to government or official application resources for the selected visa route."
        />
        <div className="mt-4">
          <OfficialLinks guide={guide} />
        </div>
      </section>
    </div>
  );
}
