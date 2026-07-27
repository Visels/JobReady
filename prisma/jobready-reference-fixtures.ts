import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export const JOBREADY_REFERENCE_FIXTURE_VERSION = "task04-2026-07-25";

export const JOBREADY_REFERENCE_FIXTURE_IDS = {
  syntheticUser: "00000000-0000-4000-8000-000000000404",
  marketKenya: "fixture-market-kenya",
  companySafaricom: "fixture-company-safaricom",
  sources: {
    safaricomCareers: "fixture-source-safaricom-careers",
    jobreadyGeneral: "fixture-source-jobready-general-interview",
    safaricomJobFixture: "fixture-source-safaricom-job-synthetic",
  },
  jobSource: "fixture-job-source-jobready-development",
  jobPosting: "fixture-job-safaricom-graduate-software-engineer",
  jobPostingVersion: "fixture-job-version-safaricom-graduate-software-engineer-v1",
  candidateDocument: "fixture-candidate-document-synthetic-cv",
  candidateDocumentVersion: "fixture-candidate-document-version-synthetic-cv-v1",
  privateTarget: "fixture-private-target-synthetic-software-engineer",
  privateTargetVersion: "fixture-private-target-version-synthetic-software-engineer-v1",
} as const;

const REVIEWED_AT = new Date("2026-07-25T00:00:00.000Z");
const NEXT_REVIEW_AT = new Date("2027-01-25T00:00:00.000Z");
const JOB_FIRST_SEEN_AT = new Date("2026-01-15T09:00:00.000Z");
const JOB_CLOSED_AT = new Date("2026-02-28T20:59:59.000Z");

const industries = [
  {
    id: "fixture-industry-telecommunications",
    slug: "telecommunications",
    name: "Telecommunications",
    description:
      "Connectivity, mobile services, digital platforms, and adjacent customer operations.",
  },
  {
    id: "fixture-industry-banking",
    slug: "banking",
    name: "Banking",
    description:
      "Retail, corporate, and digital banking products across regulated financial services.",
  },
  {
    id: "fixture-industry-energy",
    slug: "energy",
    name: "Energy",
    description:
      "Power generation, distribution, renewables, utilities, and energy services.",
  },
] as const;

const roleFamilies = [
  {
    id: "fixture-role-family-software-engineering",
    slug: "software-engineering",
    name: "Software Engineering",
    description:
      "Builds, integrates, operates, and improves software systems and developer platforms.",
  },
  {
    id: "fixture-role-family-product-management",
    slug: "product-management",
    name: "Product Management",
    description:
      "Frames customer problems, prioritizes opportunities, aligns stakeholders, and guides delivery.",
  },
] as const;

const seniorityLevels = [
  {
    id: "fixture-seniority-internship",
    slug: "internship",
    label: "Internship",
    displayOrder: 10,
  },
  {
    id: "fixture-seniority-graduate-entry",
    slug: "graduate-entry",
    label: "Graduate/Entry",
    displayOrder: 20,
  },
  {
    id: "fixture-seniority-mid-level",
    slug: "mid-level",
    label: "Mid-level",
    displayOrder: 30,
  },
  {
    id: "fixture-seniority-senior",
    slug: "senior",
    label: "Senior",
    displayOrder: 40,
  },
  {
    id: "fixture-seniority-lead-manager",
    slug: "lead-manager",
    label: "Lead/Manager",
    displayOrder: 50,
  },
  {
    id: "fixture-seniority-executive",
    slug: "executive",
    label: "Executive",
    displayOrder: 60,
  },
] as const;

const interviewStages = [
  {
    id: "fixture-stage-screening",
    slug: "screening",
    label: "Screening",
    displayOrder: 10,
  },
  {
    id: "fixture-stage-hiring-manager",
    slug: "hiring-manager",
    label: "Hiring Manager",
    displayOrder: 20,
  },
  {
    id: "fixture-stage-technical-functional",
    slug: "technical-functional",
    label: "Technical/Functional",
    displayOrder: 30,
  },
  {
    id: "fixture-stage-panel",
    slug: "panel",
    label: "Panel",
    displayOrder: 40,
  },
  {
    id: "fixture-stage-final",
    slug: "final",
    label: "Final",
    displayOrder: 50,
  },
] as const;

const frameworks = [
  {
    id: "fixture-framework-behavioral-star",
    key: "behavioral_star",
    name: "Behavioral STAR",
    description:
      "Behavioral evidence using situation, task, action, result, ownership, and impact.",
  },
  {
    id: "fixture-framework-situational",
    key: "situational",
    name: "Situational",
    description:
      "Judgment and response structure for plausible workplace situations.",
  },
  {
    id: "fixture-framework-role-knowledge",
    key: "role_knowledge",
    name: "Role Knowledge",
    description:
      "Role-specific expectations, vocabulary, workflows, and practical awareness.",
  },
  {
    id: "fixture-framework-technical-concept",
    key: "technical_concept",
    name: "Technical Concept",
    description:
      "Technical accuracy, mechanism, practical use, and seniority-appropriate trade-offs.",
  },
  {
    id: "fixture-framework-product-case",
    key: "product_case",
    name: "Product Case",
    description:
      "Problem framing, user understanding, prioritization, metrics, and recommendation.",
  },
  {
    id: "fixture-framework-analytics-case",
    key: "analytics_case",
    name: "Analytics Case",
    description:
      "Metrics, assumptions, diagnosis, experiment design, and decision-making.",
  },
  {
    id: "fixture-framework-system-design",
    key: "system_design",
    name: "System Design",
    description:
      "Requirements, architecture, scalability, reliability, security, and trade-offs.",
  },
  {
    id: "fixture-framework-coding",
    key: "coding",
    name: "Coding",
    description:
      "Correctness, reasoning, complexity, edge cases, tests, and communication.",
  },
  {
    id: "fixture-framework-case-study",
    key: "case_study",
    name: "Case Study",
    description:
      "Structured analysis and recommendations for business or operational cases.",
  },
  {
    id: "fixture-framework-general",
    key: "general",
    name: "General",
    description:
      "General readiness, communication clarity, motivation, and interview hygiene.",
  },
] as const;

const competencies = [
  {
    id: "fixture-competency-ownership",
    slug: "ownership",
    name: "Ownership",
    description:
      "Takes responsibility, follows through, and communicates risks early.",
  },
  {
    id: "fixture-competency-stakeholder-communication",
    slug: "stakeholder-communication",
    name: "Stakeholder Communication",
    description:
      "Explains trade-offs clearly and adapts communication to technical and non-technical audiences.",
  },
  {
    id: "fixture-competency-customer-empathy",
    slug: "customer-empathy",
    name: "Customer Empathy",
    description:
      "Understands user needs, constraints, trust, accessibility, and service context.",
  },
  {
    id: "fixture-competency-product-prioritization",
    slug: "product-prioritization",
    name: "Product Prioritization",
    description:
      "Balances impact, effort, risk, learning value, and operational constraints.",
  },
  {
    id: "fixture-competency-metrics-analytics",
    slug: "metrics-analytics",
    name: "Metrics and Analytics",
    description:
      "Defines useful measures, interprets evidence, and avoids vanity metrics.",
  },
  {
    id: "fixture-competency-technical-fundamentals",
    slug: "technical-fundamentals",
    name: "Technical Fundamentals",
    description:
      "Explains core software concepts accurately and uses them in practical scenarios.",
  },
  {
    id: "fixture-competency-systems-thinking",
    slug: "systems-thinking",
    name: "Systems Thinking",
    description:
      "Reasons about interfaces, dependencies, reliability, observability, and change impact.",
  },
  {
    id: "fixture-competency-problem-solving",
    slug: "problem-solving",
    name: "Problem Solving",
    description:
      "Breaks down ambiguous problems, tests assumptions, and chooses next actions.",
  },
  {
    id: "fixture-competency-collaboration",
    slug: "collaboration",
    name: "Collaboration",
    description:
      "Works constructively with peers, reviewers, customers, and cross-functional teams.",
  },
  {
    id: "fixture-competency-delivery-execution",
    slug: "delivery-execution",
    name: "Delivery and Execution",
    description:
      "Converts priorities into reliable delivery, feedback loops, and measurable progress.",
  },
] as const;

const skills = [
  {
    id: "fixture-skill-typescript",
    slug: "typescript",
    name: "TypeScript",
    aliases: ["TS", "typed JavaScript"],
    description: "Typed JavaScript for maintainable web and service code.",
  },
  {
    id: "fixture-skill-javascript",
    slug: "javascript",
    name: "JavaScript",
    aliases: ["JS", "ECMAScript"],
    description: "Core language for web application behavior and services.",
  },
  {
    id: "fixture-skill-api-design",
    slug: "api-design",
    name: "API Design",
    aliases: ["REST APIs", "service contracts"],
    description: "Designing dependable contracts between clients and services.",
  },
  {
    id: "fixture-skill-sql",
    slug: "sql",
    name: "SQL",
    aliases: ["PostgreSQL", "relational databases"],
    description: "Relational querying, indexing, transactions, and data modeling.",
  },
  {
    id: "fixture-skill-cloud-services",
    slug: "cloud-services",
    name: "Cloud Services",
    aliases: ["cloud platforms", "managed services"],
    description: "Using managed infrastructure for secure, reliable delivery.",
  },
  {
    id: "fixture-skill-product-analytics",
    slug: "product-analytics",
    name: "Product Analytics",
    aliases: ["funnels", "metrics"],
    description: "Using product data to reason about customer behavior and outcomes.",
  },
  {
    id: "fixture-skill-agile-delivery",
    slug: "agile-delivery",
    name: "Agile Delivery",
    aliases: ["scrum", "kanban"],
    description: "Iterative delivery, backlog shaping, and team ceremonies.",
  },
  {
    id: "fixture-skill-stakeholder-management",
    slug: "stakeholder-management",
    name: "Stakeholder Management",
    aliases: ["alignment", "cross-functional leadership"],
    description: "Aligning decisions across product, engineering, operations, and support.",
  },
] as const;

