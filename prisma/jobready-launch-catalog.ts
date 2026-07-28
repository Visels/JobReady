import type {
  ConfidenceLevel,
  ContentSourceType,
  FollowUpIntent,
  InterviewFocusMode,
  PrismaClient,
} from "@prisma/client";

export const JOBREADY_LAUNCH_CATALOG_VERSION = "task24-2026-07-28";

const REVIEWED_AT = new Date("2026-07-28T00:00:00.000Z");
const NEXT_REVIEW_AT = new Date("2027-01-28T00:00:00.000Z");

type IdOnly = { id: string };

type SourceFixture = {
  key: string;
  id: string;
  type: ContentSourceType;
  title: string;
  publisher: string;
  url: string;
  publishedAt?: Date | null;
  retrievedAt: Date;
  isOfficial: boolean;
  researchNotes: string;
  confidence: ConfidenceLevel;
};

type TaxonomyFixture = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

type SeniorityFixture = {
  id: string;
  slug: string;
  label: string;
  displayOrder: number;
};

type StageFixture = {
  id: string;
  slug: string;
  label: string;
  displayOrder: number;
};

type JobRoleFixture = {
  id: string;
  slug: string;
  name: string;
  roleFamilySlug: string;
  description: string;
  aliases: string[];
};

type RubricCriterionFixture = {
  id: string;
  key: string;
  label: string;
  description: string;
  weight: number;
  competencySlug: string;
};

type RubricFixture = {
  id: string;
  key: string;
  version: number;
  frameworkKey: string;
  label: string;
  description: string;
  criteria: RubricCriterionFixture[];
};

type QuestionFixture = {
  id: string;
  slug: string;
  version: number;
  prompt: string;
  frameworkKey: string;
  rubricKey: string;
  industrySlug: string | null;
  difficulty: string;
  senioritySlug: string | null;
  roleFamilySlug: string;
  jobRoleSlug: string | null;
  companySlug: string | null;
  sourceKey: string | null;
  sourceRationale: string | null;
  confidence: ConfidenceLevel;
  competencySlugs: string[];
  signals: string[];
  redFlags: string[];
  followUps: {
    intent: FollowUpIntent;
    condition: string;
    promptHint: string;
  }[];
};

type PlanModuleFixture = {
  id: string;
  frameworkKey: string;
  competencySlug: string;
  weight: number;
  displayOrder: number;
  rubricKey: string;
};

type PlanFixture = {
  id: string;
  slug: string;
  version: number;
  companySlug: string | null;
  roleFamilySlug: string;
  jobRoleSlug: string | null;
  senioritySlug: string;
  interviewStageSlug: string | null;
  focusMode: InterviewFocusMode;
  promptVersion: string;
  questionSetVersion: string;
  rubricVersion: string;
  rationale: string;
  modules: PlanModuleFixture[];
};

function requireMapValue<T>(
  map: Map<string, T>,
  key: string,
  label: string,
): T {
  const value = map.get(key);
  if (!value) {
    throw new Error(`Missing ${label}: ${key}`);
  }
  return value;
}

function reviewId(target: string, slug: string) {
  return `task24-review-${target}-${slug}`;
}

const sourceReviewNotes =
  "Task 24 human review accepted this official source for employer and role-context use only. It must not be treated as leaked interview content.";

const market = {
  id: "task24-market-kenya",
  slug: "kenya",
  name: "Kenya",
  isoCode: "KE",
  currencyCode: "KES",
  timezone: "Africa/Nairobi",
};

const industries = [
  {
    id: "task24-industry-telecommunications",
    slug: "telecommunications",
    name: "Telecommunications",
    description:
      "Connectivity, mobile services, financial technology, digital platforms, and adjacent customer operations.",
  },
  {
    id: "task24-industry-banking",
    slug: "banking",
    name: "Banking",
    description:
      "Retail, corporate, relationship, and digital banking in a regulated financial-services environment.",
  },
  {
    id: "task24-industry-energy",
    slug: "energy",
    name: "Energy",
    description:
      "Energy infrastructure, transport, storage, reliability, safety, and operational excellence.",
  },
] satisfies TaxonomyFixture[];

const roleFamilies = [
  {
    id: "task24-role-family-software-engineering",
    slug: "software-engineering",
    name: "Software Engineering",
    description:
      "Builds, integrates, operates, and improves software systems and customer-facing digital platforms.",
  },
  {
    id: "task24-role-family-product-management",
    slug: "product-management",
    name: "Product Management",
    description:
      "Frames customer problems, prioritizes opportunities, aligns stakeholders, and guides delivery.",
  },
  {
    id: "task24-role-family-customer-service",
    slug: "customer-service",
    name: "Customer Service",
    description:
      "Handles customer issues, service recovery, escalation, communication, and trusted follow-through.",
  },
  {
    id: "task24-role-family-relationship-management",
    slug: "relationship-management",
    name: "Relationship Management",
    description:
      "Builds customer portfolios, discovers needs, manages commercial opportunities, and protects trust.",
  },
  {
    id: "task24-role-family-energy-engineering",
    slug: "energy-engineering",
    name: "Energy Engineering",
    description:
      "Supports safe, reliable energy infrastructure operations, maintenance, projects, and field decisions.",
  },
] satisfies TaxonomyFixture[];

const frameworks = [
  {
    id: "task24-framework-behavioral-star",
    slug: "behavioral_star",
    name: "Behavioral STAR",
    description:
      "Behavioral evidence using situation, task, action, result, ownership, and impact.",
  },
  {
    id: "task24-framework-situational",
    slug: "situational",
    name: "Situational",
    description:
      "Judgment and response structure for plausible workplace situations.",
  },
  {
    id: "task24-framework-role-knowledge",
    slug: "role_knowledge",
    name: "Role Knowledge",
    description:
      "Role-specific expectations, vocabulary, workflows, and practical awareness.",
  },
  {
    id: "task24-framework-technical-concept",
    slug: "technical_concept",
    name: "Technical Concept",
    description:
      "Technical accuracy, mechanism, practical use, and seniority-appropriate trade-offs.",
  },
  {
    id: "task24-framework-product-case",
    slug: "product_case",
    name: "Product Case",
    description:
      "Problem framing, user understanding, prioritization, metrics, and recommendation.",
  },
  {
    id: "task24-framework-analytics-case",
    slug: "analytics_case",
    name: "Analytics Case",
    description:
      "Metrics, assumptions, diagnosis, experiment design, and decision-making.",
  },
  {
    id: "task24-framework-system-design",
    slug: "system_design",
    name: "System Design",
    description:
      "Requirements, architecture, scalability, reliability, security, and trade-offs.",
  },
  {
    id: "task24-framework-coding",
    slug: "coding",
    name: "Coding",
    description:
      "Correctness, reasoning, complexity, edge cases, tests, and communication.",
  },
  {
    id: "task24-framework-general",
    slug: "general",
    name: "General",
    description:
      "General readiness, communication clarity, motivation, and interview hygiene.",
  },
] satisfies TaxonomyFixture[];

const competencies = [
  {
    id: "task24-competency-ownership",
    slug: "ownership",
    name: "Ownership",
    description:
      "Takes responsibility, follows through, and communicates risks early.",
  },
  {
    id: "task24-competency-stakeholder-communication",
    slug: "stakeholder-communication",
    name: "Stakeholder Communication",
    description:
      "Explains trade-offs clearly and adapts communication to technical and non-technical audiences.",
  },
  {
    id: "task24-competency-customer-empathy",
    slug: "customer-empathy",
    name: "Customer Empathy",
    description:
      "Understands user needs, constraints, trust, accessibility, and service context.",
  },
  {
    id: "task24-competency-product-prioritization",
    slug: "product-prioritization",
    name: "Product Prioritization",
    description:
      "Balances impact, effort, risk, learning value, and operational constraints.",
  },
  {
    id: "task24-competency-metrics-analytics",
    slug: "metrics-analytics",
    name: "Metrics and Analytics",
    description:
      "Defines useful measures, interprets evidence, and avoids vanity metrics.",
  },
  {
    id: "task24-competency-technical-fundamentals",
    slug: "technical-fundamentals",
    name: "Technical Fundamentals",
    description:
      "Explains core technical concepts accurately and uses them in practical scenarios.",
  },
  {
    id: "task24-competency-systems-thinking",
    slug: "systems-thinking",
    name: "Systems Thinking",
    description:
      "Reasons about interfaces, dependencies, reliability, observability, and change impact.",
  },
  {
    id: "task24-competency-problem-solving",
    slug: "problem-solving",
    name: "Problem Solving",
    description:
      "Breaks down ambiguous problems, tests assumptions, and chooses next actions.",
  },
  {
    id: "task24-competency-collaboration",
    slug: "collaboration",
    name: "Collaboration",
    description:
      "Works constructively with peers, reviewers, customers, and cross-functional teams.",
  },
  {
    id: "task24-competency-delivery-execution",
    slug: "delivery-execution",
    name: "Delivery and Execution",
    description:
      "Converts priorities into reliable delivery, feedback loops, and measurable progress.",
  },
  {
    id: "task24-competency-customer-service-excellence",
    slug: "customer-service-excellence",
    name: "Customer Service Excellence",
    description:
      "Responds to customer needs with empathy, accuracy, escalation discipline, and follow-through.",
  },
  {
    id: "task24-competency-digital-customer-experience",
    slug: "digital-customer-experience",
    name: "Digital Customer Experience",
    description:
      "Uses service systems, customer signals, and digital channels to improve customer outcomes.",
  },
  {
    id: "task24-competency-relationship-building",
    slug: "relationship-building",
    name: "Relationship Building",
    description:
      "Earns trust through discovery, consistent communication, and customer-centered judgment.",
  },
  {
    id: "task24-competency-sales-pipeline-management",
    slug: "sales-pipeline-management",
    name: "Sales Pipeline Management",
    description:
      "Manages prospects, opportunities, portfolio growth, and commercial follow-up responsibly.",
  },
  {
    id: "task24-competency-regulatory-risk-awareness",
    slug: "regulatory-risk-awareness",
    name: "Regulatory and Risk Awareness",
    description:
      "Recognizes compliance, privacy, credit, conduct, and operational-risk constraints.",
  },
  {
    id: "task24-competency-safety-environmental-stewardship",
    slug: "safety-environmental-stewardship",
    name: "Safety and Environmental Stewardship",
    description:
      "Makes safety-first decisions and respects environmental, incident, and permit controls.",
  },
  {
    id: "task24-competency-operational-reliability",
    slug: "operational-reliability",
    name: "Operational Reliability",
    description:
      "Protects continuity, quality, observability, and disciplined recovery in operational systems.",
  },
  {
    id: "task24-competency-field-engineering-judgment",
    slug: "field-engineering-judgment",
    name: "Field Engineering Judgment",
    description:
      "Applies engineering reasoning safely in site, maintenance, commissioning, and handover contexts.",
  },
] satisfies TaxonomyFixture[];

const seniorityLevels = [
  {
    id: "task24-seniority-internship",
    slug: "internship",
    label: "Internship",
    displayOrder: 10,
  },
  {
    id: "task24-seniority-graduate-entry",
    slug: "graduate-entry",
    label: "Graduate/Entry",
    displayOrder: 20,
  },
  {
    id: "task24-seniority-mid-level",
    slug: "mid-level",
    label: "Mid-level",
    displayOrder: 30,
  },
  {
    id: "task24-seniority-senior",
    slug: "senior",
    label: "Senior",
    displayOrder: 40,
  },
  {
    id: "task24-seniority-lead-manager",
    slug: "lead-manager",
    label: "Lead/Manager",
    displayOrder: 50,
  },
] satisfies SeniorityFixture[];

const interviewStages = [
  {
    id: "task24-stage-screening",
    slug: "screening",
    label: "Screening",
    displayOrder: 10,
  },
  {
    id: "task24-stage-hiring-manager",
    slug: "hiring-manager",
    label: "Hiring Manager",
    displayOrder: 20,
  },
  {
    id: "task24-stage-technical-functional",
    slug: "technical-functional",
    label: "Technical/Functional",
    displayOrder: 30,
  },
  {
    id: "task24-stage-panel",
    slug: "panel",
    label: "Panel",
    displayOrder: 40,
  },
] satisfies StageFixture[];

const jobRoles = [
  {
    id: "task24-job-role-software-engineer",
    slug: "software-engineer",
    name: "Software Engineer",
    roleFamilySlug: "software-engineering",
    description:
      "Builds and maintains software services, APIs, data flows, and user-facing systems.",
    aliases: ["Graduate Software Engineer", "Backend Engineer", "Frontend Engineer"],
  },
  {
    id: "task24-job-role-product-manager",
    slug: "product-manager",
    name: "Product Manager",
    roleFamilySlug: "product-management",
    description:
      "Owns customer problems, prioritization, stakeholder alignment, delivery, and product outcomes.",
    aliases: ["Associate Product Manager", "Product Owner", "Digital Product Manager"],
  },
  {
    id: "task24-job-role-customer-service-officer",
    slug: "customer-service-officer",
    name: "Customer Service Officer",
    roleFamilySlug: "customer-service",
    description:
      "Supports customers through service requests, complaints, digital-service issues, escalation, and resolution tracking.",
    aliases: [
      "Customer Care Officer",
      "Customer Experience Officer",
      "Contact Centre Officer",
    ],
  },
  {
    id: "task24-job-role-relationship-manager",
    slug: "relationship-manager",
    name: "Relationship Manager",
    roleFamilySlug: "relationship-management",
    description:
      "Manages a customer portfolio, identifies needs, coordinates solutions, and balances growth with risk and trust.",
    aliases: [
      "Senior Relationship Manager",
      "Business Relationship Manager",
      "Portfolio Relationship Manager",
    ],
  },
  {
    id: "task24-job-role-graduate-trainee-engineer",
    slug: "graduate-trainee-engineer",
    name: "Graduate Trainee Engineer",
    roleFamilySlug: "energy-engineering",
    description:
      "Entry-level engineering role preparing for safe field, operations, reliability, and project work in energy infrastructure.",
    aliases: [
      "Engineering Graduate Trainee",
      "Graduate Engineer",
      "Trainee Engineer",
    ],
  },
  {
    id: "task24-job-role-pipeline-engineer",
    slug: "pipeline-engineer",
    name: "Pipeline Engineer",
    roleFamilySlug: "energy-engineering",
    description:
      "Supports pipeline, pumping, storage, maintenance, reliability, and project engineering decisions.",
    aliases: ["Mechanical Engineer", "Operations Engineer", "Maintenance Engineer"],
  },
] satisfies JobRoleFixture[];

