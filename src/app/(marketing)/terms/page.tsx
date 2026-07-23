import type { Metadata } from "next";
import {
  PolicyEmailLink,
  PolicyShell,
} from "@/components/marketing/PolicyShell";
import { generateSEO } from "@/lib/seo";

export const metadata: Metadata = generateSEO({
  title: "Terms and Conditions",
  description:
    "Terms and conditions for using VisaInterview's AI-powered visa interview practice service.",
  slug: "/terms",
  keywords: [
    "VisaInterview terms",
    "visa interview practice terms",
    "AI visa interview simulator terms",
  ],
  ogImageParams: {
    title: "Terms and Conditions",
    sub: "Clear terms for VisaInterview users.",
    badge: "Terms",
  },
});

export default function TermsPage() {
  return (
    <PolicyShell
      title="Terms and Conditions"
      badge="Terms"
      lastUpdated="June 10, 2026"
      description="These Terms explain how VisaInterview may be used, what users are responsible for, and the limits of our AI-powered visa interview practice service operated by Exelient Technologies."
      sections={[
        {
          id: "acceptance",
          title: "Acceptance of These Terms",
          eyebrow: "Overview",
          children: (
            <>
              <p>
                By accessing or using VisaInterview, you agree to these
                Terms and Conditions. If you do not agree with these Terms, you
                should not use the service.
              </p>
              <p>
                These Terms form an agreement between you and Exelient Technologies,
                the operator of VisaInterview. In these Terms,
                &quot;VisaInterview,&quot; &quot;we,&quot; &quot;us,&quot;
                and &quot;our&quot; refer to Exelient Technologies and the
                VisaInterview service. You may contact us about these Terms
                at
                {" "}
                <PolicyEmailLink email="support@visainterview.ai" />.
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
                VisaInterview provides AI-powered visa interview practice,
                sample questions, simulated officer follow-ups, readiness
                reports, and preparation guidance. The service is designed for
                practice and education only.
              </p>
              <p>
                VisaInterview is not a law firm, immigration advisor,
                embassy, consulate, or government agency. We do not guarantee
                visa approval, appointment availability, application outcomes,
                or acceptance of any document or answer.
              </p>
            </>
          ),
        },
        {
          id: "accounts",
          title: "Accounts and User Responsibilities",
          eyebrow: "Access",
          children: (
            <>
              <p>
                You must be at least 16 years old to use VisaInterview. You
                are responsible for providing accurate account information,
                keeping your login credentials secure, and using the service in
                a lawful and respectful manner.
              </p>
              <p>
                You agree not to misuse the service, interfere with its
                operation, attempt unauthorized access, copy or resell the
                service, submit harmful content, or use generated output to
                misrepresent facts in an application or interview.
              </p>
            </>
          ),
        },
        {
          id: "ai-output",
          title: "AI Practice Output",
          eyebrow: "Important limits",
          children: (
            <>
              <p>
                AI-generated questions, feedback, scores, transcripts, and
                reports may be incomplete, inaccurate, or not suited to your
                exact case. You should review all output carefully and use your
                own judgment before relying on it.
              </p>
              <p>
                You are responsible for the statements, documents, and evidence
                you provide in any real visa process. The service is intended
                to help you practice clear communication, not to create false,
                misleading, or scripted answers.
              </p>
            </>
          ),
        },
        {
          id: "payments",
          title: "Plans and Payments",
          eyebrow: "Billing",
          children: (
            <>
              <p>
                Some features may be offered for free, while others require
                payment. Paid access, pricing, duration, included features, and
                any renewal terms will be shown before purchase.
              </p>
              <p>
                Paid purchases are processed by our payment providers, such as
                Flutterwave or Stripe. They may collect payment details, confirm
                your transaction by email, provide buyer support, and help
                manage refunds or billing where applicable.
              </p>
              <p>
                Billing questions can be sent to{" "}
                <PolicyEmailLink email="support@visainterview.ai" />.
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
                Unless required by applicable law, all transactions are
                non-refundable and non-exchangeable. Approved refunds are
                returned to the original payment method where possible.
              </p>
              <p>
                We may issue discretionary refunds if a request is submitted
                within 14 days of the transaction date. Submitting a request
                within 14 days does not guarantee a refund. Statutory
                refund or withdrawal rights may apply in some countries: 14
                days in the European Union, EEA, Switzerland, United Kingdom,
                Turkey, and Israel; 7 days in South Korea, Brazil, China, and
                Canada; and 5 days in Singapore.
              </p>
              <p>
                To request a refund, contact{" "}
                <PolicyEmailLink email="support@visainterview.ai" /> with your
                account email and receipt details. If a refund is approved, it
                will be processed using the same payment method where possible,
                and access to the relevant paid product will end.
              </p>
            </>
          ),
        },
        {
          id: "privacy",
          title: "Privacy and Data",
          eyebrow: "Information",
          children: (
            <>
              <p>
                Your use of the service may involve submitting personal
                information, interview answers, visa preparation details,
                account details, payment records, analytics events, and support
                messages.
              </p>
              <p>
                Please review the Privacy Policy for more information about how
                data may be collected, used, shared, retained, and protected.
              </p>
            </>
          ),
        },
        {
          id: "availability",
          title: "Availability and Changes",
          eyebrow: "Service changes",
          children: (
            <>
              <p>
                We may update, pause, restrict, or discontinue parts of the
                service at any time. We may also update these Terms as the
                product evolves or legal requirements change.
              </p>
              <p>
                If changes are material, we will aim to provide reasonable
                notice through the website, account area, email, or another
                appropriate channel.
              </p>
            </>
          ),
        },
        {
          id: "liability",
          title: "Disclaimers and Limitation of Liability",
          eyebrow: "Risk",
          children: (
            <>
              <p>
                The service is provided on an &quot;as is&quot; and
                &quot;as available&quot; basis. To the fullest extent permitted
                by law, we disclaim warranties of accuracy, fitness for a
                particular purpose, uninterrupted availability, and error-free
                operation.
              </p>
              <p>
                To the fullest extent permitted by law, Exelient Technologies and
                VisaInterview will not be liable for indirect, incidental,
                special, consequential, or punitive damages, or for visa
                refusals, missed appointments, lost opportunities, or reliance
                on AI output.
              </p>
            </>
          ),
        },
        {
          id: "governing-law",
          title: "Governing Law",
          eyebrow: "Law",
          children: (
            <>
              <p>
                These Terms are governed by the laws of the State of Delaware,
                United States, without regard to conflict of law principles.
              </p>
              <p>
                Unless applicable law provides otherwise, disputes related to
                these Terms or the service will be handled in the state or
                federal courts located in Delaware.
              </p>
            </>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          eyebrow: "Questions",
          children: (
            <p>
              Questions about these Terms can be sent to{" "}
              <PolicyEmailLink email="support@visainterview.ai" /> or mailed
              to Exelient Technologies, operator of VisaInterview, Kentucky
              Avenue, Suite #107, Oklahoma City, OK 73119.
            </p>
          ),
        },
      ]}
    />
  );
}
