import type { ReactNode } from "react";
import Link from "next/link";

const evaluationPoints = [
  {
    title: "Study purpose",
    copy:
      "The officer is listening for a specific academic reason for studying in the United States, not a generic preference for America. Your answer should connect the school, program, and next career step.",
  },
  {
    title: "Funding",
    copy:
      "Your funding story should match your I-20, bank evidence, sponsor income, scholarships, and realistic living costs. The officer may test whether the money is legitimate and available.",
  },
  {
    title: "Academic preparation",
    copy:
      "Your prior grades, work, test scores, and course choice should make the new program feel like a logical next step. If there is a gap or course change, explain it directly.",
  },
  {
    title: "Intent to depart",
    copy:
      "F1 is a temporary student visa. The officer is assessing whether your long-term plan, family context, career path, and opportunities outside the United States support a credible return plan.",
  },
];

const questionGroups = [
  {
    title: "University and program fit",
    questions: [
      "Why did you choose this university?",
      "Which course, faculty member, lab, clinic, studio, or concentration matters most to your plan?",
      "Which other schools admitted you, and why did you choose this one?",
      "Why is this US program better for your goal than a similar program at home?",
    ],
  },
  {
    title: "Funding and sponsor credibility",
    questions: [
      "Who is paying for your first year of tuition and living expenses?",
      "What does your sponsor do, and how much can they realistically contribute?",
      "Can you explain the recent deposits in your bank statement?",
      "If your sponsor has an emergency, what backup funding do you have?",
    ],
  },
  {
    title: "Academic preparation",
    questions: [
      "How does this program connect to your previous education or work?",
      "Why do your grades or test scores show that you can handle this course?",
      "How do you explain your study gap or change of field?",
      "What will you study in the first semester?",
    ],
  },
  {
    title: "Home ties and return plan",
    questions: [
      "What will you do after graduation?",
      "What career opportunities exist for this degree in your home country?",
      "What family, professional, business, or property ties pull you back home?",
      "Do you have relatives in the United States, and how does that affect your plan?",
    ],
  },
];

const answerFrameworks = [
  {
    question: "Why did you choose this university?",
    framework:
      "Start with the academic reason, name one or two concrete program details, then connect those details to a career plan outside the United States.",
    redFlags:
      "Ranking-only answers, location-only answers, agent-driven choices, and answers that could describe any university.",
  },
  {
    question: "Who is sponsoring your studies?",
    framework:
      "Name the sponsor, relationship, occupation or business, first-year cost, available funds, and how the documents support those facts.",
    redFlags:
      "Unexplained large deposits, sponsors whose income does not match the claimed support, vague promises, or saying you will work to pay core costs.",
  },
  {
    question: "What will you do after graduation?",
    framework:
      "Give a direct post-study role or sector, explain why the US degree helps, and name the home-market demand or employer type you are targeting.",
    redFlags:
      "Making permanent US work sound like the main goal, saying you will decide later, or giving a plan unrelated to the degree.",
  },
];

const checklistItems = [
  "Passport valid for travel",
  "DS-160 confirmation page",
  "Visa appointment confirmation",
  "Application fee payment receipt, if payment is required before the interview",
  "One printed visa photo if the DS-160 photo upload failed",
  "Form I-20 from the SEVP-certified school",
  "I-901 SEVIS fee payment confirmation",
  "Admission letter and scholarship letter, if any",
  "Academic transcripts, certificates, and test scores",
  "Bank statements and sponsor financial evidence",
  "Sponsor employment, business, tax, or income documents",
  "Evidence of home ties, such as employment plans, business ties, family obligations, or property documents",
  "Any additional documents required by your specific US embassy or consulate",
];

const difficultCases = [
  {
    title: "Previous refusal",
    copy:
      "Do not argue with the old decision. Identify what changed: stronger funding, clearer program fit, better home-tie evidence, or a more credible explanation of your plan.",
  },
  {
    title: "Study gap",
    copy:
      "Give dates and facts. Work, exams, family responsibilities, finances, or applications can be valid context when you connect the gap to your current academic plan.",
  },
  {
    title: "US relatives",
    copy:
      "Disclose them honestly. Then separate their life from your plan by explaining where you will study, who funds you, and why your long-term path is outside the United States.",
  },
  {
    title: "Loans",
    copy:
      "Know the lender, amount, repayment terms, collateral if any, and how the loan plus other funds covers the first year without unauthorized work.",
  },
  {
    title: "OPT",
    copy:
      "OPT can be a lawful training option, but it should not sound like your reason for applying. Keep the main answer anchored in study first and a credible post-study plan after.",
  },
];