const jobRoles = [
  {
    id: "fixture-job-role-software-engineer",
    slug: "software-engineer",
    name: "Software Engineer",
    roleFamilySlug: "software-engineering",
    description:
      "Builds and maintains software services, APIs, data flows, and user-facing systems.",
    aliases: ["Graduate Software Engineer", "Backend Engineer", "Frontend Engineer"],
  },
  {
    id: "fixture-job-role-product-manager",
    slug: "product-manager",
    name: "Product Manager",
    roleFamilySlug: "product-management",
    description:
      "Owns customer problems, prioritization, stakeholder alignment, delivery, and product outcomes.",
    aliases: ["Associate Product Manager", "Product Owner", "Digital Product Manager"],
  },
] as const;

const rubrics = [
  {
    id: "fixture-rubric-behavioral-star-v1",
    key: "behavioral_star_v1",
    version: 1,
    frameworkKey: "behavioral_star",
    label: "Behavioral STAR v1",
    description:
      "Scores STAR completeness, ownership, specificity, judgment, and impact using only interview evidence.",
    criteria: [
      {
        id: "fixture-rubric-criterion-star-structure",
        key: "star_structure",
        label: "STAR structure",
        description:
          "Situation, task, action, and result are clear enough to understand the answer.",
        weight: 25,
        competencySlug: "ownership",
      },
      {
        id: "fixture-rubric-criterion-specific-action",
        key: "specific_action",
        label: "Specific action",
        description:
          "Candidate describes their own concrete action rather than vague team activity.",
        weight: 30,
        competencySlug: "ownership",
      },
      {
        id: "fixture-rubric-criterion-impact-learning",
        key: "impact_learning",
        label: "Impact and learning",
        description:
          "Outcome, metric, customer impact, or lesson learned is supported by the answer.",
        weight: 25,
        competencySlug: "delivery-execution",
      },
      {
        id: "fixture-rubric-criterion-communication",
        key: "communication",
        label: "Communication",
        description:
          "Answer is concise, understandable, and transparent about trade-offs or limits.",
        weight: 20,
        competencySlug: "stakeholder-communication",
      },
    ],
  },
  {
    id: "fixture-rubric-product-case-v1",
    key: "product_case_v1",
    version: 1,
    frameworkKey: "product_case",
    label: "Product Case v1",
    description:
      "Scores product problem framing, user insight, prioritization, metrics, recommendation, and risks.",
    criteria: [
      {
        id: "fixture-rubric-criterion-product-framing",
        key: "problem_framing",
        label: "Problem framing",
        description:
          "Frames the user problem, business context, constraints, and assumptions.",
        weight: 25,
        competencySlug: "customer-empathy",
      },
      {
        id: "fixture-rubric-criterion-product-prioritization",
        key: "prioritization",
        label: "Prioritization",
        description:
          "Explains what to do first and why based on impact, risk, and evidence.",
        weight: 25,
        competencySlug: "product-prioritization",
      },
      {
        id: "fixture-rubric-criterion-product-metrics",
        key: "metrics",
        label: "Metrics",
        description:
          "Defines useful success and guardrail metrics for the recommendation.",
        weight: 25,
        competencySlug: "metrics-analytics",
      },
      {
        id: "fixture-rubric-criterion-product-risks",
        key: "risks_tradeoffs",
        label: "Risks and trade-offs",
        description:
          "Names practical delivery, trust, operational, or adoption risks.",
        weight: 25,
        competencySlug: "delivery-execution",
      },
    ],
  },
  {
    id: "fixture-rubric-technical-concept-v1",
    key: "technical_concept_v1",
    version: 1,
    frameworkKey: "technical_concept",
    label: "Technical Concept v1",
    description:
      "Scores technical accuracy, mechanism, practical example, completeness, clarity, and trade-offs.",
    criteria: [
      {
        id: "fixture-rubric-criterion-technical-accuracy",
        key: "accuracy",
        label: "Accuracy",
        description:
          "Explanation is technically correct for a graduate or entry-level candidate.",
        weight: 30,
        competencySlug: "technical-fundamentals",
      },
      {
        id: "fixture-rubric-criterion-technical-mechanism",
        key: "mechanism",
        label: "Mechanism",
        description:
          "Candidate explains how the concept works, not only what it is called.",
        weight: 25,
        competencySlug: "systems-thinking",
      },
      {
        id: "fixture-rubric-criterion-technical-example",
        key: "practical_example",
        label: "Practical example",
        description:
          "Answer connects the concept to a realistic service, API, data, or reliability scenario.",
        weight: 25,
        competencySlug: "problem-solving",
      },
      {
        id: "fixture-rubric-criterion-technical-tradeoffs",
        key: "tradeoffs",
        label: "Trade-offs",
        description:
          "Candidate names limits, failure modes, or alternative approaches at an appropriate depth.",
        weight: 20,
        competencySlug: "systems-thinking",
      },
    ],
  },
  {
    id: "fixture-rubric-role-knowledge-v1",
    key: "role_knowledge_v1",
    version: 1,
    frameworkKey: "role_knowledge",
    label: "Role Knowledge v1",
    description:
      "Scores practical awareness of role responsibilities, collaboration, and delivery expectations.",
    criteria: [
      {
        id: "fixture-rubric-criterion-role-practical-awareness",
        key: "practical_awareness",
        label: "Practical awareness",
        description:
          "Candidate understands typical responsibilities and delivery context for the role.",
        weight: 35,
        competencySlug: "delivery-execution",
      },
      {
        id: "fixture-rubric-criterion-role-collaboration",
        key: "collaboration",
        label: "Collaboration",
        description:
          "Candidate explains how they work with peers, reviewers, users, or stakeholders.",
        weight: 35,
        competencySlug: "collaboration",
      },
      {
        id: "fixture-rubric-criterion-role-judgment",
        key: "judgment",
        label: "Judgment",
        description:
          "Candidate makes reasonable trade-offs for their seniority and context.",
        weight: 30,
        competencySlug: "problem-solving",
      },
    ],
  },
] as const;