const sources: SourceFixture[] = [
  {
    key: "safaricom-careers",
    id: "task24-source-safaricom-careers",
    type: "official_career_page",
    title: "Safaricom Careers",
    publisher: "Safaricom PLC",
    url: "https://www.safaricom.co.ke/careers/",
    retrievedAt: REVIEWED_AT,
    isOfficial: true,
    researchNotes:
      "Official careers page reviewed for Safaricom employer context, technology-career positioning, and application destination.",
    confidence: "high",
  },
  {
    key: "safaricom-annual-report-2026",
    id: "task24-source-safaricom-annual-report-2026",
    type: "annual_report",
    title: "Safaricom PLC 2026 Annual Report",
    publisher: "Safaricom PLC",
    url: "https://www.safaricom.co.ke/images/Downloads/2026-Annual-Report.pdf",
    retrievedAt: REVIEWED_AT,
    isOfficial: true,
    researchNotes:
      "Official annual report reviewed for strategy, digital-services context, customer-impact framing, and reliability themes.",
    confidence: "high",
  },
  {
    key: "safaricom-annual-reports",
    id: "task24-source-safaricom-annual-reports",
    type: "company_site",
    title: "Safaricom Annual Reports Index",
    publisher: "Safaricom PLC",
    url: "https://www.safaricom.co.ke/investor-relations-landing/reports/annual-reports",
    retrievedAt: REVIEWED_AT,
    isOfficial: true,
    researchNotes:
      "Official annual-report index reviewed to confirm current reporting cadence and the 2026 report listing.",
    confidence: "high",
  },
  {
    key: "kcb-careers",
    id: "task24-source-kcb-careers",
    type: "official_career_page",
    title: "KCB Group Careers",
    publisher: "KCB Group",
    url: "https://kcbgroup.com/careers",
    retrievedAt: REVIEWED_AT,
    isOfficial: true,
    researchNotes:
      "Official careers page reviewed for KCB employer proposition, purpose language, network, development, and recruitment process.",
    confidence: "high",
  },
  {
    key: "kcb-integrated-reports",
    id: "task24-source-kcb-integrated-reports",
    type: "annual_report",
    title: "KCB Group Integrated Reports",
    publisher: "KCB Group",
    url: "https://kcbgroup.com/integrated-reports",
    retrievedAt: REVIEWED_AT,
    isOfficial: true,
    researchNotes:
      "Official integrated-report index reviewed for current 2025 report availability and group context.",
    confidence: "high",
  },
  {
    key: "kcb-customer-experience-systems-job",
    id: "task24-source-kcb-customer-experience-systems-job",
    type: "official_career_page",
    title: "KCB Applications Specialist - Customer Experience Systems",
    publisher: "KCB Bank Kenya",
    url: "https://ke.kcbgroup.com/applications-specialist-customer-experience-systems",
    retrievedAt: REVIEWED_AT,
    isOfficial: true,
    researchNotes:
      "Official recent KCB Kenya job page reviewed for customer-experience systems and CRM context. Application deadline was 24 July 2026, so this is role context only and not a live job publication.",
    confidence: "high",
  },
  {
    key: "kcb-relationship-manager-job",
    id: "task24-source-kcb-relationship-manager-job",
    type: "official_career_page",
    title: "KCB Senior Relationship Manager - Infrastructure and Energy",
    publisher: "KCB Bank Kenya",
    url: "https://ke.kcbgroup.com/senior-relationship-manager-infrastructure-energy",
    retrievedAt: REVIEWED_AT,
    isOfficial: true,
    researchNotes:
      "Official recent KCB Kenya job page reviewed for relationship-management portfolio, retention, infrastructure, and energy segment context. Treated as recent context, not a live job listing.",
    confidence: "high",
  },
  {
    key: "kpc-careers",
    id: "task24-source-kpc-careers",
    type: "official_career_page",
    title: "Kenya Pipeline Company Careers",
    publisher: "Kenya Pipeline Company PLC",
    url: "https://www.kpc.co.ke/career/",
    retrievedAt: REVIEWED_AT,
    isOfficial: true,
    researchNotes:
      "Official careers page reviewed for e-recruitment portal, current visible vacancies, industrial attachment link, and internship status.",
    confidence: "high",
  },
  {
    key: "kpc-about",
    id: "task24-source-kpc-about",
    type: "company_site",
    title: "Kenya Pipeline Company About",
    publisher: "Kenya Pipeline Company PLC",
    url: "https://www.kpc.co.ke/about/",
    retrievedAt: REVIEWED_AT,
    isOfficial: true,
    researchNotes:
      "Official about page reviewed for mandate, pipeline and storage infrastructure, strategic pillars, mission, vision, values, and service principles.",
    confidence: "high",
  },
  {
    key: "kpc-morendat",
    id: "task24-source-kpc-morendat",
    type: "company_site",
    title: "Morendat Institute of Oil and Gas",
    publisher: "Kenya Pipeline Company PLC",
    url: "https://www.kpc.co.ke/morendat-institute-of-oil-gas/",
    retrievedAt: REVIEWED_AT,
    isOfficial: true,
    researchNotes:
      "Official KPC page reviewed for oil-and-gas skills development, accredited courses, research, and capacity-building context.",
    confidence: "high",
  },
  {
    key: "kpc-line-iv-upgrade",
    id: "task24-source-kpc-line-iv-upgrade",
    type: "company_site",
    title: "KPC Western Kenya Pipeline Flowrate Upgrade",
    publisher: "Kenya Pipeline Company PLC",
    url: "https://kpc.co.ke/kpc-upgrades-western-kenya-pipeline-boosting-the-flowrate-to-515m3-per-hour/",
    retrievedAt: REVIEWED_AT,
    isOfficial: true,
    researchNotes:
      "Official KPC news page reviewed for pipeline-flowrate improvement, pumping-station project, contractor coordination, and operations-reliability context.",
    confidence: "high",
  },
];

const companies = [
  {
    id: "task24-company-safaricom",
    slug: "safaricom",
    legalName: "Safaricom PLC",
    displayName: "Safaricom",
    industrySlug: "telecommunications",
    websiteUrl: "https://www.safaricom.co.ke/",
    careersUrl: "https://www.safaricom.co.ke/careers/",
    summary:
      "Reviewed Kenyan telecommunications and digital-services employer context for software engineering and product management preparation. Sources support practice around customer impact, digital services, reliability, and responsible product decisions.",
    focusAreas: [
      "mobile services",
      "digital financial services",
      "customer-facing platforms",
      "service reliability",
      "product inclusion",
    ],
    sourceKeys: [
      "safaricom-careers",
      "safaricom-annual-report-2026",
      "safaricom-annual-reports",
    ],
  },
  {
    id: "task24-company-kcb",
    slug: "kcb",
    legalName: "KCB Bank Kenya Limited",
    displayName: "KCB Bank Kenya",
    industrySlug: "banking",
    websiteUrl: "https://ke.kcbgroup.com/",
    careersUrl: "https://kcbgroup.com/careers",
    summary:
      "Reviewed Kenyan banking employer context for customer service and relationship-management preparation. Sources support practice around purpose-led service, East African customer impact, customer-experience systems, portfolio growth, retention, and risk-aware relationship decisions.",
    focusAreas: [
      "customer service",
      "customer experience systems",
      "relationship management",
      "financial inclusion",
      "regulated banking conduct",
    ],
    sourceKeys: [
      "kcb-careers",
      "kcb-integrated-reports",
      "kcb-customer-experience-systems-job",
      "kcb-relationship-manager-job",
    ],
  },
  {
    id: "task24-company-kenya-pipeline-company",
    slug: "kenya-pipeline-company",
    legalName: "Kenya Pipeline Company PLC",
    displayName: "Kenya Pipeline Company",
    industrySlug: "energy",
    websiteUrl: "https://www.kpc.co.ke/",
    careersUrl: "https://www.kpc.co.ke/career/",
    summary:
      "Reviewed Kenyan energy-infrastructure employer context for graduate trainee and pipeline engineering preparation. Sources support practice around safe delivery, reliable petroleum-product transport and storage, operational excellence, digitization, ESG, field coordination, and oil-and-gas skills development.",
    focusAreas: [
      "pipeline operations",
      "storage and pumping facilities",
      "safety and environmental stewardship",
      "operational reliability",
      "engineering capability building",
    ],
    sourceKeys: ["kpc-careers", "kpc-about", "kpc-morendat", "kpc-line-iv-upgrade"],
  },
];

const rubrics = [
  {
    id: "task24-rubric-customer-service-excellence-v1",
    key: "customer_service_excellence_v1",
    version: 1,
    frameworkKey: "role_knowledge",
    label: "Customer Service Excellence v1",
    description:
      "Scores customer need triage, empathy, accurate service communication, escalation discipline, privacy, and follow-through.",
    criteria: [
      {
        id: "task24-rubric-criterion-customer-need-triage",
        key: "customer_need_triage",
        label: "Customer need triage",
        description:
          "Identifies the customer need, urgency, available evidence, and correct service path before acting.",
        weight: 30,
        competencySlug: "customer-service-excellence",
      },
      {
        id: "task24-rubric-criterion-empathy-clarity",
        key: "empathy_clarity",
        label: "Empathy and clarity",
        description:
          "Communicates respectfully, sets realistic expectations, and avoids blaming the customer.",
        weight: 25,
        competencySlug: "stakeholder-communication",
      },
      {
        id: "task24-rubric-criterion-service-follow-through",
        key: "follow_through",
        label: "Follow-through",
        description:
          "Tracks ownership, escalation, resolution evidence, and customer updates through closure.",
        weight: 25,
        competencySlug: "ownership",
      },
      {
        id: "task24-rubric-criterion-risk-privacy-controls",
        key: "risk_privacy_controls",
        label: "Risk and privacy controls",
        description:
          "Protects customer data, follows policy, and escalates risk-sensitive issues appropriately.",
        weight: 20,
        competencySlug: "regulatory-risk-awareness",
      },
    ],
  },
  {
    id: "task24-rubric-relationship-management-v1",
    key: "relationship_management_v1",
    version: 1,
    frameworkKey: "role_knowledge",
    label: "Relationship Management v1",
    description:
      "Scores portfolio strategy, customer discovery, responsible growth, risk awareness, ethics, and durable relationship follow-through.",
    criteria: [
      {
        id: "task24-rubric-criterion-portfolio-strategy",
        key: "portfolio_strategy",
        label: "Portfolio strategy",
        description:
          "Segments the portfolio, sets clear growth priorities, and protects relationship quality.",
        weight: 30,
        competencySlug: "sales-pipeline-management",
      },
      {
        id: "task24-rubric-criterion-customer-discovery",
        key: "customer_discovery",
        label: "Customer discovery",
        description:
          "Understands customer context, decision makers, pain points, and success criteria before proposing solutions.",
        weight: 25,
        competencySlug: "relationship-building",
      },
      {
        id: "task24-rubric-criterion-risk-credit-ethics",
        key: "risk_credit_ethics",
        label: "Risk, credit, and ethics",
        description:
          "Balances growth with credit quality, conduct, regulatory requirements, and long-term trust.",
        weight: 25,
        competencySlug: "regulatory-risk-awareness",
      },
      {
        id: "task24-rubric-criterion-relationship-execution",
        key: "execution_follow_through",
        label: "Execution and follow-through",
        description:
          "Coordinates internal teams, keeps commitments visible, and closes loops with the customer.",
        weight: 20,
        competencySlug: "ownership",
      },
    ],
  },
  {
    id: "task24-rubric-energy-engineering-v1",
    key: "energy_engineering_v1",
    version: 1,
    frameworkKey: "technical_concept",
    label: "Energy Engineering v1",
    description:
      "Scores safety-first engineering judgment, systems reasoning, operational reliability, field communication, and practical constraints.",
    criteria: [
      {
        id: "task24-rubric-criterion-safety-first-judgment",
        key: "safety_first_judgment",
        label: "Safety-first judgment",
        description:
          "Names relevant hazards, controls, permits, escalation points, and stop-work conditions before optimization.",
        weight: 30,
        competencySlug: "safety-environmental-stewardship",
      },
      {
        id: "task24-rubric-criterion-energy-system-mechanism",
        key: "system_mechanism",
        label: "System mechanism",
        description:
          "Explains how pipeline, pumping, storage, measurement, or control-system dependencies affect the decision.",
        weight: 25,
        competencySlug: "systems-thinking",
      },
      {
        id: "task24-rubric-criterion-reliability-operations",
        key: "reliability_operations",
        label: "Reliability and operations",
        description:
          "Considers continuity, maintenance, monitoring, handover, and recovery without hiding uncertainty.",
        weight: 25,
        competencySlug: "operational-reliability",
      },
      {
        id: "task24-rubric-criterion-field-communication",
        key: "field_communication",
        label: "Field communication",
        description:
          "Communicates constraints, evidence, and next actions clearly across engineering, operations, and contractors.",
        weight: 20,
        competencySlug: "field-engineering-judgment",
      },
    ],
  },
] satisfies RubricFixture[];

