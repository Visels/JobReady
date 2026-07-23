import type { Metadata } from "next";
import {
  PolicyEmailLink,
  PolicyShell,
} from "@/components/marketing/PolicyShell";
import { generateSEO } from "@/lib/seo";

export const metadata: Metadata = generateSEO({
  title: "Privacy Policy",
  description:
    "Privacy policy for VisaInterview covering account data, interview practice content, payments, analytics, and user choices.",
  slug: "/privacy",
  keywords: [
    "VisaInterview privacy",
    "visa interview practice privacy policy",
    "AI visa interview simulator privacy",
  ],
  ogImageParams: {
    title: "Privacy Policy",
    sub: "How VisaInterview handles account, practice, and billing data.",
    badge: "Privacy",
  },
});

export default function PrivacyPage() {
  return (
    <PolicyShell
      title="Privacy Policy"
      badge="Privacy"
      lastUpdated="June 10, 2026"
      description="This policy explains the data Exelient Technologies may collect and how it may be used, shared, retained, and protected when you use the VisaInterview service."
      sections={[
        {
          id: "scope",
          title: "Scope of This Policy",
          eyebrow: "Overview",
          children: (
            <>
              <p>
                This Privacy Policy describes how Exelient Technologies, the
                operator of VisaInterview, may collect, use, disclose,
                retain, and protect information when you visit the website,
                create an account, practice interviews, purchase a plan, or
                contact support.
              </p>
              <p>
                Exelient Technologies can be contacted for privacy questions at
                {" "}
                <PolicyEmailLink email="support@visainterview.ai" /> or by
                mail at Kentucky Avenue, Suite #107, Oklahoma City, OK 73119.
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
                address, password or sign-in credentials, authentication
                activity, and account preferences.
              </p>
              <p>
                We may collect visa preparation information you choose to
                provide, including destination, visa type, interview date,
                background details, funding details, school or work plans,
                travel history, prior refusal context, uploaded or typed
                practice material, interview answers, transcripts, audio
                interactions, readiness reports, and AI feedback.
              </p>
              <p>
                We may also collect payment records, plan status, support
                messages, device and browser details, IP address, approximate
                location, cookies, analytics events, and usage logs.
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
                practice sessions, personalize questions, generate feedback,
                maintain readiness reports, process purchases, provide support,
                secure the service, prevent abuse, debug errors, improve
                product quality, and communicate important updates.
              </p>
              <p>
                We may use aggregated or de-identified information to understand
                usage trends, evaluate product performance, and improve the
                training experience.
              </p>
            </>
          ),
        },
        {
          id: "ai",
          title: "AI Processing",
          eyebrow: "Interview practice",
          children: (
            <>
              <p>
                Interview answers, profile details, and practice context may be
                processed by AI systems to generate simulated questions,
                follow-ups, coaching notes, scores, summaries, and reports.
              </p>
              <p>
                Avoid submitting information that is unnecessary for practice.
                Do not include sensitive documents, identification numbers, or
                financial records unless the final product explicitly supports
                and protects that type of submission.
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
                authentication tools, payment processors such as Flutterwave or
                Stripe, analytics providers, email providers, support tools, and
                AI infrastructure providers.
              </p>
              <p>
                When you make a purchase, the selected payment provider may
                process personal data according to its own privacy terms.
              </p>
              <p>
                We may also disclose information if required by law, to protect
                rights and safety, to investigate misuse, or in connection with
                a merger, acquisition, financing, or sale of assets.
              </p>
              <p>
                We do not sell personal information in the ordinary sense.
                We do not provide your interview practice content to data
                brokers.
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
                errors, and improve performance.
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
                service, maintain records, resolve disputes, meet legal
                obligations, prevent abuse, and improve product quality.
              </p>
              <p>
                Account, interview, and session information is kept until you
                delete your account, unless we need to retain certain records
                for legal, security, fraud-prevention, tax, accounting, or
                dispute-resolution purposes.
              </p>
            </>
          ),
        },
        {
          id: "security",
          title: "Security",
          eyebrow: "Protection",
          children: (
            <>
              <p>
                We use reasonable administrative, technical, and organizational
                safeguards designed to protect information against unauthorized
                access, loss, misuse, alteration, or disclosure.
              </p>
              <p>
                No online service can guarantee perfect security. You are
                responsible for keeping your account credentials confidential
                and notifying us if you believe your account has been
                compromised.
              </p>
            </>
          ),
        },
        {
          id: "choices",
          title: "Your Choices and Requests",
          eyebrow: "Control",
          children: (
            <>
              <p>
                Depending on where you live, you may have rights to access,
                correct, delete, export, restrict, or object to certain
                processing of your personal information.
              </p>
              <p>
                To make a request, contact us at{" "}
                <PolicyEmailLink email="support@visainterview.ai" />. We may
                need to verify your identity before responding.
              </p>
            </>
          ),
        },
        {
          id: "children",
          title: "Children's Privacy",
          eyebrow: "Age limits",
          children: (
            <p>
              VisaInterview is not intended for children under 16. If we
              learn that we collected personal information from a child under
              16 without appropriate consent, we will take reasonable steps to
              delete it.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes to This Policy",
          eyebrow: "Updates",
          children: (
            <p>
              We may update this Privacy Policy as the service changes. When we
              make material changes, we will aim to provide reasonable notice
              through the website, account area, email, or another appropriate
              channel.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          eyebrow: "Questions",
          children: (
            <p>
              Privacy questions and requests can be sent to{" "}
              <PolicyEmailLink email="support@visainterview.ai" /> or mailed
              to Exelient Technologies, operator of VisaInterview, Kentucky
              Avenue, Suite #107, Oklahoma City, OK 73119. General support
              questions can also be sent to{" "}
              <PolicyEmailLink email="help@visainterview.ai" />.
            </p>
          ),
        },
      ]}
    />
  );
}