const questions = [
  {
    id: "fixture-question-ownership-star-v1",
    slug: "ownership-star",
    version: 1,
    prompt:
      "Tell me about a time you took ownership of a difficult work or school project and had to show measurable progress.",
    frameworkKey: "behavioral_star",
    rubricKey: "behavioral_star_v1",
    industrySlug: null,
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: null,
    companySpecific: false,
    competencySlugs: ["ownership", "delivery-execution", "stakeholder-communication"],
    signals: [
      "Clear situation, task, action, and result.",
      "Own contribution is separated from the team's contribution.",
      "Progress is described with evidence, feedback, or a measurable outcome.",
    ],
    redFlags: [
      "Only says the team worked hard without naming personal action.",
      "No result, learning, or follow-through.",
    ],
    followUps: [
      {
        intent: "ownership",
        condition: "The candidate describes a team outcome but not their own action.",
        promptHint: "What specifically did you do, and how did that change the outcome?",
      },
      {
        intent: "result",
        condition: "The answer has no result or learning.",
        promptHint: "How did you know the project had improved or succeeded?",
      },
    ],
  },
  {
    id: "fixture-question-product-ownership-star-v1",
    slug: "product-ownership-star",
    version: 1,
    prompt:
      "Tell me about a time you owned a product or customer problem from ambiguity to a clearer decision or shipped improvement.",
    frameworkKey: "behavioral_star",
    rubricKey: "behavioral_star_v1",
    industrySlug: null,
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    companySpecific: false,
    competencySlugs: ["ownership", "delivery-execution", "stakeholder-communication"],
    signals: [
      "Frames the ambiguous customer or business problem clearly.",
      "Explains personal ownership across discovery, decision, and delivery.",
      "Names a concrete outcome, learning, or follow-up decision.",
    ],
    redFlags: [
      "Describes product work as only taking requests from stakeholders.",
      "Cannot explain what changed because of their action.",
    ],
    followUps: [
      {
        intent: "ownership",
        condition: "The candidate describes a shared product outcome but not their own role.",
        promptHint: "Which decision or action was specifically yours?",
      },
      {
        intent: "result",
        condition: "The answer does not include an outcome or customer signal.",
        promptHint: "What evidence told you the decision or improvement worked?",
      },
    ],
  },
  {
    id: "fixture-question-safaricom-product-dropoff-v1",
    slug: "safaricom-product-dropoff",
    version: 1,
    prompt:
      "Imagine Safaricom is seeing fewer customers complete a payment flow in a consumer app. How would you investigate the problem and decide what to prioritize first?",
    frameworkKey: "product_case",
    rubricKey: "product_case_v1",
    industrySlug: "telecommunications",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    companySpecific: true,
    competencySlugs: [
      "customer-empathy",
      "product-prioritization",
      "metrics-analytics",
      "delivery-execution",
    ],
    signals: [
      "Separates user, business, technical, and operational hypotheses.",
      "Identifies funnel metrics and guardrails such as failed transactions or support contacts.",
      "Prioritizes learning and risk reduction before jumping to a feature solution.",
    ],
    redFlags: [
      "Assumes the cause without checking evidence.",
      "Optimizes only conversion while ignoring trust, reliability, or customer support impact.",
    ],
    followUps: [
      {
        intent: "mechanism",
        condition: "The candidate names metrics without explaining how they would use them.",
        promptHint: "Which metric would you inspect first, and what would each possible result tell you?",
      },
      {
        intent: "trade_off",
        condition: "The candidate recommends a solution without naming risks.",
        promptHint: "What trade-off could make your recommendation risky in a telecom context?",
      },
    ],
  },
  {
    id: "fixture-question-product-stakeholder-prioritization-v1",
    slug: "product-stakeholder-prioritization",
    version: 1,
    prompt:
      "A commercial team wants a new feature urgently, while engineering is warning about reliability work. How would you make and communicate the product decision?",
    frameworkKey: "product_case",
    rubricKey: "product_case_v1",
    industrySlug: "telecommunications",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    companySpecific: false,
    competencySlugs: [
      "product-prioritization",
      "stakeholder-communication",
      "metrics-analytics",
      "delivery-execution",
    ],
    signals: [
      "Clarifies customer impact and business urgency.",
      "Weighs reliability, opportunity cost, and short-term commitments.",
      "Communicates a decision with rationale and next checkpoints.",
    ],
    redFlags: [
      "Defaults to the loudest stakeholder.",
      "Treats reliability work as invisible or optional without evidence.",
    ],
    followUps: [
      {
        intent: "clarification",
        condition: "The candidate does not define the decision criteria.",
        promptHint: "What criteria would you use to compare the feature and reliability work?",
      },
      {
        intent: "example",
        condition: "The answer stays theoretical.",
        promptHint: "Give an example of the message you would send to stakeholders.",
      },
    ],
  },
  {
    id: "fixture-question-mobile-money-funnel-metrics-v1",
    slug: "mobile-money-funnel-metrics",
    version: 1,
    prompt:
      "A Kenyan mobile-money product has strong sign-ups but weak repeat usage. Which metrics would you inspect, and how would you decide the next experiment?",
    frameworkKey: "analytics_case",
    rubricKey: "product_case_v1",
    industrySlug: "telecommunications",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    companySpecific: false,
    competencySlugs: [
      "metrics-analytics",
      "customer-empathy",
      "product-prioritization",
      "delivery-execution",
    ],
    signals: [
      "Separates activation, repeat usage, transaction success, and retention metrics.",
      "Connects metrics to user hypotheses rather than treating dashboards as the answer.",
      "Proposes a safe experiment with a clear success measure and guardrail.",
    ],
    redFlags: [
      "Uses only vanity metrics such as total registrations.",
      "Recommends an experiment without naming a user segment or guardrail.",
    ],
    followUps: [
      {
        intent: "clarification",
        condition: "The candidate lists metrics without a decision path.",
        promptHint: "Which metric would change your decision first, and why?",
      },
      {
        intent: "trade_off",
        condition: "The candidate proposes an experiment without risks.",
        promptHint: "What could this experiment accidentally make worse?",
      },
    ],
  },
  {
    id: "fixture-question-product-cross-functional-alignment-v1",
    slug: "product-cross-functional-alignment",
    version: 1,
    prompt:
      "How do you keep product, engineering, commercial, and support teams aligned when new customer evidence changes the priority mid-cycle?",
    frameworkKey: "role_knowledge",
    rubricKey: "role_knowledge_v1",
    industrySlug: "telecommunications",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    companySpecific: false,
    competencySlugs: [
      "stakeholder-communication",
      "product-prioritization",
      "delivery-execution",
    ],
    signals: [
      "Uses a clear decision record, evidence summary, and next checkpoint.",
      "Balances customer impact, delivery cost, commercial commitments, and reliability.",
      "Explains how different teams hear the same rationale in useful language.",
    ],
    redFlags: [
      "Frames alignment as persuasion without evidence.",
      "Ignores engineering or support impact when priorities change.",
    ],
    followUps: [
      {
        intent: "example",
        condition: "The answer is too abstract.",
        promptHint: "Give an example of the message you would send after the priority changed.",
      },
      {
        intent: "trade_off",
        condition: "The candidate does not mention trade-offs.",
        promptHint: "What would you deliberately not do in that cycle, and how would you explain it?",
      },
    ],
  },
  {
    id: "fixture-question-product-customer-empathy-motivation-v1",
    slug: "product-customer-empathy-motivation",
    version: 1,
    prompt:
      "Why are you interested in product roles serving African digital-service customers, and how would you keep learning from users after launch?",
    frameworkKey: "general",
    rubricKey: "role_knowledge_v1",
    industrySlug: "telecommunications",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    companySpecific: false,
    competencySlugs: ["customer-empathy", "stakeholder-communication", "collaboration"],
    signals: [
      "Motivation is connected to user problems, trust, access, or service quality.",
      "Names concrete learning loops such as interviews, support themes, and product analytics.",
      "Avoids claiming certainty before evidence is gathered.",
    ],
    redFlags: [
      "Motivation is only prestige, title, or employer brand.",
      "Treats users as one uniform group without context or constraints.",
    ],
    followUps: [
      {
        intent: "example",
        condition: "The answer does not include a learning loop.",
        promptHint: "What is one regular signal you would review after launch?",
      },
      {
        intent: "clarification",
        condition: "The candidate speaks broadly about Africa without specifics.",
        promptHint: "Which user constraint would you want to understand first?",
      },
    ],
  },
  {
    id: "fixture-question-idempotent-api-v1",
    slug: "idempotent-api",
    version: 1,
    prompt:
      "Explain idempotency in an API. How would you use it to prevent duplicate processing when a mobile client retries a request?",
    frameworkKey: "technical_concept",
    rubricKey: "technical_concept_v1",
    industrySlug: null,
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    companySpecific: false,
    competencySlugs: ["technical-fundamentals", "systems-thinking", "problem-solving"],
    signals: [
      "Defines idempotency in plain language.",
      "Uses an idempotency key, transaction, or unique constraint in the explanation.",
      "Mentions retries, duplicate requests, and safe response reuse.",
    ],
    redFlags: [
      "Confuses idempotency with authentication.",
      "Ignores race conditions or concurrent retries.",
    ],
    followUps: [
      {
        intent: "mechanism",
        condition: "The candidate only gives a definition.",
        promptHint: "What would you store in the database to make the retry safe?",
      },
      {
        intent: "trade_off",
        condition: "The answer has no edge cases.",
        promptHint: "What could go wrong if two identical requests arrive at the same time?",
      },
    ],
  },
  {
    id: "fixture-question-debugging-production-v1",
    slug: "debugging-production-incident",
    version: 1,
    prompt:
      "Tell me about a time you debugged a serious issue or confusing bug. What did you do first, and how did you know it was fixed?",
    frameworkKey: "behavioral_star",
    rubricKey: "behavioral_star_v1",
    industrySlug: null,
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    companySpecific: false,
    competencySlugs: ["problem-solving", "ownership", "collaboration"],
    signals: [
      "Shows a calm sequence of diagnosis, action, verification, and communication.",
      "Names evidence used to confirm the fix.",
      "Explains what changed after the issue was resolved.",
    ],
    redFlags: [
      "Blames others without explaining investigation.",
      "Does not verify the fix.",
    ],
    followUps: [
      {
        intent: "mechanism",
        condition: "The candidate says they fixed it but does not explain how.",
        promptHint: "Walk me through the debugging steps in order.",
      },
      {
        intent: "result",
        condition: "The candidate gives no verification evidence.",
        promptHint: "What did you check to confirm the issue was really fixed?",
      },
    ],
  },
  {
    id: "fixture-question-service-reliability-v1",
    slug: "service-reliability-for-entry-engineer",
    version: 1,
    prompt:
      "If a simple service sometimes returns slow responses, what signals would you check and what first changes would you consider?",
    frameworkKey: "technical_concept",
    rubricKey: "technical_concept_v1",
    industrySlug: null,
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: null,
    companySpecific: false,
    competencySlugs: ["systems-thinking", "technical-fundamentals", "problem-solving"],
    signals: [
      "Mentions logs, metrics, traces, database queries, or external dependencies.",
      "Separates diagnosis from optimization.",
      "Names one safe first improvement and one trade-off.",
    ],
    redFlags: [
      "Suggests rewriting the whole system before measuring.",
      "Ignores user impact or production safety.",
    ],
    followUps: [
      {
        intent: "example",
        condition: "The answer is too abstract.",
        promptHint: "Give one concrete metric and one concrete log message you would check.",
      },
      {
        intent: "trade_off",
        condition: "The candidate gives only one solution.",
        promptHint: "What downside could your first fix introduce?",
      },
    ],
  },
  {
    id: "fixture-question-software-delivery-collaboration-v1",
    slug: "software-delivery-collaboration",
    version: 1,
    prompt:
      "How would you work with product, QA, and another engineer when an API change affects a customer-facing flow?",
    frameworkKey: "role_knowledge",
    rubricKey: "role_knowledge_v1",
    industrySlug: null,
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    companySpecific: false,
    competencySlugs: ["collaboration", "problem-solving", "delivery-execution"],
    signals: [
      "Clarifies requirements, affected users, contracts, and test expectations.",
      "Communicates risk early and keeps teammates updated with concrete next steps.",
      "Mentions review, rollout safety, or backward compatibility.",
    ],
    redFlags: [
      "Makes the API change without checking consumers or tests.",
      "Treats QA or product as blockers rather than collaborators.",
    ],
    followUps: [
      {
        intent: "mechanism",
        condition: "The candidate does not describe coordination steps.",
        promptHint: "What would you confirm with each teammate before merging?",
      },
      {
        intent: "trade_off",
        condition: "The answer does not mention rollout risk.",
        promptHint: "How would you reduce the chance of breaking existing clients?",
      },
    ],
  },
  {
    id: "fixture-question-software-engineer-growth-communication-v1",
    slug: "software-engineer-growth-communication",
    version: 1,
    prompt:
      "Why are you interested in a software engineering role, and how do you explain technical work clearly to non-technical teammates?",
    frameworkKey: "general",
    rubricKey: "role_knowledge_v1",
    industrySlug: null,
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    companySpecific: false,
    competencySlugs: ["stakeholder-communication", "collaboration", "ownership"],
    signals: [
      "Motivation is grounded in building useful, reliable systems.",
      "Explains technical choices with user impact, risk, and simple language.",
      "Shows learning orientation without pretending to know everything.",
    ],
    redFlags: [
      "Uses jargon without checking understanding.",
      "Cannot connect engineering work to users or teammates.",
    ],
    followUps: [
      {
        intent: "example",
        condition: "The communication answer is generic.",
        promptHint: "Give an example of how you would explain a database timeout to a product teammate.",
      },
      {
        intent: "clarification",
        condition: "The motivation answer is vague.",
        promptHint: "Which kind of software problem are you most excited to learn more about?",
      },
    ],
  },
  {
    id: "fixture-question-code-review-feedback-v1",
    slug: "code-review-feedback-situational",
    version: 1,
    prompt:
      "A reviewer gives you feedback you do not fully agree with, and the release is due soon. What would you do?",
    frameworkKey: "situational",
    rubricKey: "role_knowledge_v1",
    industrySlug: null,
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    companySpecific: false,
    competencySlugs: ["collaboration", "problem-solving", "stakeholder-communication"],
    signals: [
      "Seeks to understand the concern before defending the original approach.",
      "Balances release timing with correctness, maintainability, and team standards.",
      "Suggests a concrete path such as a quick discussion, smaller change, or follow-up issue.",
    ],
    redFlags: [
      "Dismisses the reviewer or merges without resolving the concern.",
      "Blocks progress without proposing a decision path.",
    ],
    followUps: [
      {
        intent: "clarification",
        condition: "The candidate does not state how they would decide.",
        promptHint: "What information would help you decide whether to change the code now?",
      },
      {
        intent: "example",
        condition: "The answer stays theoretical.",
        promptHint: "What would you say to the reviewer in that moment?",
      },
    ],
  },
  {
    id: "fixture-question-simple-service-design-v1",
    slug: "simple-service-design-graduate",
    version: 1,
    prompt:
      "Design a small service that lets a user check the status of a submitted request. What components would you include and how would you keep it reliable?",
    frameworkKey: "system_design",
    rubricKey: "technical_concept_v1",
    industrySlug: null,
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    companySpecific: false,
    competencySlugs: ["systems-thinking", "technical-fundamentals", "problem-solving"],
    signals: [
      "Names basic API, data store, status model, authentication, and client behavior.",
      "Discusses reliability through idempotency, retries, validation, or monitoring.",
      "Keeps the design appropriate for graduate or entry-level scope.",
    ],
    redFlags: [
      "Jumps into tools without defining the request lifecycle.",
      "Ignores errors, authorization, or duplicate requests.",
    ],
    followUps: [
      {
        intent: "mechanism",
        condition: "The candidate names components without connecting them.",
        promptHint: "Walk me through what happens after the user presses submit.",
      },
      {
        intent: "trade_off",
        condition: "The design has no reliability discussion.",
        promptHint: "What failure would you handle first, and why?",
      },
    ],
  },
] as const;