const questions = [
  {
    id: "task24-question-safaricom-software-reliability-customer-impact",
    slug: "safaricom-software-reliability-customer-impact",
    version: 1,
    prompt:
      "Tell me about a time you improved reliability or supportability for a customer-facing digital service. What changed for users, and how did you know?",
    frameworkKey: "behavioral_star",
    rubricKey: "behavioral_star_v1",
    industrySlug: "telecommunications",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    companySlug: "safaricom",
    sourceKey: "safaricom-annual-report-2026",
    sourceRationale:
      "Safaricom source supports customer-impact and digital-service context. Prompt is synthetic practice content, not a leaked or confirmed Safaricom interview question.",
    confidence: "medium",
    competencySlugs: ["ownership", "operational-reliability", "customer-empathy"],
    signals: [
      "Separates the user's pain from the technical failure mode.",
      "Explains a concrete reliability or supportability change and personal ownership.",
      "Uses evidence such as incidents, latency, failures, support contacts, or customer feedback.",
    ],
    redFlags: [
      "Describes reliability only as code cleanup with no customer impact.",
      "Claims team success without personal action or measurable follow-through.",
    ],
    followUps: [
      {
        intent: "mechanism",
        condition: "The candidate names an improvement but not how it worked.",
        promptHint: "What mechanism made the service more reliable or easier to support?",
      },
      {
        intent: "metrics",
        condition: "The answer has no evidence of customer or operational impact.",
        promptHint: "Which metric or signal changed after your work?",
      },
    ],
  },
  {
    id: "task24-question-safaricom-software-mobile-money-failure-investigation",
    slug: "safaricom-software-mobile-money-failure-investigation",
    version: 1,
    prompt:
      "How would you investigate intermittent failures in a high-volume mobile-money payment flow while protecting customer data?",
    frameworkKey: "technical_concept",
    rubricKey: "technical_concept_v1",
    industrySlug: "telecommunications",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    companySlug: "safaricom",
    sourceKey: "safaricom-annual-report-2026",
    sourceRationale:
      "Safaricom source supports digital financial-service and customer-trust context. Prompt is synthetic practice content, not a leaked or confirmed Safaricom interview question.",
    confidence: "medium",
    competencySlugs: [
      "technical-fundamentals",
      "systems-thinking",
      "regulatory-risk-awareness",
    ],
    signals: [
      "Starts with safe logs, traces, metrics, and transaction states rather than raw customer data.",
      "Forms hypotheses across client, API, dependency, queue, database, and reconciliation paths.",
      "Names privacy, access-control, rollback, and communication safeguards.",
    ],
    redFlags: [
      "Requests raw customer credentials, PINs, or private transaction data.",
      "Jumps directly to a code fix without narrowing the failure domain.",
    ],
    followUps: [
      {
        intent: "risks",
        condition: "The candidate proposes debugging steps without privacy safeguards.",
        promptHint: "Which customer data should never be exposed during your investigation?",
      },
      {
        intent: "assumptions",
        condition: "The answer assumes the failure is in one component.",
        promptHint: "What else could explain intermittent failures besides the API code?",
      },
    ],
  },
  {
    id: "task24-question-safaricom-software-secure-release-system-design",
    slug: "safaricom-software-secure-release-system-design",
    version: 1,
    prompt:
      "Design a safe release approach for a customer-facing payment feature where reliability, rollback, monitoring, and support readiness all matter.",
    frameworkKey: "system_design",
    rubricKey: "technical_concept_v1",
    industrySlug: "telecommunications",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    companySlug: "safaricom",
    sourceKey: "safaricom-careers",
    sourceRationale:
      "Safaricom source supports technology and customer-facing career context. Prompt is synthetic practice content, not a leaked or confirmed Safaricom interview question.",
    confidence: "medium",
    competencySlugs: [
      "systems-thinking",
      "technical-fundamentals",
      "stakeholder-communication",
    ],
    signals: [
      "Defines rollout stages, feature flags, monitoring, rollback, and support handoff.",
      "Protects security and customer trust while controlling blast radius.",
      "Explains trade-offs appropriate for an entry-level engineer.",
    ],
    redFlags: [
      "Releases to all customers without monitoring or rollback.",
      "Treats support and incident communication as someone else's concern.",
    ],
    followUps: [
      {
        intent: "trade_off",
        condition: "The candidate lists release steps without choices.",
        promptHint: "What trade-off would make you choose a staged rollout over a full release?",
      },
      {
        intent: "evidence",
        condition: "The answer lacks readiness criteria.",
        promptHint: "What evidence would tell you the feature is safe to expand?",
      },
    ],
  },
  {
    id: "task24-question-safaricom-software-code-review-incident",
    slug: "safaricom-software-code-review-incident",
    version: 1,
    prompt:
      "A reviewer finds that your change could break a customer payment edge case close to release. How would you respond?",
    frameworkKey: "situational",
    rubricKey: "role_knowledge_v1",
    industrySlug: "telecommunications",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    companySlug: "safaricom",
    sourceKey: "safaricom-careers",
    sourceRationale:
      "Safaricom source supports technology-career context. Prompt is synthetic practice content, not a leaked or confirmed Safaricom interview question.",
    confidence: "medium",
    competencySlugs: ["collaboration", "problem-solving", "ownership"],
    signals: [
      "Thanks the reviewer and restates the risk in customer-impact terms.",
      "Narrows the edge case with tests, rollback options, and release-impact discussion.",
      "Communicates the decision and next action clearly.",
    ],
    redFlags: [
      "Dismisses review feedback because release is close.",
      "Focuses on defending the code rather than protecting customers.",
    ],
    followUps: [
      {
        intent: "ownership",
        condition: "The candidate says the reviewer should decide.",
        promptHint: "What would you personally do next before release?",
      },
      {
        intent: "risks",
        condition: "The answer does not describe customer impact.",
        promptHint: "What customer risk are you trying to prevent?",
      },
    ],
  },
  {
    id: "task24-question-safaricom-software-purpose-growth",
    slug: "safaricom-software-purpose-growth",
    version: 1,
    prompt:
      "Why are you interested in software engineering work that supports Kenyan digital-service customers, and how would you keep learning after joining?",
    frameworkKey: "general",
    rubricKey: "role_knowledge_v1",
    industrySlug: "telecommunications",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    companySlug: "safaricom",
    sourceKey: "safaricom-careers",
    sourceRationale:
      "Safaricom source supports employer and technology-career context. Prompt is synthetic practice content, not a leaked or confirmed Safaricom interview question.",
    confidence: "medium",
    competencySlugs: ["customer-empathy", "collaboration", "delivery-execution"],
    signals: [
      "Connects motivation to customer outcomes, learning, and service quality.",
      "Names practical learning loops such as code reviews, incident reviews, and user feedback.",
      "Avoids prestige-only motivation.",
    ],
    redFlags: [
      "Gives only brand-prestige reasons.",
      "Cannot describe how engineering work affects customers.",
    ],
    followUps: [
      {
        intent: "example",
        condition: "The answer is generic.",
        promptHint: "Give one example of a customer signal you would want engineers to understand.",
      },
      {
        intent: "ownership",
        condition: "The candidate does not mention learning behavior.",
        promptHint: "What would you do in your first month to learn the service safely?",
      },
    ],
  },
  {
    id: "task24-question-safaricom-product-customer-impact-ownership",
    slug: "safaricom-product-customer-impact-ownership",
    version: 1,
    prompt:
      "Tell me about a time you owned a product or service decision where customer trust, business goals, and delivery constraints had to be balanced.",
    frameworkKey: "behavioral_star",
    rubricKey: "behavioral_star_v1",
    industrySlug: "telecommunications",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    companySlug: "safaricom",
    sourceKey: "safaricom-annual-report-2026",
    sourceRationale:
      "Safaricom source supports customer-impact and digital-service context. Prompt is synthetic practice content, not a leaked or confirmed Safaricom interview question.",
    confidence: "medium",
    competencySlugs: [
      "ownership",
      "customer-empathy",
      "stakeholder-communication",
    ],
    signals: [
      "Uses STAR structure with a clear product decision and personal ownership.",
      "Balances customer trust, business impact, delivery limits, and stakeholder communication.",
      "Names evidence, outcome, and what they learned.",
    ],
    redFlags: [
      "Frames the product decision as simply following stakeholder requests.",
      "Does not explain customer trust or delivery constraints.",
    ],
    followUps: [
      {
        intent: "ownership",
        condition: "The answer describes a shared product decision.",
        promptHint: "Which decision or trade-off was specifically yours?",
      },
      {
        intent: "evidence",
        condition: "The result is vague.",
        promptHint: "What evidence showed the decision was right or needed adjustment?",
      },
    ],
  },
  {
    id: "task24-question-safaricom-product-first-time-mpesa-user",
    slug: "safaricom-product-first-time-mpesa-user",
    version: 1,
    prompt:
      "Design a small improvement that helps a first-time mobile-money user complete a transaction confidently without increasing support load.",
    frameworkKey: "product_case",
    rubricKey: "product_case_v1",
    industrySlug: "telecommunications",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    companySlug: "safaricom",
    sourceKey: "safaricom-annual-report-2026",
    sourceRationale:
      "Safaricom source supports digital financial-service and customer-impact context. Prompt is synthetic practice content, not a leaked or confirmed Safaricom interview question.",
    confidence: "medium",
    competencySlugs: [
      "customer-empathy",
      "product-prioritization",
      "metrics-analytics",
    ],
    signals: [
      "Identifies the first-time user's trust, comprehension, and error-recovery needs.",
      "Chooses a small testable improvement with clear success and guardrail metrics.",
      "Considers support load, fraud risk, accessibility, and user confidence.",
    ],
    redFlags: [
      "Assumes all users understand the payment flow already.",
      "Optimizes conversion without guardrails for trust, safety, or support contacts.",
    ],
    followUps: [
      {
        intent: "metrics",
        condition: "The candidate does not name success metrics.",
        promptHint: "Which success metric and guardrail would you track first?",
      },
      {
        intent: "risks",
        condition: "The recommendation omits trust or safety risks.",
        promptHint: "What could accidentally reduce user trust in this flow?",
      },
    ],
  },
  {
    id: "task24-question-safaricom-product-app-payment-dropoff",
    slug: "safaricom-product-app-payment-dropoff",
    version: 1,
    prompt:
      "An app-to-payment conversion rate drops after a release. Which metrics would you inspect, and how would you decide whether to roll back, fix forward, or monitor?",
    frameworkKey: "analytics_case",
    rubricKey: "product_case_v1",
    industrySlug: "telecommunications",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    companySlug: "safaricom",
    sourceKey: "safaricom-annual-report-2026",
    sourceRationale:
      "Safaricom source supports digital-service and customer-trust context. Prompt is synthetic practice content, not a leaked or confirmed Safaricom interview question.",
    confidence: "medium",
    competencySlugs: [
      "metrics-analytics",
      "product-prioritization",
      "stakeholder-communication",
    ],
    signals: [
      "Separates funnel, transaction success, error, latency, segment, and support-contact metrics.",
      "Defines a decision path for rollback versus fix-forward based on severity and confidence.",
      "Communicates trade-offs to engineering, support, and commercial stakeholders.",
    ],
    redFlags: [
      "Uses only aggregate conversion without segment or error analysis.",
      "Treats rollback as failure rather than a customer-protection option.",
    ],
    followUps: [
      {
        intent: "assumptions",
        condition: "The candidate jumps straight to one cause.",
        promptHint: "What assumptions would you test before deciding rollback or fix-forward?",
      },
      {
        intent: "trade_off",
        condition: "The answer lacks decision trade-offs.",
        promptHint: "When would monitoring be irresponsible here?",
      },
    ],
  },
  {
    id: "task24-question-safaricom-product-stakeholder-trust",
    slug: "safaricom-product-stakeholder-trust",
    version: 1,
    prompt:
      "How would you keep commercial, engineering, risk, and support teams aligned when a customer-trust issue changes a product roadmap priority?",
    frameworkKey: "role_knowledge",
    rubricKey: "role_knowledge_v1",
    industrySlug: "telecommunications",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    companySlug: "safaricom",
    sourceKey: "safaricom-careers",
    sourceRationale:
      "Safaricom source supports technology and career context. Prompt is synthetic practice content, not a leaked or confirmed Safaricom interview question.",
    confidence: "medium",
    competencySlugs: [
      "stakeholder-communication",
      "product-prioritization",
      "delivery-execution",
    ],
    signals: [
      "Frames the customer-trust risk and the roadmap impact in plain language.",
      "Uses shared evidence, decision logs, owners, and checkpoints.",
      "Balances commercial commitments with reliability, risk, and support readiness.",
    ],
    redFlags: [
      "Frames alignment as convincing stakeholders without evidence.",
      "Ignores risk or support teams until after delivery.",
    ],
    followUps: [
      {
        intent: "example",
        condition: "The answer stays abstract.",
        promptHint: "Give an example of the update you would send to stakeholders.",
      },
      {
        intent: "trade_off",
        condition: "The candidate does not name what would be deprioritized.",
        promptHint: "What would you delay, and how would you explain that decision?",
      },
    ],
  },
  {
    id: "task24-question-safaricom-product-purpose",
    slug: "safaricom-product-purpose",
    version: 1,
    prompt:
      "Why do you want to work on digital products for Kenyan customers, and how would you avoid designing only for the easiest-to-reach users?",
    frameworkKey: "general",
    rubricKey: "role_knowledge_v1",
    industrySlug: "telecommunications",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    companySlug: "safaricom",
    sourceKey: "safaricom-careers",
    sourceRationale:
      "Safaricom source supports employer and customer-impact context. Prompt is synthetic practice content, not a leaked or confirmed Safaricom interview question.",
    confidence: "medium",
    competencySlugs: ["customer-empathy", "stakeholder-communication", "collaboration"],
    signals: [
      "Connects motivation to user needs, access, trust, and learning.",
      "Names discovery methods that include underserved or lower-confidence users.",
      "Acknowledges assumptions and ethical limits.",
    ],
    redFlags: [
      "Uses only prestige or employer-brand motivation.",
      "Treats Kenyan users as one uniform segment.",
    ],
    followUps: [
      {
        intent: "clarification",
        condition: "The candidate speaks broadly about customers.",
        promptHint: "Which customer segment would you make sure not to miss?",
      },
      {
        intent: "evidence",
        condition: "The answer does not include a learning loop.",
        promptHint: "What evidence would help you avoid designing for only power users?",
      },
    ],
  },
  {
    id: "task24-question-kcb-customer-service-digital-transaction-escalation",
    slug: "kcb-customer-service-digital-transaction-escalation",
    version: 1,
    prompt:
      "A customer reports repeated failed digital banking transactions before an urgent payment deadline. How would you handle the case from first contact to resolution?",
    frameworkKey: "situational",
    rubricKey: "customer_service_excellence_v1",
    industrySlug: "banking",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "customer-service",
    jobRoleSlug: "customer-service-officer",
    companySlug: "kcb",
    sourceKey: "kcb-customer-experience-systems-job",
    sourceRationale:
      "KCB source supports customer-experience systems and customer-service issue context. Prompt is synthetic practice content, not a leaked or confirmed KCB interview question.",
    confidence: "medium",
    competencySlugs: [
      "customer-service-excellence",
      "digital-customer-experience",
      "regulatory-risk-awareness",
    ],
    signals: [
      "Acknowledges urgency and confirms facts without exposing sensitive data.",
      "Checks transaction evidence, channel status, escalation route, and customer update cadence.",
      "Keeps ownership visible until the customer has a clear resolution or next step.",
    ],
    redFlags: [
      "Promises reversal or completion without checking policy or transaction state.",
      "Blames the customer or another team before investigating.",
    ],
    followUps: [
      {
        intent: "clarification",
        condition: "The candidate does not gather enough initial facts.",
        promptHint: "What would you ask the customer before escalating?",
      },
      {
        intent: "risks",
        condition: "The answer omits privacy or banking controls.",
        promptHint: "Which information should you avoid requesting or sharing in this case?",
      },
    ],
  },
  {
    id: "task24-question-kcb-customer-experience-crm-follow-through",
    slug: "kcb-customer-experience-crm-follow-through",
    version: 1,
    prompt:
      "How would you use CRM or customer-service systems to keep a customer complaint visible until it is resolved?",
    frameworkKey: "role_knowledge",
    rubricKey: "customer_service_excellence_v1",
    industrySlug: "banking",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "customer-service",
    jobRoleSlug: "customer-service-officer",
    companySlug: "kcb",
    sourceKey: "kcb-customer-experience-systems-job",
    sourceRationale:
      "KCB source supports customer-experience systems role context. Prompt is synthetic practice content, not a leaked or confirmed KCB interview question.",
    confidence: "medium",
    competencySlugs: [
      "digital-customer-experience",
      "customer-service-excellence",
      "ownership",
    ],
    signals: [
      "Captures accurate case notes, owner, status, priority, and next action.",
      "Uses reminders, escalation paths, and customer updates to prevent silent delays.",
      "Protects customer privacy and documents resolution evidence.",
    ],
    redFlags: [
      "Treats CRM as a passive record rather than an active follow-through tool.",
      "Stores unnecessary sensitive data or leaves unclear ownership.",
    ],
    followUps: [
      {
        intent: "mechanism",
        condition: "The answer says 'log it' but not how the case moves.",
        promptHint: "What fields or workflow steps would keep the case from disappearing?",
      },
      {
        intent: "result",
        condition: "The candidate does not define closure.",
        promptHint: "How would you know the complaint is truly resolved?",
      },
    ],
  },
  {
    id: "task24-question-kcb-customer-service-trust-recovery",
    slug: "kcb-customer-service-trust-recovery",
    version: 1,
    prompt:
      "Tell me about a time you helped recover trust after a customer or stakeholder had a poor service experience.",
    frameworkKey: "behavioral_star",
    rubricKey: "behavioral_star_v1",
    industrySlug: "banking",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "customer-service",
    jobRoleSlug: "customer-service-officer",
    companySlug: "kcb",
    sourceKey: "kcb-careers",
    sourceRationale:
      "KCB careers source supports purpose-led service and customer progress context. Prompt is synthetic practice content, not a leaked or confirmed KCB interview question.",
    confidence: "medium",
    competencySlugs: ["customer-service-excellence", "ownership", "customer-empathy"],
    signals: [
      "Uses STAR structure and owns the service-recovery action.",
      "Explains how expectations, updates, and resolution evidence were handled.",
      "Shows learning that would improve future service.",
    ],
    redFlags: [
      "Only says the customer calmed down without explaining action or result.",
      "Promises outcomes outside policy or authority.",
    ],
    followUps: [
      {
        intent: "ownership",
        condition: "The candidate describes what the organization did but not their action.",
        promptHint: "What did you personally do to recover trust?",
      },
      {
        intent: "result",
        condition: "The answer lacks a result.",
        promptHint: "How did you know trust had improved?",
      },
    ],
  },
  {
    id: "task24-question-kcb-customer-service-purpose",
    slug: "kcb-customer-service-purpose",
    version: 1,
    prompt:
      "Why are you interested in customer service in a bank serving East African customers, and what does responsible service mean to you?",
    frameworkKey: "general",
    rubricKey: "customer_service_excellence_v1",
    industrySlug: "banking",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "customer-service",
    jobRoleSlug: "customer-service-officer",
    companySlug: "kcb",
    sourceKey: "kcb-careers",
    sourceRationale:
      "KCB careers source supports purpose, East African customer impact, and employee-growth context. Prompt is synthetic practice content, not a leaked or confirmed KCB interview question.",
    confidence: "medium",
    competencySlugs: [
      "customer-service-excellence",
      "stakeholder-communication",
      "regulatory-risk-awareness",
    ],
    signals: [
      "Connects motivation to customer progress, trust, and service quality.",
      "Names responsible-service behaviors such as accuracy, privacy, escalation, and follow-through.",
      "Avoids treating service as only friendliness.",
    ],
    redFlags: [
      "Focuses only on getting a job or working for a known brand.",
      "Ignores privacy, policy, or risk in banking service.",
    ],
    followUps: [
      {
        intent: "example",
        condition: "The answer defines service abstractly.",
        promptHint: "Give one example of responsible service in a banking context.",
      },
      {
        intent: "risks",
        condition: "The candidate does not mention controls.",
        promptHint: "What could go wrong if a service officer tries to be helpful but ignores policy?",
      },
    ],
  },
  {
    id: "task24-question-kcb-relationship-portfolio-growth-risk",
    slug: "kcb-relationship-portfolio-growth-risk",
    version: 1,
    prompt:
      "How would you grow a relationship portfolio while protecting credit quality, customer trust, and long-term value?",
    frameworkKey: "role_knowledge",
    rubricKey: "relationship_management_v1",
    industrySlug: "banking",
    difficulty: "mid-level",
    senioritySlug: "mid-level",
    roleFamilySlug: "relationship-management",
    jobRoleSlug: "relationship-manager",
    companySlug: "kcb",
    sourceKey: "kcb-relationship-manager-job",
    sourceRationale:
      "KCB source supports relationship-management portfolio and infrastructure/energy segment context. Prompt is synthetic practice content, not a leaked or confirmed KCB interview question.",
    confidence: "medium",
    competencySlugs: [
      "relationship-building",
      "sales-pipeline-management",
      "regulatory-risk-awareness",
    ],
    signals: [
      "Segments the portfolio by customer needs, value, risk, and relationship maturity.",
      "Balances growth opportunities with credit, conduct, and service-quality controls.",
      "Coordinates internal product, credit, operations, and service stakeholders.",
    ],
    redFlags: [
      "Focuses only on sales volume without credit quality or customer suitability.",
      "Treats customer trust as separate from portfolio growth.",
    ],
    followUps: [
      {
        intent: "metrics",
        condition: "The candidate does not define portfolio success.",
        promptHint: "Which growth and risk indicators would you review regularly?",
      },
      {
        intent: "trade_off",
        condition: "The answer lacks trade-offs.",
        promptHint: "When would you walk away from a growth opportunity?",
      },
    ],
  },
  {
    id: "task24-question-kcb-relationship-retention-service-issue",
    slug: "kcb-relationship-retention-service-issue",
    version: 1,
    prompt:
      "Tell me about a time you retained a customer or stakeholder relationship through a difficult service or delivery issue.",
    frameworkKey: "behavioral_star",
    rubricKey: "behavioral_star_v1",
    industrySlug: "banking",
    difficulty: "mid-level",
    senioritySlug: "mid-level",
    roleFamilySlug: "relationship-management",
    jobRoleSlug: "relationship-manager",
    companySlug: "kcb",
    sourceKey: "kcb-relationship-manager-job",
    sourceRationale:
      "KCB source supports customer retention and relationship-management context. Prompt is synthetic practice content, not a leaked or confirmed KCB interview question.",
    confidence: "medium",
    competencySlugs: ["relationship-building", "ownership", "stakeholder-communication"],
    signals: [
      "Shows personal ownership of communication and internal coordination.",
      "Explains how the customer relationship was stabilized without overpromising.",
      "Names outcome, learning, and future prevention.",
    ],
    redFlags: [
      "Blames internal teams or the customer without owning the recovery path.",
      "Retains the customer by making unsupported promises.",
    ],
    followUps: [
      {
        intent: "ownership",
        condition: "The candidate describes broad team action.",
        promptHint: "What specific action was yours during the retention effort?",
      },
      {
        intent: "evidence",
        condition: "The result is vague.",
        promptHint: "What evidence showed the relationship was retained or repaired?",
      },
    ],
  },
  {
    id: "task24-question-kcb-relationship-cross-sell-ethics",
    slug: "kcb-relationship-cross-sell-ethics",
    version: 1,
    prompt:
      "A strong customer relationship creates a cross-sell opportunity, but the product may not fully fit the customer's needs. What do you do?",
    frameworkKey: "situational",
    rubricKey: "relationship_management_v1",
    industrySlug: "banking",
    difficulty: "mid-level",
    senioritySlug: "mid-level",
    roleFamilySlug: "relationship-management",
    jobRoleSlug: "relationship-manager",
    companySlug: "kcb",
    sourceKey: "kcb-careers",
    sourceRationale:
      "KCB careers source supports purpose-led customer progress context. Prompt is synthetic practice content, not a leaked or confirmed KCB interview question.",
    confidence: "medium",
    competencySlugs: [
      "relationship-building",
      "regulatory-risk-awareness",
      "sales-pipeline-management",
    ],
    signals: [
      "Prioritizes customer suitability, disclosure, and long-term trust over short-term sale.",
      "Clarifies needs and risk before recommending or declining the product.",
      "Documents rationale and offers an alternative path if appropriate.",
    ],
    redFlags: [
      "Pushes the product because the customer trusts the relationship manager.",
      "Ignores compliance, suitability, or reputational risk.",
    ],
    followUps: [
      {
        intent: "risks",
        condition: "The candidate focuses only on sales outcome.",
        promptHint: "What risks could this create for the customer and the bank?",
      },
      {
        intent: "example",
        condition: "The answer lacks communication detail.",
        promptHint: "How would you explain the decision to the customer?",
      },
    ],
  },
  {
    id: "task24-question-kcb-relationship-purpose",
    slug: "kcb-relationship-purpose",
    version: 1,
    prompt:
      "What does responsible relationship management mean in a bank with customers across East Africa?",
    frameworkKey: "general",
    rubricKey: "relationship_management_v1",
    industrySlug: "banking",
    difficulty: "mid-level",
    senioritySlug: "mid-level",
    roleFamilySlug: "relationship-management",
    jobRoleSlug: "relationship-manager",
    companySlug: "kcb",
    sourceKey: "kcb-careers",
    sourceRationale:
      "KCB careers source supports East African network, purpose, and customer-progress context. Prompt is synthetic practice content, not a leaked or confirmed KCB interview question.",
    confidence: "medium",
    competencySlugs: [
      "relationship-building",
      "stakeholder-communication",
      "regulatory-risk-awareness",
    ],
    signals: [
      "Defines responsibility as trust, suitability, progress, and regulatory discipline.",
      "Accounts for customer diversity across regions and segments.",
      "Names collaboration with internal teams to solve customer needs.",
    ],
    redFlags: [
      "Defines relationship management only as selling.",
      "Speaks broadly about East Africa without customer or regulatory nuance.",
    ],
    followUps: [
      {
        intent: "clarification",
        condition: "The answer is too broad.",
        promptHint: "Which customer difference would change your relationship approach?",
      },
      {
        intent: "example",
        condition: "The candidate does not include a behavior.",
        promptHint: "Give one behavior that protects both customer trust and bank risk.",
      },
    ],
  },
  {
    id: "task24-question-kpc-graduate-engineer-safety-controls",
    slug: "kpc-graduate-engineer-safety-controls",
    version: 1,
    prompt:
      "Tell me about a time you followed safety controls while solving an engineering, lab, workshop, or field problem.",
    frameworkKey: "behavioral_star",
    rubricKey: "behavioral_star_v1",
    industrySlug: "energy",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: null,
    companySlug: "kenya-pipeline-company",
    sourceKey: "kpc-about",
    sourceRationale:
      "KPC source supports safety, environmental stewardship, operational excellence, and energy-infrastructure context. Prompt is synthetic practice content, not a leaked or confirmed KPC interview question.",
    confidence: "medium",
    competencySlugs: [
      "safety-environmental-stewardship",
      "ownership",
      "field-engineering-judgment",
    ],
    signals: [
      "Uses STAR structure and names concrete hazards or controls.",
      "Shows when they escalated, paused, checked permits, or asked for supervision.",
      "Connects safety discipline to quality, reliability, or stakeholder trust.",
    ],
    redFlags: [
      "Treats safety as paperwork after the work is done.",
      "Claims urgency justified bypassing controls.",
    ],
    followUps: [
      {
        intent: "risks",
        condition: "The candidate does not name hazards.",
        promptHint: "What hazard were you controlling for?",
      },
      {
        intent: "ownership",
        condition: "The answer says a supervisor handled safety.",
        promptHint: "What did you personally do to keep the work safe?",
      },
    ],
  },
  {
    id: "task24-question-kpc-pipeline-flowrate-bottleneck",
    slug: "kpc-pipeline-flowrate-bottleneck",
    version: 1,
    prompt:
      "How would you reason about bottlenecks in a pipeline flow-rate improvement project before recommending a change?",
    frameworkKey: "technical_concept",
    rubricKey: "energy_engineering_v1",
    industrySlug: "energy",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: null,
    companySlug: "kenya-pipeline-company",
    sourceKey: "kpc-line-iv-upgrade",
    sourceRationale:
      "KPC source supports pipeline-flowrate improvement, pumping-station, contractor, and operations context. Prompt is synthetic practice content, not a leaked or confirmed KPC interview question.",
    confidence: "medium",
    competencySlugs: [
      "systems-thinking",
      "operational-reliability",
      "field-engineering-judgment",
    ],
    signals: [
      "Considers pump capacity, pipeline constraints, storage, controls, maintenance state, and operating limits.",
      "Separates measurement, hypothesis, safety review, and stakeholder validation.",
      "Avoids optimizing throughput without reliability and safety guardrails.",
    ],
    redFlags: [
      "Recommends increasing flow without checking equipment limits or safety controls.",
      "Ignores operations, maintenance, or contractor handover constraints.",
    ],
    followUps: [
      {
        intent: "mechanism",
        condition: "The answer lists components without explaining interaction.",
        promptHint: "How could one constraint create a bottleneck elsewhere in the system?",
      },
      {
        intent: "evidence",
        condition: "The candidate does not name data needed.",
        promptHint: "What measurements would you need before recommending a change?",
      },
    ],
  },
  {
    id: "task24-question-kpc-operations-system-integration-stakeholders",
    slug: "kpc-operations-system-integration-stakeholders",
    version: 1,
    prompt:
      "How would you coordinate engineering, operations, ICT, and external stakeholders during an operations-system integration affecting product movement approvals?",
    frameworkKey: "situational",
    rubricKey: "energy_engineering_v1",
    industrySlug: "energy",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: null,
    companySlug: "kenya-pipeline-company",
    sourceKey: "kpc-about",
    sourceRationale:
      "KPC source supports digitization, operational excellence, stakeholder service, and infrastructure mandate context. Prompt is synthetic practice content, not a leaked or confirmed KPC interview question.",
    confidence: "medium",
    competencySlugs: [
      "stakeholder-communication",
      "systems-thinking",
      "operational-reliability",
    ],
    signals: [
      "Maps stakeholders, dependencies, risks, test windows, and escalation paths.",
      "Protects operational continuity and data integrity during changeover.",
      "Communicates checkpoints and evidence for go-live or rollback decisions.",
    ],
    redFlags: [
      "Treats integration as only an ICT task.",
      "Ignores operational downtime, approvals, or stakeholder communication.",
    ],
    followUps: [
      {
        intent: "assumptions",
        condition: "The candidate does not state dependencies.",
        promptHint: "Which dependency would you validate first?",
      },
      {
        intent: "risks",
        condition: "The answer lacks go-live risks.",
        promptHint: "What could go wrong during cutover, and how would you reduce that risk?",
      },
    ],
  },
  {
    id: "task24-question-kpc-engineering-learning-morendat",
    slug: "kpc-engineering-learning-morendat",
    version: 1,
    prompt:
      "How would you build oil-and-gas engineering capability as a graduate trainee while contributing safely to real operations?",
    frameworkKey: "role_knowledge",
    rubricKey: "energy_engineering_v1",
    industrySlug: "energy",
    difficulty: "role-adaptive",
    senioritySlug: null,
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: null,
    companySlug: "kenya-pipeline-company",
    sourceKey: "kpc-morendat",
    sourceRationale:
      "KPC source supports oil-and-gas skills development and capacity-building context. Prompt is synthetic practice content, not a leaked or confirmed KPC interview question.",
    confidence: "medium",
    competencySlugs: [
      "field-engineering-judgment",
      "safety-environmental-stewardship",
      "collaboration",
    ],
    signals: [
      "Combines formal learning, supervised practice, and documentation.",
      "Respects role boundaries, permits, and safety controls while learning.",
      "Seeks feedback from operations, maintenance, and engineering mentors.",
    ],
    redFlags: [
      "Equates learning with acting independently before competence is proven.",
      "Ignores supervision, safety controls, or documentation.",
    ],
    followUps: [
      {
        intent: "example",
        condition: "The answer is generic.",
        promptHint: "Give an example of a task you would only do under supervision at first.",
      },
      {
        intent: "ownership",
        condition: "The answer does not show personal learning discipline.",
        promptHint: "How would you track your own engineering learning gaps?",
      },
    ],
  },
  {
    id: "task24-question-kpc-graduate-energy-mission-motivation",
    slug: "kpc-graduate-energy-mission-motivation",
    version: 1,
    prompt:
      "Why are you interested in engineering work that supports safe and reliable energy infrastructure in Kenya and the region?",
    frameworkKey: "general",
    rubricKey: "energy_engineering_v1",
    industrySlug: "energy",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: "graduate-trainee-engineer",
    companySlug: "kenya-pipeline-company",
    sourceKey: "kpc-about",
    sourceRationale:
      "KPC source supports safe delivery, regional energy infrastructure, and public-service mandate context. Prompt is synthetic practice content, not a leaked or confirmed KPC interview question.",
    confidence: "medium",
    competencySlugs: [
      "safety-environmental-stewardship",
      "operational-reliability",
      "stakeholder-communication",
    ],
    signals: [
      "Connects motivation to safety, reliability, energy security, and public impact.",
      "Shows humility about learning in high-consequence operations.",
      "Names stakeholders affected by engineering reliability.",
    ],
    redFlags: [
      "Focuses only on prestige or job stability.",
      "Cannot connect engineering decisions to safety or public impact.",
    ],
    followUps: [
      {
        intent: "clarification",
        condition: "The answer lacks specific engineering context.",
        promptHint: "Which part of energy infrastructure reliability interests you most?",
      },
      {
        intent: "risks",
        condition: "The answer omits high-consequence operations.",
        promptHint: "Why does caution matter in this kind of engineering work?",
      },
    ],
  },
  {
    id: "task24-question-kpc-pipeline-reliability-maintenance",
    slug: "kpc-pipeline-reliability-maintenance",
    version: 1,
    prompt:
      "A pump station has recurring downtime after maintenance. How would you investigate the reliability issue and communicate next actions?",
    frameworkKey: "technical_concept",
    rubricKey: "energy_engineering_v1",
    industrySlug: "energy",
    difficulty: "mid-level",
    senioritySlug: "mid-level",
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: "pipeline-engineer",
    companySlug: "kenya-pipeline-company",
    sourceKey: "kpc-line-iv-upgrade",
    sourceRationale:
      "KPC source supports pumping-station and pipeline operations context. Prompt is synthetic practice content, not a leaked or confirmed KPC interview question.",
    confidence: "medium",
    competencySlugs: [
      "operational-reliability",
      "systems-thinking",
      "field-engineering-judgment",
    ],
    signals: [
      "Checks maintenance records, operating conditions, failure timing, instrumentation, and handover quality.",
      "Uses safe root-cause analysis before recommending changes.",
      "Communicates risk, evidence, owner, and monitoring plan.",
    ],
    redFlags: [
      "Blames technicians without evidence.",
      "Restarts equipment repeatedly without safety or root-cause controls.",
    ],
    followUps: [
      {
        intent: "mechanism",
        condition: "The candidate lists checks without causal reasoning.",
        promptHint: "How would you distinguish mechanical, electrical, control, and operating-condition causes?",
      },
      {
        intent: "evidence",
        condition: "The answer lacks evidence.",
        promptHint: "Which records or measurements would you inspect first?",
      },
    ],
  },
  {
    id: "task24-question-kpc-pipeline-storage-system-tradeoffs",
    slug: "kpc-pipeline-storage-system-tradeoffs",
    version: 1,
    prompt:
      "Design the high-level checks you would perform before changing a pipeline and storage operation that affects downstream supply reliability.",
    frameworkKey: "system_design",
    rubricKey: "energy_engineering_v1",
    industrySlug: "energy",
    difficulty: "mid-level",
    senioritySlug: "mid-level",
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: "pipeline-engineer",
    companySlug: "kenya-pipeline-company",
    sourceKey: "kpc-about",
    sourceRationale:
      "KPC source supports pipeline, storage, pumping, regional supply, and operational-excellence context. Prompt is synthetic practice content, not a leaked or confirmed KPC interview question.",
    confidence: "medium",
    competencySlugs: [
      "systems-thinking",
      "operational-reliability",
      "safety-environmental-stewardship",
    ],
    signals: [
      "Maps upstream, pumping, storage, downstream, measurement, and stakeholder dependencies.",
      "Defines safety, continuity, communication, and rollback checks.",
      "Names trade-offs between throughput, maintenance, supply reliability, and risk.",
    ],
    redFlags: [
      "Optimizes one segment without checking downstream consequences.",
      "Omits safety, environmental, or stakeholder communication checks.",
    ],
    followUps: [
      {
        intent: "trade_off",
        condition: "The candidate presents one perfect solution.",
        promptHint: "What trade-off could make your preferred approach risky?",
      },
      {
        intent: "risks",
        condition: "The answer lacks operational risk.",
        promptHint: "What could go wrong downstream if this change is poorly coordinated?",
      },
    ],
  },
  {
    id: "task24-question-customer-service-difficult-client-follow-through",
    slug: "customer-service-difficult-client-follow-through",
    version: 1,
    prompt:
      "Tell me about a time you handled a difficult customer or stakeholder issue and followed through to a clear next step.",
    frameworkKey: "behavioral_star",
    rubricKey: "behavioral_star_v1",
    industrySlug: null,
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "customer-service",
    jobRoleSlug: "customer-service-officer",
    companySlug: null,
    sourceKey: null,
    sourceRationale: null,
    confidence: "high",
    competencySlugs: ["customer-service-excellence", "ownership", "customer-empathy"],
    signals: [
      "Uses STAR structure with clear personal action.",
      "Shows calm communication, expectation setting, and ownership of follow-up.",
      "Names a result, next step, or lesson learned.",
    ],
    redFlags: [
      "Blames the customer without attempting to understand the issue.",
      "Ends the story before resolution or next action.",
    ],
    followUps: [
      {
        intent: "ownership",
        condition: "The candidate describes the issue but not their action.",
        promptHint: "What did you personally do to move the issue forward?",
      },
      {
        intent: "result",
        condition: "The answer does not explain the outcome.",
        promptHint: "How did the customer or stakeholder know what would happen next?",
      },
    ],
  },
  {
    id: "task24-question-customer-service-compliance-privacy",
    slug: "customer-service-compliance-privacy",
    version: 1,
    prompt:
      "How do you stay helpful to a customer while still following privacy, identity-check, and escalation rules?",
    frameworkKey: "role_knowledge",
    rubricKey: "customer_service_excellence_v1",
    industrySlug: null,
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "customer-service",
    jobRoleSlug: "customer-service-officer",
    companySlug: null,
    sourceKey: null,
    sourceRationale: null,
    confidence: "high",
    competencySlugs: [
      "customer-service-excellence",
      "regulatory-risk-awareness",
      "stakeholder-communication",
    ],
    signals: [
      "Explains verification, minimum necessary data, policy boundaries, and escalation.",
      "Keeps tone helpful without overpromising.",
      "Names what they would document and communicate.",
    ],
    redFlags: [
      "Shares or requests unnecessary sensitive information.",
      "Treats policy as an obstacle to work around.",
    ],
    followUps: [
      {
        intent: "risks",
        condition: "The answer omits privacy or identity controls.",
        promptHint: "What could go wrong if you skip verification to be fast?",
      },
      {
        intent: "example",
        condition: "The answer is theoretical.",
        promptHint: "Give an example of wording that is helpful but policy-safe.",
      },
    ],
  },
  {
    id: "task24-question-customer-service-purpose-generic",
    slug: "customer-service-purpose-generic",
    version: 1,
    prompt:
      "Why are you interested in customer service, and how do you balance empathy, accuracy, and policy when customers are frustrated?",
    frameworkKey: "general",
    rubricKey: "customer_service_excellence_v1",
    industrySlug: null,
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "customer-service",
    jobRoleSlug: "customer-service-officer",
    companySlug: null,
    sourceKey: null,
    sourceRationale: null,
    confidence: "high",
    competencySlugs: [
      "customer-service-excellence",
      "stakeholder-communication",
      "regulatory-risk-awareness",
    ],
    signals: [
      "Connects motivation to helping customers reach a clear outcome.",
      "Balances empathy with accurate information and policy boundaries.",
      "Shows calm communication under pressure.",
    ],
    redFlags: [
      "Defines customer service only as being friendly.",
      "Suggests bypassing policy to make customers happy.",
    ],
    followUps: [
      {
        intent: "example",
        condition: "The answer is too abstract.",
        promptHint: "Give one example of a phrase you would use with a frustrated customer.",
      },
      {
        intent: "risks",
        condition: "The candidate does not mention policy boundaries.",
        promptHint: "What can go wrong if empathy is not balanced with accuracy?",
      },
    ],
  },
  {
    id: "task24-question-relationship-manager-discovery-credit-quality",
    slug: "relationship-manager-discovery-credit-quality",
    version: 1,
    prompt:
      "How would you discover a customer's needs before recommending a financial solution, while protecting credit quality and suitability?",
    frameworkKey: "role_knowledge",
    rubricKey: "relationship_management_v1",
    industrySlug: "banking",
    difficulty: "mid-level",
    senioritySlug: "mid-level",
    roleFamilySlug: "relationship-management",
    jobRoleSlug: "relationship-manager",
    companySlug: null,
    sourceKey: null,
    sourceRationale: null,
    confidence: "high",
    competencySlugs: [
      "relationship-building",
      "regulatory-risk-awareness",
      "sales-pipeline-management",
    ],
    signals: [
      "Asks about customer goals, cash flow, risk, decision makers, and constraints.",
      "Connects solution fit to suitability, credit quality, and customer value.",
      "Names documentation, internal collaboration, and follow-up.",
    ],
    redFlags: [
      "Starts with the product they want to sell.",
      "Ignores credit quality, suitability, or customer affordability.",
    ],
    followUps: [
      {
        intent: "clarification",
        condition: "The candidate does not ask discovery questions.",
        promptHint: "What would you need to learn before proposing a product?",
      },
      {
        intent: "risks",
        condition: "The answer lacks risk controls.",
        promptHint: "What risk would make you slow down or decline the opportunity?",
      },
    ],
  },
  {
    id: "task24-question-relationship-manager-difficult-stakeholder",
    slug: "relationship-manager-difficult-stakeholder",
    version: 1,
    prompt:
      "Tell me about a time you managed a difficult stakeholder relationship while keeping trust and progress intact.",
    frameworkKey: "behavioral_star",
    rubricKey: "behavioral_star_v1",
    industrySlug: null,
    difficulty: "mid-level",
    senioritySlug: "mid-level",
    roleFamilySlug: "relationship-management",
    jobRoleSlug: "relationship-manager",
    companySlug: null,
    sourceKey: null,
    sourceRationale: null,
    confidence: "high",
    competencySlugs: ["relationship-building", "ownership", "stakeholder-communication"],
    signals: [
      "Uses STAR structure and names the relationship tension clearly.",
      "Shows personal communication, expectation management, and follow-through.",
      "Explains what improved or what was learned.",
    ],
    redFlags: [
      "Frames the stakeholder as the only problem.",
      "Does not explain any concrete action or outcome.",
    ],
    followUps: [
      {
        intent: "ownership",
        condition: "The answer blames the stakeholder.",
        promptHint: "What did you change in your own approach?",
      },
      {
        intent: "result",
        condition: "The answer lacks an outcome.",
        promptHint: "What evidence showed the relationship or delivery improved?",
      },
    ],
  },
  {
    id: "task24-question-relationship-manager-purpose-generic",
    slug: "relationship-manager-purpose-generic",
    version: 1,
    prompt:
      "Why are you interested in relationship management, and what habits help a relationship manager earn long-term customer trust?",
    frameworkKey: "general",
    rubricKey: "relationship_management_v1",
    industrySlug: null,
    difficulty: "mid-level",
    senioritySlug: "mid-level",
    roleFamilySlug: "relationship-management",
    jobRoleSlug: "relationship-manager",
    companySlug: null,
    sourceKey: null,
    sourceRationale: null,
    confidence: "high",
    competencySlugs: [
      "relationship-building",
      "stakeholder-communication",
      "regulatory-risk-awareness",
    ],
    signals: [
      "Connects motivation to customer progress and durable trust.",
      "Names habits such as discovery, honest expectation-setting, and follow-through.",
      "Acknowledges responsible growth and risk awareness.",
    ],
    redFlags: [
      "Defines the role only as sales target achievement.",
      "Ignores suitability, conduct, or follow-through.",
    ],
    followUps: [
      {
        intent: "example",
        condition: "The answer is generic.",
        promptHint: "Give one habit that would help you protect trust during a hard conversation.",
      },
      {
        intent: "trade_off",
        condition: "The candidate does not mention responsible growth.",
        promptHint: "When would you choose customer trust over a short-term sale?",
      },
    ],
  },
  {
    id: "task24-question-energy-engineering-safety-risk-assessment",
    slug: "energy-engineering-safety-risk-assessment",
    version: 1,
    prompt:
      "You are asked to join a field task and notice a possible safety risk that was not discussed. What do you do?",
    frameworkKey: "situational",
    rubricKey: "energy_engineering_v1",
    industrySlug: "energy",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: null,
    companySlug: null,
    sourceKey: null,
    sourceRationale: null,
    confidence: "high",
    competencySlugs: [
      "safety-environmental-stewardship",
      "field-engineering-judgment",
      "stakeholder-communication",
    ],
    signals: [
      "Pauses, clarifies the hazard, and escalates through the right supervisor or permit process.",
      "Balances respect, evidence, and urgency without pretending to be the sole expert.",
      "Explains how work can resume safely.",
    ],
    redFlags: [
      "Continues the task to avoid slowing the team.",
      "Raises concern vaguely without describing the hazard or next step.",
    ],
    followUps: [
      {
        intent: "risks",
        condition: "The answer does not name the risk.",
        promptHint: "What exact risk would make you pause the work?",
      },
      {
        intent: "example",
        condition: "The answer lacks communication detail.",
        promptHint: "What would you say to the supervisor or team?",
      },
    ],
  },
  {
    id: "task24-question-energy-engineering-purpose-generic",
    slug: "energy-engineering-purpose-generic",
    version: 1,
    prompt:
      "Why are you interested in energy engineering, and how would you build confidence before working on safety-critical operations?",
    frameworkKey: "general",
    rubricKey: "energy_engineering_v1",
    industrySlug: "energy",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: null,
    companySlug: null,
    sourceKey: null,
    sourceRationale: null,
    confidence: "high",
    competencySlugs: [
      "safety-environmental-stewardship",
      "field-engineering-judgment",
      "stakeholder-communication",
    ],
    signals: [
      "Connects motivation to safety, reliability, learning, and public impact.",
      "Respects supervision, permits, documentation, and competence boundaries.",
      "Names practical learning loops before independent work.",
    ],
    redFlags: [
      "Focuses only on prestige or job security.",
      "Suggests confidence comes from speed rather than supervised competence.",
    ],
    followUps: [
      {
        intent: "ownership",
        condition: "The candidate does not mention learning discipline.",
        promptHint: "How would you track what you are ready to do independently?",
      },
      {
        intent: "risks",
        condition: "The answer misses safety-critical context.",
        promptHint: "Why does supervision matter in energy operations?",
      },
    ],
  },
  {
    id: "task24-question-energy-engineering-root-cause-reliability",
    slug: "energy-engineering-root-cause-reliability",
    version: 1,
    prompt:
      "Explain how you would approach root-cause analysis for recurring equipment downtime in an energy operation.",
    frameworkKey: "technical_concept",
    rubricKey: "energy_engineering_v1",
    industrySlug: "energy",
    difficulty: "graduate-entry",
    senioritySlug: "graduate-entry",
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: null,
    companySlug: null,
    sourceKey: null,
    sourceRationale: null,
    confidence: "high",
    competencySlugs: [
      "operational-reliability",
      "systems-thinking",
      "problem-solving",
    ],
    signals: [
      "Defines the symptom, boundary, timeline, evidence, and operating context.",
      "Checks logs, maintenance history, measurements, recent changes, and human-process factors.",
      "Proposes verification and prevention rather than a quick guess.",
    ],
    redFlags: [
      "Names a single cause without evidence.",
      "Ignores safety and continuity while investigating.",
    ],
    followUps: [
      {
        intent: "evidence",
        condition: "The candidate does not name data sources.",
        promptHint: "What evidence would you gather before proposing a cause?",
      },
      {
        intent: "mechanism",
        condition: "The answer lists tools without explaining reasoning.",
        promptHint: "How would your evidence narrow the possible causes?",
      },
    ],
  },
] satisfies QuestionFixture[];

