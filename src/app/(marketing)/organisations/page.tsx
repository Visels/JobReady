import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Handshake,
  LibraryBig,
  Mail,
  MessagesSquare,
  Mic,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { OrganisationContactSubmitButton } from "@/components/marketing/OrganisationContactSubmitButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { BrandMark } from "@/components/ui/BrandMark";
import { publicProductConfig } from "@/config/public";
import { sendTransactionalEmail } from "@/lib/email";
import { generateSEO } from "@/lib/seo";
import { generateWebPageSchema } from "@/lib/structured-data";

type OrganisationsPageProps = {
  searchParams?: Promise<{ contact?: string }>;
};

type CardItem = {
  icon: LucideIcon;
  title: string;
  copy: string;
  tone?: "green" | "gold";
};

type CapabilityItem = CardItem & {
  step: string;
};

type UseCaseItem = {
  icon: LucideIcon;
  copy: string;
};

const pageDescription =
  "Jiandae helps schools, universities, employers, training programs, and career organisations give people practical job-preparation tools for specific opportunities.";

const audienceCards: CardItem[] = [
  {
    icon: GraduationCap,
    title: "Schools & Universities",
    copy: "Prepare students for internships, graduate roles and life after campus.",
    tone: "green",
  },
  {
    icon: UsersRound,
    title: "Training & Employability Programs",
    copy: "Empower cohorts with tools that improve readiness and employability outcomes.",
    tone: "gold",
  },
  {
    icon: Building2,
    title: "Employers",
    copy: "Help your candidates and new hires prepare for opportunities and interviews that matter.",
    tone: "green",
  },
  {
    icon: Handshake,
    title: "Career Development Organisations",
    copy: "Support job seekers with the resources they need to take the next step.",
    tone: "gold",
  },
];

const capabilityCards: CapabilityItem[] = [
  {
    icon: ClipboardCheck,
    title: "CV Tailoring",
    copy: "Match CVs to specific job requirements to stand out to recruiters.",
    step: "1",
    tone: "green",
  },
  {
    icon: Mail,
    title: "Cover Letter Tailoring",
    copy: "Create personalised cover letters that speak directly to the role.",
    step: "2",
    tone: "gold",
  },
  {
    icon: Mic,
    title: "Mock Interviews",
    copy: "Practise with realistic, role-specific interviews and get actionable feedback.",
    step: "3",
    tone: "green",
  },
];

const useCases: UseCaseItem[] = [
  {
    icon: GraduationCap,
    copy: "Prepare students for internships and graduate roles",
  },
  {
    icon: UsersRound,
    copy: "Support job-seeker cohorts and alumni networks",
  },
  {
    icon: LibraryBig,
    copy: "Run employability and career-readiness programs",
  },
  {
    icon: BriefcaseBusiness,
    copy: "Help candidates prepare for specific opportunities",
  },
  {
    icon: BarChart3,
    copy: "Track engagement and measure readiness",
  },
];

const lookingForOptions = [
  "A pilot for a student or job-seeker cohort",
  "Tools for an employability program",
  "Candidate preparation for specific roles",
  "A partnership conversation",
  "Something else",
];

const organisationTypes = [
  "School or university",
  "Training or employability program",
  "Employer",
  "Career development organisation",
  "Other organisation",
];

const peopleCountOptions = [
  "1-50",
  "51-200",
  "201-500",
  "501-1,000",
  "1,000+",
];

const contactMessages = {
  sent: {
    title: "Thanks. We received your message.",
    copy: "The Jiandae team will review it and get back to you.",
  },
  missing: {
    title: "Please complete the required fields.",
    copy: "Name, work email, organisation details, audience size, and what you are looking for are required.",
  },
  error: {
    title: "We could not send that just now.",
    copy: `Please email ${publicProductConfig.legal.supportEmail} if the form keeps failing.`,
  },
} as const;

export const metadata: Metadata = generateSEO({
  title: "Organisations",
  description: pageDescription,
  slug: "/organisations",
  keywords: [
    "career readiness programs Africa",
    "employability programs Kenya",
    "graduate job preparation",
    "job preparation for universities",
    "candidate preparation tools",
  ],
  ogImageParams: {
    title: "Prepare your people for better opportunities.",
    sub: "Structured CV, cover-letter, and mock interview preparation for organisations.",
    badge: "Jiandae Organisations",
  },
});

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  const replacements: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (character) => replacements[character]);
}

