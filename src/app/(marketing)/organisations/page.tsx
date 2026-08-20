import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Handshake,
  LibraryBig,
  MessagesSquare,
  NotebookPen,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { OrganisationContactSubmitButton } from "@/components/marketing/OrganisationContactSubmitButton";
import { JsonLd } from "@/components/seo/JsonLd";
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
};

const pageDescription =
  "Jiandae helps schools, universities, employers, training programs, and career organisations give people practical job-preparation tools for specific opportunities.";

const audienceCards: CardItem[] = [
  {
    icon: GraduationCap,
    title: "Schools & Universities",
    copy: "Help students and graduates prepare for internships, attachments, and early-career roles with more structure.",
  },
  {
    icon: UsersRound,
    title: "Training & Employability Programs",
    copy: "Support cohorts with practical preparation before applications, employer sessions, or placement cycles.",
  },
  {
    icon: Building2,
    title: "Employers",
    copy: "Give candidates and talent communities a clearer way to prepare for real opportunities and hiring stages.",
  },
  {
    icon: Handshake,
    title: "Career Development Organisations",
    copy: "Extend advisory work with guided CV, cover-letter, and interview preparation that candidates can use repeatedly.",
  },
];

const capabilityCards: CardItem[] = [
  {
    icon: ClipboardCheck,
    title: "CV Tailoring",
    copy: "Help users tailor their CV to specific opportunities without losing the truth of their experience.",
  },
  {
    icon: NotebookPen,
    title: "Cover Letter Tailoring",
    copy: "Help users create stronger, role-specific applications grounded in the role and their own evidence.",
  },
  {
    icon: MessagesSquare,
    title: "Mock Interviews",
    copy: "Help users practise realistic interviews based on the opportunities they are pursuing.",
  },
];

