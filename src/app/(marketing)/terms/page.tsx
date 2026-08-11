import type { Metadata } from "next";
import {
  PolicyEmailLink,
  PolicyShell,
} from "@/components/marketing/PolicyShell";
import { publicProductConfig } from "@/config/public";
import { generateSEO } from "@/lib/seo";

const { brand, legal } = publicProductConfig;

export const metadata: Metadata = generateSEO({
  title: "Terms and Conditions",
  description:
    "Terms and conditions for using Jiandae's sourced jobs, CV/resume tailoring, interview practice, application tracking, and paid preparation credits.",
  slug: "/terms",
  keywords: [
    "Jiandae terms",
    "job preparation terms",
    "CV tailoring terms",
    "job interview practice terms",
  ],
  ogImageParams: {
    title: "Terms and Conditions",
    sub: "Clear boundaries for Jiandae candidates.",
    badge: "Terms",
  },
});

export default function TermsPage() {
  return (
    <PolicyShell
      title="Terms and Conditions"
      badge="Terms"
      lastUpdated="July 28, 2026"
      description={`These Terms explain how ${brand.name} may be used, what candidates are responsible for, and the limits of the jobs, CV/resume tailoring, interview practice, and application tracking service operated by ${legal.legalName}.`}
      sections={[
        {
          id: "acceptance",
          title: "Acceptance of These Terms",
          eyebrow: "Overview",
          children: (
            <>
              <p>
                By accessing or using {brand.name}, you agree to these Terms
                and Conditions. If you do not agree with these Terms, you should
                not use the service.
              </p>
              <p>
                These Terms form an agreement between you and{" "}
                {legal.legalName}, the operator of {brand.name}. You may
                contact us about these Terms at{" "}
                <PolicyEmailLink email={legal.supportEmail} />.
              </p>
            </>
          ),
        },
        {
          id: "service",
          title: "What the Service Provides",
          eyebrow: "Product",
          children: (
            <>
              <p>
                {brand.name} provides sourced job discovery, CV/resume
                tailoring support, job interview practice, readiness reports,
                application tracking, and preparation resources. Some features
                are public, and some require a private account.
              </p>
              <p>
                Job browsing and official application links are separate from
                paid preparation. Paid credits, where available, are for mock
                interviews and CV/resume tailoring actions.
              </p>
            </>
          ),
        },
        {
          id: "jobs",
          title: "Jobs, Sources, and Non-Affiliation",
          eyebrow: "Important limits",
          children: (
            <>
              <p>
                Public job pages may include employer names, role details,
                source links, review dates, freshness labels, closing dates, and
                official application destinations. Jiandae does not guarantee
                that a job remains available, that an employer will respond, or
                that any application will succeed.
              </p>
              <p>
                Unless an explicit partnership is stated, Jiandae is not
                affiliated with, endorsed by, or approved by the employers named
                in public job listings or preparation content.
              </p>
              <p>
                You are responsible for reviewing the official destination and
                completing any real application yourself. Jiandae does not
                submit applications on your behalf.
              </p>
            </>
          ),
        },
        {
          id: "accounts",
          title: "Accounts and Candidate Responsibilities",
          eyebrow: "Access",
          children: (
            <>
              <p>
                You must be at least 16 years old to use {brand.name}. You are
                responsible for providing accurate account information, keeping
                your login credentials secure, and using the service lawfully
                and respectfully.
              </p>
              <p>
                You agree not to misuse the service, interfere with its
                operation, attempt unauthorized access, copy or resell the
                service, submit harmful content, or use generated output to
                misrepresent your experience, qualifications, achievements, or
                application status.
              </p>
            </>
          ),
        },
        {
          id: "cv-output",
          title: "CV and Resume Output",
          eyebrow: "Truthful tailoring",
          children: (
            <>
              <p>
                CV/resume tailoring output may include suggested wording,
                structure changes, gap notes, and exportable versions. You must
                review every suggestion before using it.
              </p>
              <p>
                Do not use the service to invent employers, titles, dates,
                responsibilities, achievements, credentials, salary history, or
                references. You are responsible for the accuracy of any document
                you submit to an employer or recruiter.
              </p>
            </>
          ),
        },
        {
          id: "interview-output",
          title: "Interview Practice Output",
          eyebrow: "Preparation",
          children: (
            <>
              <p>
                Interview questions, feedback, reports, summaries, and practice
                prompts may be incomplete, inaccurate, or not suited to your
                exact situation. They are designed for preparation and coaching,
                not as guaranteed hiring advice.
              </p>
              <p>
                Company and role preparation is based on reviewed sources and
                controlled practice content unless real examples are explicitly
                marked as permissioned and reviewed.
              </p>
            </>
          ),
        },
        {
          id: "payments",
          title: "Plans, Credits, and Payments",
          eyebrow: "Billing",
          children: (
            <>
              <p>
                Some features may be offered for free, while others require
                payment. Paid access, pricing, included credits, expiry windows,
                and any renewal terms will be shown before purchase.
              </p>
              <p>
                Paid purchases are processed by payment providers such as
                Flutterwave or Stripe. They may collect payment details, confirm
                your transaction by email, provide buyer support, and help
                manage refunds or billing where applicable.
              </p>
              <p>
                Billing questions can be sent to{" "}
                <PolicyEmailLink email={legal.supportEmail} />.
              </p>
            </>
          ),
        },
        {
          id: "refunds",
          title: "Refunds",
          eyebrow: "Refund policy",
          children: (
            <>
              <p>
                Unless required by applicable law or stated at checkout,
                purchases are non-refundable and non-exchangeable. Approved
                refunds are returned to the original payment method where
                possible.
              </p>
              <p>
                To request help with a payment, contact{" "}
                <PolicyEmailLink email={legal.supportEmail} /> with your
                account email and receipt details.
              </p>
            </>
          ),
        },
        {
          id: "privacy",
          title: "Privacy and Data",
          eyebrow: "Information",
          children: (
            <p>
              Our Privacy Policy explains how we may collect, use, share, and
              retain information related to accounts, jobs, documents,
              interviews, applications, payments, analytics, and support.
            </p>
          ),
        },
        {
          id: "availability",
          title: "Availability and Changes",
          eyebrow: "Operations",
          children: (
            <>
              <p>
                We may change, suspend, limit, or discontinue parts of the
                service. We may also remove or retire content, jobs, features,
                plans, credits, or account access where needed for safety,
                security, compliance, quality, or operational reasons.
              </p>
              <p>
                We may update these Terms as the product, legal requirements, or
                operating practices change. The updated date will show when the
                Terms last changed.
              </p>
            </>
          ),
        },
        {
          id: "ownership",
          title: "Content and Intellectual Property",
          eyebrow: "Rights",
          children: (
            <>
              <p>
                {brand.name}, its design, software, workflows, templates,
                reports, and content are owned by {legal.legalName} or its
                licensors. You may not copy, resell, or use the service to build
                a competing product without permission.
              </p>
              <p>
                You retain responsibility for the candidate content you provide,
                such as your CV/resume text, answers, private targets, and
                application notes.
              </p>
            </>
          ),
        },
        {
          id: "liability",
          title: "Disclaimers and Liability",
          eyebrow: "Limits",
          children: (
            <>
              <p>
                The service is provided for preparation and information. We do
                not guarantee job availability, interview invitations, employer
                decisions, application outcomes, income, or career results.
              </p>
              <p>
                To the maximum extent permitted by law, {legal.legalName} will
                not be liable for indirect, incidental, special, consequential,
                or punitive damages, or for lost opportunities, lost profits,
                lost data, or employment outcomes arising from use of the
                service.
              </p>
            </>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          eyebrow: "Support",
          children: (
            <p>
              Questions about these Terms can be sent to{" "}
              <PolicyEmailLink email={legal.supportEmail} />.
            </p>
          ),
        },
      ]}
    />
  );
}