function subjectText(value: string) {
  return value.replace(/[\r\n]+/g, " ").slice(0, 96);
}

async function submitOrganisationInquiry(formData: FormData) {
  "use server";

  const inquiry = {
    name: formValue(formData, "name"),
    workEmail: formValue(formData, "workEmail").toLowerCase(),
    organisationName: formValue(formData, "organisationName"),
    organisationType: formValue(formData, "organisationType"),
    peopleCount: formValue(formData, "peopleCount"),
    lookingFor: formValue(formData, "lookingFor"),
    message: formValue(formData, "message"),
  };
  const requiredValues = [
    inquiry.name,
    inquiry.workEmail,
    inquiry.organisationName,
    inquiry.organisationType,
    inquiry.peopleCount,
    inquiry.lookingFor,
  ];

  if (requiredValues.some((value) => !value) || !validEmail(inquiry.workEmail)) {
    redirect("/organisations?contact=missing#contact");
  }

  const fields = [
    ["Name", inquiry.name],
    ["Work email", inquiry.workEmail],
    ["Organisation", inquiry.organisationName],
    ["Organisation type", inquiry.organisationType],
    ["Approximate people supported", inquiry.peopleCount],
    ["What they are looking for", inquiry.lookingFor],
    ["Additional message", inquiry.message || "Not provided"],
  ] as const;
  const text = fields.map(([label, value]) => `${label}: ${value}`).join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172333;">
      <h1 style="font-size:22px;margin:0 0 16px;">Organisation inquiry</h1>
      <table style="border-collapse:collapse;width:100%;">
        <tbody>
          ${fields
            .map(
              ([label, value]) => `
                <tr>
                  <th style="border:1px solid #dce4df;padding:10px;text-align:left;background:#f4f7f5;width:220px;">${escapeHtml(label)}</th>
                  <td style="border:1px solid #dce4df;padding:10px;">${escapeHtml(value)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
  let status: keyof typeof contactMessages = "sent";

  try {
    await sendTransactionalEmail({
      to: publicProductConfig.legal.supportEmail,
      subject: `Organisation inquiry: ${subjectText(inquiry.organisationName)}`,
      html,
      text,
      replyTo: inquiry.workEmail,
      tags: [
        { name: "type", value: "organisation_inquiry" },
        { name: "organisation_type", value: inquiry.organisationType },
      ],
    });
  } catch (error) {
    status = "error";

    if (process.env.NODE_ENV !== "production") {
      console.error("Could not send organisation inquiry.", error);
    }
  }

  redirect(`/organisations?contact=${status}#contact`);
}

function iconToneClass(tone: CardItem["tone"] = "green") {
  return tone === "gold"
    ? "bg-[#f7bd22] text-[#173127]"
    : "bg-[#00533f] text-white";
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#02271f] px-5 pb-10 pt-8 text-white md:px-8 md:pb-14 md:pt-10 lg:min-h-[calc(100dvh-5.25rem)] lg:px-12 lg:pb-8 lg:pt-6">
      <div className="mx-auto grid min-h-full max-w-[1440px] gap-10 lg:grid-cols-[minmax(420px,0.9fr)_minmax(560px,1.1fr)] lg:items-center lg:gap-2 xl:gap-6">
        <div className="reveal-up relative z-10 lg:translate-y-24 lg:pb-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#d8eb8f]">
            <UsersRound className="h-4 w-4" strokeWidth={2} />
            For organisations
          </span>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.8rem,5vw,4.8rem)] font-bold leading-[0.99] tracking-[-0.058em] text-white text-balance">
            Prepare your people{" "}
            <span className="text-[#f7bd22]">for better opportunities.</span>
          </h1>
          <p className="mt-6 max-w-[34rem] text-[1.05rem] font-medium leading-8 text-white/85 md:text-[1.18rem]">
            Jiandae provides practical, AI-powered tools that help students,
            graduates and job seekers{" "}
            <span className="font-bold text-[#f7bd22]">
              build stronger applications
            </span>
            , practise interviews, and gain the confidence to succeed.
          </p>
          <div className="mt-6 grid gap-3 text-[1rem] font-semibold leading-6 text-white/88">
            {["Built for Africa", "Trusted by job seekers across Kenya and beyond"].map(
              (item) => (
                <p key={item} className="flex items-center gap-3">
                  <CheckCircle2
                    className="h-5 w-5 flex-none text-[#7bdc69]"
                    strokeWidth={2.5}
                  />
                  {item}
                </p>
              ),
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#contact"
              data-analytics-event="organisations_hero_contact_click"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#f7bd22] px-7 text-[0.98rem] font-bold text-[#173127] shadow-[0_8px_18px_rgba(247,189,34,0.2)] transition hover:-translate-y-px hover:bg-[#ffd15a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7bd22] active:scale-[0.98]"
            >
              Talk to us
            </a>
          </div>
        </div>

        <div className="reveal-up delay-soft-2">
          <aside className="relative mx-auto w-full max-w-[900px] lg:max-w-none lg:translate-x-2 lg:translate-y-14 lg:scale-[1.18] lg:origin-center">
            <Image
              src="/marketing/organization.png"
              alt="Professionals from an organisation reviewing job preparation work on a laptop"
              width={1536}
              height={1024}
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="h-auto w-full object-contain"
              priority
            />
          </aside>
        </div>
      </div>
    </section>
  );
}

function WhoItsForSection() {
  return (
    <section className="bg-[#fcfcfa] px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[clamp(2rem,3vw,3rem)] font-bold leading-tight tracking-[-0.045em] text-[#303942]">
            Who it&apos;s for
          </h2>
          <p className="mt-3 text-base font-medium leading-7 text-[#52605b]">
            Jiandae supports organisations that are committed to preparing
            people for work.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audienceCards.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="marketing-card-motion flex min-h-[13.4rem] flex-col items-center rounded-[1.25rem] border border-[#edf0ed] bg-white px-6 py-7 text-center shadow-[0_16px_42px_rgba(21,35,29,0.08)]"
              >
                <span
                  className={`grid h-16 w-16 place-items-center rounded-full ${iconToneClass(item.tone)}`}
                >
                  <Icon className="h-7 w-7" strokeWidth={1.9} />
                </span>
                <h3 className="mt-6 text-[1.18rem] font-bold leading-tight tracking-[-0.035em] text-[#071512]">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-[16rem] text-sm font-medium leading-6 text-[#52605b]">
                  {item.copy}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section className="border-y border-[#eef4ef] bg-[#f5faf7] px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[clamp(2rem,3vw,3rem)] font-bold leading-tight tracking-[-0.045em] text-[#303942]">
            What Jiandae provides
          </h2>
          <p className="mt-2 text-base font-medium leading-7 text-[#52605b]">
            A complete preparation journey tailored to every opportunity.
          </p>
        </div>

        <div className="relative mt-10 grid gap-9 lg:grid-cols-3 lg:gap-12">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-3 hidden border-t border-dashed border-[#b8c8bf] lg:block" />
          {capabilityCards.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="relative flex flex-col items-center text-center"
              >
                <span
                  className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-black ${iconToneClass(item.tone)}`}
                >
                  {item.step}
                </span>
                <span
                  className={`mt-4 grid h-20 w-20 place-items-center rounded-full ${
                    item.tone === "gold"
                      ? "bg-[#fff0b7] text-[#173127]"
                      : "bg-[#dff1e3] text-[#00533f]"
                  }`}
                >
                  <Icon className="h-9 w-9" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-lg font-bold leading-tight tracking-[-0.035em] text-[#071512]">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-[18rem] text-sm font-medium leading-6 text-[#2f3f3a]">
                  {item.copy}
                </p>
              </article>
            );
          })}
        </div>
        <p className="mt-8 text-center text-base font-black leading-6 text-[#071512]">
          All tools are tailored to the specific job opportunity the user is
          preparing for.
        </p>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section className="bg-[#fcfcfa] px-5 py-12 md:px-8 md:py-14">
      <div className="mx-auto max-w-[1320px]">
        <h2 className="text-center text-[clamp(2rem,3vw,3rem)] font-bold leading-tight tracking-[-0.045em] text-[#303942]">
          How organisations can use Jiandae
        </h2>
        <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-5 lg:gap-0">
          {useCases.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                key={item.copy}
                className={`flex flex-col items-center px-5 text-center ${
                  index === 0 ? "" : "lg:border-l lg:border-dashed lg:border-[#aebbb4]"
                }`}
              >
                <Icon className="h-10 w-10 text-[#00533f]" strokeWidth={1.65} />
                <p className="mt-4 max-w-[13rem] text-sm font-medium leading-6 text-[#2f3f3a]">
                  {item.copy}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TrustedSection() {
  return (
    <section className="bg-[#022f27] px-5 py-10 text-white md:px-8 md:py-12">
      <div className="mx-auto grid max-w-[1320px] gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <h2 className="max-w-[24rem] text-[clamp(2rem,3vw,3.1rem)] font-bold leading-tight tracking-[-0.045em]">
            Trusted by job seekers across Africa
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              ["100k+", "Job seekers empowered"],
              ["70%", "Report more confidence after 3 sessions"],
              ["50+", "Countries across Africa"],
            ].map(([value, label], index) => (
              <div
                key={value}
                className={index === 0 ? "" : "sm:border-l sm:border-white/12 sm:pl-6"}
              >
                <p className="text-3xl font-bold tracking-[-0.045em] text-[#f7bd22]">
                  {value}
                </p>
                <p className="mt-1 max-w-[10rem] text-sm font-semibold leading-5 text-white/78">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <figure className="rounded-[1.5rem] bg-white/8 p-7 shadow-[0_24px_70px_rgba(0,18,14,0.2)]">
          <MessagesSquare
            className="h-10 w-10 text-[#f7bd22]"
            strokeWidth={1.75}
          />
          <blockquote className="mt-4 max-w-[40rem] text-base font-bold leading-7 text-white">
            Jiandae has helped our students show up for interviews with
            confidence. The feedback and practice they get is practical and
            relevant.
          </blockquote>
          <figcaption className="mt-6 flex items-center gap-3">
            <Image
              src="/marketing/avatars/testimonial-daniel.jpg"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <p className="font-bold text-white">Mercy W.</p>
              <p className="text-sm font-medium text-white/72">
                Career Services Manager, University of Nairobi
              </p>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function ContactNotice({
  status,
}: {
  status?: keyof typeof contactMessages;
}) {
  if (!status) return null;

  const message = contactMessages[status];
  const isSuccess = status === "sent";

  return (
    <div
      className={`rounded-[1.25rem] border px-5 py-4 ${
        isSuccess
          ? "border-[#b7d8c9] bg-[#eaf4ef] text-[#00533f]"
          : "border-[#e4c4a1] bg-[#fff3d6] text-[#7a4d00]"
      }`}
      role={isSuccess ? "status" : "alert"}
    >
      <p className="font-bold">{message.title}</p>
      <p className="mt-1 text-sm font-semibold leading-6">{message.copy}</p>
    </div>
  );
}

function ContactField({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold text-[#172333]">
        {label}
        {required ? <span className="text-[#c33030]"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className="h-11 rounded-lg border border-[#d9dee2] bg-white px-4 text-sm font-medium text-[#071512] outline-none transition duration-300 ease-soft placeholder:text-[#98a2ad] focus:border-[#087236] focus:ring-4 focus:ring-[#087236]/10"
      />
    </label>
  );
}

function ContactSelect({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold text-[#172333]">
        {label}
        <span className="text-[#c33030]"> *</span>
      </span>
      <select
        name={name}
        defaultValue=""
        required
        className="h-11 rounded-lg border border-[#d9dee2] bg-white px-4 text-sm font-medium text-[#6b747c] outline-none transition duration-300 ease-soft focus:border-[#087236] focus:ring-4 focus:ring-[#087236]/10"
      >
        <option value="" disabled>
          Select one
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ContactTextarea({
  label,
  name,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold text-[#172333]">
        {label}
        {required ? <span className="text-[#c33030]"> *</span> : null}
      </span>
      <textarea
        name={name}
        rows={4}
        placeholder={placeholder}
        required={required}
        className="min-h-28 resize-y rounded-lg border border-[#d9dee2] bg-white px-4 py-3 text-sm font-medium leading-6 text-[#071512] outline-none transition duration-300 ease-soft placeholder:text-[#98a2ad] focus:border-[#087236] focus:ring-4 focus:ring-[#087236]/10"
      />
    </label>
  );
}

function ContactSection({
  status,
}: {
  status?: keyof typeof contactMessages;
}) {
  return (
    <section
      id="contact"
      className="scroll-mt-28 bg-[#fbf8f2] px-5 py-14 md:px-8 md:py-16"
    >
      <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
        <div>
          <h2 className="text-[clamp(2rem,3.2vw,3.25rem)] font-bold leading-tight tracking-[-0.045em] text-[#303942]">
            Let&apos;s work together
          </h2>
          <p className="mt-4 max-w-[23rem] text-base font-medium leading-7 text-[#52605b]">
            Tell us about your organisation and how we can support your goals.
          </p>
          <div className="mt-7 grid gap-3">
            {["Quick response", "Solutions tailored to your needs", "Built for impact"].map(
              (item) => (
                <p
                  key={item}
                  className="flex items-center gap-3 text-sm font-semibold text-[#34413c]"
                >
                  <CheckCircle2
                    className="h-5 w-5 flex-none text-[#12805c]"
                    strokeWidth={2}
                  />
                  {item}
                </p>
              ),
            )}
          </div>
        </div>

        <form
          action={submitOrganisationInquiry}
          className="rounded-[1.35rem] border border-[#edf0ed] bg-white p-5 shadow-[0_16px_48px_rgba(21,35,29,0.08)] md:p-7"
        >
          <div className="grid gap-4">
            <ContactNotice status={status} />
            <div className="grid gap-4 md:grid-cols-2">
              <ContactField
                label="Full name"
                name="name"
                autoComplete="name"
                placeholder="Enter your full name"
              />
              <ContactField
                label="Work email"
                name="workEmail"
                type="email"
                autoComplete="email"
                placeholder="you@organisation.com"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ContactField
                label="Organisation name"
                name="organisationName"
                autoComplete="organization"
                placeholder="Organisation or program name"
              />
              <ContactSelect
                label="Organisation type"
                name="organisationType"
                options={organisationTypes}
              />
            </div>
            <ContactSelect
              label="Approximate number of people they want to support"
              name="peopleCount"
              options={peopleCountOptions}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <ContactSelect
                label="What are you looking for?"
                name="lookingFor"
                options={lookingForOptions}
              />
              <ContactTextarea
                label="Additional message"
                name="message"
                required={false}
                placeholder="Tell us more about your goals or needs"
              />
            </div>
            <OrganisationContactSubmitButton />
            <p className="text-xs font-medium leading-5 text-[#52605b]">
              By submitting, you agree to our{" "}
              <Link
                href="/privacy"
                className="font-bold text-[#00533f] underline"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="font-bold text-[#00533f] underline"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

function OrganisationsFooter() {
  return (
    <footer className="bg-[#02271f] px-5 py-7 text-white md:px-8">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <BrandMark
            tone="reversed"
            className="inline-flex items-center"
            wordmarkClassName="h-8"
          />
          <p className="mt-2 text-xs font-medium text-white/62">
            © 2026 Jiandae. All rights reserved.
          </p>
        </div>
        <nav
          aria-label="Organisations footer navigation"
          className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-white/72"
        >
          <Link href="/#how-it-works" className="hover:text-white">
            How it works
          </Link>
          <Link href="/dashboard" className="hover:text-white">
            Prepare
          </Link>
          <Link href="/organisations" className="hover:text-white">
            Organisations
          </Link>
          <Link href="/career-resources" className="hover:text-white">
            Resources
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default async function OrganisationsPage({
  searchParams,
}: OrganisationsPageProps) {
  const params = await searchParams;
  const status =
    params?.contact === "sent" ||
    params?.contact === "missing" ||
    params?.contact === "error"
      ? params.contact
      : undefined;

  return (
    <main className="min-h-viewport bg-[#fcfcfa] text-[#071512]">
      <JsonLd
        data={generateWebPageSchema({
          title: "Organisations",
          description: pageDescription,
          slug: "/organisations",
          datePublished: "2026-08-20",
          dateModified: "2026-08-20",
          author: publicProductConfig.brand.name,
          reviewer: publicProductConfig.brand.name,
        })}
      />
      <HeroSection />
      <WhoItsForSection />
      <CapabilitiesSection />
      <UseCasesSection />
      <TrustedSection />
      <ContactSection status={status} />
      <OrganisationsFooter />
    </main>
  );
}