const useCases = [
  "Preparing students for internships and graduate roles",
  "Supporting job-seeker cohorts",
  "Running employability and career-readiness programs",
  "Preparing candidates for specific opportunities",
  "Giving people access to structured job-preparation tools",
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

function SectionIntro({
  eyebrow,
  title,
  copy,
  reversed = false,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  reversed?: boolean;
}) {
  return (
    <div className="max-w-4xl">
      <p
        className={`text-sm font-bold uppercase tracking-[0.18em] ${
          reversed ? "text-[#d7a84f]" : "text-[#6f4e00]"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-5 text-[clamp(2.25rem,3.9vw,4.3rem)] font-bold leading-none tracking-[-0.05em] text-balance ${
          reversed ? "text-white" : "text-[#071512]"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-6 max-w-3xl text-base leading-7 md:text-lg md:leading-8 ${
          reversed ? "text-white/72" : "text-[#52605b]"
        }`}
      >
        {copy}
      </p>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="overflow-hidden bg-[#063c31] px-5 py-16 text-white md:px-9 md:py-24">
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
        <div className="reveal-up">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d7a84f]">
            Jiandae for organisations
          </p>
          <h1 className="mt-6 max-w-4xl text-[clamp(3rem,6vw,6.4rem)] font-bold leading-none tracking-[-0.055em] text-balance">
            Prepare your people for better opportunities.
          </h1>
          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/74 md:text-xl md:leading-9">
            Jiandae gives students, graduates, candidates, and job seekers
            practical tools to prepare for specific job opportunities.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#contact"
              data-analytics-event="organisations_hero_contact_click"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#f7bd22] px-7 text-sm font-bold uppercase tracking-[0.12em] text-[#173127] shadow-[0_12px_30px_rgba(247,189,34,0.22)] transition hover:-translate-y-px hover:bg-[#ffd15a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-press"
            >
              Talk to us
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>
          </div>
        </div>

        <div className="relative reveal-up delay-soft-2">
          <div className="absolute -left-8 top-10 hidden h-32 w-32 rounded-full border border-white/12 lg:block" />
          <div className="rounded-[2rem] border border-white/12 bg-white/8 p-4 shadow-[0_30px_80px_rgba(0,18,14,0.22)] backdrop-blur">
            <Image
              src="/marketing/banner.png"
              alt="Professionals preparing for an interview with a laptop and Africa map backdrop"
              width={1536}
              height={1024}
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="h-auto w-full object-contain mix-blend-screen"
              priority
            />
            <div className="grid gap-3 border-t border-white/10 px-2 pb-2 pt-4 sm:grid-cols-3">
              {["CV evidence", "Role fit", "Interview practice"].map((item) => (
                <span
                  key={item}
                  className="rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-white/82"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhoItsForSection() {
  return (
    <section className="bg-[#fbf8f2] px-5 py-16 md:px-9 md:py-24">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionIntro
            eyebrow="Who it is for"
            title="A shared preparation layer for different support models."
            copy="Use Jiandae when your organisation wants people to move from interest to application with clearer documents, sharper interview practice, and a more concrete plan."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {audienceCards.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="marketing-card-motion rounded-[1.6rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_18px_54px_rgba(21,35,29,0.06)]"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf4ef] text-[#00533f]">
                    <Icon className="h-6 w-6" strokeWidth={1.9} />
                  </span>
                  <h3 className="mt-6 text-[1.55rem] font-bold leading-tight tracking-[-0.04em] text-[#071512]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-[#52605b]">
                    {item.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  const [primary, ...secondary] = capabilityCards;
  const PrimaryIcon = primary.icon;

  return (
    <section className="bg-[#fcfcfa] px-5 py-16 md:px-9 md:py-24">
      <div className="mx-auto max-w-[1320px]">
        <SectionIntro
          eyebrow="What Jiandae provides"
          title="Three preparation tools working as one journey."
          copy="Users can move from a real opportunity to a better application and then into focused interview practice. The dashboard keeps those decisions in one place."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
          <article className="rounded-[1.8rem] border border-[#063c31] bg-[#063c31] p-7 text-white shadow-[0_28px_70px_rgba(6,60,49,0.18)] md:p-9">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-[#f7bd22]">
              <PrimaryIcon className="h-7 w-7" strokeWidth={1.9} />
            </span>
            <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-[#d7a84f]">
              Start with evidence
            </p>
            <h3 className="mt-4 text-[clamp(2rem,3.6vw,4rem)] font-bold leading-none tracking-[-0.05em]">
              {primary.title}
            </h3>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/74">
              {primary.copy}
            </p>
          </article>
          <div className="grid gap-5">
            {secondary.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="rounded-[1.6rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_18px_54px_rgba(21,35,29,0.06)]"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-[#eaf4ef] text-[#00533f]">
                      <Icon className="h-6 w-6" strokeWidth={1.9} />
                    </span>
                    <div>
                      <h3 className="text-2xl font-bold tracking-[-0.04em] text-[#071512]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-base leading-7 text-[#52605b]">
                        {item.copy}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section className="bg-[#fffaf3] px-5 py-16 md:px-9 md:py-24">
      <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <SectionIntro
          eyebrow="How organisations use Jiandae"
          title="Fit preparation around the opportunity in front of them."
          copy="Jiandae can sit beside advising, employer relations, curriculum, bootcamps, or candidate community programs."
        />
        <div className="rounded-[1.8rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_24px_70px_rgba(21,35,29,0.08)] md:p-8">
          <div className="flex items-center gap-4 border-b border-[#e8ece9] pb-6">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf4ef] text-[#00533f]">
              <BriefcaseBusiness className="h-6 w-6" strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6f4e00]">
                Practical examples
              </p>
              <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#071512]">
                From classroom to candidate pipeline
              </h3>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {useCases.map((useCase) => (
              <div
                key={useCase}
                className="flex gap-3 rounded-[1.15rem] bg-[#fbf8f2] p-4"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 flex-none text-[#00533f]"
                  strokeWidth={2}
                />
                <p className="text-base font-bold leading-6 text-[#173a32]">
                  {useCase}
                </p>
              </div>
            ))}
          </div>
        </div>
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
      <span className="text-sm font-bold text-[#172333]">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className="h-14 rounded-xl border border-[#cbd4d1] bg-white px-4 text-[0.95rem] font-medium text-[#071512] outline-none transition duration-300 ease-soft placeholder:text-[#8a96a5] focus:border-[#087236] focus:ring-4 focus:ring-[#087236]/10"
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
      <span className="text-sm font-bold text-[#172333]">{label}</span>
      <select
        name={name}
        defaultValue=""
        required
        className="h-14 rounded-xl border border-[#cbd4d1] bg-white px-4 text-[0.95rem] font-medium text-[#071512] outline-none transition duration-300 ease-soft focus:border-[#087236] focus:ring-4 focus:ring-[#087236]/10"
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
      <span className="text-sm font-bold text-[#172333]">{label}</span>
      <textarea
        name={name}
        rows={required ? 5 : 4}
        placeholder={placeholder}
        required={required}
        className="min-h-32 resize-y rounded-xl border border-[#cbd4d1] bg-white px-4 py-3 text-[0.95rem] font-medium leading-7 text-[#071512] outline-none transition duration-300 ease-soft placeholder:text-[#8a96a5] focus:border-[#087236] focus:ring-4 focus:ring-[#087236]/10"
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
    <section id="contact" className="scroll-mt-28 bg-[#fcfcfa] px-5 py-16 md:px-9 md:py-24">
      <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <SectionIntro
            eyebrow="Contact"
            title="Talk to us about your cohort, candidates, or program."
            copy="Share what you are trying to prepare people for and roughly how many people you support. We will follow up with the next practical step."
          />
          <div className="mt-8 rounded-[1.5rem] border border-[#d9cbb8] bg-[#fffaf3] p-5">
            <LibraryBig className="h-6 w-6 text-[#00533f]" strokeWidth={1.9} />
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-[#6f4e00]">
              Partnership note
            </p>
            <p className="mt-3 text-base leading-7 text-[#52605b]">
              Preparation should remain grounded in the user&apos;s real
              opportunity, documents, and experience. Jiandae does not promise
              employer access, leaked questions, or guaranteed outcomes.
            </p>
          </div>
        </div>

        <form
          action={submitOrganisationInquiry}
          className="rounded-[1.8rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_24px_70px_rgba(21,35,29,0.08)] md:p-8"
        >
          <div className="grid gap-5">
            <ContactNotice status={status} />
            <div className="grid gap-5 md:grid-cols-2">
              <ContactField
                label="Name"
                name="name"
                autoComplete="name"
                placeholder="Your full name"
              />
              <ContactField
                label="Work email"
                name="workEmail"
                type="email"
                autoComplete="email"
                placeholder="you@organisation.com"
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
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
            <ContactTextarea
              label="What they are looking for"
              name="lookingFor"
              placeholder="Tell us about the opportunity, cohort, program, or support model."
            />
            <ContactTextarea
              label="Additional message"
              name="message"
              required={false}
              placeholder="Add timing, goals, or any context that would help us respond."
            />
            <OrganisationContactSubmitButton />
          </div>
        </form>
      </div>
    </section>
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
      <ContactSection status={status} />
    </main>
  );
}