const planPromptVersion = "jr-interview-prompt-task24-v1";
const planQuestionSetVersion = `${JOBREADY_LAUNCH_CATALOG_VERSION}-questions`;
const planRubricVersion = `${JOBREADY_LAUNCH_CATALOG_VERSION}-rubrics`;

const plans = [
  {
    id: "task24-plan-safaricom-product-manager-graduate-entry-v2",
    slug: "scenario-a-safaricom-product-manager-recommended-graduate-entry",
    version: 2,
    companySlug: "safaricom",
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    senioritySlug: "graduate-entry",
    interviewStageSlug: null,
    focusMode: "recommended",
    promptVersion: planPromptVersion,
    questionSetVersion: planQuestionSetVersion,
    rubricVersion: planRubricVersion,
    rationale:
      "Task 24 reviewed launch plan for Safaricom product management. Uses official-source company context with synthetic practice prompts and falls back only to reviewed role content.",
    modules: [
      {
        id: "task24-plan-module-saf-prod-ge-star",
        frameworkKey: "behavioral_star",
        competencySlug: "ownership",
        weight: 20,
        displayOrder: 1,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "task24-plan-module-saf-prod-ge-case",
        frameworkKey: "product_case",
        competencySlug: "customer-empathy",
        weight: 25,
        displayOrder: 2,
        rubricKey: "product_case_v1",
      },
      {
        id: "task24-plan-module-saf-prod-ge-analytics",
        frameworkKey: "analytics_case",
        competencySlug: "metrics-analytics",
        weight: 20,
        displayOrder: 3,
        rubricKey: "product_case_v1",
      },
      {
        id: "task24-plan-module-saf-prod-ge-role",
        frameworkKey: "role_knowledge",
        competencySlug: "product-prioritization",
        weight: 20,
        displayOrder: 4,
        rubricKey: "role_knowledge_v1",
      },
      {
        id: "task24-plan-module-saf-prod-ge-general",
        frameworkKey: "general",
        competencySlug: "customer-empathy",
        weight: 15,
        displayOrder: 5,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    id: "task24-plan-safaricom-product-manager-mid-level-v2",
    slug: "scenario-a-safaricom-product-manager-recommended-mid-level",
    version: 2,
    companySlug: "safaricom",
    roleFamilySlug: "product-management",
    jobRoleSlug: "product-manager",
    senioritySlug: "mid-level",
    interviewStageSlug: null,
    focusMode: "recommended",
    promptVersion: planPromptVersion,
    questionSetVersion: planQuestionSetVersion,
    rubricVersion: planRubricVersion,
    rationale:
      "Task 24 reviewed launch plan for Safaricom mid-level product management. Deepens official-source company context without claiming exact interview questions.",
    modules: [
      {
        id: "task24-plan-module-saf-prod-ml-star",
        frameworkKey: "behavioral_star",
        competencySlug: "ownership",
        weight: 20,
        displayOrder: 1,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "task24-plan-module-saf-prod-ml-case",
        frameworkKey: "product_case",
        competencySlug: "customer-empathy",
        weight: 25,
        displayOrder: 2,
        rubricKey: "product_case_v1",
      },
      {
        id: "task24-plan-module-saf-prod-ml-analytics",
        frameworkKey: "analytics_case",
        competencySlug: "metrics-analytics",
        weight: 20,
        displayOrder: 3,
        rubricKey: "product_case_v1",
      },
      {
        id: "task24-plan-module-saf-prod-ml-role",
        frameworkKey: "role_knowledge",
        competencySlug: "product-prioritization",
        weight: 20,
        displayOrder: 4,
        rubricKey: "role_knowledge_v1",
      },
      {
        id: "task24-plan-module-saf-prod-ml-general",
        frameworkKey: "general",
        competencySlug: "customer-empathy",
        weight: 15,
        displayOrder: 5,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    id: "task24-plan-safaricom-software-engineer-graduate-entry-v2",
    slug: "scenario-b-safaricom-software-engineering-recommended-graduate-entry",
    version: 2,
    companySlug: "safaricom",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    senioritySlug: "graduate-entry",
    interviewStageSlug: null,
    focusMode: "recommended",
    promptVersion: planPromptVersion,
    questionSetVersion: planQuestionSetVersion,
    rubricVersion: planRubricVersion,
    rationale:
      "Task 24 reviewed launch plan for Safaricom software engineering. Covers behavioral, technical, system, situational, and general readiness with official-source company context.",
    modules: [
      {
        id: "task24-plan-module-saf-sw-ge-star",
        frameworkKey: "behavioral_star",
        competencySlug: "ownership",
        weight: 20,
        displayOrder: 1,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "task24-plan-module-saf-sw-ge-technical",
        frameworkKey: "technical_concept",
        competencySlug: "technical-fundamentals",
        weight: 25,
        displayOrder: 2,
        rubricKey: "technical_concept_v1",
      },
      {
        id: "task24-plan-module-saf-sw-ge-system",
        frameworkKey: "system_design",
        competencySlug: "systems-thinking",
        weight: 20,
        displayOrder: 3,
        rubricKey: "technical_concept_v1",
      },
      {
        id: "task24-plan-module-saf-sw-ge-situational",
        frameworkKey: "situational",
        competencySlug: "collaboration",
        weight: 20,
        displayOrder: 4,
        rubricKey: "role_knowledge_v1",
      },
      {
        id: "task24-plan-module-saf-sw-ge-general",
        frameworkKey: "general",
        competencySlug: "customer-empathy",
        weight: 15,
        displayOrder: 5,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    id: "task24-plan-safaricom-software-engineer-behavioral-v2",
    slug: "scenario-b-safaricom-software-engineering-behavioral-focus-graduate-entry",
    version: 2,
    companySlug: "safaricom",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    senioritySlug: "graduate-entry",
    interviewStageSlug: null,
    focusMode: "behavioral_focus",
    promptVersion: planPromptVersion,
    questionSetVersion: planQuestionSetVersion,
    rubricVersion: planRubricVersion,
    rationale:
      "Task 24 behavioral-focus launch plan for Safaricom software engineering. Uses reviewed practice prompts grounded in official employer context.",
    modules: [
      {
        id: "task24-plan-module-saf-sw-behavioral-star",
        frameworkKey: "behavioral_star",
        competencySlug: "ownership",
        weight: 45,
        displayOrder: 1,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "task24-plan-module-saf-sw-behavioral-situational",
        frameworkKey: "situational",
        competencySlug: "collaboration",
        weight: 35,
        displayOrder: 2,
        rubricKey: "role_knowledge_v1",
      },
      {
        id: "task24-plan-module-saf-sw-behavioral-general",
        frameworkKey: "general",
        competencySlug: "customer-empathy",
        weight: 20,
        displayOrder: 3,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    id: "task24-plan-safaricom-software-engineer-technical-v2",
    slug: "scenario-b-safaricom-software-engineering-technical-concept-graduate-entry",
    version: 2,
    companySlug: "safaricom",
    roleFamilySlug: "software-engineering",
    jobRoleSlug: "software-engineer",
    senioritySlug: "graduate-entry",
    interviewStageSlug: null,
    focusMode: "role_specific_focus",
    promptVersion: planPromptVersion,
    questionSetVersion: planQuestionSetVersion,
    rubricVersion: planRubricVersion,
    rationale:
      "Task 24 technical-focus launch plan for Safaricom software engineering. Covers debugging, release design, and customer-data safety without exact-question claims.",
    modules: [
      {
        id: "task24-plan-module-saf-sw-technical-concept",
        frameworkKey: "technical_concept",
        competencySlug: "technical-fundamentals",
        weight: 45,
        displayOrder: 1,
        rubricKey: "technical_concept_v1",
      },
      {
        id: "task24-plan-module-saf-sw-technical-system",
        frameworkKey: "system_design",
        competencySlug: "systems-thinking",
        weight: 35,
        displayOrder: 2,
        rubricKey: "technical_concept_v1",
      },
      {
        id: "task24-plan-module-saf-sw-technical-situational",
        frameworkKey: "situational",
        competencySlug: "collaboration",
        weight: 20,
        displayOrder: 3,
        rubricKey: "role_knowledge_v1",
      },
    ],
  },
  {
    id: "task24-plan-kcb-customer-service-officer-graduate-entry",
    slug: "launch-kcb-customer-service-officer-recommended-graduate-entry",
    version: 1,
    companySlug: "kcb",
    roleFamilySlug: "customer-service",
    jobRoleSlug: "customer-service-officer",
    senioritySlug: "graduate-entry",
    interviewStageSlug: null,
    focusMode: "recommended",
    promptVersion: planPromptVersion,
    questionSetVersion: planQuestionSetVersion,
    rubricVersion: planRubricVersion,
    rationale:
      "Task 24 reviewed launch plan for KCB customer service. Uses official careers and recent customer-experience systems role context; prompts are synthetic practice only.",
    modules: [
      {
        id: "task24-plan-module-kcb-cs-star",
        frameworkKey: "behavioral_star",
        competencySlug: "customer-service-excellence",
        weight: 25,
        displayOrder: 1,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "task24-plan-module-kcb-cs-situational",
        frameworkKey: "situational",
        competencySlug: "customer-service-excellence",
        weight: 25,
        displayOrder: 2,
        rubricKey: "customer_service_excellence_v1",
      },
      {
        id: "task24-plan-module-kcb-cs-role",
        frameworkKey: "role_knowledge",
        competencySlug: "digital-customer-experience",
        weight: 25,
        displayOrder: 3,
        rubricKey: "customer_service_excellence_v1",
      },
      {
        id: "task24-plan-module-kcb-cs-general",
        frameworkKey: "general",
        competencySlug: "regulatory-risk-awareness",
        weight: 25,
        displayOrder: 4,
        rubricKey: "customer_service_excellence_v1",
      },
    ],
  },
  {
    id: "task24-plan-kcb-relationship-manager-mid-level",
    slug: "launch-kcb-relationship-manager-recommended-mid-level",
    version: 1,
    companySlug: "kcb",
    roleFamilySlug: "relationship-management",
    jobRoleSlug: "relationship-manager",
    senioritySlug: "mid-level",
    interviewStageSlug: null,
    focusMode: "recommended",
    promptVersion: planPromptVersion,
    questionSetVersion: planQuestionSetVersion,
    rubricVersion: planRubricVersion,
    rationale:
      "Task 24 reviewed launch plan for KCB relationship management. Uses official careers and recent relationship-manager role context; prompts are synthetic practice only.",
    modules: [
      {
        id: "task24-plan-module-kcb-rm-star",
        frameworkKey: "behavioral_star",
        competencySlug: "relationship-building",
        weight: 25,
        displayOrder: 1,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "task24-plan-module-kcb-rm-role",
        frameworkKey: "role_knowledge",
        competencySlug: "relationship-building",
        weight: 30,
        displayOrder: 2,
        rubricKey: "relationship_management_v1",
      },
      {
        id: "task24-plan-module-kcb-rm-situational",
        frameworkKey: "situational",
        competencySlug: "regulatory-risk-awareness",
        weight: 25,
        displayOrder: 3,
        rubricKey: "relationship_management_v1",
      },
      {
        id: "task24-plan-module-kcb-rm-general",
        frameworkKey: "general",
        competencySlug: "stakeholder-communication",
        weight: 20,
        displayOrder: 4,
        rubricKey: "relationship_management_v1",
      },
    ],
  },
  {
    id: "task24-plan-kpc-graduate-trainee-engineer",
    slug: "launch-kpc-graduate-trainee-engineer-recommended-graduate-entry",
    version: 1,
    companySlug: "kenya-pipeline-company",
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: "graduate-trainee-engineer",
    senioritySlug: "graduate-entry",
    interviewStageSlug: null,
    focusMode: "recommended",
    promptVersion: planPromptVersion,
    questionSetVersion: planQuestionSetVersion,
    rubricVersion: planRubricVersion,
    rationale:
      "Task 24 reviewed launch plan for Kenya Pipeline graduate trainee engineering. Uses official KPC career, about, Morendat, and infrastructure sources; prompts are synthetic practice only.",
    modules: [
      {
        id: "task24-plan-module-kpc-ge-star",
        frameworkKey: "behavioral_star",
        competencySlug: "safety-environmental-stewardship",
        weight: 20,
        displayOrder: 1,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "task24-plan-module-kpc-ge-technical",
        frameworkKey: "technical_concept",
        competencySlug: "systems-thinking",
        weight: 25,
        displayOrder: 2,
        rubricKey: "energy_engineering_v1",
      },
      {
        id: "task24-plan-module-kpc-ge-situational",
        frameworkKey: "situational",
        competencySlug: "operational-reliability",
        weight: 20,
        displayOrder: 3,
        rubricKey: "energy_engineering_v1",
      },
      {
        id: "task24-plan-module-kpc-ge-role",
        frameworkKey: "role_knowledge",
        competencySlug: "field-engineering-judgment",
        weight: 20,
        displayOrder: 4,
        rubricKey: "energy_engineering_v1",
      },
      {
        id: "task24-plan-module-kpc-ge-general",
        frameworkKey: "general",
        competencySlug: "stakeholder-communication",
        weight: 15,
        displayOrder: 5,
        rubricKey: "energy_engineering_v1",
      },
    ],
  },
  {
    id: "task24-plan-kpc-pipeline-engineer-mid-level",
    slug: "launch-kpc-pipeline-engineer-recommended-mid-level",
    version: 1,
    companySlug: "kenya-pipeline-company",
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: "pipeline-engineer",
    senioritySlug: "mid-level",
    interviewStageSlug: null,
    focusMode: "recommended",
    promptVersion: planPromptVersion,
    questionSetVersion: planQuestionSetVersion,
    rubricVersion: planRubricVersion,
    rationale:
      "Task 24 reviewed launch plan for Kenya Pipeline engineering coverage beyond graduate entry. Uses official KPC pipeline, storage, safety, and project context; prompts are synthetic practice only.",
    modules: [
      {
        id: "task24-plan-module-kpc-pipeline-technical",
        frameworkKey: "technical_concept",
        competencySlug: "operational-reliability",
        weight: 30,
        displayOrder: 1,
        rubricKey: "energy_engineering_v1",
      },
      {
        id: "task24-plan-module-kpc-pipeline-system",
        frameworkKey: "system_design",
        competencySlug: "systems-thinking",
        weight: 25,
        displayOrder: 2,
        rubricKey: "energy_engineering_v1",
      },
      {
        id: "task24-plan-module-kpc-pipeline-star",
        frameworkKey: "behavioral_star",
        competencySlug: "safety-environmental-stewardship",
        weight: 20,
        displayOrder: 3,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "task24-plan-module-kpc-pipeline-role",
        frameworkKey: "role_knowledge",
        competencySlug: "field-engineering-judgment",
        weight: 25,
        displayOrder: 4,
        rubricKey: "energy_engineering_v1",
      },
    ],
  },
  {
    id: "task24-plan-kenya-customer-service-fallback",
    slug: "launch-kenya-customer-service-officer-recommended-graduate-entry",
    version: 1,
    companySlug: null,
    roleFamilySlug: "customer-service",
    jobRoleSlug: "customer-service-officer",
    senioritySlug: "graduate-entry",
    interviewStageSlug: null,
    focusMode: "recommended",
    promptVersion: planPromptVersion,
    questionSetVersion: planQuestionSetVersion,
    rubricVersion: planRubricVersion,
    rationale:
      "Task 24 reviewed Kenya fallback plan for customer-service combinations without a company-specific plan. This is intentionally generic and should be presented as a fallback.",
    modules: [
      {
        id: "task24-plan-module-ke-cs-star",
        frameworkKey: "behavioral_star",
        competencySlug: "customer-service-excellence",
        weight: 40,
        displayOrder: 1,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "task24-plan-module-ke-cs-role",
        frameworkKey: "role_knowledge",
        competencySlug: "regulatory-risk-awareness",
        weight: 35,
        displayOrder: 2,
        rubricKey: "customer_service_excellence_v1",
      },
      {
        id: "task24-plan-module-ke-cs-general",
        frameworkKey: "general",
        competencySlug: "stakeholder-communication",
        weight: 25,
        displayOrder: 3,
        rubricKey: "customer_service_excellence_v1",
      },
    ],
  },
  {
    id: "task24-plan-kenya-relationship-manager-fallback",
    slug: "launch-kenya-relationship-manager-recommended-mid-level",
    version: 1,
    companySlug: null,
    roleFamilySlug: "relationship-management",
    jobRoleSlug: "relationship-manager",
    senioritySlug: "mid-level",
    interviewStageSlug: null,
    focusMode: "recommended",
    promptVersion: planPromptVersion,
    questionSetVersion: planQuestionSetVersion,
    rubricVersion: planRubricVersion,
    rationale:
      "Task 24 reviewed Kenya fallback plan for relationship-management combinations without a company-specific plan. This is intentionally generic and should be presented as a fallback.",
    modules: [
      {
        id: "task24-plan-module-ke-rm-star",
        frameworkKey: "behavioral_star",
        competencySlug: "relationship-building",
        weight: 40,
        displayOrder: 1,
        rubricKey: "behavioral_star_v1",
      },
      {
        id: "task24-plan-module-ke-rm-role",
        frameworkKey: "role_knowledge",
        competencySlug: "relationship-building",
        weight: 35,
        displayOrder: 2,
        rubricKey: "relationship_management_v1",
      },
      {
        id: "task24-plan-module-ke-rm-general",
        frameworkKey: "general",
        competencySlug: "stakeholder-communication",
        weight: 25,
        displayOrder: 3,
        rubricKey: "relationship_management_v1",
      },
    ],
  },
  {
    id: "task24-plan-kenya-energy-engineering-fallback",
    slug: "launch-kenya-energy-engineering-recommended-graduate-entry",
    version: 1,
    companySlug: null,
    roleFamilySlug: "energy-engineering",
    jobRoleSlug: null,
    senioritySlug: "graduate-entry",
    interviewStageSlug: null,
    focusMode: "recommended",
    promptVersion: planPromptVersion,
    questionSetVersion: planQuestionSetVersion,
    rubricVersion: planRubricVersion,
    rationale:
      "Task 24 reviewed Kenya fallback plan for energy-engineering combinations without a company-specific plan. This is intentionally generic and should be presented as a fallback.",
    modules: [
      {
        id: "task24-plan-module-ke-energy-situational",
        frameworkKey: "situational",
        competencySlug: "safety-environmental-stewardship",
        weight: 35,
        displayOrder: 1,
        rubricKey: "energy_engineering_v1",
      },
      {
        id: "task24-plan-module-ke-energy-technical",
        frameworkKey: "technical_concept",
        competencySlug: "operational-reliability",
        weight: 40,
        displayOrder: 2,
        rubricKey: "energy_engineering_v1",
      },
      {
        id: "task24-plan-module-ke-energy-general",
        frameworkKey: "general",
        competencySlug: "stakeholder-communication",
        weight: 25,
        displayOrder: 3,
        rubricKey: "energy_engineering_v1",
      },
    ],
  },
] satisfies PlanFixture[];

async function upsertPublishedReview(
  prisma: PrismaClient,
  input: {
    id: string;
    contentSourceId?: string | null;
    companyId?: string | null;
    questionId?: string | null;
    rubricId?: string | null;
    notes: string;
  },
) {
  const data = {
    status: "published" as const,
    contentSourceId: input.contentSourceId ?? null,
    companyId: input.companyId ?? null,
    jobPostingVersionId: null,
    questionId: input.questionId ?? null,
    rubricId: input.rubricId ?? null,
    reviewedAt: REVIEWED_AT,
    notes: input.notes,
    nextReviewAt: NEXT_REVIEW_AT,
  };

  await prisma.contentReview.upsert({
    where: { id: input.id },
    update: data,
    create: { id: input.id, ...data },
  });
}

export async function seedKenyanLaunchCatalog(prisma: PrismaClient) {
  const savedMarket = await prisma.market.upsert({
    where: { slug: market.slug },
    update: {
      name: market.name,
      isoCode: market.isoCode,
      currencyCode: market.currencyCode,
      timezone: market.timezone,
      isActive: true,
    },
    create: {
      id: market.id,
      slug: market.slug,
      name: market.name,
      isoCode: market.isoCode,
      currencyCode: market.currencyCode,
      timezone: market.timezone,
      isActive: true,
    },
    select: { id: true },
  });

  const industryBySlug = new Map<string, IdOnly>();
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

  const roleFamilyBySlug = new Map<string, IdOnly>();
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

  const frameworkByKey = new Map<string, IdOnly>();
  for (const framework of frameworks) {
    const saved = await prisma.evaluationFramework.upsert({
      where: { key: framework.slug },
      update: {
        name: framework.name,
        description: framework.description,
        isActive: true,
      },
      create: {
        id: framework.id,
        key: framework.slug,
        name: framework.name,
        description: framework.description,
        isActive: true,
      },
      select: { id: true },
    });
    frameworkByKey.set(framework.slug, saved);
  }

  const competencyBySlug = new Map<string, IdOnly>();
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

  const seniorityBySlug = new Map<string, IdOnly>();
  for (const seniorityLevel of seniorityLevels) {
    const saved = await prisma.seniorityLevel.upsert({
      where: { slug: seniorityLevel.slug },
      update: {
        label: seniorityLevel.label,
        displayOrder: seniorityLevel.displayOrder,
        isActive: true,
      },
      create: {
        id: seniorityLevel.id,
        slug: seniorityLevel.slug,
        label: seniorityLevel.label,
        displayOrder: seniorityLevel.displayOrder,
        isActive: true,
      },
      select: { id: true },
    });
    seniorityBySlug.set(seniorityLevel.slug, saved);
  }

  const stageBySlug = new Map<string, IdOnly>();
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

  const sourceByKey = new Map<string, IdOnly>();
  for (const source of sources) {
    const publishedAt = "publishedAt" in source ? source.publishedAt : null;
    const saved = await prisma.contentSource.upsert({
      where: { id: source.id },
      update: {
        type: source.type,
        title: source.title,
        publisher: source.publisher,
        url: source.url,
        publishedAt,
        retrievedAt: source.retrievedAt,
        isOfficial: source.isOfficial,
        researchNotes: source.researchNotes,
        confidence: source.confidence,
      },
      create: {
        id: source.id,
        type: source.type,
        title: source.title,
        publisher: source.publisher,
        url: source.url,
        publishedAt,
        retrievedAt: source.retrievedAt,
        isOfficial: source.isOfficial,
        researchNotes: source.researchNotes,
        confidence: source.confidence,
      },
      select: { id: true },
    });
    sourceByKey.set(source.key, saved);

    await upsertPublishedReview(prisma, {
      id: reviewId("source", source.key),
      contentSourceId: saved.id,
      notes: `${sourceReviewNotes} Source note: ${source.researchNotes}`,
    });
  }

  const companyBySlug = new Map<string, IdOnly>();
  for (const company of companies) {
    const saved = await prisma.company.upsert({
      where: { slug: company.slug },
      update: {
        legalName: company.legalName,
        displayName: company.displayName,
        industryId: requireMapValue(
          industryBySlug,
          company.industrySlug,
          "industry",
        ).id,
        marketId: savedMarket.id,
        websiteUrl: company.websiteUrl,
        careersUrl: company.careersUrl,
        summary: company.summary,
        focusAreas: company.focusAreas,
        publicationStatus: "published",
        confidence: "high",
        reviewedAt: REVIEWED_AT,
        nextReviewAt: NEXT_REVIEW_AT,
      },
      create: {
        id: company.id,
        slug: company.slug,
        legalName: company.legalName,
        displayName: company.displayName,
        industryId: requireMapValue(
          industryBySlug,
          company.industrySlug,
          "industry",
        ).id,
        marketId: savedMarket.id,
        websiteUrl: company.websiteUrl,
        careersUrl: company.careersUrl,
        summary: company.summary,
        focusAreas: company.focusAreas,
        publicationStatus: "published",
        confidence: "high",
        reviewedAt: REVIEWED_AT,
        nextReviewAt: NEXT_REVIEW_AT,
      },
      select: { id: true },
    });
    companyBySlug.set(company.slug, saved);

    await upsertPublishedReview(prisma, {
      id: reviewId("company", company.slug),
      companyId: saved.id,
      notes: `Task 24 company review accepted ${company.displayName} for launch preparation coverage using sources: ${company.sourceKeys.join(", ")}.`,
    });
  }

  const jobRoleBySlug = new Map<string, IdOnly>();
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
        companyId: null,
        marketId: savedMarket.id,
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
        companyId: null,
        marketId: savedMarket.id,
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
          id: `task24-job-title-alias-${role.slug}-${alias
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

  const rubricByKey = new Map<string, IdOnly>();
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
        retiredAt: null,
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

    await upsertPublishedReview(prisma, {
      id: reviewId("rubric", rubric.key),
      rubricId: savedRubric.id,
      notes: `Task 24 human-reviewed launch rubric: ${rubric.label}.`,
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

  await prisma.question.createMany({
    data: questions.map((question) => ({
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
      confidence: question.confidence,
      reviewedAt: REVIEWED_AT,
      nextReviewAt: NEXT_REVIEW_AT,
    })),
    skipDuplicates: true,
  });

  for (const question of questions) {
    await prisma.question.update({
      where: {
        slug_version: {
          slug: question.slug,
          version: question.version,
        },
      },
      data: {
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
        confidence: question.confidence,
        reviewedAt: REVIEWED_AT,
        nextReviewAt: NEXT_REVIEW_AT,
        retiredAt: null,
      },
    });
  }

  await prisma.contentReview.deleteMany({
    where: { id: { startsWith: "task24-review-question-" } },
  });
  await prisma.questionCompany.deleteMany({
    where: { id: { startsWith: "task24-question-company-" } },
  });
  await prisma.questionRole.deleteMany({
    where: { id: { startsWith: "task24-question-role-" } },
  });
  await prisma.questionCompetency.deleteMany({
    where: { id: { startsWith: "task24-question-competency-" } },
  });
  await prisma.questionVariant.deleteMany({
    where: { id: { startsWith: "task24-question-variant-" } },
  });
  await prisma.strongAnswerSignal.deleteMany({
    where: { id: { startsWith: "task24-signal-" } },
  });
  await prisma.redFlag.deleteMany({
    where: { id: { startsWith: "task24-red-flag-" } },
  });
  await prisma.followUpRule.deleteMany({
    where: { id: { startsWith: "task24-follow-up-" } },
  });

  await prisma.contentReview.createMany({
    data: questions.map((question) => ({
      id: reviewId("question", question.slug),
      status: "published",
      questionId: question.id,
      reviewedAt: REVIEWED_AT,
      notes: question.companySlug
        ? `Task 24 human-reviewed company-specific practice prompt and association for ${question.companySlug}. This is not a leaked or exact company interview question.`
        : "Task 24 human-reviewed generic fallback practice prompt.",
      nextReviewAt: NEXT_REVIEW_AT,
    })),
    skipDuplicates: true,
  });

  await prisma.questionCompany.createMany({
    data: questions
      .filter((question) => question.companySlug)
      .map((question) => ({
        id: `task24-question-company-${question.slug}`,
        questionId: question.id,
        companyId: requireMapValue(
          companyBySlug,
          question.companySlug ?? "",
          "company",
        ).id,
        sourceId: question.sourceKey
          ? requireMapValue(sourceByKey, question.sourceKey, "source").id
          : null,
        weight: 25,
        rationale:
          question.sourceRationale ??
          "Task 24 reviewed company association. Prompt is synthetic practice content, not a leaked or confirmed company interview question.",
      })),
    skipDuplicates: true,
  });

  await prisma.questionRole.createMany({
    data: questions.map((question) => ({
      id: `task24-question-role-${question.slug}`,
      questionId: question.id,
      roleFamilyId: requireMapValue(
        roleFamilyBySlug,
        question.roleFamilySlug,
        "role family",
      ).id,
      jobRoleId: question.jobRoleSlug
        ? requireMapValue(jobRoleBySlug, question.jobRoleSlug, "job role").id
        : null,
      weight: question.companySlug ? 25 : 10,
      rationale:
        "Task 24 reviewed role association for Kenyan launch content and transparent fallbacks.",
    })),
    skipDuplicates: true,
  });

  await prisma.questionCompetency.createMany({
    data: questions.flatMap((question) =>
      question.competencySlugs.map((competencySlug) => ({
        id: `task24-question-competency-${question.slug}-${competencySlug}`,
        questionId: question.id,
        competencyId: requireMapValue(
          competencyBySlug,
          competencySlug,
          "competency",
        ).id,
        weight: question.companySlug ? 15 : 10,
        rationale:
          "Task 24 reviewed competency association for launch preparation coverage.",
      })),
    ),
    skipDuplicates: true,
  });

  await prisma.questionVariant.createMany({
    data: questions.map((question) => ({
      id: `task24-question-variant-${question.slug}-en`,
      questionId: question.id,
      locale: "en",
      prompt: question.prompt,
    })),
    skipDuplicates: true,
  });

  await prisma.strongAnswerSignal.createMany({
    data: questions.flatMap((question) =>
      question.signals.map((label, index) => ({
        id: `task24-signal-${question.slug}-${index + 1}`,
        questionId: question.id,
        label,
        description: label,
        displayOrder: index + 1,
      })),
    ),
    skipDuplicates: true,
  });

  await prisma.redFlag.createMany({
    data: questions.flatMap((question) =>
      question.redFlags.map((label, index) => ({
        id: `task24-red-flag-${question.slug}-${index + 1}`,
        questionId: question.id,
        label,
        description: label,
        severity: index + 2,
        displayOrder: index + 1,
      })),
    ),
    skipDuplicates: true,
  });

  await prisma.followUpRule.createMany({
    data: questions.flatMap((question) =>
      question.followUps.map((followUp, index) => ({
        id: `task24-follow-up-${question.slug}-${index + 1}`,
        questionId: question.id,
        intent: followUp.intent,
        condition: followUp.condition,
        promptHint: followUp.promptHint,
        displayOrder: index + 1,
      })),
    ),
    skipDuplicates: true,
  });

  for (const plan of plans) {
    const savedPlan = await prisma.interviewPlan.upsert({
      where: {
        slug_version: {
          slug: plan.slug,
          version: plan.version,
        },
      },
      update: {
        marketId: savedMarket.id,
        companyId: plan.companySlug
          ? requireMapValue(companyBySlug, plan.companySlug, "company").id
          : null,
        roleFamilyId: requireMapValue(
          roleFamilyBySlug,
          plan.roleFamilySlug,
          "role family",
        ).id,
        jobRoleId: plan.jobRoleSlug
          ? requireMapValue(jobRoleBySlug, plan.jobRoleSlug, "job role").id
          : null,
        seniorityLevelId: requireMapValue(
          seniorityBySlug,
          plan.senioritySlug,
          "seniority",
        ).id,
        interviewStageId: plan.interviewStageSlug
          ? requireMapValue(stageBySlug, plan.interviewStageSlug, "interview stage").id
          : null,
        focusMode: plan.focusMode,
        status: "published",
        promptVersion: plan.promptVersion,
        questionSetVersion: plan.questionSetVersion,
        rubricVersion: plan.rubricVersion,
        rationale: plan.rationale,
        retiredAt: null,
      },
      create: {
        id: plan.id,
        slug: plan.slug,
        version: plan.version,
        marketId: savedMarket.id,
        companyId: plan.companySlug
          ? requireMapValue(companyBySlug, plan.companySlug, "company").id
          : null,
        roleFamilyId: requireMapValue(
          roleFamilyBySlug,
          plan.roleFamilySlug,
          "role family",
        ).id,
        jobRoleId: plan.jobRoleSlug
          ? requireMapValue(jobRoleBySlug, plan.jobRoleSlug, "job role").id
          : null,
        seniorityLevelId: requireMapValue(
          seniorityBySlug,
          plan.senioritySlug,
          "seniority",
        ).id,
        interviewStageId: plan.interviewStageSlug
          ? requireMapValue(stageBySlug, plan.interviewStageSlug, "interview stage")
              .id
          : null,
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
            catalogVersion: JOBREADY_LAUNCH_CATALOG_VERSION,
            includePublishedOnly: true,
            preferCompanyContext: Boolean(plan.companySlug),
            requireReviewedCompanySource: true,
            avoidNearDuplicates: true,
            syntheticPracticeOnly: true,
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
            catalogVersion: JOBREADY_LAUNCH_CATALOG_VERSION,
            includePublishedOnly: true,
            preferCompanyContext: Boolean(plan.companySlug),
            requireReviewedCompanySource: true,
            avoidNearDuplicates: true,
            syntheticPracticeOnly: true,
          },
        },
      });
    }
  }

  return {
    catalogVersion: JOBREADY_LAUNCH_CATALOG_VERSION,
    companies: companies.length,
    officialSources: sources.length,
    questions: questions.length,
    rubrics: rubrics.length,
    plans: plans.length,
    publishedJobs: 0,
    jobPublicationPolicy:
      "No Task 24 live public job was published because reviewed KCB role pages had passed the 24 July 2026 deadline on the 28 July 2026 review date, and KPC visible vacancies did not match the graduate trainee or engineering launch-role scope with enough closing-date evidence.",
  };
}

export const JOBREADY_LAUNCH_CATALOG_EXPECTED = {
  companySlugs: companies.map((company) => company.slug),
  sourceIds: sources.map((source) => source.id),
  questionSlugs: questions.map((question) => question.slug),
  rubricKeys: rubrics.map((rubric) => rubric.key),
  planSlugs: plans.map((plan) => ({
    slug: plan.slug,
    version: plan.version,
    companySlug: plan.companySlug,
    roleFamilySlug: plan.roleFamilySlug,
    jobRoleSlug: plan.jobRoleSlug,
    senioritySlug: plan.senioritySlug,
    focusMode: plan.focusMode,
  })),
} as const;