const mockInterview = [
  {
    officer: "Why are you going to the United States?",
    applicant:
      "I am going for a Master of Science in Data Analytics at North Valley University. The program has applied machine learning and health data courses that match my statistics background and my plan to work in healthcare analytics after graduation.",
    followUps: [
      "Why this university instead of another school?",
      "Which course is most relevant to your career plan?",
    ],
  },
  {
    officer: "Who is paying for your studies?",
    applicant:
      "My father and I are funding the first year. My I-20 lists the estimated cost, and our bank statements and my father's business records show funds above that amount. I also received a partial merit scholarship from the university.",
    followUps: [
      "What does your father do?",
      "Can you explain the largest recent deposit?",
    ],
  },
  {
    officer: "What will you do after the degree?",
    applicant:
      "I plan to return to Nairobi and work in healthcare data operations. Several private hospital groups and insurers are building analytics teams, and the US degree gives me the technical training I need for those roles.",
    followUps: [
      "Do you plan to apply for OPT?",
      "Why should I believe you will return?",
    ],
  },
];

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-16">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#00624c]">
        {eyebrow}
      </p>
      <h2 className="mt-3 max-w-4xl text-4xl font-bold tracking-[-0.045em] text-[#071512]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function F1GuideContent({ practiceHref }: { practiceHref: string }) {
  return (
    <div className="mt-16 border-t border-[#d9d1c6] pt-14">
      <section className="rounded-2xl bg-[#063c31] p-6 text-white md:p-8">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#f4d28f]">
              F1 visa interview practice online
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">
              Use the F1 visa interview simulator before appointment day
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-white/74">
              Start a free F1 visa interview, answer adaptive officer
              follow-ups, and turn this guide into US student visa interview
              practice. New accounts get one free F1 visa mock interview; if
              it has already been used, the practice page will say so before
              you start another session.
            </p>
            <p className="mt-3 max-w-3xl text-base leading-7 text-white/74">
              The same flow is our free US visa interview practice for F1
              applicants, with an AI F1 visa interview focused on your school,
              funding, academics, and return plan.
            </p>
          </div>
          <Link
            href={practiceHref}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#ff4f36] px-6 text-sm font-bold text-white transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#ef3d25] active:scale-press"
          >
            Start free F1 visa interview practice
          </Link>
        </div>
      </section>

      <Section
        eyebrow="Officer focus"
        title="What the F1 visa officer evaluates"
      >
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {evaluationPoints.map((point) => (
            <article
              key={point.title}
              className="rounded-2xl border border-[#e1d8cc] bg-white p-5 shadow-[0_18px_48px_rgba(29,43,37,0.04)]"
            >
              <h3 className="text-xl font-bold tracking-[-0.03em] text-[#071512]">
                {point.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-[#52605b]">
                {point.copy}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Practice prompts"
        title="F1 visa interview questions by topic"
      >
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {questionGroups.map((group) => (
            <article key={group.title} className="rounded-2xl bg-white p-6">
              <h3 className="text-xl font-bold tracking-[-0.03em] text-[#071512]">
                {group.title}
              </h3>
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-base leading-7 text-[#52605b]">
                {group.questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-base leading-7 text-[#52605b]">
          Need a longer question bank before your mock session? Read{" "}
          <Link
            href="/blog/f1-visa-interview-questions-2026"
            className="font-bold text-[#00533f] underline decoration-[#d7a84f] underline-offset-4"
          >
            F1 visa interview questions for 2026
          </Link>
          .
        </p>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[#52605b]">
          Comparing student and visitor paths? Use the{" "}
          <Link
            href="/us-visa-interview"
            className="font-bold text-[#00533f] underline decoration-[#d7a84f] underline-offset-4"
          >
            US visa interview questions hub
          </Link>{" "}
          to choose the right US interview guide.
        </p>
      </Section>

      <Section
        eyebrow="Answer strategy"
        title="Strong answer frameworks and red flags"
      >
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#4b596b]">
          Do not memorize scripts. Prepare facts, then answer directly in your
          own words so you can handle follow-up questions without sounding
          rehearsed.
        </p>
        <div className="mt-8 grid gap-5">
          {answerFrameworks.map((item) => (
            <article
              key={item.question}
              className="grid gap-4 rounded-2xl border border-[#e1d8cc] bg-white p-6 md:grid-cols-[0.9fr_1.1fr_1.1fr]"
            >
              <h3 className="text-xl font-bold tracking-[-0.03em] text-[#071512]">
                {item.question}
              </h3>
              <p className="text-base leading-7 text-[#52605b]">
                <span className="font-bold text-[#071512]">Framework: </span>
                {item.framework}
              </p>
              <p className="text-base leading-7 text-[#8b3d31]">
                <span className="font-bold text-[#071512]">Red flags: </span>
                {item.redFlags}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Documents" title="F1 interview document checklist">
        <div className="mt-8 rounded-2xl bg-white p-6">
          <p className="mb-5 max-w-3xl text-base leading-7 text-[#52605b]">
            Requirements can vary by location. Check the instructions from the
            US embassy or consulate where you will apply before your appointment.
          </p>
          <ul className="grid gap-3 text-base leading-7 text-[#52605b] md:grid-cols-2">
            {checklistItems.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  className="mt-2 h-2 w-2 flex-none rounded-full bg-[#00624c]"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section eyebrow="Difficult cases" title="How to handle riskier F1 facts">
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {difficultCases.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[#e1d8cc] bg-white p-5"
            >
              <h3 className="text-xl font-bold tracking-[-0.03em] text-[#071512]">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-[#52605b]">
                {item.copy}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Mock interview" title="A realistic F1 practice exchange">
        <div className="mt-8 grid gap-5">
          {mockInterview.map((turn, index) => (
            <article key={turn.officer} className="rounded-2xl bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#00624c]">
                Turn {index + 1}
              </p>
              <p className="mt-4 text-lg font-bold leading-7 text-[#071512]">
                Officer: {turn.officer}
              </p>
              <p className="mt-3 text-base leading-7 text-[#52605b]">
                Applicant: {turn.applicant}
              </p>
              <div className="mt-4 rounded-xl bg-[#f7efe4] p-4">
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#87541a]">
                  Likely follow-ups
                </p>
                <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-[#52605b]">
                  {turn.followUps.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Disclaimer" title="Practice is preparation, not a guarantee">
        <p className="mt-8 rounded-2xl border border-[#e1d8cc] bg-white p-5 text-base font-semibold leading-7 text-[#52605b]">
          Disclaimer: F1 visa interview practice can help you prepare clearer,
          more consistent answers, but it cannot guarantee approval. A consular
          officer decides each application under US law and your individual
          facts.
        </p>
      </Section>
    </div>
  );
}
