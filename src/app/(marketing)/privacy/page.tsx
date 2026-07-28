import type { Metadata } from "next";
import {
  PolicyEmailLink,
  PolicyShell,
} from "@/components/marketing/PolicyShell";
import { publicProductConfig } from "@/config/public";
import { generateSEO } from "@/lib/seo";

const { brand, legal } = publicProductConfig;

export const metadata: Metadata = generateSEO({
  title: "Privacy Policy",
  description:
    "Privacy policy for Jobready account data, sourced jobs, CV/resume tailoring, interview practice, application tracking, payments, analytics, and support.",
  slug: "/privacy",
  keywords: [
    "Jobready privacy",
    "job application privacy Kenya",
    "CV tailoring privacy",
    "job interview practice privacy",
  ],
  ogImageParams: {
    title: "Privacy Policy",
    sub: "How Jobready handles candidate workspace, preparation, and billing data.",
    badge: "Privacy",
  },
});

export default function PrivacyPage() {
  return (
    <PolicyShell
      title="Privacy Policy"
      badge="Privacy"
      lastUpdated="July 28, 2026"
      description={`This policy explains the information ${legal.legalName} may collect and use when operating the ${brand.name} jobs, CV/resume tailoring, interview practice, and application tracking service.`}
      sections={[
        {
          id: "scope",
          title: "Scope of This Policy",
          eyebrow: "Overview",
          children: (
            <>
              <p>
                This Privacy Policy describes how {legal.legalName}, the
                operator of {brand.name}, may collect, use, disclose, retain,
                and protect information when you visit the website, create an
                account, browse jobs, tailor documents, practise interviews,
                track applications, purchase preparation credits, or contact
                support.
              </p>
              <p>
                You can contact us for privacy questions at{" "}
                <PolicyEmailLink email={legal.supportEmail} />.
              </p>
            </>
          ),
        },
        {
          id: "information",
          title: "Information We May Collect",
          eyebrow: "Data categories",
          children: (
            <>
              <p>
                We may collect account information such as your name, email
                address, sign-in credentials, authentication activity, account
                preferences, and support messages.
              </p>
              <p>
                We may collect candidate workspace information you choose to
                provide, including saved jobs, application tracking notes, CV or
                resume text, parsed document facts, private role targets,
                interview setup choices, interview answers, transcripts,
                readiness reports, export records, and feedback history.
              </p>
              <p>
                We may collect payment records, plan status, referral records,
                device and browser details, IP address, approximate location,
                cookies, analytics events, usage logs, and security events.
              </p>
            </>
          ),
        },
        {
          id: "jobs",
          title: "Public Jobs and Private Candidate Data",
          eyebrow: "Separation",
          children: (
            <>
              <p>
                Public job records are kept separate from private candidate
                workspace data. Opening an official application destination,
                saving a job, or tracking an application does not mean Jobready
                applied on your behalf.
              </p>
              <p>
                Public job pages may show employer names, source details,
                review dates, deadlines, and official application links. Your
                private notes, documents, answers, reports, and application
                tracking records are not displayed on public job pages.
              </p>
            </>
          ),
        },
        {
          id: "ai",
          title: "AI and Preparation Processing",
          eyebrow: "Candidate content",
          children: (
            <>
              <p>
                CV/resume text, target-role details, interview answers, and
                related context may be processed by AI systems to generate
                tailored suggestions, practice questions, feedback, summaries,
                reports, and exports.
              </p>
              <p>
                Treat generated output as assistance, not a final submission.
                Review every suggestion before using it and avoid providing
                information that is not needed for the preparation task.
              </p>
            </>
          ),
        },
        {
          id: "use",
          title: "How We May Use Information",
          eyebrow: "Purpose",
          children: (
            <>
              <p>
                We may use information to create and manage accounts, deliver
                job discovery, tailor documents, run interview practice,
                generate reports, maintain saved jobs and trackers, process
                purchases, provide support, secure the service, prevent abuse,
                debug errors, improve product quality, and communicate service
                updates.
              </p>
              <p>
                We may use aggregated or de-identified information to understand
                usage trends, evaluate product performance, and improve the
                candidate experience.
              </p>
            </>
          ),
        },
        {
          id: "sharing",
          title: "How Information May Be Shared",
          eyebrow: "Third parties",
          children: (
            <>
              <p>
                We may share information with service providers that help run
                the product, such as hosting providers, database services,
                authentication tools, payment processors, analytics providers,
                email providers, support tools, storage providers, and AI
                infrastructure providers.
              </p>
              <p>
                We may disclose information if required by law, to protect
                rights and safety, to investigate misuse, or in connection with
                a merger, acquisition, financing, or sale of assets.
              </p>
              <p>
                We do not sell candidate preparation content to data brokers.
                We do not share your private CV/resume, interview answers, or
                application tracker with employers unless a future product
                feature asks for your explicit consent.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies and Analytics",
          eyebrow: "Site activity",
          children: (
            <>
              <p>
                We may use cookies, local storage, pixels, analytics tools, and
                similar technologies to keep users signed in, remember
                preferences, measure traffic, understand feature usage, detect
                errors, attribute referrals, and improve performance.
              </p>
              <p>
                You can usually adjust cookie preferences through your browser
                settings. Some features may not work correctly if essential
                cookies or storage are disabled.
              </p>
            </>
          ),
        },
        {
          id: "retention",
          title: "Data Retention",
          eyebrow: "Storage",
          children: (
            <>
              <p>
                We retain information for as long as needed to provide the
                service, keep records, meet legal or accounting obligations,
                resolve disputes, enforce agreements, secure the product, and
                maintain auditability for credits, purchases, reports, and
                application tracking actions.
              </p>
              <p>
                Candidate documents and derived exports should be deleted when
                no longer needed or when deletion is requested and no retention
                exception applies.
              </p>
            </>
          ),
        },
        {
          id: "choices",
          title: "Your Choices",
          eyebrow: "Control",
          children: (
            <>
              <p>
                You may access, update, export, or delete certain information
                through the product where supported. You may also contact us to
                ask about account access, correction, deletion, or privacy
                concerns.
              </p>
              <p>
                Some records may need to be retained for security, audit,
                payment, dispute, fraud-prevention, or legal reasons.
              </p>
            </>
          ),
        },
        {
          id: "children",
          title: "Children",
          eyebrow: "Eligibility",
          children: (
            <p>
              {brand.name} is not intended for children under 16. If we learn
              that a child under 16 has provided personal information without
              appropriate consent, we may delete it.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes to This Policy",
          eyebrow: "Updates",
          children: (
            <p>
              We may update this Privacy Policy as the product, legal
              requirements, or operating practices change. The updated date will
              show when the policy last changed.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          eyebrow: "Support",
          children: (
            <p>
              Privacy questions can be sent to{" "}
              <PolicyEmailLink email={legal.supportEmail} />.
            </p>
          ),
        },
      ]}
    />
  );
}
