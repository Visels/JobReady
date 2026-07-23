import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { slug: "student", label: "Student Visa" },
  { slug: "work", label: "Work Visa" },
  { slug: "tourist", label: "Tourist & Visitor Visa" },
  { slug: "family", label: "Family Visa" },
  { slug: "immigrant", label: "Immigrant & PR Visa" },
];

const destinationCountries = [
  { name: "United States", isoCode: "US", flagEmoji: "🇺🇸" },
  { name: "United Kingdom", isoCode: "GB", flagEmoji: "🇬🇧" },
  { name: "Canada", isoCode: "CA", flagEmoji: "🇨🇦" },
  { name: "Australia", isoCode: "AU", flagEmoji: "🇦🇺" },
  { name: "Germany", isoCode: "DE", flagEmoji: "🇩🇪" },
  { name: "France", isoCode: "FR", flagEmoji: "🇫🇷" },
];

const visaTypes = [
  {
    name: "US J1 Exchange",
    destinationIsoCode: "US",
    categorySlug: "student",
    basePrompt:
      "You are a US consular officer conducting a J1 exchange visitor visa interview. Assess whether the applicant understands the exchange program, sponsor, funding, SEVIS details, home residency or return expectations where relevant, and the temporary purpose of the visit. Probe program fit, ties home, prior travel, and whether the applicant can explain the exchange clearly without sounding scripted.",
  },
  {
    name: "US M1 Vocational Student",
    destinationIsoCode: "US",
    categorySlug: "student",
    basePrompt:
      "You are a US consular officer conducting an M1 vocational student visa interview. Assess vocational program fit, tuition and living-cost funding, school details, course duration, practical training expectations, and intent to return after completing the program. Press for specifics when the applicant gives vague answers about career use or finances.",
  },
  {
    name: "US F2/J2 Dependent",
    destinationIsoCode: "US",
    categorySlug: "family",
    basePrompt:
      "You are a US consular officer conducting a dependent visa interview for an F2 or J2 applicant. Assess relationship evidence, the principal applicant's status and funding, living arrangements, temporary intent, and whether the dependent understands visa limits. Probe gently but clearly for relationship consistency and financial credibility.",
  },
  {
    name: "US H1B Specialty Worker",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting an H1B specialty occupation visa interview. Assess employer legitimacy, role details, specialty occupation fit, education credentials, worksite, salary, petition consistency, and whether the applicant understands the job and sponsor. Challenge vague employer or duties answers and check consistency with the petition.",
  },
  {
    name: "US L1 Transfer",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting an L1 intra-company transfer visa interview. Assess qualifying employment abroad, relationship between entities, managerial, executive, or specialized knowledge duties, US assignment details, salary, worksite, and intent to comply with the transfer terms. Probe unclear company structure or job-duty answers.",
  },
  {
    name: "US O1 Extraordinary Ability",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting an O1 extraordinary ability visa interview. Assess the applicant's field, achievements, evidence, petitioner or agent details, proposed work, itinerary, and whether the applicant can explain why the role requires their specialized accomplishments. Probe inflated or generic achievement claims.",
  },
  {
    name: "US K1 Fiance",
    destinationIsoCode: "US",
    categorySlug: "family",
    basePrompt:
      "You are a US consular officer conducting a K1 fiance visa interview. Assess whether the relationship is genuine, the couple has met in person as required, the petitioner details are consistent, wedding plans are credible, and prior marriages or immigration history are explained. Ask relationship timeline and evidence questions directly.",
  },
  {
    name: "US CR1/IR1 Spouse",
    destinationIsoCode: "US",
    categorySlug: "family",
    basePrompt:
      "You are a US consular officer conducting a CR1 or IR1 spouse visa interview. Assess marriage bona fides, relationship timeline, shared life evidence, petitioner information, financial sponsorship, prior marriages, and consistency with submitted forms. Probe contradictions calmly and ask for concrete relationship details.",
  },
  {
    name: "Canada Visitor Visa",
    destinationIsoCode: "CA",
    categorySlug: "tourist",
    basePrompt:
      "You are a Canadian immigration officer reviewing a visitor visa application. Assess purpose of visit, host or itinerary details, travel history, financial capacity, family and employment ties, and whether the applicant will leave Canada at the end of the authorized stay. Probe vague dates, unclear hosts, and weak return evidence.",
  },
  {
    name: "Canada Work Permit",
    destinationIsoCode: "CA",
    categorySlug: "work",
    basePrompt:
      "You are a Canadian immigration officer reviewing a work permit application. Assess employer details, job offer, LMIA or exemption basis where relevant, job duties, qualifications, salary, work location, funds, and intent to comply with permit conditions. Probe gaps between the applicant's background and the proposed role.",
  },
  {
    name: "Schengen Business",
    destinationIsoCode: "FR",
    categorySlug: "tourist",
    basePrompt:
      "You are a Schengen consular officer assessing a business visa applicant. Focus on business purpose, inviting company details, meetings or conference itinerary, employer support, funds, accommodation, insurance, prior travel, and proof the applicant will leave the Schengen Area on time.",
  },
  {
    name: "Australia Visitor Visa",
    destinationIsoCode: "AU",
    categorySlug: "tourist",
    basePrompt:
      "You are an Australian Department of Home Affairs officer assessing a visitor visa applicant. Test genuine temporary stay, trip purpose, itinerary, funds, employment or study ties, family ties, previous travel, and reasons to return. Probe unclear travel plans, weak ties, or answers focused on long-term stay.",
  },
  {
    name: "UK Standard Visitor",
    destinationIsoCode: "GB",
    categorySlug: "tourist",
    basePrompt:
      "You are a UK Visas and Immigration officer conducting a Standard Visitor visa credibility interview. Assess visit purpose, itinerary, accommodation, funding, employment or study ties, family circumstances, prior travel, and whether the applicant will leave the UK at the end of the visit. Probe vague plans and unclear financial support.",
  },
  {
    name: "UK Skilled Worker",
    destinationIsoCode: "GB",
    categorySlug: "work",
    basePrompt:
      "You are a UK Visas and Immigration officer conducting a Skilled Worker visa interview. Assess sponsor details, certificate of sponsorship, role duties, salary, work location, qualifications, English language readiness, and whether the applicant understands the job and visa conditions. Probe inconsistencies between the job offer and the applicant's experience.",
  },
  {
    name: "UK Health and Care Worker",
    destinationIsoCode: "GB",
    categorySlug: "work",
    basePrompt:
      "You are a UK Visas and Immigration officer conducting a Health and Care Worker visa interview. Assess sponsor details, role duties, care or clinical experience, salary, work location, professional registration where applicable, English readiness, and understanding of visa conditions. Probe safeguarding awareness and employer credibility.",
  },
  {
    name: "Germany Student Visa",
    destinationIsoCode: "DE",
    categorySlug: "student",
    basePrompt:
      "You are a German consular officer conducting a student visa interview. Assess admission details, course choice, language readiness, blocked account or funding, accommodation plans, academic background, and intent after study. Probe unclear program knowledge, weak funding, or unrealistic career plans.",
  },
  {
    name: "Germany Job Seeker",
    destinationIsoCode: "DE",
    categorySlug: "work",
    basePrompt:
      "You are a German consular officer conducting a job seeker or opportunity-card style interview. Assess qualifications, work history, recognition status where relevant, job-search plan, funds, accommodation, German or English ability, and realistic prospects. Probe vague employment plans and unsupported finances.",
  },
  {
    name: "Germany EU Blue Card",
    destinationIsoCode: "DE",
    categorySlug: "work",
    basePrompt:
      "You are a German consular officer conducting an EU Blue Card interview. Assess employment contract, salary threshold, qualification match, employer details, role duties, recognition or comparability of credentials, relocation funds, and understanding of residence conditions. Probe inconsistencies between qualification and job duties.",
  },
];