const plans = [
  {
    id: "fixture-plan-safaricom-pm-recommended-graduate-entry-v1",
    slug: "scenario-a-safaricom-product-manager-recommended-graduate-entry",
    version: 1,
    focusMode: "recommended",
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    senioritySlug: "graduate-entry",
    promptVersion: "jr-interview-prompt-v1",
    questionSetVersion: "jr-scenario-a-product-manager-v1",
    rubricVersion: "jr-rubric-v1",
    rationale:
      "Scenario A standalone Product Manager plan for Safaricom context with no job posting and no CV.",
    modules: [
      {
        id: "fixture-plan-module-pm-grad-behavioral",
        frameworkKey: "behavioral_star",
        competencySlug: "ownership",
        weight: 30,
        displayOrder: 10,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "fixture-plan-module-pm-grad-product",
        frameworkKey: "product_case",
        competencySlug: "product-prioritization",
        weight: 25,
        displayOrder: 20,
        rubricKey: "product_case_v1",
      },
      {
        id: "fixture-plan-module-pm-grad-analytics",
        frameworkKey: "analytics_case",
        competencySlug: "metrics-analytics",
        weight: 20,
        displayOrder: 30,
        rubricKey: "product_case_v1",
      },
      {
        id: "fixture-plan-module-pm-grad-role",
        frameworkKey: "role_knowledge",
        competencySlug: "stakeholder-communication",
        weight: 15,
        displayOrder: 40,
        rubricKey: "role_knowledge_v1",
      },
      {
        id: "fixture-plan-module-pm-grad-general",
        frameworkKey: "general",
        competencySlug: "customer-empathy",
        weight: 10,
        displayOrder: 50,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    id: "fixture-plan-safaricom-pm-recommended-mid-v1",
    slug: "scenario-a-safaricom-product-manager-recommended-mid-level",
    version: 1,
    focusMode: "recommended",
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    senioritySlug: "mid-level",
    promptVersion: "jr-interview-prompt-v1",
    questionSetVersion: "jr-scenario-a-product-manager-v1",
    rubricVersion: "jr-rubric-v1",
    rationale:
      "Scenario A mid-level Product Manager plan for candidate-selected seniority.",
    modules: [
      {
        id: "fixture-plan-module-pm-mid-behavioral",
        frameworkKey: "behavioral_star",
        competencySlug: "ownership",
        weight: 30,
        displayOrder: 10,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "fixture-plan-module-pm-mid-product",
        frameworkKey: "product_case",
        competencySlug: "product-prioritization",
        weight: 25,
        displayOrder: 20,
        rubricKey: "product_case_v1",
      },
      {
        id: "fixture-plan-module-pm-mid-analytics",
        frameworkKey: "analytics_case",
        competencySlug: "metrics-analytics",
        weight: 20,
        displayOrder: 30,
        rubricKey: "product_case_v1",
      },
      {
        id: "fixture-plan-module-pm-mid-role",
        frameworkKey: "role_knowledge",
        competencySlug: "stakeholder-communication",
        weight: 15,
        displayOrder: 40,
        rubricKey: "role_knowledge_v1",
      },
      {
        id: "fixture-plan-module-pm-mid-general",
        frameworkKey: "general",
        competencySlug: "customer-empathy",
        weight: 10,
        displayOrder: 50,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    id: "fixture-plan-safaricom-se-recommended-graduate-v1",
    slug: "scenario-b-safaricom-software-engineering-recommended-graduate-entry",
    version: 1,
    focusMode: "recommended",
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    senioritySlug: "graduate-entry",
    promptVersion: "jr-interview-prompt-v1",
    questionSetVersion: "jr-scenario-b-software-engineering-v1",
    rubricVersion: "jr-rubric-v1",
    rationale:
      "Scenario B recommended plan with technical and behavioral coverage for Graduate/Entry software engineering.",
    modules: [
      {
        id: "fixture-plan-module-se-rec-behavioral",
        frameworkKey: "behavioral_star",
        competencySlug: "ownership",
        weight: 30,
        displayOrder: 10,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "fixture-plan-module-se-rec-technical",
        frameworkKey: "technical_concept",
        competencySlug: "technical-fundamentals",
        weight: 40,
        displayOrder: 20,
        rubricKey: "technical_concept_v1",
      },
      {
        id: "fixture-plan-module-se-rec-role",
        frameworkKey: "role_knowledge",
        competencySlug: "collaboration",
        weight: 20,
        displayOrder: 30,
        rubricKey: "role_knowledge_v1",
      },
      {
        id: "fixture-plan-module-se-rec-general",
        frameworkKey: "general",
        competencySlug: "stakeholder-communication",
        weight: 10,
        displayOrder: 40,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    id: "fixture-plan-safaricom-se-behavioral-graduate-v1",
    slug: "scenario-b-safaricom-software-engineering-behavioral-focus-graduate-entry",
    version: 1,
    focusMode: "behavioral_focus",
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    senioritySlug: "graduate-entry",
    promptVersion: "jr-interview-prompt-v1",
    questionSetVersion: "jr-scenario-b-software-engineering-v1",
    rubricVersion: "jr-rubric-v1",
    rationale:
      "Scenario B behavioral focus plan for Graduate/Entry software engineering.",
    modules: [
      {
        id: "fixture-plan-module-se-behavioral-star",
        frameworkKey: "behavioral_star",
        competencySlug: "ownership",
        weight: 70,
        displayOrder: 10,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "fixture-plan-module-se-behavioral-situational",
        frameworkKey: "situational",
        competencySlug: "collaboration",
        weight: 20,
        displayOrder: 20,
        rubricKey: "role_knowledge_v1",
      },
      {
        id: "fixture-plan-module-se-behavioral-general",
        frameworkKey: "general",
        competencySlug: "stakeholder-communication",
        weight: 10,
        displayOrder: 30,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    id: "fixture-plan-safaricom-se-technical-graduate-v1",
    slug: "scenario-b-safaricom-software-engineering-technical-concept-graduate-entry",
    version: 1,
    focusMode: "role_specific_focus",
    marketSlug: "kenya",
    companySlug: "safaricom",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    senioritySlug: "graduate-entry",
    promptVersion: "jr-interview-prompt-v1",
    questionSetVersion: "jr-scenario-b-software-engineering-v1",
    rubricVersion: "jr-rubric-v1",
    rationale:
      "Scenario B technical concept plan using the role-specific focus mode.",
    modules: [
      {
        id: "fixture-plan-module-se-tech-concept",
        frameworkKey: "technical_concept",
        competencySlug: "technical-fundamentals",
        weight: 70,
        displayOrder: 10,
        rubricKey: "technical_concept_v1",
      },
      {
        id: "fixture-plan-module-se-tech-system",
        frameworkKey: "system_design",
        competencySlug: "systems-thinking",
        weight: 20,
        displayOrder: 20,
        rubricKey: "technical_concept_v1",
      },
      {
        id: "fixture-plan-module-se-tech-role",
        frameworkKey: "role_knowledge",
        competencySlug: "problem-solving",
        weight: 10,
        displayOrder: 30,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
] as const;

function hashFixture(value: unknown) {
  return createHash("sha256")
    .update(JOBREADY_REFERENCE_FIXTURE_VERSION)
    .update(JSON.stringify(value))
    .digest("hex");
}

function requireMapValue<T>(map: Map<string, T>, key: string, label: string) {
  const value = map.get(key);
  if (!value) {
    throw new Error(`Missing ${label} fixture for key: ${key}`);
  }
  return value;
}

export async function seedJobreadyReferenceFixtures(prisma: PrismaClient) {
  const market = await prisma.market.upsert({
    where: { slug: "kenya" },
    update: {
      name: "Kenya",
      isoCode: "KE",
      currencyCode: "KES",
      timezone: "Africa/Nairobi",
      isActive: true,
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.marketKenya,
      slug: "kenya",
      name: "Kenya",
      isoCode: "KE",
      currencyCode: "KES",
      timezone: "Africa/Nairobi",
      isActive: true,
    },
    select: { id: true },
  });

  const industryBySlug = new Map<string, { id: string }>();
  for (const industry of industries) {
    const saved = await prisma.industry.upsert({
      where: { slug: industry.slug },
      update: {
        name: industry.name,
        description: industry.description,
        isActive: true,
      },
      create: {
        id: industry.id,
        slug: industry.slug,
        name: industry.name,
        description: industry.description,
        isActive: true,
      },
      select: { id: true },
    });
    industryBySlug.set(industry.slug, saved);
  }

  const roleFamilyBySlug = new Map<string, { id: string }>();
  for (const roleFamily of roleFamilies) {
    const saved = await prisma.roleFamily.upsert({
      where: { slug: roleFamily.slug },
      update: {
        name: roleFamily.name,
        description: roleFamily.description,
        isActive: true,
      },
      create: {
        id: roleFamily.id,
        slug: roleFamily.slug,
        name: roleFamily.name,
        description: roleFamily.description,
        isActive: true,
      },
      select: { id: true },
    });
    roleFamilyBySlug.set(roleFamily.slug, saved);
  }

  const seniorityBySlug = new Map<string, { id: string }>();
  for (const seniority of seniorityLevels) {
    const saved = await prisma.seniorityLevel.upsert({
      where: { slug: seniority.slug },
      update: {
        label: seniority.label,
        displayOrder: seniority.displayOrder,
        isActive: true,
      },
      create: {
        id: seniority.id,
        slug: seniority.slug,
        label: seniority.label,
        displayOrder: seniority.displayOrder,
        isActive: true,
      },
      select: { id: true },
    });
    seniorityBySlug.set(seniority.slug, saved);
  }

  const stageBySlug = new Map<string, { id: string }>();
  for (const stage of interviewStages) {
    const saved = await prisma.interviewStage.upsert({
      where: { slug: stage.slug },
      update: {
        label: stage.label,
        displayOrder: stage.displayOrder,
        isActive: true,
      },
      create: {
        id: stage.id,
        slug: stage.slug,
        label: stage.label,
        displayOrder: stage.displayOrder,
        isActive: true,
      },
      select: { id: true },
    });
    stageBySlug.set(stage.slug, saved);
  }

  const frameworkByKey = new Map<string, { id: string }>();
  for (const framework of frameworks) {
    const saved = await prisma.evaluationFramework.upsert({
      where: { key: framework.key },
      update: {
        name: framework.name,
        description: framework.description,
        isActive: true,
      },
      create: {
        id: framework.id,
        key: framework.key,
        name: framework.name,
        description: framework.description,
        isActive: true,
      },
      select: { id: true },
    });
    frameworkByKey.set(framework.key, saved);
  }

  const competencyBySlug = new Map<string, { id: string }>();
  for (const competency of competencies) {
    const saved = await prisma.competency.upsert({
      where: { slug: competency.slug },
      update: {
        name: competency.name,
        description: competency.description,
        isActive: true,
      },
      create: {
        id: competency.id,
        slug: competency.slug,
        name: competency.name,
        description: competency.description,
        isActive: true,
      },
      select: { id: true },
    });
    competencyBySlug.set(competency.slug, saved);
  }

  const skillBySlug = new Map<string, { id: string }>();
  for (const skill of skills) {
    const saved = await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {
        name: skill.name,
        aliases: [...skill.aliases],
        description: skill.description,
        isActive: true,
      },
      create: {
        id: skill.id,
        slug: skill.slug,
        name: skill.name,
        aliases: [...skill.aliases],
        description: skill.description,
        isActive: true,
      },
      select: { id: true },
    });
    skillBySlug.set(skill.slug, saved);
  }

  const safaricomCareersSource = await prisma.contentSource.upsert({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.sources.safaricomCareers },
    update: {
      type: "official_career_page",
      title: "Safaricom Careers",
      publisher: "Safaricom PLC",
      url: "https://www.safaricom.co.ke/careers/",
      retrievedAt: REVIEWED_AT,
      isOfficial: true,
      researchNotes:
        "Official Safaricom careers page used only to anchor company context for Task 04 fixtures.",
      confidence: "high",
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.sources.safaricomCareers,
      type: "official_career_page",
      title: "Safaricom Careers",
      publisher: "Safaricom PLC",
      url: "https://www.safaricom.co.ke/careers/",
      retrievedAt: REVIEWED_AT,
      isOfficial: true,
      researchNotes:
        "Official Safaricom careers page used only to anchor company context for Task 04 fixtures.",
      confidence: "high",
    },
    select: { id: true },
  });

  const generalSource = await prisma.contentSource.upsert({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.sources.jobreadyGeneral },
    update: {
      type: "internal_fixture",
      title: "Jobready Task 04 Synthetic Interview Fixture",
      publisher: "Jobready development fixtures",
      url: "https://example.test/jobready/task-04/interview-fixtures",
      retrievedAt: REVIEWED_AT,
      isOfficial: false,
      researchNotes:
        "Synthetic, non-production interview content for deterministic development tests.",
      confidence: "medium",
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.sources.jobreadyGeneral,
      type: "internal_fixture",
      title: "Jobready Task 04 Synthetic Interview Fixture",
      publisher: "Jobready development fixtures",
      url: "https://example.test/jobready/task-04/interview-fixtures",
      retrievedAt: REVIEWED_AT,
      isOfficial: false,
      researchNotes:
        "Synthetic, non-production interview content for deterministic development tests.",
      confidence: "medium",
    },
    select: { id: true },
  });

  const jobFixtureSource = await prisma.contentSource.upsert({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.sources.safaricomJobFixture },
    update: {
      type: "internal_fixture",
      title: "Development Fixture: Safaricom Graduate Software Engineer",
      publisher: "Jobready development fixtures",
      url: "https://example.test/jobready/task-04/safaricom-graduate-software-engineer",
      retrievedAt: REVIEWED_AT,
      isOfficial: false,
      researchNotes:
        "Expired synthetic job fixture. This is not a real Safaricom vacancy and must not be published as a live job.",
      confidence: "medium",
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.sources.safaricomJobFixture,
      type: "internal_fixture",
      title: "Development Fixture: Safaricom Graduate Software Engineer",
      publisher: "Jobready development fixtures",
      url: "https://example.test/jobready/task-04/safaricom-graduate-software-engineer",
      retrievedAt: REVIEWED_AT,
      isOfficial: false,
      researchNotes:
        "Expired synthetic job fixture. This is not a real Safaricom vacancy and must not be published as a live job.",
      confidence: "medium",
    },
    select: { id: true },
  });

  const company = await prisma.company.upsert({
    where: { slug: "safaricom" },
    update: {
      legalName: "Safaricom PLC",
      displayName: "Safaricom",
      industryId: requireMapValue(
        industryBySlug,
        "telecommunications",
        "industry",
      ).id,
      marketId: market.id,
      websiteUrl: "https://www.safaricom.co.ke/",
      careersUrl: "https://www.safaricom.co.ke/careers/",
      summary:
        "Reviewed Kenya telecommunications employer context for Jobready development fixtures. Verify all current public details before production publication.",
      focusAreas: ["mobile services", "digital platforms", "customer operations"],
      publicationStatus: "published",
      confidence: "medium",
      reviewedAt: REVIEWED_AT,
      nextReviewAt: NEXT_REVIEW_AT,
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.companySafaricom,
      slug: "safaricom",
      legalName: "Safaricom PLC",
      displayName: "Safaricom",
      industryId: requireMapValue(
        industryBySlug,
        "telecommunications",
        "industry",
      ).id,
      marketId: market.id,
      websiteUrl: "https://www.safaricom.co.ke/",
      careersUrl: "https://www.safaricom.co.ke/careers/",
      summary:
        "Reviewed Kenya telecommunications employer context for Jobready development fixtures. Verify all current public details before production publication.",
      focusAreas: ["mobile services", "digital platforms", "customer operations"],
      publicationStatus: "published",
      confidence: "medium",
      reviewedAt: REVIEWED_AT,
      nextReviewAt: NEXT_REVIEW_AT,
    },
    select: { id: true },
  });

  await prisma.contentReview.upsert({
    where: { id: "fixture-review-source-safaricom-careers" },
    update: {
      status: "published",
      contentSourceId: safaricomCareersSource.id,
      reviewedAt: REVIEWED_AT,
      notes:
        "Official careers page source reviewed for company-context fixture only.",
      nextReviewAt: NEXT_REVIEW_AT,
    },
    create: {
      id: "fixture-review-source-safaricom-careers",
      status: "published",
      contentSourceId: safaricomCareersSource.id,
      reviewedAt: REVIEWED_AT,
      notes:
        "Official careers page source reviewed for company-context fixture only.",
      nextReviewAt: NEXT_REVIEW_AT,
    },
  });

  await prisma.contentReview.upsert({
    where: { id: "fixture-review-company-safaricom" },
    update: {
      status: "published",
      companyId: company.id,
      reviewedAt: REVIEWED_AT,
      notes:
        "Company record is suitable for development fixtures; live publication requires fresh review.",
      nextReviewAt: NEXT_REVIEW_AT,
    },
    create: {
      id: "fixture-review-company-safaricom",
      status: "published",
      companyId: company.id,
      reviewedAt: REVIEWED_AT,
      notes:
        "Company record is suitable for development fixtures; live publication requires fresh review.",
      nextReviewAt: NEXT_REVIEW_AT,
    },
  });

  await prisma.contentReview.upsert({
    where: { id: "fixture-review-source-jobready-general" },
    update: {
      status: "published",
      contentSourceId: generalSource.id,
      reviewedAt: REVIEWED_AT,
      notes: "Synthetic general interview fixture reviewed for development use.",
      nextReviewAt: NEXT_REVIEW_AT,
    },
    create: {
      id: "fixture-review-source-jobready-general",
      status: "published",
      contentSourceId: generalSource.id,
      reviewedAt: REVIEWED_AT,
      notes: "Synthetic general interview fixture reviewed for development use.",
      nextReviewAt: NEXT_REVIEW_AT,
    },
  });

  await prisma.contentReview.upsert({
    where: { id: "fixture-review-source-safaricom-job" },
    update: {
      status: "published",
      contentSourceId: jobFixtureSource.id,
      reviewedAt: REVIEWED_AT,
      notes:
        "Synthetic expired job source reviewed for tests; not a live or real vacancy.",
      nextReviewAt: NEXT_REVIEW_AT,
    },
    create: {
      id: "fixture-review-source-safaricom-job",
      status: "published",
      contentSourceId: jobFixtureSource.id,
      reviewedAt: REVIEWED_AT,
      notes:
        "Synthetic expired job source reviewed for tests; not a live or real vacancy.",
      nextReviewAt: NEXT_REVIEW_AT,
    },
  });

  const jobRoleBySlug = new Map<string, { id: string }>();
  for (const role of jobRoles) {
    const saved = await prisma.jobRole.upsert({
      where: { slug: role.slug },
      update: {
        name: role.name,
        roleFamilyId: requireMapValue(
          roleFamilyBySlug,
          role.roleFamilySlug,
          "role family",
        ).id,
        marketId: market.id,
        description: role.description,
        isActive: true,
      },
      create: {
        id: role.id,
        slug: role.slug,
        name: role.name,
        roleFamilyId: requireMapValue(
          roleFamilyBySlug,
          role.roleFamilySlug,
          "role family",
        ).id,
        marketId: market.id,
        description: role.description,
        isActive: true,
      },
      select: { id: true },
    });
    jobRoleBySlug.set(role.slug, saved);

    for (const alias of role.aliases) {
      await prisma.jobTitleAlias.upsert({
        where: {
          jobRoleId_alias_locale: {
            jobRoleId: saved.id,
            alias,
            locale: "en",
          },
        },
        update: {},
        create: {
          id: `fixture-job-title-alias-${role.slug}-${alias
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")}`,
          jobRoleId: saved.id,
          alias,
          locale: "en",
        },
      });
    }
  }

  const rubricByKey = new Map<string, { id: string }>();
  for (const rubric of rubrics) {
    const savedRubric = await prisma.rubric.upsert({
      where: {
        key_version: {
          key: rubric.key,
          version: rubric.version,
        },
      },
      update: {
        evaluationFrameworkId: requireMapValue(
          frameworkByKey,
          rubric.frameworkKey,
          "framework",
        ).id,
        label: rubric.label,
        description: rubric.description,
        status: "published",
      },
      create: {
        id: rubric.id,
        key: rubric.key,
        version: rubric.version,
        evaluationFrameworkId: requireMapValue(
          frameworkByKey,
          rubric.frameworkKey,
          "framework",
        ).id,
        label: rubric.label,
        description: rubric.description,
        status: "published",
      },
      select: { id: true },
    });
    rubricByKey.set(rubric.key, savedRubric);

    await prisma.contentReview.upsert({
      where: { id: `fixture-review-rubric-${rubric.key}` },
      update: {
        status: "published",
        rubricId: savedRubric.id,
        reviewedAt: REVIEWED_AT,
        notes: `Task 04 ${rubric.label} reviewed synthetic rubric.`,
        nextReviewAt: NEXT_REVIEW_AT,
      },
      create: {
        id: `fixture-review-rubric-${rubric.key}`,
        status: "published",
        rubricId: savedRubric.id,
        reviewedAt: REVIEWED_AT,
        notes: `Task 04 ${rubric.label} reviewed synthetic rubric.`,
        nextReviewAt: NEXT_REVIEW_AT,
      },
    });

    for (const [index, criterion] of rubric.criteria.entries()) {
      await prisma.rubricCriterion.upsert({
        where: { id: criterion.id },
        update: {
          rubricId: savedRubric.id,
          competencyId: requireMapValue(
            competencyBySlug,
            criterion.competencySlug,
            "competency",
          ).id,
          key: criterion.key,
          label: criterion.label,
          description: criterion.description,
          weight: criterion.weight,
          minScore: 0,
          maxScore: 5,
          displayOrder: index + 1,
        },
        create: {
          id: criterion.id,
          rubricId: savedRubric.id,
          competencyId: requireMapValue(
            competencyBySlug,
            criterion.competencySlug,
            "competency",
          ).id,
          key: criterion.key,
          label: criterion.label,
          description: criterion.description,
          weight: criterion.weight,
          minScore: 0,
          maxScore: 5,
          displayOrder: index + 1,
        },
      });
    }
  }

  const questionBySlug = new Map<string, { id: string }>();
  for (const question of questions) {
    const savedQuestion = await prisma.question.upsert({
      where: {
        slug_version: {
          slug: question.slug,
          version: question.version,
        },
      },
      update: {
        prompt: question.prompt,
        evaluationFrameworkId: requireMapValue(
          frameworkByKey,
          question.frameworkKey,
          "framework",
        ).id,
        industryId: question.industrySlug
          ? requireMapValue(industryBySlug, question.industrySlug, "industry").id
          : null,
        difficulty: question.difficulty,
        seniorityLevelId: question.senioritySlug
          ? requireMapValue(seniorityBySlug, question.senioritySlug, "seniority").id
          : null,
        publicationStatus: "published",
        confidence: question.companySpecific ? "medium" : "high",
        reviewedAt: REVIEWED_AT,
        nextReviewAt: NEXT_REVIEW_AT,
      },
      create: {
        id: question.id,
        slug: question.slug,
        version: question.version,
        prompt: question.prompt,
        evaluationFrameworkId: requireMapValue(
          frameworkByKey,
          question.frameworkKey,
          "framework",
        ).id,
        industryId: question.industrySlug
          ? requireMapValue(industryBySlug, question.industrySlug, "industry").id
          : null,
        difficulty: question.difficulty,
        seniorityLevelId: question.senioritySlug
          ? requireMapValue(seniorityBySlug, question.senioritySlug, "seniority").id
          : null,
        publicationStatus: "published",
        confidence: question.companySpecific ? "medium" : "high",
        reviewedAt: REVIEWED_AT,
        nextReviewAt: NEXT_REVIEW_AT,
      },
      select: { id: true },
    });
    questionBySlug.set(question.slug, savedQuestion);

    await prisma.contentReview.upsert({
      where: { id: `fixture-review-question-${question.slug}` },
      update: {
        status: "published",
        questionId: savedQuestion.id,
        reviewedAt: REVIEWED_AT,
        notes: question.companySpecific
          ? "Company-context synthetic question reviewed; not a confirmed company interview question."
          : "Synthetic general question reviewed for development use.",
        nextReviewAt: NEXT_REVIEW_AT,
      },
      create: {
        id: `fixture-review-question-${question.slug}`,
        status: "published",
        questionId: savedQuestion.id,
        reviewedAt: REVIEWED_AT,
        notes: question.companySpecific
          ? "Company-context synthetic question reviewed; not a confirmed company interview question."
          : "Synthetic general question reviewed for development use.",
        nextReviewAt: NEXT_REVIEW_AT,
      },
    });

    if (question.companySpecific) {
      await prisma.questionCompany.upsert({
        where: { id: `fixture-question-company-${question.slug}-safaricom` },
        update: {
          questionId: savedQuestion.id,
          companyId: company.id,
          sourceId: safaricomCareersSource.id,
          weight: 10,
          rationale:
            "Safaricom-specific interview context. Prompt is synthetic and not represented as a confirmed Safaricom interview question.",
        },
        create: {
          id: `fixture-question-company-${question.slug}-safaricom`,
          questionId: savedQuestion.id,
          companyId: company.id,
          sourceId: safaricomCareersSource.id,
          weight: 10,
          rationale:
            "Safaricom-specific interview context. Prompt is synthetic and not represented as a confirmed Safaricom interview question.",
        },
      });
    }

    await prisma.questionRole.upsert({
      where: { id: `fixture-question-role-${question.slug}` },
      update: {
        questionId: savedQuestion.id,
        roleFamilyId: requireMapValue(
          roleFamilyBySlug,
          question.roleFamilySlug,
          "role family",
        ).id,
        jobRoleId: question.jobRoleSlug
          ? requireMapValue(jobRoleBySlug, question.jobRoleSlug, "job role").id
          : null,
        weight: question.companySpecific ? 10 : 5,
        rationale:
          "Task 04 fixture role association for deterministic question selection.",
      },
      create: {
        id: `fixture-question-role-${question.slug}`,
        questionId: savedQuestion.id,
        roleFamilyId: requireMapValue(
          roleFamilyBySlug,
          question.roleFamilySlug,
          "role family",
        ).id,
        jobRoleId: question.jobRoleSlug
          ? requireMapValue(jobRoleBySlug, question.jobRoleSlug, "job role").id
          : null,
        weight: question.companySpecific ? 10 : 5,
        rationale:
          "Task 04 fixture role association for deterministic question selection.",
      },
    });

    for (const competencySlug of question.competencySlugs) {
      await prisma.questionCompetency.upsert({
        where: {
          questionId_competencyId: {
            questionId: savedQuestion.id,
            competencyId: requireMapValue(
              competencyBySlug,
              competencySlug,
              "competency",
            ).id,
          },
        },
        update: {
          weight: 5,
          rationale:
            "Task 04 fixture competency association for deterministic coverage.",
        },
        create: {
          id: `fixture-question-competency-${question.slug}-${competencySlug}`,
          questionId: savedQuestion.id,
          competencyId: requireMapValue(
            competencyBySlug,
            competencySlug,
            "competency",
          ).id,
          weight: 5,
          rationale:
            "Task 04 fixture competency association for deterministic coverage.",
        },
      });
    }

    await prisma.questionVariant.upsert({
      where: {
        questionId_locale: {
          questionId: savedQuestion.id,
          locale: "en",
        },
      },
      update: { prompt: question.prompt },
      create: {
        id: `fixture-question-variant-${question.slug}-en`,
        questionId: savedQuestion.id,
        locale: "en",
        prompt: question.prompt,
      },
    });

    for (const [index, label] of question.signals.entries()) {
      await prisma.strongAnswerSignal.upsert({
        where: { id: `fixture-signal-${question.slug}-${index + 1}` },
        update: {
          questionId: savedQuestion.id,
          label,
          description: label,
          displayOrder: index + 1,
        },
        create: {
          id: `fixture-signal-${question.slug}-${index + 1}`,
          questionId: savedQuestion.id,
          label,
          description: label,
          displayOrder: index + 1,
        },
      });
    }

    for (const [index, label] of question.redFlags.entries()) {
      await prisma.redFlag.upsert({
        where: { id: `fixture-red-flag-${question.slug}-${index + 1}` },
        update: {
          questionId: savedQuestion.id,
          label,
          description: label,
          severity: index + 2,
          displayOrder: index + 1,
        },
        create: {
          id: `fixture-red-flag-${question.slug}-${index + 1}`,
          questionId: savedQuestion.id,
          label,
          description: label,
          severity: index + 2,
          displayOrder: index + 1,
        },
      });
    }

    for (const [index, followUp] of question.followUps.entries()) {
      await prisma.followUpRule.upsert({
        where: { id: `fixture-follow-up-${question.slug}-${index + 1}` },
        update: {
          questionId: savedQuestion.id,
          intent: followUp.intent,
          condition: followUp.condition,
          promptHint: followUp.promptHint,
          displayOrder: index + 1,
        },
        create: {
          id: `fixture-follow-up-${question.slug}-${index + 1}`,
          questionId: savedQuestion.id,
          intent: followUp.intent,
          condition: followUp.condition,
          promptHint: followUp.promptHint,
          displayOrder: index + 1,
        },
      });
    }
  }

  for (const plan of plans) {
    const savedPlan = await prisma.interviewPlan.upsert({
      where: {
        slug_version: {
          slug: plan.slug,
          version: plan.version,
        },
      },
      update: {
        marketId: market.id,
        companyId: company.id,
        roleFamilyId: requireMapValue(
          roleFamilyBySlug,
          plan.roleFamilySlug,
          "role family",
        ).id,
        jobRoleId: requireMapValue(jobRoleBySlug, plan.jobRoleSlug, "job role").id,
        seniorityLevelId: requireMapValue(
          seniorityBySlug,
          plan.senioritySlug,
          "seniority",
        ).id,
        focusMode: plan.focusMode,
        status: "published",
        promptVersion: plan.promptVersion,
        questionSetVersion: plan.questionSetVersion,
        rubricVersion: plan.rubricVersion,
        rationale: plan.rationale,
      },
      create: {
        id: plan.id,
        slug: plan.slug,
        version: plan.version,
        marketId: market.id,
        companyId: company.id,
        roleFamilyId: requireMapValue(
          roleFamilyBySlug,
          plan.roleFamilySlug,
          "role family",
        ).id,
        jobRoleId: requireMapValue(jobRoleBySlug, plan.jobRoleSlug, "job role").id,
        seniorityLevelId: requireMapValue(
          seniorityBySlug,
          plan.senioritySlug,
          "seniority",
        ).id,
        focusMode: plan.focusMode,
        status: "published",
        promptVersion: plan.promptVersion,
        questionSetVersion: plan.questionSetVersion,
        rubricVersion: plan.rubricVersion,
        rationale: plan.rationale,
      },
      select: { id: true },
    });

    for (const planModule of plan.modules) {
      await prisma.interviewPlanModule.upsert({
        where: { id: planModule.id },
        update: {
          interviewPlanId: savedPlan.id,
          evaluationFrameworkId: requireMapValue(
            frameworkByKey,
            planModule.frameworkKey,
            "framework",
          ).id,
          competencyId: requireMapValue(
            competencyBySlug,
            planModule.competencySlug,
            "competency",
          ).id,
          weight: planModule.weight,
          displayOrder: planModule.displayOrder,
          rubricKey: planModule.rubricKey,
          selectionRules: {
            fixtureVersion: JOBREADY_REFERENCE_FIXTURE_VERSION,
            includePublishedOnly: true,
            preferCompanyContext: planModule.frameworkKey !== "general",
            avoidNearDuplicates: true,
          },
        },
        create: {
          id: planModule.id,
          interviewPlanId: savedPlan.id,
          evaluationFrameworkId: requireMapValue(
            frameworkByKey,
            planModule.frameworkKey,
            "framework",
          ).id,
          competencyId: requireMapValue(
            competencyBySlug,
            planModule.competencySlug,
            "competency",
          ).id,
          weight: planModule.weight,
          displayOrder: planModule.displayOrder,
          rubricKey: planModule.rubricKey,
          selectionRules: {
            fixtureVersion: JOBREADY_REFERENCE_FIXTURE_VERSION,
            includePublishedOnly: true,
            preferCompanyContext: planModule.frameworkKey !== "general",
            avoidNearDuplicates: true,
          },
        },
      });
    }
  }

  const jobSource = await prisma.jobSource.upsert({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.jobSource },
    update: {
      type: "internal_fixture",
      name: "Jobready development fixtures",
      url: "https://example.test/jobready/task-04/jobs",
      isAuthorized: false,
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.jobSource,
      type: "internal_fixture",
      name: "Jobready development fixtures",
      url: "https://example.test/jobready/task-04/jobs",
      isAuthorized: false,
    },
    select: { id: true },
  });

  const jobPosting = await prisma.jobPosting.upsert({
    where: { slug: "dev-fixture-safaricom-graduate-software-engineer-expired" },
    update: {
      companyId: company.id,
      marketId: market.id,
      roleFamilyId: requireMapValue(
        roleFamilyBySlug,
        "software-engineering",
        "role family",
      ).id,
      jobRoleId: requireMapValue(jobRoleBySlug, "software-engineer", "job role").id,
      jobSourceId: jobSource.id,
      status: "expired",
      firstSeenAt: JOB_FIRST_SEEN_AT,
      lastVerifiedAt: REVIEWED_AT,
      closesAt: JOB_CLOSED_AT,
      publishedAt: null,
      retiredAt: JOB_CLOSED_AT,
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.jobPosting,
      slug: "dev-fixture-safaricom-graduate-software-engineer-expired",
      companyId: company.id,
      marketId: market.id,
      roleFamilyId: requireMapValue(
        roleFamilyBySlug,
        "software-engineering",
        "role family",
      ).id,
      jobRoleId: requireMapValue(jobRoleBySlug, "software-engineer", "job role").id,
      jobSourceId: jobSource.id,
      status: "expired",
      firstSeenAt: JOB_FIRST_SEEN_AT,
      lastVerifiedAt: REVIEWED_AT,
      closesAt: JOB_CLOSED_AT,
      publishedAt: null,
      retiredAt: JOB_CLOSED_AT,
    },
    select: { id: true },
  });

  const jobFixture = {
    title: "Development Fixture: Graduate Software Engineer (Synthetic)",
    description:
      "Synthetic expired job fixture for Jobready tests. This is not a real Safaricom vacancy and should never be presented as a live job.",
    responsibilities: [
      "Build and test small web-service features with guidance from senior engineers.",
      "Participate in code reviews, incident learning sessions, and documentation updates.",
      "Collaborate with product and operations teammates on customer-facing service improvements.",
    ],
    requirements: [
      "Graduate or entry-level software engineering experience through coursework, internship, or projects.",
      "Comfort explaining APIs, SQL, debugging steps, and safe release practices.",
      "Clear communication and willingness to learn from review feedback.",
    ],
    preferredQualifications: [
      "Exposure to TypeScript or JavaScript.",
      "Exposure to cloud services or payment-adjacent reliability concepts.",
    ],
  };

  const jobPostingVersion = await prisma.jobPostingVersion.upsert({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.jobPostingVersion },
    update: {
      jobPostingId: jobPosting.id,
      version: 1,
      title: jobFixture.title,
      description: jobFixture.description,
      responsibilities: jobFixture.responsibilities,
      requirements: jobFixture.requirements,
      preferredQualifications: jobFixture.preferredQualifications,
      location: "Nairobi, Kenya",
      workType: "hybrid",
      employmentType: "graduate_trainee",
      seniorityLevelId: requireMapValue(
        seniorityBySlug,
        "graduate-entry",
        "seniority",
      ).id,
      salaryMinAmount: null,
      salaryMaxAmount: null,
      salaryCurrency: "KES",
      salaryPeriod: null,
      contentSourceId: jobFixtureSource.id,
      jobSourceId: jobSource.id,
      applicationUrl:
        "https://example.test/jobready-fixtures/safaricom-graduate-software-engineer",
      applicationUrlHost: "example.test",
      sourcePublishedAt: JOB_FIRST_SEEN_AT,
      sourceRetrievedAt: REVIEWED_AT,
      contentHash: hashFixture(jobFixture),
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.jobPostingVersion,
      jobPostingId: jobPosting.id,
      version: 1,
      title: jobFixture.title,
      description: jobFixture.description,
      responsibilities: jobFixture.responsibilities,
      requirements: jobFixture.requirements,
      preferredQualifications: jobFixture.preferredQualifications,
      location: "Nairobi, Kenya",
      workType: "hybrid",
      employmentType: "graduate_trainee",
      seniorityLevelId: requireMapValue(
        seniorityBySlug,
        "graduate-entry",
        "seniority",
      ).id,
      salaryMinAmount: null,
      salaryMaxAmount: null,
      salaryCurrency: "KES",
      salaryPeriod: null,
      contentSourceId: jobFixtureSource.id,
      jobSourceId: jobSource.id,
      applicationUrl:
        "https://example.test/jobready-fixtures/safaricom-graduate-software-engineer",
      applicationUrlHost: "example.test",
      sourcePublishedAt: JOB_FIRST_SEEN_AT,
      sourceRetrievedAt: REVIEWED_AT,
      contentHash: hashFixture(jobFixture),
    },
    select: { id: true },
  });

  await prisma.jobPosting.update({
    where: { id: jobPosting.id },
    data: { currentVersionId: jobPostingVersion.id },
  });

  await prisma.contentReview.upsert({
    where: { id: "fixture-review-job-version-safaricom-se" },
    update: {
      status: "published",
      jobPostingVersionId: jobPostingVersion.id,
      reviewedAt: REVIEWED_AT,
      notes:
        "Expired synthetic development fixture. Not a real job and not suitable for production publication.",
      nextReviewAt: NEXT_REVIEW_AT,
    },
    create: {
      id: "fixture-review-job-version-safaricom-se",
      status: "published",
      jobPostingVersionId: jobPostingVersion.id,
      reviewedAt: REVIEWED_AT,
      notes:
        "Expired synthetic development fixture. Not a real job and not suitable for production publication.",
      nextReviewAt: NEXT_REVIEW_AT,
    },
  });

  await prisma.jobPublicationReview.upsert({
    where: { id: "fixture-publication-review-safaricom-se-expired" },
    update: {
      jobPostingId: jobPosting.id,
      jobPostingVersionId: jobPostingVersion.id,
      sourceDecision: "approved",
      duplicateDecision: "approved",
      applicationDecision: "expired",
      freshnessDecision: "expired",
      publicationDecision: "expired",
      expiryDecision: "expired",
      notes:
        "Development-only synthetic fixture. Application URL is example.test and deliberately not a live apply destination.",
      reviewedAt: REVIEWED_AT,
      nextReviewAt: NEXT_REVIEW_AT,
    },
    create: {
      id: "fixture-publication-review-safaricom-se-expired",
      jobPostingId: jobPosting.id,
      jobPostingVersionId: jobPostingVersion.id,
      sourceDecision: "approved",
      duplicateDecision: "approved",
      applicationDecision: "expired",
      freshnessDecision: "expired",
      publicationDecision: "expired",
      expiryDecision: "expired",
      notes:
        "Development-only synthetic fixture. Application URL is example.test and deliberately not a live apply destination.",
      reviewedAt: REVIEWED_AT,
      nextReviewAt: NEXT_REVIEW_AT,
    },
  });

  const jobSkillFixtures = [
    { slug: "typescript", importance: "required", evidence: "Fixture requirement mentions TypeScript exposure." },
    { slug: "api-design", importance: "required", evidence: "Fixture requirement mentions APIs." },
    { slug: "sql", importance: "required", evidence: "Fixture requirement mentions SQL." },
    { slug: "cloud-services", importance: "preferred", evidence: "Fixture preferred qualification mentions cloud services." },
  ] as const;

  for (const jobSkill of jobSkillFixtures) {
    await prisma.jobPostingSkill.upsert({
      where: {
        jobPostingVersionId_skillId_importance: {
          jobPostingVersionId: jobPostingVersion.id,
          skillId: requireMapValue(skillBySlug, jobSkill.slug, "skill").id,
          importance: jobSkill.importance,
        },
      },
      update: { evidence: jobSkill.evidence },
      create: {
        id: `fixture-job-skill-${jobSkill.slug}`,
        jobPostingVersionId: jobPostingVersion.id,
        skillId: requireMapValue(skillBySlug, jobSkill.slug, "skill").id,
        importance: jobSkill.importance,
        evidence: jobSkill.evidence,
      },
    });
  }

  const jobCompetencyFixtures = [
    { slug: "technical-fundamentals", weight: 5 },
    { slug: "problem-solving", weight: 4 },
    { slug: "collaboration", weight: 3 },
  ] as const;

  for (const jobCompetency of jobCompetencyFixtures) {
    await prisma.jobPostingCompetency.upsert({
      where: {
        jobPostingVersionId_competencyId: {
          jobPostingVersionId: jobPostingVersion.id,
          competencyId: requireMapValue(
            competencyBySlug,
            jobCompetency.slug,
            "competency",
          ).id,
        },
      },
      update: {
        weight: jobCompetency.weight,
        evidence: "Task 04 synthetic job fixture competency mapping.",
      },
      create: {
        id: `fixture-job-competency-${jobCompetency.slug}`,
        jobPostingVersionId: jobPostingVersion.id,
        competencyId: requireMapValue(
          competencyBySlug,
          jobCompetency.slug,
          "competency",
        ).id,
        weight: jobCompetency.weight,
        evidence: "Task 04 synthetic job fixture competency mapping.",
      },
    });
  }

  const user = await prisma.user.upsert({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.syntheticUser },
    update: {
      name: "Synthetic Fixture Candidate",
      email: "synthetic.fixture.candidate@example.test",
      credits: 0,
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.syntheticUser,
      name: "Synthetic Fixture Candidate",
      email: "synthetic.fixture.candidate@example.test",
      credits: 0,
    },
    select: { id: true },
  });

  const candidateDocument = await prisma.candidateDocument.upsert({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocument },
    update: {
      userId: user.id,
      kind: "cv",
      title: "Synthetic CV Fixture - Not Real Candidate Data",
      status: "active",
      deletedAt: null,
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocument,
      userId: user.id,
      kind: "cv",
      title: "Synthetic CV Fixture - Not Real Candidate Data",
      status: "active",
      deletedAt: null,
    },
    select: { id: true },
  });

  const syntheticCvFacts = [
    "Built a classroom payments dashboard using TypeScript and SQL.",
    "Collaborated with a student team to debug API retry behavior.",
    "Presented a final-year project demo to peers and faculty reviewers.",
  ];

  const candidateDocumentVersion = await prisma.candidateDocumentVersion.upsert({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocumentVersion },
    update: {
      userId: user.id,
      documentId: candidateDocument.id,
      version: 1,
      status: "parsed",
      r2Bucket: "jobready-fixture-candidate-documents-development",
      r2Key: "fixtures/synthetic-candidate/cv-v1.txt",
      r2Etag: "fixture-etag-synthetic-cv-v1",
      checksumSha256: hashFixture(syntheticCvFacts),
      contentHash: hashFixture({ syntheticCvFacts }),
      mimeType: "text/plain",
      sizeBytes: 512,
      scanStatus: "clean",
      scanProvider: "fixture-scanner",
      scanVersion: "fixture-v1",
      structuredFactsSchemaVersion: "jobready-candidate-facts-v1",
      parsedTextHash: hashFixture("synthetic-cv-parsed-text-v1"),
      deletedAt: null,
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.candidateDocumentVersion,
      userId: user.id,
      documentId: candidateDocument.id,
      version: 1,
      status: "parsed",
      r2Bucket: "jobready-fixture-candidate-documents-development",
      r2Key: "fixtures/synthetic-candidate/cv-v1.txt",
      r2Etag: "fixture-etag-synthetic-cv-v1",
      checksumSha256: hashFixture(syntheticCvFacts),
      contentHash: hashFixture({ syntheticCvFacts }),
      mimeType: "text/plain",
      sizeBytes: 512,
      scanStatus: "clean",
      scanProvider: "fixture-scanner",
      scanVersion: "fixture-v1",
      structuredFactsSchemaVersion: "jobready-candidate-facts-v1",
      parsedTextHash: hashFixture("synthetic-cv-parsed-text-v1"),
      deletedAt: null,
    },
    select: { id: true },
  });

  await prisma.candidateDocument.update({
    where: { id: candidateDocument.id },
    data: { currentVersionId: candidateDocumentVersion.id },
  });

  const candidateFacts = [
    {
      id: "fixture-candidate-fact-typescript-project",
      type: "project",
      skillSlug: "typescript",
      label: "TypeScript dashboard project",
      sourceExcerpt:
        "Synthetic fixture: built a classroom payments dashboard using TypeScript and SQL.",
      normalizedData: {
        fixture: true,
        technologies: ["TypeScript", "SQL"],
        context: "student project",
      },
    },
    {
      id: "fixture-candidate-fact-api-debugging",
      type: "experience",
      skillSlug: "api-design",
      label: "API retry debugging practice",
      sourceExcerpt:
        "Synthetic fixture: collaborated with a student team to debug API retry behavior.",
      normalizedData: {
        fixture: true,
        behaviors: ["debugging", "collaboration", "retry handling"],
      },
    },
    {
      id: "fixture-candidate-fact-presentation",
      type: "achievement",
      skillSlug: "stakeholder-management",
      label: "Project demo presentation",
      sourceExcerpt:
        "Synthetic fixture: presented a final-year project demo to peers and faculty reviewers.",
      normalizedData: {
        fixture: true,
        behaviors: ["communication", "demo", "feedback"],
      },
    },
  ] as const;

  for (const fact of candidateFacts) {
    await prisma.candidateFact.upsert({
      where: { id: fact.id },
      update: {
        userId: user.id,
        documentId: candidateDocument.id,
        sourceDocumentVersionId: candidateDocumentVersion.id,
        skillId: requireMapValue(skillBySlug, fact.skillSlug, "skill").id,
        type: fact.type,
        evidenceSource: "document",
        label: fact.label,
        normalizedData: fact.normalizedData,
        sourceExcerpt: fact.sourceExcerpt,
        userConfirmedAt: null,
      },
      create: {
        id: fact.id,
        userId: user.id,
        documentId: candidateDocument.id,
        sourceDocumentVersionId: candidateDocumentVersion.id,
        skillId: requireMapValue(skillBySlug, fact.skillSlug, "skill").id,
        type: fact.type,
        evidenceSource: "document",
        label: fact.label,
        normalizedData: fact.normalizedData,
        sourceExcerpt: fact.sourceExcerpt,
        userConfirmedAt: null,
      },
    });
  }

  const privateTarget = await prisma.privateJobTarget.upsert({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.privateTarget },
    update: {
      userId: user.id,
      marketId: market.id,
      companyId: company.id,
      jobRoleId: requireMapValue(jobRoleBySlug, "software-engineer", "job role").id,
      title: "Synthetic Private Target - Graduate Software Engineer",
      deletedAt: null,
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.privateTarget,
      userId: user.id,
      marketId: market.id,
      companyId: company.id,
      jobRoleId: requireMapValue(jobRoleBySlug, "software-engineer", "job role").id,
      title: "Synthetic Private Target - Graduate Software Engineer",
      deletedAt: null,
    },
    select: { id: true },
  });

  const privateTargetFixture = {
    companyName: "Safaricom",
    roleTitle: "Graduate Software Engineer",
    description:
      "Synthetic private target fixture for testing CV tailoring without publishing private candidate data.",
    requirements: [
      "Explain API retry safety and idempotency.",
      "Show clear debugging process and communication.",
      "Discuss TypeScript, SQL, and basic service reliability.",
    ],
    skills: ["typescript", "api-design", "sql", "cloud-services"],
  };

  const privateTargetVersion = await prisma.privateJobTargetVersion.upsert({
    where: { id: JOBREADY_REFERENCE_FIXTURE_IDS.privateTargetVersion },
    update: {
      privateJobTargetId: privateTarget.id,
      sourceJobPostingVersionId: jobPostingVersion.id,
      version: 1,
      companyName: privateTargetFixture.companyName,
      roleTitle: privateTargetFixture.roleTitle,
      description: privateTargetFixture.description,
      requirements: privateTargetFixture.requirements,
      skills: {
        fixture: true,
        slugs: privateTargetFixture.skills,
      },
      contentHash: hashFixture(privateTargetFixture),
    },
    create: {
      id: JOBREADY_REFERENCE_FIXTURE_IDS.privateTargetVersion,
      privateJobTargetId: privateTarget.id,
      sourceJobPostingVersionId: jobPostingVersion.id,
      version: 1,
      companyName: privateTargetFixture.companyName,
      roleTitle: privateTargetFixture.roleTitle,
      description: privateTargetFixture.description,
      requirements: privateTargetFixture.requirements,
      skills: {
        fixture: true,
        slugs: privateTargetFixture.skills,
      },
      contentHash: hashFixture(privateTargetFixture),
    },
    select: { id: true },
  });

  await prisma.privateJobTarget.update({
    where: { id: privateTarget.id },
    data: { currentVersionId: privateTargetVersion.id },
  });
}
