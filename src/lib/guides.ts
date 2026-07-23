export type GuideFAQ = {
  question: string;
  answer: string;
};

export type GuideSource = {
  label: string;
  href: string;
};

export type GuideEntry = {
  name: string;
  title: string;
  h1?: string;
  description: string;
  keywords: string[];
  badge: string;
  flag: string;
  visaType: string;
  intro: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  sources: GuideSource[];
  faqs: GuideFAQ[];
};

export const GUIDES = {
  "us-f1-student-visa": {
    name: "US F1 Student Visa",
    title: "F1 Visa Interview Practice: Free US Student Visa Mock Interview",
    h1: "Free F1 Visa Interview Practice for US Student Visa Applicants",
    description:
      "Practice F1 visa interview questions with answer frameworks, AI follow-ups, and one free US student visa mock interview session when available.",
    keywords: [
      "F1 visa interview practice",
      "free F1 visa mock interview",
      "US student visa interview practice",
      "AI F1 visa interview",
      "F1 visa interview preparation",
    ],
    badge: "Highest rejection risk",
    flag: "🇺🇸",
    visaType: "US F1 Student",
    author: "VisaInterview editorial team",
    publishedAt: "2026-05-11",
    updatedAt: "2026-07-17",
    sources: [
      {
        label: "State Department student visa guidance",
        href: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html",
      },
      {
        label: "State Department visa denials and 214(b)",
        href: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/visa-denials.html",
      },
      {
        label: "USCIS Optional Practical Training for F-1 students",
        href: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students",
      },
      {
        label: "ICE SEVP student steps",
        href: "https://www.ice.gov/sevis/students",
      },
    ],
    intro:
      "The US F1 visa interview is short, but every answer has to prove that you are a genuine student with enough funding and a credible reason to return after your studies. Most F1 interviews move quickly through your university choice, program details, sponsor, academic background, home ties, and post-study plan. The officer is not looking for a memorized speech. They are testing whether your story is consistent with your I-20, SEVIS record, bank documents, transcripts, and future plans. A strong answer names the specific program, explains why it fits your academic path, gives clear funding numbers, and connects the degree to opportunities outside the United States. Weak answers often sound vague, over-rehearsed, or focused mainly on living in America. Use this guide to practice the patterns behind real US F1 visa interview questions before you sit across from the consular officer.",
    faqs: [
      {
        question: "How many questions are asked in a US F1 visa interview?",
        answer:
          "Most US F1 visa interviews include 5 to 10 questions and last only a few minutes. Officers usually focus on school choice, program knowledge, funding, academic history, home ties, and what you plan to do after graduation.",
      },
      {
        question: "What documents should I bring to an F1 visa interview?",
        answer:
          "Bring your passport, DS-160 confirmation, appointment confirmation, I-20, SEVIS payment receipt, admission letter, academic records, test scores if relevant, financial documents, sponsor evidence, and any documents proving home ties.",
      },
      {
        question: "What is the officer really assessing in an F1 interview?",
        answer:
          "The officer is assessing whether you are a genuine student, whether your funding is credible, whether your academic plan makes sense, and whether you are likely to leave the United States after your authorized stay.",
      },
      {
        question: "What should I do if my F1 visa is rejected?",
        answer:
          "Read the refusal notice carefully, identify the weak part of your case, and reapply only when you can present stronger evidence or clearer answers. Repeating the same answers without fixing the concern usually leads to another refusal.",
      },
      {
        question: "What are common F1 visa interview mistakes?",
        answer:
          "Common mistakes include giving long memorized answers, not knowing program details, giving unclear sponsor information, sounding unsure about returning home, and contradicting your DS-160 or I-20.",
      },
      {
        question: "How should I answer why I chose this university?",
        answer:
          "Name one or two specific academic reasons, such as faculty, curriculum, research area, internship structure, accreditation, or facilities, then connect those details to your career plan after the degree.",
      },
    ],
  },
  "us-b1-b2-tourist-visa": {
    name: "US B1/B2 Tourist Visa",
    title: "US B1/B2 Visa Interview Questions for Tourist and Visitor Applicants",
    description:
      "Prepare for US B1/B2 visa interview questions with tourist visa documents, home ties, trip purpose, and free MCQ practice.",
    keywords: [
      "US B1/B2 visa interview",
      "B1 B2 visa interview questions",
      "US tourist visa interview questions",
      "visitor visa interview practice",
      "US visa interview preparation",
    ],
    badge: "Overstay scrutiny",
    flag: "🇺🇸",
    visaType: "US B1/B2 Tourist",
    author: "VisaInterview editorial team",
    publishedAt: "2026-05-11",
    updatedAt: "2026-07-17",
    sources: [
      {
        label: "State Department visitor visa guidance",
        href: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html",
      },
      {
        label: "State Department DS-160 application guidance",
        href: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/forms/ds-160-online-nonimmigrant-visa-application.html",
      },
      {
        label: "State Department visa denials and 214(b)",
        href: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/visa-denials.html",
      },
    ],
    intro:
      "The US B1/B2 visa interview is mainly about temporary intent. The consular officer wants to know why you are traveling, how long you will stay, who is paying, where you will go, and what brings you back home. Tourist and business visitor applicants often lose credibility when their itinerary is too loose, their funding does not match the trip, or their answers make the visit sound open-ended. A strong B1/B2 answer is short and evidence-backed: exact dates, clear purpose, realistic budget, stable work or family commitments, and a return plan that makes sense. If you have relatives in the United States, prior refusals, long travel plans, or limited travel history, expect follow-up questions. This guide helps you prepare for US B1/B2 visa interview questions with the same clarity officers expect at the window.",
    faqs: [
      {
        question: "How many questions are asked in a US B1/B2 visa interview?",
        answer:
          "A typical B1/B2 interview includes 4 to 8 questions. Officers usually ask about your travel purpose, itinerary, length of stay, funding, employment, family in the United States, and reasons you will return home.",
      },
      {
        question: "What documents should I bring for a B1/B2 visa interview?",
        answer:
          "Bring your passport, DS-160 confirmation, appointment confirmation, itinerary, employment or business evidence, bank statements, invitation letter if applicable, accommodation details, and proof of ties such as work, family, property, or school obligations.",
      },
      {
        question: "What is the officer really assessing for a tourist visa?",
        answer:
          "The officer is assessing whether your visit is temporary, whether your budget fits your trip, whether your story is credible, and whether you have strong reasons to leave the United States on time.",
      },
      {
        question: "What should I do if my B1/B2 visa is rejected?",
        answer:
          "Identify whether the weak point was purpose of travel, funding, home ties, prior travel, or inconsistent answers. Reapply only when you can show a stronger, clearer case than the one refused.",
      },
      {
        question: "What are common B1/B2 interview mistakes?",
        answer:
          "Common mistakes include saying you will stay as long as possible, giving vague plans, relying on undocumented sponsors, hiding US relatives, or failing to explain what requires you to return home.",
      },
      {
        question: "How specific should my US travel itinerary be?",
        answer:
          "You should know your approximate dates, cities, accommodation, main activities, and trip budget. You do not need every hour planned, but the visit should sound realistic and time-limited.",
      },
    ],
  },
  "uk-student-visa": {
    name: "UK Student Visa",
    title: "UK Student Visa Interview Questions: Genuine Student Preparation Guide",
    description:
      "Practice UK student visa interview questions covering CAS, course choice, funds, English, genuine student intent, and refusals.",
    keywords: [
      "UK student visa interview",
      "UK student visa interview questions",
      "genuine student interview UK",
      "CAS interview questions",
      "UK visa interview practice",
    ],
    badge: "Genuine student test",
    flag: "🇬🇧",
    visaType: "UK Student Visa",
    author: "VisaInterview editorial team",
    publishedAt: "2026-05-11",
    updatedAt: "2026-07-17",
    sources: [
      {
        label: "GOV.UK Student route caseworker guidance",
        href: "https://www.gov.uk/government/publications/points-based-system-student-route",
      },
      {
        label: "GOV.UK student credibility interview guidance",
        href: "https://www.gov.uk/government/news/students-are-now-being-interviewed-at-the-visa-application-centres",
      },
      {
        label: "GOV.UK genuine student rule guidance",
        href: "https://www.gov.uk/government/publications/tier-4-interviews-and-genuine-student-rule-gsr-sty02/tier-4-interviews-and-genuine-student-rule-gsr-sty02",
      },
    ],
    intro:
      "The UK student visa interview focuses on whether you are a genuine student and whether your application matches the Student route requirements. You may be asked about your CAS, course level, university, tuition fees, living costs, academic background, English ability, and plans after study. The officer wants to see that you understand what you are studying and that your funds are legitimate, available, and consistent with the documents submitted. Unlike a casual school interview, this is an immigration credibility check. Weak answers usually come from not knowing the course modules, confusing the sponsor details, or making the UK sound like a backdoor to work rather than a study destination. This guide helps you practice UK student visa interview questions in a way that keeps your answers direct, specific, and aligned with your CAS and financial evidence.",
    faqs: [
      {
        question: "How many questions are asked in a UK student visa interview?",
        answer:
          "Most UK student visa credibility interviews include 8 to 15 questions. They usually cover your CAS, university, course details, finances, accommodation, English ability, study history, and post-study plans.",
      },
      {
        question: "What documents should I bring to a UK student visa interview?",
        answer:
          "Prepare your passport, CAS details, offer letter, financial evidence, academic certificates, English test evidence if applicable, accommodation details, TB certificate if required, and sponsor documents if someone else is funding you.",
      },
      {
        question: "What is the officer really assessing in a UK student interview?",
        answer:
          "The officer is assessing genuine student intent, knowledge of your course and institution, financial maintenance, English communication, and whether your answers match your application documents.",
      },
      {
        question: "What should I do if my UK student visa is refused?",
        answer:
          "Read the refusal reasons carefully and address each point with stronger evidence or clearer explanation. If the refusal involves credibility, practice concise answers before submitting a new application or review request.",
      },
      {
        question: "What mistakes lead to UK student visa refusals?",
        answer:
          "Common mistakes include not knowing CAS details, giving weak reasons for choosing the course, unclear funding sources, poor knowledge of living costs, and answers that make work sound more important than study.",
      },
      {
        question: "How should I explain why I chose my UK university?",
        answer:
          "Mention specific course modules, teaching approach, accreditation, facilities, placement links, or academic reputation, then connect those details to your prior education and career goals.",
      },
    ],
  },
  "canada-express-entry": {
    name: "Canada Express Entry",
    title: "Canada Visa Interview Tips for Express Entry and PR Applicants",
    description:
      "Use Canada visa interview tips for Express Entry questions on work history, funds, settlement plans, documents, and refusals.",
    keywords: [
      "Canada visa interview tips",
      "Canada Express Entry interview questions",
      "Canada PR interview preparation",
      "IRCC interview questions",
      "Canada immigration interview tips",
    ],
    badge: "Document consistency",
    flag: "🇨🇦",
    visaType: "Canada Express Entry",
    author: "VisaInterview editorial team",
    publishedAt: "2026-05-11",
    updatedAt: "2026-07-17",
    sources: [
      {
        label: "Canada.ca Express Entry eligibility tool",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/come-canada-tool-immigration-express-entry.html",
      },
      {
        label: "Canada.ca Express Entry after you apply",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/after-apply.html",
      },
      {
        label: "Canada.ca Express Entry rounds of invitations",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds.html",
      },
    ],
    intro:
      "Canada Express Entry applicants are not always interviewed, but when IRCC asks for an interview or follow-up, the focus is usually document consistency and admissibility. Officers may ask about your work history, duties, proof of funds, education credentials, family composition, settlement plan, travel history, or discrepancies in your profile. The goal is not to trap you with obscure questions. It is to confirm that the points you claimed are real, that your employment letters match your actual duties, and that you can settle in Canada with lawful funds and a credible plan. Strong answers use the same dates, job titles, NOC-aligned duties, and financial details shown in your application. This guide gives Canada visa interview tips for applicants who want to answer clearly without over-explaining or creating new inconsistencies.",
    faqs: [
      {
        question: "How many questions are asked in a Canada Express Entry interview?",
        answer:
          "If an interview is requested, the number varies, but many applicants face 6 to 12 focused questions about work history, funds, education, settlement plans, family details, or document inconsistencies.",
      },
      {
        question: "What documents should I prepare for a Canada PR interview?",
        answer:
          "Prepare your passport, employment reference letters, pay evidence, education credential assessment, proof of funds, language results, police certificates, medical confirmation if available, and any documents IRCC specifically requested.",
      },
      {
        question: "What is the officer really assessing for Express Entry?",
        answer:
          "The officer is assessing whether your claimed work experience, education, funds, identity, family composition, and admissibility information are accurate and supported by reliable documents.",
      },
      {
        question: "What should I do if my Canada PR application is refused?",
        answer:
          "Review the refusal reason and your application record. Depending on the issue, you may need to correct documentation, address misrepresentation concerns, submit a new profile, or seek qualified immigration advice.",
      },
      {
        question: "What are common Canada immigration interview mistakes?",
        answer:
          "Common mistakes include guessing dates, describing job duties that do not match reference letters, giving unclear proof-of-funds explanations, minimizing family details, or adding new facts not supported in the application.",
      },
      {
        question: "How should I explain my settlement plan in Canada?",
        answer:
          "Name the province or city you are targeting, explain why it fits your occupation and family needs, mention job-market research, and show that your proof of funds can support the first months of settlement.",
      },
    ],
  },
  "schengen-tourist-visa": {
    name: "Schengen Tourist Visa",
    title: "Schengen Visa Interview Questions for Tourist Visa Applicants",
    description:
      "Practice Schengen visa interview questions on itinerary, entry country, funds, insurance, host details, and return proof.",
    keywords: [
      "Schengen visa interview questions",
      "Schengen tourist visa interview",
      "Europe tourist visa questions",
      "Schengen visa preparation",
      "Schengen visa interview practice",
    ],
    badge: "Itinerary precision",
    flag: "🇪🇺",
    visaType: "Schengen Tourist",
    author: "VisaInterview editorial team",
    publishedAt: "2026-05-11",
    updatedAt: "2026-07-17",
    sources: [
      {
        label: "European Commission applying for a Schengen visa",
        href: "https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en",
      },
      {
        label: "European Commission Schengen visa policy",
        href: "https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en",
      },
      {
        label: "European Commission Schengen visa legal documents",
        href: "https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/legal-documents-related-schengen-visas_en",
      },
    ],
    intro:
      "A Schengen tourist visa interview is built around itinerary credibility. Officers want to know why you are visiting, which country is your main destination, where you will stay, how you will pay, whether your insurance is valid, and why you will return before the visa expires. Because one Schengen visa can allow travel across multiple member states, inconsistent routes or unclear hotel bookings can create doubt quickly. A strong answer explains the main destination, dates, accommodation, budget, transport plan, and ties at home without sounding inflated. If you are visiting family or friends, the officer may also test the relationship, host status, invitation details, and who pays for the trip. Use this guide to practice Schengen visa interview questions before you submit or attend a consular appointment.",
    faqs: [
      {
        question: "How many questions are asked in a Schengen visa interview?",
        answer:
          "A Schengen tourist visa interview often includes 5 to 10 questions about your itinerary, main destination, travel dates, accommodation, funds, insurance, employment, host details, and return plans.",
      },
      {
        question: "What documents should I bring for a Schengen tourist visa?",
        answer:
          "Prepare your passport, application form, appointment confirmation, travel itinerary, flight reservation, hotel bookings or invitation letter, travel insurance, bank statements, employment or school proof, and evidence of return ties.",
      },
      {
        question: "What is the officer really assessing for a Schengen visa?",
        answer:
          "The officer is assessing whether your trip is genuine, whether the itinerary matches the country you applied through, whether you can pay for the stay, and whether you will leave the Schengen Area on time.",
      },
      {
        question: "What should I do if my Schengen visa is rejected?",
        answer:
          "Read the refusal grounds carefully. You may appeal if the rules allow it or reapply with stronger itinerary, funds, insurance, accommodation, employment, or return-tie evidence.",
      },
      {
        question: "What are common Schengen visa interview mistakes?",
        answer:
          "Common mistakes include applying through the wrong main destination, giving vague travel dates, using weak hotel reservations, not knowing host details, or showing funds that do not match the trip length.",
      },
      {
        question: "How do I answer which Schengen country is my main destination?",
        answer:
          "State the country where you will spend the most time. If days are equal, explain which country you enter first and show that your bookings match the rule you are relying on.",
      },
    ],
  },
  "australia-student-visa": {
    name: "Australia Student Visa",
    title: "Australia Student Visa Interview Questions and Genuine Student Tips",
    description:
      "Prepare for Australia student visa interview questions about genuine student intent, course relevance, funds, and return plans.",
    keywords: [
      "Australia student visa interview",
      "Australia student visa questions",
      "genuine student requirement Australia",
      "Australian student visa interview preparation",
      "Australia visa interview practice",
    ],
    badge: "Genuine student focus",
    flag: "🇦🇺",
    visaType: "Australia Student",
    author: "VisaInterview editorial team",
    publishedAt: "2026-05-11",
    updatedAt: "2026-07-17",
    sources: [
      {
        label: "Australia Home Affairs Student visa subclass 500",
        href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500",
      },
      {
        label: "Australia Home Affairs Genuine Student requirement",
        href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500/genuine-student-requirement",
      },
      {
        label: "Australia Home Affairs student visa application tips",
        href: "https://immi.homeaffairs.gov.au/check-twice-submit-once/student-visa",
      },
    ],
    intro:
      "The Australia student visa interview is designed to test whether you are a genuine student whose course choice, finances, immigration history, and future plans make sense. Officers may ask why you chose Australia, why this institution, how the course fits your background, who pays your tuition and living costs, and what you plan to do after studying. Because Australia assesses genuine student intent carefully, vague answers about career goals or course relevance can create risk. A strong answer connects your previous education or work to the Australian course, explains the value of the qualification, gives realistic funding details, and shows awareness of visa conditions. If you have a gap in study, a prior refusal, or a course change, prepare a direct explanation. This guide helps you practice Australia student visa interview questions with clarity and confidence.",
    faqs: [
      {
        question: "How many questions are asked in an Australia student visa interview?",
        answer:
          "If an interview or phone check is required, applicants may face 6 to 12 questions about course choice, institution, finances, previous study, immigration history, family ties, and plans after completion.",
      },
      {
        question: "What documents should I prepare for an Australian student visa interview?",
        answer:
          "Prepare your passport, Confirmation of Enrolment, offer letter, academic records, English evidence, financial documents, Overseas Student Health Cover details, statement of purpose if submitted, and evidence of family or career ties.",
      },
      {
        question: "What is the officer really assessing for an Australia student visa?",
        answer:
          "The officer is assessing genuine student intent, course relevance, funding credibility, knowledge of visa conditions, immigration history, and whether your plans after study are realistic.",
      },
      {
        question: "What should I do if my Australia student visa is refused?",
        answer:
          "Review the refusal reason and address it directly before applying again. If the issue is genuine student intent, strengthen your course rationale, career plan, financial evidence, and explanation of ties.",
      },
      {
        question: "What are common Australia student visa interview mistakes?",
        answer:
          "Common mistakes include choosing a course without a clear reason, not knowing tuition and living costs, giving weak post-study plans, ignoring visa conditions, or making the application sound mainly work-focused.",
      },
      {
        question: "How should I explain a study gap for Australia?",
        answer:
          "Explain the gap honestly with dates, mention work, family, exams, finances, or other real reasons, and connect the current course to a clear next step rather than leaving the gap unexplained.",
      },
    ],
  },
} as const satisfies Record<string, GuideEntry>;

export type GuideSlug = keyof typeof GUIDES;

export const GUIDE_SLUGS = Object.keys(GUIDES) as GuideSlug[];

export function isGuideSlug(slug: string): slug is GuideSlug {
  return slug in GUIDES;
}