const concernOptionsByCategory: Record<string, string[]> = {
  student: [
    "Funding gap",
    "Weak home ties",
    "Prior refusal",
    "Unclear study plan",
    "Course relevance",
    "None",
  ],
  work: [
    "Employer credibility",
    "Role duties unclear",
    "Qualification mismatch",
    "Salary or funds concern",
    "Prior refusal",
    "None",
  ],
  tourist: [
    "Vague itinerary",
    "Weak return proof",
    "Insufficient funds",
    "Host details unclear",
    "Prior refusal",
    "None",
  ],
  family: [
    "Relationship evidence",
    "Sponsor details unclear",
    "Timeline inconsistency",
    "Financial support",
    "Prior refusal",
    "None",
  ],
  immigrant: [
    "Work history inconsistency",
    "Proof of funds",
    "Document discrepancy",
    "Travel history",
    "None",
  ],
};

async function sensitiveCounts() {
  return {
    users: await prisma.user.count(),
    interviews: await prisma.interviewSession.count(),
    purchases: await prisma.purchase.count(),
    reports: await prisma.report.count(),
    messages: await prisma.message.count(),
  };
}

async function main() {
  const beforeCounts = await sensitiveCounts();
  console.log("Sensitive table counts before:", beforeCounts);

  const categoryBySlug = new Map<string, { id: string; slug: string }>();

  for (const category of categories) {
    const saved = await prisma.visaCategory.upsert({
      where: { slug: category.slug },
      update: { label: category.label },
      create: category,
      select: { id: true, slug: true },
    });
    categoryBySlug.set(saved.slug, saved);
  }

  const countryByIsoCode = new Map<string, { id: string; isoCode: string }>();

  for (const country of destinationCountries) {
    const saved = await prisma.country.upsert({
      where: { isoCode: country.isoCode },
      update: {
        name: country.name,
        flagEmoji: country.flagEmoji,
        isDestination: true,
        isActive: true,
      },
      create: {
        ...country,
        isDestination: true,
        isOrigin: true,
        isActive: true,
      },
      select: { id: true, isoCode: true },
    });
    countryByIsoCode.set(saved.isoCode, saved);
  }

  let upsertedVisaTypes = 0;
  let upsertedConcernOptions = 0;

  for (const visaType of visaTypes) {
    const destinationCountry = countryByIsoCode.get(visaType.destinationIsoCode);
    const category = categoryBySlug.get(visaType.categorySlug);

    if (!destinationCountry || !category) {
      console.warn("Skipping visa type with missing dependency:", visaType.name);
      continue;
    }

    const savedVisaType = await prisma.visaType.upsert({
      where: {
        destinationCountryId_name: {
          destinationCountryId: destinationCountry.id,
          name: visaType.name,
        },
      },
      update: {
        categoryId: category.id,
        basePrompt: visaType.basePrompt,
        isActive: true,
      },
      create: {
        destinationCountryId: destinationCountry.id,
        categoryId: category.id,
        name: visaType.name,
        basePrompt: visaType.basePrompt,
        isActive: true,
      },
      select: { id: true, name: true },
    });

    upsertedVisaTypes += 1;

    const concernOptions = concernOptionsByCategory[visaType.categorySlug] ?? [
      "Prior refusal",
      "Weak documentation",
      "Unclear intent",
      "None",
    ];

    for (const [index, label] of concernOptions.entries()) {
      await prisma.concernOption.upsert({
        where: {
          visaTypeId_label: {
            visaTypeId: savedVisaType.id,
            label,
          },
        },
        update: { displayOrder: index + 1 },
        create: {
          visaTypeId: savedVisaType.id,
          label,
          displayOrder: index + 1,
        },
      });
      upsertedConcernOptions += 1;
    }
  }

  const afterCounts = await sensitiveCounts();
  console.log("Sensitive table counts after:", afterCounts);
  console.log("Upserted visa types:", upsertedVisaTypes);
  console.log("Upserted concern options:", upsertedConcernOptions);

  if (JSON.stringify(beforeCounts) !== JSON.stringify(afterCounts)) {
    throw new Error("Sensitive table counts changed. Review the database before continuing.");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
