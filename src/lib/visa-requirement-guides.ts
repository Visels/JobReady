export type RequirementItem = {
  title: string;
  body: string;
  required: boolean;
};

export type GuideStep = {
  title: string;
  body: string;
};

export type OfficialLink = {
  title: string;
  href: string;
  body: string;
};

export type VisaRequirementGuide = {
  id: string;
  label: string;
  shortLabel: string;
  category: string;
  summary: string;
  eligibility: string[];
  documents: RequirementItem[];
  applicationSteps: GuideStep[];
  interviewFocus: string[];
  commonPitfalls: string[];
  timeline: string;
  stay: string;
  applicationMode: string;
  officialLinks: OfficialLink[];
};

export type DestinationRequirementGuide = {
  id: string;
  country: string;
  region: string;
  countryNote: string;
  lastReviewed: string;
  visas: VisaRequirementGuide[];
};

const usOfficialLinks = [
  {
    title: "DS-160 application",
    href: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/forms/ds-160-online-nonimmigrant-visa-application.html",
    body: "Official Department of State DS-160 instructions and CEAC access.",
  },
  {
    title: "U.S. embassy finder",
    href: "https://www.usembassy.gov/",
    body: "Find local appointment, payment, courier, and document instructions.",
  },
  {
    title: "Global visa wait times",
    href: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/global-visa-wait-times.html",
    body: "Check current appointment estimates by post and visa category.",
  },
] satisfies OfficialLink[];

const schengenOfficialLinks = [
  {
    title: "EU Schengen visa policy",
    href: "https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en",
    body: "European Commission overview of Schengen visa policy.",
  },
  {
    title: "France-Visas wizard",
    href: "https://www.france-visas.gouv.fr/en/web/france-visas/visa-wizard",
    body: "Official document checklist tool for France visa applications.",
  },
  {
    title: "Short-stay visa overview",
    href: "https://www.france-visas.gouv.fr/en/visa-de-court-sejour",
    body: "Official France-Visas short-stay Schengen guidance.",
  },
] satisfies OfficialLink[];

const studentDocuments = (
  schoolDocument: string,
  fundingDetail: string,
): RequirementItem[] => [
  {
    title: "Valid passport",
    body: "Use the passport you will travel with and confirm the destination's validity rules before submitting.",
    required: true,
  },
  {
    title: schoolDocument,
    body: "Bring the official admission or enrolment proof and make sure names, dates, course level, and institution details match the application.",
    required: true,
  },
  {
    title: "Funding evidence",
    body: fundingDetail,
    required: true,
  },
  {
    title: "Academic records",
    body: "Prepare transcripts, certificates, test scores, resumes, or prior study evidence that explains why the program fits your background.",
    required: true,
  },
  {
    title: "Accommodation and travel plan",
    body: "Have a realistic address, arrival window, and first weeks plan. Some countries ask for proof of accommodation.",
    required: false,
  },
  {
    title: "Medical, insurance, or police checks",
    body: "Some applicants need health insurance, medical exams, TB certificates, police certificates, or translations depending on country and nationality.",
    required: false,
  },
];

const visitorDocuments = (
  applicationForm: string,
  fundsCopy: string,
): RequirementItem[] => [
  {
    title: "Valid passport",
    body: "Confirm validity, blank page, and prior visa or stamp requirements before booking travel.",
    required: true,
  },
  {
    title: applicationForm,
    body: "Complete the correct visitor application and keep the confirmation or reference number available.",
    required: true,
  },
  {
    title: "Trip itinerary",
    body: "Prepare dates, cities, accommodation, host details if applicable, and the reason each stop fits the visit.",
    required: true,
  },
  {
    title: "Proof of funds",
    body: fundsCopy,
    required: true,
  },
  {
    title: "Return-tie evidence",
    body: "Employment leave, school enrolment, business ownership, family obligations, property, or other reasons to leave on time.",
    required: false,
  },
  {
    title: "Invitation or event evidence",
    body: "Use when visiting family, attending a business event, receiving medical care, or joining a conference.",
    required: false,
  },
];

const workDocuments = (
  workAuthorization: string,
  qualificationCopy: string,
): RequirementItem[] => [
  {
    title: "Valid passport",
    body: "Use a passport with enough validity for visa processing and travel.",
    required: true,
  },
  {
    title: workAuthorization,
    body: "The employer, sponsor, petition, certificate, or work permit approval should match the role and application details.",
    required: true,
  },
  {
    title: "Job offer or contract",
    body: "Prepare title, duties, salary, worksite, start date, supervisor, and employer contact details.",
    required: true,
  },
  {
    title: "Qualifications and work history",
    body: qualificationCopy,
    required: true,
  },
  {
    title: "Financial and settlement evidence",
    body: "Some routes require savings, maintenance funds, accommodation plans, or family support documents.",
    required: false,
  },
  {
    title: "Medical, police, or biometrics evidence",
    body: "Follow country-specific rules for biometrics, health checks, police certificates, TB tests, and translations.",
    required: false,
  },
];

const defaultStudentSteps = [
  {
    title: "Confirm eligibility",
    body: "Check the course, school, funding, age, language, and nationality-specific rules before paying fees.",
  },
  {
    title: "Complete the application",
    body: "Use details exactly as they appear on passport, admission, and funding documents.",
  },
  {
    title: "Book biometrics or interview",
    body: "Follow the local visa center or embassy instructions for fingerprints, photo, interview, and courier steps.",
  },
  {
    title: "Prepare for arrival",
    body: "Carry admission, funding, accommodation, and contact details in your travel packet if approved.",
  },
] satisfies GuideStep[];

const defaultVisitorSteps = [
  {
    title: "Define the temporary purpose",
    body: "Set exact dates, destination, activity, budget, host, and return plan before completing the form.",
  },
  {
    title: "Submit the application",
    body: "Use accurate travel history, host information, funding details, and family information.",
  },
  {
    title: "Attend appointment if required",
    body: "Bring the document packet in the order requested by the local post or visa center.",
  },
  {
    title: "Check entry rules after approval",
    body: "A visa or travel authorization can still be checked at the border. Carry proof of purpose and funds.",
  },
] satisfies GuideStep[];

const defaultWorkSteps = [
  {
    title: "Confirm the route",
    body: "Check that the job, employer, salary, sponsor, occupation, and qualifications fit the visa category.",
  },
  {
    title: "Gather employer evidence",
    body: "Collect the approval, certificate, petition, contract, or nomination before filing the visa application.",
  },
  {
    title: "Submit and prove identity",
    body: "Complete the online form, upload documents, and attend biometrics or interview if required.",
  },
  {
    title: "Travel with work details",
    body: "Carry employer contact details, approval notices, worksite information, and family documents if dependants travel.",
  },
] satisfies GuideStep[];

export const VISA_REQUIREMENT_DESTINATIONS: DestinationRequirementGuide[] = [
  {
    id: "united-states",
    country: "United States",
    region: "North America",
    countryNote:
      "U.S. nonimmigrant applicants usually complete DS-160, schedule at a U.S. embassy or consulate, and follow local post instructions for fees, photos, courier, and interview waiver rules.",
    lastReviewed: "June 2026",
    visas: [
      {
        id: "f1-student",
        label: "F1 Student Visa",
        shortLabel: "F1",
        category: "Study",
        summary:
          "For full-time academic study at a SEVP-approved U.S. school. The strongest applications connect the I-20, funding, study plan, and return plan.",
        eligibility: [
          "Admission to a SEVP-approved school with a valid Form I-20.",
          "SEVIS fee payment and accurate DS-160 details.",
          "Credible funds for tuition, living costs, and travel.",
          "Clear academic purpose and a realistic plan after study.",
        ],
        documents: [
          ...studentDocuments(
            "Signed Form I-20",
            "Bank statements, sponsor letter, scholarship letter, loan approval, income records, or other funds that cover the I-20 estimate.",
          ),
          {
            title: "SEVIS fee receipt",
            body: "Keep the payment confirmation with your I-20 and DS-160 confirmation.",
            required: true,
          },
          {
            title: "DS-160 and appointment confirmation",
            body: "Bring the barcode page and appointment instructions from the consulate system.",
            required: true,
          },
        ],
        applicationSteps: defaultStudentSteps,
        interviewFocus: [
          "Why this school and program fit your academic path.",
          "Who pays, how much is available, and what proves it.",
          "What you will do after the program and why it is credible.",
        ],
        commonPitfalls: [
          "Choosing a school for generic prestige only.",
          "Not knowing I-20 costs, sponsor income, or program details.",
          "Sounding more focused on U.S. life than on study.",
        ],
        timeline:
          "Start after receiving the I-20. New student visas can be issued well before the start date, but entry timing is tied to program rules.",
        stay: "Duration of status while maintaining F1 status, plus the applicable grace period.",
        applicationMode: "DS-160, SEVIS fee, embassy appointment, and interview unless waived.",
        officialLinks: [
          {
            title: "Student visas",
            href: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html",
            body: "Official Department of State student visa overview.",
          },
          ...usOfficialLinks,
        ],
      },
      {
        id: "b1-b2-visitor",
        label: "B1/B2 Visitor Visa",
        shortLabel: "B1/B2",
        category: "Visit",
        summary:
          "For temporary tourism, family visits, medical treatment, or permitted business visitor activities. The case must sound time-limited and affordable.",
        eligibility: [
          "Temporary purpose that fits B1, B2, or combined B1/B2 travel.",
          "Funds that match the trip length and itinerary.",
          "Credible reasons to leave the United States on time.",
          "Truthful disclosure of U.S. relatives, prior refusals, and travel history.",
        ],
        documents: [
          ...visitorDocuments(
            "DS-160 confirmation page",
            "Recent bank statements, pay records, business records, or sponsor evidence that fit the travel plan.",
          ),
          {
            title: "Appointment confirmation and fee receipt",
            body: "Use the local U.S. visa scheduling system instructions for your post.",
            required: true,
          },
        ],
        applicationSteps: defaultVisitorSteps,
        interviewFocus: [
          "Purpose, dates, cities, accommodation, and who is traveling.",
          "How the trip will be paid for.",
          "Work, school, family, business, or property ties outside the United States.",
        ],
        commonPitfalls: [
          "Open-ended travel dates or vague accommodation.",
          "Depending on undocumented promises from a sponsor.",
          "Hiding relatives, prior refusals, or long prior stays.",
        ],
        timeline:
          "Apply early because appointment wait times vary by post, season, and visa category.",
        stay: "Visa validity varies by nationality. The authorized stay is set at entry on the I-94.",
        applicationMode: "DS-160, embassy appointment, and interview unless waived.",
        officialLinks: [
          {
            title: "Visitor visa",
            href: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html",
            body: "Official B1/B2 overview, purpose, and required documentation.",
          },
          ...usOfficialLinks,
        ],
      },
      {
        id: "h1b-worker",
        label: "H1B Specialty Occupation",
        shortLabel: "H1B",
        category: "Work",
        summary:
          "For specialty occupation employment based on an employer petition. The interview checks petition consistency, role details, qualifications, and salary.",
        eligibility: [
          "Approved or receipted employer petition for the correct H category.",
          "Specialty occupation role and qualifying degree or equivalent experience.",
          "Employer, salary, worksite, and duties matching the petition.",
          "Awareness of U.S. worker rights and role restrictions.",
        ],
        documents: [
          ...workDocuments(
            "I-797 approval notice or I-129 petition receipt number",
            "Degree, transcripts, evaluations, licenses, resume, and employment letters that show specialty experience.",
          ),
          {
            title: "LCA, offer, and employer support evidence",
            body: "Know the salary, location, job title, employer relationship, and start date listed in the petition packet.",
            required: true,
          },
          {
            title: "DS-160 confirmation page",
            body: "Petition-based temporary workers should keep petition details available while completing DS-160.",
            required: true,
          },
        ],
        applicationSteps: defaultWorkSteps,
        interviewFocus: [
          "Employer name, worksite, salary, title, and start date.",
          "Specialized duties and why your education fits the role.",
          "Who supervises and pays you, especially for client-site work.",
        ],
        commonPitfalls: [
          "Not knowing petition receipt, salary, or worksite details.",
          "Describing duties too broadly or inconsistently.",
          "Confusing petitioner, end client, and staffing relationships.",
        ],
        timeline:
          "Begin consular scheduling after the employer provides petition details and the case is ready for visa processing.",
        stay: "Usually petition-based and tied to the approved employment period.",
        applicationMode: "DS-160, petition receipt number, embassy appointment, and interview unless waived.",
        officialLinks: [
          {
            title: "Temporary worker visas",
            href: "https://travel.state.gov/content/travel/en/us-visas/employment/temporary-worker-visas.html",
            body: "Official H, L, O, P, and Q temporary worker visa guidance.",
          },
          ...usOfficialLinks,
        ],
      },
      {
        id: "o1-extraordinary-ability",
        label: "O1 Extraordinary Ability",
        shortLabel: "O1",
        category: "Work",
        summary:
          "For applicants with extraordinary ability or achievement coming temporarily to continue work in the same field.",
        eligibility: [
          "Approved O petition or petition details ready for consular processing.",
          "Evidence of sustained acclaim or extraordinary achievement.",
          "Specific U.S. work, itinerary, contracts, or engagement details.",
          "Petitioner or agent relationship that matches the application.",
        ],
        documents: [
          ...workDocuments(
            "I-797 approval notice or petition receipt number",
            "Awards, press, publications, judging, leading roles, high compensation, memberships, or original contributions.",
          ),
          {
            title: "Support letter, contracts, and itinerary",
            body: "Prepare dates, venues, clients, deliverables, petitioner or agent role, and payment structure.",
            required: true,
          },
          {
            title: "Advisory opinion or consultation evidence",
            body: "Bring a copy if it was included in the petition or requested for your category.",
            required: false,
          },
        ],
        applicationSteps: defaultWorkSteps,
        interviewFocus: [
          "What makes your record extraordinary, with evidence not adjectives.",
          "How the U.S. project fits your field of acclaim.",
          "Who filed the petition and what each engagement involves.",
        ],
        commonPitfalls: [
          "Relying on broad fame claims without proof.",
          "Not knowing the petitioner, agent, dates, or venues.",
          "Making the U.S. plan sound like open-ended job searching.",
        ],
        timeline:
          "Schedule after the petition is approved or ready for the consular process and review the support packet before the interview.",
        stay: "Usually tied to the time needed for the approved event, activity, or employment.",
        applicationMode: "DS-160, petition details, embassy appointment, and interview unless waived.",
        officialLinks: [
          {
            title: "Temporary worker visas",
            href: "https://travel.state.gov/content/travel/en/us-visas/employment/temporary-worker-visas.html",
            body: "Official temporary worker visa category guidance, including O classifications.",
          },
          ...usOfficialLinks,
        ],
      },
    ],
  },
  {
    id: "united-kingdom",
    country: "United Kingdom",
    region: "Europe",
    countryNote:
      "UK applications are usually completed online, followed by identity verification through an app or visa application centre. Certified translations are needed for documents not in English or Welsh.",
    lastReviewed: "June 2026",
    visas: [
      {
        id: "uk-student",
        label: "Student Visa",
        shortLabel: "Student",
        category: "Study",
        summary:
          "For eligible students accepted by a licensed sponsor. The case should match the CAS, financial evidence, course plan, and genuine student purpose.",
        eligibility: [
          "Confirmation of Acceptance for Studies from a licensed Student sponsor.",
          "Funds for tuition and living costs unless an exemption applies.",
          "English, age, parental consent, ATAS, or TB evidence where required.",
          "A credible course choice and post-study explanation.",
        ],
        documents: studentDocuments(
          "CAS from your course provider",
          "Maintenance and tuition evidence that meets UKVI rules for your circumstances, plus sponsor consent if relevant.",
        ),
        applicationSteps: defaultStudentSteps,
        interviewFocus: [
          "Why this course, institution, and study level fit your background.",
          "CAS details, tuition, living costs, and funding source.",
          "Accommodation, English ability, and plans after the course.",
        ],
        commonPitfalls: [
          "Not knowing CAS, course modules, or tuition figures.",
          "Weak explanation for course choice or study gap.",
          "Financial evidence that does not meet UKVI format or timing rules.",
        ],
        timeline:
          "Apply within the allowed window for your location and allow time for biometrics, TB testing if required, and document checks.",
        stay: "Linked to the course length and Student route conditions.",
        applicationMode: "Online UKVI application, identity verification, biometrics if required, and possible credibility interview.",
        officialLinks: [
          {
            title: "Student visa",
            href: "https://www.gov.uk/student-visa",
            body: "Official UK Student visa overview and eligibility.",
          },
          {
            title: "Student documents",
            href: "https://www.gov.uk/tier-4-general-visa/documents-you-must-provide",
            body: "Official list of documents you need to apply.",
          },
          {
            title: "Student financial evidence",
            href: "https://www.gov.uk/guidance/financial-evidence-for-student-and-child-student-route-applicants",
            body: "Official financial evidence guidance for Student route applicants.",
          },
        ],
      },
      {
        id: "uk-standard-visitor",
        label: "Standard Visitor Visa",
        shortLabel: "Visitor",
        category: "Visit",
        summary:
          "For tourism, family visits, short study, permitted business activities, medical visits, and other allowed temporary activities.",
        eligibility: [
          "Permitted visitor activity and intention to leave at the end of the visit.",
          "Enough money for stay, return or onward journey, and dependants if relevant.",
          "No plan to live in the UK through frequent or successive visits.",
          "Additional evidence for medical, study, academic, or paid engagement visits.",
        ],
        documents: visitorDocuments(
          "Online Standard Visitor application",
          "Bank, income, sponsor, business, or employment evidence showing the visit is affordable.",
        ),
        applicationSteps: defaultVisitorSteps,
        interviewFocus: [
          "Purpose, dates, accommodation, and permitted activity.",
          "Funding source and who pays for the trip.",
          "Reasons you will leave the UK after the visit.",
        ],
        commonPitfalls: [
          "Applying for a visit that looks like long-term residence.",
          "Missing evidence for sponsor, host, or activity.",
          "Documents not translated into English or Welsh where required.",
        ],
        timeline:
          "The earliest standard visitor application window is usually before travel, and decisions are often estimated in weeks after identity and documents are provided.",
        stay: "Usually up to 6 months per visit, with special rules for some purposes.",
        applicationMode: "Online application, visa application centre appointment, biometrics, and document upload.",
        officialLinks: [
          {
            title: "Standard Visitor",
            href: "https://www.gov.uk/standard-visitor",
            body: "Official UK visitor route overview.",
          },
          {
            title: "Apply for a visitor visa",
            href: "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa",
            body: "Official application steps and appointment guidance.",
          },
          {
            title: "Supporting documents",
            href: "https://www.gov.uk/government/publications/visitor-visa-guide-to-supporting-documents",
            body: "Official supporting document guidance.",
          },
        ],
      },
      {
        id: "uk-skilled-worker",
        label: "Skilled Worker Visa",
        shortLabel: "Skilled Worker",
        category: "Work",
        summary:
          "For work with an approved UK sponsor in an eligible role. The application depends heavily on the Certificate of Sponsorship, salary, English, and funds.",
        eligibility: [
          "Certificate of Sponsorship from an approved UK employer.",
          "Eligible occupation, salary level, and sponsor details.",
          "English language requirement unless exempt.",
          "Maintenance funds, TB certificate, or criminal record certificate where required.",
        ],
        documents: workDocuments(
          "Certificate of Sponsorship reference number",
          "Qualification, English, professional registration, and employment evidence relevant to the sponsored role.",
        ),
        applicationSteps: defaultWorkSteps,
        interviewFocus: [
          "Sponsor, job title, salary, start date, and work location.",
          "How your experience fits the occupation code.",
          "Family members, maintenance funds, and immigration history.",
        ],
        commonPitfalls: [
          "Certificate of Sponsorship details do not match the application.",
          "Salary, occupation code, or hours are unclear.",
          "Missing TB, criminal record, or English documents where required.",
        ],
        timeline:
          "Apply after receiving the Certificate of Sponsorship and before it expires. Build in time for biometrics and priority options if available.",
        stay: "Granted according to the sponsored employment period and route rules.",
        applicationMode: "Online application with identity verification, biometrics if required, and document upload.",
        officialLinks: [
          {
            title: "Skilled Worker visa",
            href: "https://www.gov.uk/skilled-worker-visa",
            body: "Official eligibility and route overview.",
          },
          {
            title: "Skilled Worker documents",
            href: "https://www.gov.uk/skilled-worker-visa/documents-you-must-provide",
            body: "Official documents needed to apply.",
          },
          {
            title: "Apply from outside the UK",
            href: "https://www.gov.uk/skilled-worker-visa/apply-from-outside-the-uk",
            body: "Official application process for applicants outside the UK.",
          },
        ],
      },
      {
        id: "uk-global-talent",
        label: "Global Talent Visa",
        shortLabel: "Global Talent",
        category: "Talent",
        summary:
          "For leaders or potential leaders in eligible fields. Most applicants need endorsement unless they have a qualifying prestigious prize.",
        eligibility: [
          "Endorsement from the relevant endorsing body or eligible prize evidence.",
          "Identity and nationality document.",
          "Evidence package for the field and level claimed.",
          "Translations and TB certificate where required.",
        ],
        documents: [
          {
            title: "Passport or travel document",
            body: "Must prove identity and nationality.",
            required: true,
          },
          {
            title: "Endorsement or prize evidence",
            body: "Use endorsement approval or eligible prize evidence for the Global Talent stage you are applying under.",
            required: true,
          },
          {
            title: "Field evidence portfolio",
            body: "Awards, publications, press, leadership, recommendation letters, product impact, research, or other field-specific documents.",
            required: true,
          },
          {
            title: "Certified translations",
            body: "Required when supporting documents are not in English or Welsh.",
            required: false,
          },
          {
            title: "TB certificate",
            body: "Required for applicants from listed countries.",
            required: false,
          },
        ],
        applicationSteps: [
          {
            title: "Choose endorsement or prize route",
            body: "Confirm whether you need stage 1 endorsement or can apply using an eligible prize.",
          },
          {
            title: "Prepare the evidence package",
            body: "Use field-specific criteria and keep evidence concise, labeled, and consistent.",
          },
          {
            title: "Apply for the visa",
            body: "Submit identity, endorsement or prize proof, and required supporting documents.",
          },
          {
            title: "Plan UK arrival",
            body: "Keep evidence of your field activity and intended work available for border questions.",
          },
        ],
        interviewFocus: [
          "Field, level of recognition, and why the evidence meets the route.",
          "How your UK plans fit your recognized work.",
          "Whether your evidence is current, authentic, and consistent.",
        ],
        commonPitfalls: [
          "Using evidence that is impressive but not tied to the criteria.",
          "Weak recommendation letters or unlabeled portfolios.",
          "Confusing endorsement requirements with visa-stage documents.",
        ],
        timeline:
          "Allow time for endorsement review before the visa stage unless applying through an eligible prize route.",
        stay: "Flexible grant periods are available within the route rules.",
        applicationMode: "Endorsement or prize route followed by online visa application and identity verification.",
        officialLinks: [
          {
            title: "Global Talent visa",
            href: "https://www.gov.uk/global-talent",
            body: "Official route overview.",
          },
          {
            title: "Global Talent documents",
            href: "https://www.gov.uk/global-talent/documents-youll-need-to-apply",
            body: "Official visa-stage document guidance.",
          },
          {
            title: "Digital technology endorsement",
            href: "https://www.gov.uk/global-talent-digital-technology/documents-you-need-to-apply-endorsement",
            body: "Official endorsement evidence guidance for digital technology applicants.",
          },
        ],
      },
    ],
  },
  {
    id: "canada",
    country: "Canada",
    region: "North America",
    countryNote:
      "Canada applications are commonly submitted online through IRCC. Requirements can change by passport, residence country, biometrics history, family composition, and whether a medical exam or police certificate is requested.",
    lastReviewed: "June 2026",
    visas: [
      {
        id: "canada-study-permit",
        label: "Study Permit",
        shortLabel: "Study Permit",
        category: "Study",
        summary:
          "For programs that require a study permit. The application turns on DLI admission, PAL or TAL where required, funds, admissibility, and intent to leave when status expires.",
        eligibility: [
          "Letter of acceptance from a designated learning institution.",
          "Provincial or territorial attestation letter unless an exception applies.",
          "Funds for tuition, living expenses, and return transportation.",
          "Good health, clean admissibility record, and plan to leave when status expires.",
        ],
        documents: studentDocuments(
          "Letter of acceptance from a DLI",
          "Proof of tuition, living expenses, and return transportation for yourself and family members who come with you.",
        ),
        applicationSteps: defaultStudentSteps,
        interviewFocus: [
          "Why the DLI and program fit your background.",
          "How funds cover tuition, living costs, and return transportation.",
          "Why you will comply with study permit conditions.",
        ],
        commonPitfalls: [
          "Missing PAL or TAL when required.",
          "Funding documents that do not prove accessible money.",
          "Study plan does not connect to prior education or work.",
        ],
        timeline:
          "Apply before travel unless a port-of-entry exception applies. Processing and biometrics timing vary by country.",
        stay: "Study permit validity is tied to the program and permit conditions.",
        applicationMode: "IRCC online application, biometrics if required, and possible interview or additional document request.",
        officialLinks: [
          {
            title: "Study permit",
            href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html",
            body: "Official study permit overview.",
          },
          {
            title: "Get the right documents",
            href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html",
            body: "Official study permit document guidance.",
          },
          {
            title: "How to apply",
            href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/apply.html",
            body: "Official application steps.",
          },
        ],
      },
      {
        id: "canada-visitor-visa",
        label: "Visitor Visa",
        shortLabel: "Visitor",
        category: "Visit",
        summary:
          "For visa-required travellers visiting temporarily. IRCC assesses purpose, funds, travel history, ties, and admissibility.",
        eligibility: [
          "Valid travel document and temporary purpose.",
          "Good health and no inadmissibility concerns.",
          "Funds for stay and return travel.",
          "Proof you will leave Canada at the end of the authorized stay.",
        ],
        documents: visitorDocuments(
          "Online visitor visa application",
          "Bank, income, sponsor, employment, or business evidence showing you can pay for the trip.",
        ),
        applicationSteps: defaultVisitorSteps,
        interviewFocus: [
          "Why you are visiting and how long you will stay.",
          "How you will pay and where you will stay.",
          "What ties bring you back home.",
        ],
        commonPitfalls: [
          "Weak travel purpose or no clear itinerary.",
          "Unexplained funds or sponsor relationship.",
          "Documents that do not address ties outside Canada.",
        ],
        timeline:
          "Processing varies by country and biometrics timing. Apply before making final travel commitments.",
        stay: "Usually assessed at entry; visitor status length is determined by border instructions or visitor record.",
        applicationMode: "IRCC online application, biometrics if required, and possible document request.",
        officialLinks: [
          {
            title: "Visitor visa",
            href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/visitor-visa.html",
            body: "Official visitor visa overview.",
          },
          {
            title: "How to apply",
            href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/apply-visitor-visa.html",
            body: "Official purpose-based visitor application steps.",
          },
          {
            title: "Find out if you need a visa",
            href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/entry-requirements-country.html",
            body: "Official visa or eTA checker by nationality.",
          },
        ],
      },
      {
        id: "canada-work-permit",
        label: "Work Permit",
        shortLabel: "Work Permit",
        category: "Work",
        summary:
          "For temporary work in Canada. Requirements depend on whether the route needs an LMIA, employer compliance submission, open work eligibility, or exemption.",
        eligibility: [
          "Job offer, LMIA, employer-specific details, or open work permit eligibility.",
          "Proof you can support yourself and family during the stay.",
          "Admissibility, medical, police, and biometrics requirements where applicable.",
          "Plan to leave Canada when authorized status ends unless another lawful route applies.",
        ],
        documents: workDocuments(
          "LMIA, offer of employment number, or work permit eligibility proof",
          "Resume, education, licenses, reference letters, and proof you meet job requirements.",
        ),
        applicationSteps: defaultWorkSteps,
        interviewFocus: [
          "Employer, duties, wage, location, and duration.",
          "How your qualifications fit the role.",
          "Funds, family members, and compliance with permit conditions.",
        ],
        commonPitfalls: [
          "Confusing LMIA-exempt and LMIA-required routes.",
          "Missing employer compliance or offer number.",
          "Job duties do not match the evidence provided.",
        ],
        timeline:
          "Apply after the employer and route documents are ready. Processing varies by country and work permit type.",
        stay: "Tied to the permit validity and work permit conditions.",
        applicationMode: "IRCC online application, biometrics if required, and possible medical or police checks.",
        officialLinks: [
          {
            title: "Work permits",
            href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit.html",
            body: "Official work permit overview.",
          },
          {
            title: "Apply for a work permit",
            href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/apply.html",
            body: "Official temporary work permit application guidance.",
          },
          {
            title: "Employer-specific work permit",
            href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/work-permit.html",
            body: "Official guidance on employer-specific permits.",
          },
        ],
      },
      {
        id: "canada-express-entry",
        label: "Express Entry",
        shortLabel: "Express Entry",
        category: "Permanent residence",
        summary:
          "For skilled immigration through eligible federal programs. After invitation, the application must prove points, work history, funds, education, language, identity, and admissibility.",
        eligibility: [
          "Eligibility under an Express Entry managed program.",
          "Language results, education credential assessment if needed, and accurate work history.",
          "Invitation to Apply before submitting permanent residence documents.",
          "Proof of funds unless exempt and admissibility checks for all family members.",
        ],
        documents: [
          {
            title: "Passport or travel document",
            body: "Needed for the principal applicant and accompanying family members.",
            required: true,
          },
          {
            title: "Language test results",
            body: "Use valid approved results that match the profile and points claimed.",
            required: true,
          },
          {
            title: "Education and ECA evidence",
            body: "Upload credentials and education credential assessment where required for points.",
            required: true,
          },
          {
            title: "Employment reference letters",
            body: "Letters should show dates, hours, duties, title, salary, and employer details.",
            required: true,
          },
          {
            title: "Proof of funds",
            body: "Required for some applicants. Funds must be available, transferable, and properly documented.",
            required: false,
          },
          {
            title: "Medical, police, photos, and civil status documents",
            body: "Prepare certificates, marriage or birth documents, photos, and other admissibility records for all applicable family members.",
            required: true,
          },
        ],
        applicationSteps: [
          {
            title: "Build the profile",
            body: "Enter accurate work, education, language, family, and funds information.",
          },
          {
            title: "Receive an Invitation to Apply",
            body: "Do not submit final permanent residence documents until invited.",
          },
          {
            title: "Upload proof",
            body: "Documents must support each claimed point and personal history detail.",
          },
          {
            title: "Respond to IRCC requests",
            body: "Watch for medical, police, biometrics, interview, or additional document requests.",
          },
        ],
        interviewFocus: [
          "Consistency between profile, documents, and personal history.",
          "Work duties matching the claimed occupation.",
          "Proof of funds, family composition, and admissibility.",
        ],
        commonPitfalls: [
          "Reference letters missing duties, hours, or salary.",
          "Dates do not match travel, employment, or education history.",
          "Claimed funds are not accessible or properly documented.",
        ],
        timeline:
          "The profile, invitation, document upload, biometrics, and admissibility checks each have separate timing.",
        stay: "Permanent residence if approved, subject to landing and residence obligations.",
        applicationMode: "IRCC online profile, Invitation to Apply, document upload, biometrics, and admissibility processing.",
        officialLinks: [
          {
            title: "Express Entry",
            href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html",
            body: "Official Express Entry overview.",
          },
          {
            title: "Documents for Express Entry",
            href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents.html",
            body: "Official document guidance before and after invitation.",
          },
          {
            title: "Proof of funds",
            href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html",
            body: "Official settlement funds guidance.",
          },
        ],
      },
    ],
  },
  {
    id: "australia",
    country: "Australia",
    region: "Oceania",
    countryNote:
      "Australia uses ImmiAccount for most applications. The Department of Home Affairs provides document checklists that can change by passport country, education provider, stream, and personal circumstances.",
    lastReviewed: "June 2026",
    visas: [
      {
        id: "australia-student-500",
        label: "Student Visa Subclass 500",
        shortLabel: "Subclass 500",
        category: "Study",
        summary:
          "For full-time study in Australia. The application should prove enrolment, genuine student purpose, funds, English, health cover, and welfare arrangements if under 18.",
        eligibility: [
          "Confirmation of Enrolment for each intended course unless an exception applies.",
          "Genuine Student requirement and understanding that study is the primary reason.",
          "Financial capacity, English evidence where required, and Overseas Student Health Cover.",
          "Health, character, and welfare arrangements where applicable.",
        ],
        documents: studentDocuments(
          "Confirmation of Enrolment",
          "Financial capacity evidence, scholarship, government loan, family income, or other accepted proof under Home Affairs rules.",
        ),
        applicationSteps: defaultStudentSteps,
        interviewFocus: [
          "Why Australia, why this course, and why this education provider.",
          "How the course fits your background and future plans.",
          "Funds, health cover, English, and visa conditions.",
        ],
        commonPitfalls: [
          "No valid CoE at lodgement when required.",
          "Weak Genuine Student explanation.",
          "Ignoring English, OSHC, or under-18 welfare rules.",
        ],
        timeline:
          "Apply through ImmiAccount after documents are ready and before travel. Processing times are guide-only and vary.",
        stay: "Usually in line with enrolment, up to route limits.",
        applicationMode: "ImmiAccount online application, document upload, biometrics or health exams if requested.",
        officialLinks: [
          {
            title: "Student visa Subclass 500",
            href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500",
            body: "Official eligibility, document, and step-by-step guidance.",
          },
          {
            title: "Genuine Student requirement",
            href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500/genuine-student-requirement",
            body: "Official Genuine Student requirement guidance.",
          },
          {
            title: "ImmiAccount",
            href: "https://online.immi.gov.au/lusc/login",
            body: "Official online account for visa applications.",
          },
        ],
      },
      {
        id: "australia-visitor-600",
        label: "Visitor Visa Subclass 600",
        shortLabel: "Subclass 600",
        category: "Visit",
        summary:
          "For tourism, family visits, cruises, and some business visitor activities depending on stream. The case must show genuine temporary stay and funds.",
        eligibility: [
          "Genuine visitor purpose and intent to stay temporarily.",
          "Enough money for the stay and departure.",
          "Stream-specific requirements for tourist, business, sponsored family, or frequent traveller use.",
          "Health and character checks where required.",
        ],
        documents: visitorDocuments(
          "ImmiAccount visitor application",
          "Savings, income, employer, business, sponsor, or family evidence showing you can support the visit.",
        ),
        applicationSteps: defaultVisitorSteps,
        interviewFocus: [
          "Purpose, stream, dates, accommodation, and activities.",
          "Funds and who pays for the visit.",
          "Reasons you will leave Australia before stay ends.",
        ],
        commonPitfalls: [
          "Applying under the wrong visitor stream.",
          "Weak evidence of funds or return obligations.",
          "Visitor plan sounds like work or long-term residence.",
        ],
        timeline:
          "Apply online and check stream-specific processing guidance before final travel bookings.",
        stay: "Can vary by stream and grant letter, often up to 3, 6, or 12 months.",
        applicationMode: "ImmiAccount application and document upload, with biometrics or health checks if requested.",
        officialLinks: [
          {
            title: "Visitor visa Subclass 600",
            href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600",
            body: "Official visitor visa overview.",
          },
          {
            title: "Tourist stream",
            href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600/tourist-stream-overseas",
            body: "Official tourist stream guidance for applicants outside Australia.",
          },
          {
            title: "Visa processing times",
            href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-processing-times",
            body: "Official processing time guide.",
          },
        ],
      },
      {
        id: "australia-skilled-189",
        label: "Skilled Independent Subclass 189",
        shortLabel: "Subclass 189",
        category: "Skilled migration",
        summary:
          "For invited skilled workers who are not sponsored by an employer, state, territory, or family member.",
        eligibility: [
          "Occupation on the relevant skilled occupation list.",
          "Positive skills assessment and points-tested eligibility.",
          "Expression of Interest and invitation before applying.",
          "English, age, health, character, and identity requirements.",
        ],
        documents: [
          {
            title: "Passport and identity documents",
            body: "Include name change, birth, and civil status documents where relevant.",
            required: true,
          },
          {
            title: "Skills assessment",
            body: "Use a valid positive assessment for the nominated occupation.",
            required: true,
          },
          {
            title: "English test results",
            body: "Provide valid English results that support the points claimed.",
            required: true,
          },
          {
            title: "Employment and education evidence",
            body: "Reference letters, pay evidence, qualifications, transcripts, and licenses should support all claimed points.",
            required: true,
          },
          {
            title: "Invitation and EOI consistency",
            body: "The visa application must match the information used to receive the invitation.",
            required: true,
          },
          {
            title: "Health, character, and family documents",
            body: "Medical exams, police certificates, partner evidence, and dependant documents may be required.",
            required: false,
          },
        ],
        applicationSteps: [
          {
            title: "Check occupation and points",
            body: "Confirm the occupation list, skills assessment pathway, and points claim before lodging an EOI.",
          },
          {
            title: "Submit SkillSelect EOI",
            body: "Enter accurate points, work, education, English, and family details.",
          },
          {
            title: "Apply after invitation",
            body: "Upload evidence for every point claimed and respond to requests quickly.",
          },
          {
            title: "Complete health and character checks",
            body: "Follow Home Affairs instructions for medicals, police certificates, and family member checks.",
          },
        ],
        interviewFocus: [
          "Claimed occupation, duties, and skills assessment consistency.",
          "Points evidence for English, work, age, education, and partner factors.",
          "Family composition, health, character, and immigration history.",
        ],
        commonPitfalls: [
          "EOI points are higher than documents can prove.",
          "Reference letters do not match assessed occupation duties.",
          "Expired English or skills assessment evidence.",
        ],
        timeline:
          "The EOI, invitation, application, medicals, and decision stages each have separate timing.",
        stay: "Permanent residence if granted.",
        applicationMode: "SkillSelect Expression of Interest followed by ImmiAccount application after invitation.",
        officialLinks: [
          {
            title: "Skilled Independent Subclass 189",
            href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189",
            body: "Official route guidance.",
          },
          {
            title: "SkillSelect",
            href: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect",
            body: "Official Expression of Interest system guidance.",
          },
          {
            title: "Visa list",
            href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing",
            body: "Official list of Australian visa categories.",
          },
        ],
      },
      {
        id: "australia-working-holiday",
        label: "Working Holiday Visa",
        shortLabel: "Working Holiday",
        category: "Work and travel",
        summary:
          "For eligible young adults from participating countries to holiday in Australia and work to support their stay.",
        eligibility: [
          "Eligible passport country for Subclass 417 or 462.",
          "Age, funds, health, character, and prior visa conditions.",
          "Education, English, or support letter requirements for some Subclass 462 applicants.",
          "No dependent children accompanying during the stay.",
        ],
        documents: [
          {
            title: "Passport",
            body: "Use an eligible passport and confirm age and nationality rules for the correct subclass.",
            required: true,
          },
          {
            title: "Funds and onward travel evidence",
            body: "Prepare evidence of enough money for initial stay and departure arrangements if requested.",
            required: true,
          },
          {
            title: "Health and character documents",
            body: "Police, medical, or additional checks may be requested.",
            required: false,
          },
          {
            title: "Subclass 462 supporting evidence",
            body: "Some applicants need education, English, or government support evidence.",
            required: false,
          },
        ],
        applicationSteps: defaultVisitorSteps,
        interviewFocus: [
          "Eligibility by passport, age, and prior Working Holiday history.",
          "Funds, travel plan, and intent to comply with work conditions.",
          "Subclass-specific education, English, or support documents.",
        ],
        commonPitfalls: [
          "Choosing the wrong subclass for nationality.",
          "Insufficient funds or unclear travel plan.",
          "Missing country-specific 462 requirements.",
        ],
        timeline:
          "Apply online and review subclass-specific rules before travel or job commitments.",
        stay: "Usually temporary and subject to grant conditions and repeat-year eligibility rules.",
        applicationMode: "ImmiAccount online application and document upload.",
        officialLinks: [
          {
            title: "Working Holiday Subclass 417",
            href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417",
            body: "Official Subclass 417 guidance.",
          },
          {
            title: "Work and Holiday Subclass 462",
            href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462",
            body: "Official Subclass 462 guidance.",
          },
          {
            title: "ImmiAccount",
            href: "https://online.immi.gov.au/lusc/login",
            body: "Official online account for visa applications.",
          },
        ],
      },
    ],
  },
];

function createSchengenDestination(
  id: string,
  country: string,
  portalLink: OfficialLink,
): DestinationRequirementGuide {
  return {
    id,
    country,
    region: "Schengen Area",
    countryNote: `${country} short-stay visas follow Schengen rules, but local consulates and visa centers control appointment booking, document order, translations, fees, and national long-stay routes.`,
    lastReviewed: "June 2026",
    visas: [
      {
        id: "schengen-tourist",
        label: "Schengen Tourist Visa",
        shortLabel: "Tourist",
        category: "Visit",
        summary:
          "For tourism and private visits of up to 90 days in any 180-day period across the Schengen Area, subject to the visa sticker and entry rules.",
        eligibility: [
          "Main destination or first-entry rule supports applying through this country.",
          "Genuine temporary trip, clear itinerary, funds, and accommodation.",
          "Travel medical insurance meeting Schengen requirements.",
          "Evidence you will leave the Schengen Area before the visa expires.",
        ],
        documents: visitorDocuments(
          "Schengen visa application form",
          "Bank statements, income records, sponsor evidence, or host support proving the trip is affordable.",
        ),
        applicationSteps: defaultVisitorSteps,
        interviewFocus: [
          "Main destination, travel dates, route, and accommodation.",
          "Funds, insurance, and transport reservations.",
          "Return obligations and prior Schengen travel history.",
        ],
        commonPitfalls: [
          "Applying through the wrong country for the itinerary.",
          "Hotel, flight, or insurance dates do not match.",
          "Weak proof of employment, funds, or return ties.",
        ],
        timeline:
          "Book early enough for appointment availability and local processing, but follow Schengen timing rules for how early applications can be lodged.",
        stay: "Short stay up to 90 days in any 180-day period, unless the visa grants more limited validity.",
        applicationMode: "Consulate or visa application centre appointment with form, biometrics, and supporting documents.",
        officialLinks: [portalLink, ...schengenOfficialLinks],
      },
      {
        id: "schengen-business",
        label: "Schengen Business Visa",
        shortLabel: "Business",
        category: "Business visit",
        summary:
          "For meetings, conferences, trade events, negotiations, and other short permitted business activities without local employment.",
        eligibility: [
          "Business purpose that fits short-stay rules.",
          "Invitation, event registration, or employer letter explaining purpose and dates.",
          "Funds, accommodation, insurance, and return evidence.",
          "No plan to work locally beyond permitted business visitor activity.",
        ],
        documents: [
          ...visitorDocuments(
            "Schengen visa application form",
            "Employer, business, or sponsor funds showing who pays for travel and stay.",
          ),
          {
            title: "Invitation or event proof",
            body: "Include host company letter, conference registration, trade fair proof, or meeting agenda.",
            required: true,
          },
          {
            title: "Employer letter",
            body: "Should confirm role, leave or travel authorization, purpose, dates, and return to work.",
            required: false,
          },
        ],
        applicationSteps: defaultVisitorSteps,
        interviewFocus: [
          "Business purpose, host, and who pays.",
          "Why the visit is temporary and not local employment.",
          "Employer ties and return date.",
        ],
        commonPitfalls: [
          "Invitation is vague or missing host contact details.",
          "Business activity sounds like paid local work.",
          "Travel dates do not match event or meeting evidence.",
        ],
        timeline:
          "Use the consulate or visa centre timeline and prepare business evidence before booking.",
        stay: "Short stay up to 90 days in any 180-day period unless visa validity is shorter.",
        applicationMode: "Consulate or visa application centre appointment with biometrics and business evidence.",
        officialLinks: [portalLink, ...schengenOfficialLinks],
      },
      {
        id: "national-student",
        label: `${country} Student Visa`,
        shortLabel: "Student",
        category: "Study",
        summary:
          "For longer study or residence beyond short-stay rules. National student visas are country-specific and require the destination's official checklist.",
        eligibility: [
          "Admission or enrolment at an eligible institution.",
          "Funds, accommodation, insurance or health cover, and education records.",
          "Translations, legalization, or apostille where required.",
          "Clear study purpose and compliance with residence rules.",
        ],
        documents: studentDocuments(
          "Admission or enrolment letter",
          "Savings, scholarship, sponsor, blocked account, income, or other financial proof accepted by the national authority.",
        ),
        applicationSteps: defaultStudentSteps,
        interviewFocus: [
          "Why the country, institution, and program fit your academic path.",
          "Funds, accommodation, insurance, and residence plan.",
          "Future plan after the course.",
        ],
        commonPitfalls: [
          "Using Schengen short-stay documents for a national student route.",
          "Missing translations or legalized documents.",
          "Weak accommodation or financial proof.",
        ],
        timeline:
          "National long-stay processing can differ from short-stay Schengen processing. Check the country portal before booking.",
        stay: "Country-specific, usually tied to enrolment or residence permit rules.",
        applicationMode: "National visa application through the consulate, visa centre, or official country portal.",
        officialLinks: [portalLink, ...schengenOfficialLinks],
      },
      {
        id: "national-work",
        label: `${country} Work Visa`,
        shortLabel: "Work",
        category: "Work",
        summary:
          "For employment or self-employment under national immigration rules. Work authorization often starts with the employer or a national approval process.",
        eligibility: [
          "Job offer, work authorization, or national approval for the route.",
          "Qualifications, salary, employer details, and occupation eligibility.",
          "Accommodation, insurance, funds, and residence compliance where required.",
          "Translations, legalization, medical, or police checks if requested.",
        ],
        documents: workDocuments(
          "Employment contract or work authorization",
          "Diplomas, licenses, experience letters, resume, and professional registrations required by the route.",
        ),
        applicationSteps: defaultWorkSteps,
        interviewFocus: [
          "Employer, role, salary, location, and contract dates.",
          "How your qualifications fit the role.",
          "Residence plan, insurance, and family members if any.",
        ],
        commonPitfalls: [
          "Employer approval is not complete before visa filing.",
          "Qualifications are not translated, recognized, or legalized where required.",
          "Contract details conflict with the visa application.",
        ],
        timeline:
          "Start with employer or national approval steps, then use the country portal for visa appointment timing.",
        stay: "Country-specific and tied to employment or residence permit rules.",
        applicationMode: "National visa application after work authorization or employer evidence is ready.",
        officialLinks: [portalLink, ...schengenOfficialLinks],
      },
    ],
  };
}

export const ALL_VISA_REQUIREMENT_DESTINATIONS: DestinationRequirementGuide[] = [
  ...VISA_REQUIREMENT_DESTINATIONS,
  createSchengenDestination("france", "France", {
    title: "France-Visas",
    href: "https://www.france-visas.gouv.fr/en/web/france-visas/",
    body: "Official France visa portal and application guidance.",
  }),
  createSchengenDestination("germany", "Germany", {
    title: "Germany visa services",
    href: "https://www.auswaertiges-amt.de/en/visa-service",
    body: "Official German Federal Foreign Office visa information.",
  }),
  createSchengenDestination("italy", "Italy", {
    title: "Visa for Italy",
    href: "https://vistoperitalia.esteri.it/home/en",
    body: "Official Italian Ministry of Foreign Affairs visa tool.",
  }),
  createSchengenDestination("spain", "Spain", {
    title: "Spain consular services",
    href: "https://www.exteriores.gob.es/en/ServiciosAlCiudadano/Paginas/Servicios-consulares.aspx",
    body: "Official Spanish consular services information.",
  }),
  createSchengenDestination("netherlands", "Netherlands", {
    title: "Netherlands visa information",
    href: "https://www.netherlandsworldwide.nl/visa-the-netherlands",
    body: "Official Netherlands visa information portal.",
  }),
  {
    id: "kenya",
    country: "Kenya",
    region: "Africa",
    countryNote:
      "Kenya visitor entry uses the official eTA platform for many travellers, while student passes and work permits use immigration services and route-specific supporting evidence.",
    lastReviewed: "June 2026",
    visas: [
      {
        id: "kenya-eta",
        label: "Kenya eTA",
        shortLabel: "eTA",
        category: "Visit",
        summary:
          "For eligible travellers who need electronic travel authorization before travelling to Kenya.",
        eligibility: [
          "Eligible travel purpose and passport.",
          "Travel details, accommodation or host information, and contact details.",
          "Health or vaccination evidence where applicable.",
          "Truthful personal and security information in the eTA form.",
        ],
        documents: visitorDocuments(
          "Kenya eTA application",
          "Proof of funds, accommodation, or host support if requested by the eTA platform or carrier.",
        ),
        applicationSteps: defaultVisitorSteps,
        interviewFocus: [
          "Purpose, accommodation, host, and departure plan.",
          "Passport and travel information consistency.",
          "Any health, yellow fever, or transit requirements.",
        ],
        commonPitfalls: [
          "Applying through unofficial sites.",
          "Travel dates or passport details entered incorrectly.",
          "Missing health or accommodation details requested by the platform.",
        ],
        timeline:
          "Apply before travel and allow time for review before airline check-in.",
        stay: "Granted according to eTA and border instructions.",
        applicationMode: "Official Kenya eTA online application.",
        officialLinks: [
          {
            title: "Kenya eTA",
            href: "https://www.etakenya.go.ke/",
            body: "Official Kenya Electronic Travel Authorization portal.",
          },
          {
            title: "Immigration services",
            href: "https://fns.immigration.go.ke/",
            body: "Official Foreign Nationals Services portal.",
          },
        ],
      },
      {
        id: "kenya-student-pass",
        label: "Student Pass",
        shortLabel: "Student Pass",
        category: "Study",
        summary:
          "For foreign students accepted by Kenyan institutions where a student pass is required.",
        eligibility: [
          "Admission to a Kenyan education institution.",
          "Passport, photos, application forms, and institutional support.",
          "Proof of funds, parent or sponsor details, and accommodation where requested.",
          "Compliance with immigration and reporting rules.",
        ],
        documents: studentDocuments(
          "Admission letter from Kenyan institution",
          "Sponsor, parent, scholarship, or bank evidence showing support during study.",
        ),
        applicationSteps: defaultStudentSteps,
        interviewFocus: [
          "Institution, course, duration, and accommodation.",
          "Funding source and guardian or sponsor support.",
          "Plans after completing study in Kenya.",
        ],
        commonPitfalls: [
          "Institution letter lacks course duration or contact details.",
          "Sponsor evidence is unclear.",
          "Passport and application details do not match.",
        ],
        timeline:
          "Prepare institutional documents before filing and follow Foreign Nationals Services instructions.",
        stay: "Tied to student pass validity and institution details.",
        applicationMode: "Foreign Nationals Services application and immigration review.",
        officialLinks: [
          {
            title: "Foreign Nationals Services",
            href: "https://fns.immigration.go.ke/",
            body: "Official Kenya immigration services portal.",
          },
          {
            title: "Directorate of Immigration",
            href: "https://immigration.go.ke/",
            body: "Official immigration information site.",
          },
        ],
      },
      {
        id: "kenya-work-permit",
        label: "Work Permit",
        shortLabel: "Work Permit",
        category: "Work",
        summary:
          "For employment or investment activity in Kenya under the correct work permit class.",
        eligibility: [
          "Correct permit class for the role or investment activity.",
          "Employer, company, contract, registration, or professional evidence.",
          "Qualifications and experience relevant to the role.",
          "Immigration compliance and supporting documents requested by the portal.",
        ],
        documents: workDocuments(
          "Permit class evidence and employer support",
          "Academic certificates, professional licenses, resume, reference letters, and role-specific proof.",
        ),
        applicationSteps: defaultWorkSteps,
        interviewFocus: [
          "Employer, permit class, duties, and duration.",
          "Why your experience fits the role.",
          "Company registration, tax, or local compliance evidence where relevant.",
        ],
        commonPitfalls: [
          "Wrong permit class selected.",
          "Employer documents are incomplete.",
          "Qualifications are not certified or translated where required.",
        ],
        timeline:
          "Start after employer and class-specific documents are ready and follow portal status updates.",
        stay: "Tied to the permit class and approval period.",
        applicationMode: "Foreign Nationals Services application and immigration review.",
        officialLinks: [
          {
            title: "Foreign Nationals Services",
            href: "https://fns.immigration.go.ke/",
            body: "Official Kenya immigration services portal.",
          },
          {
            title: "Directorate of Immigration",
            href: "https://immigration.go.ke/",
            body: "Official immigration information site.",
          },
        ],
      },
    ],
  },
  {
    id: "united-arab-emirates",
    country: "United Arab Emirates",
    region: "Middle East",
    countryNote:
      "UAE entry and residence pathways can depend on emirate, sponsor, airline, hotel, employer, free zone, or ICP and GDRFA service channel. Always verify the issuing authority for the emirate involved.",
    lastReviewed: "June 2026",
    visas: [
      {
        id: "uae-tourist",
        label: "Tourist or Visit Visa",
        shortLabel: "Tourist",
        category: "Visit",
        summary:
          "For tourism, family visits, business exploration, medical treatment, training, or transit purposes depending on the visit route.",
        eligibility: [
          "Passport and eligibility for visa on arrival, visa-free entry, or pre-arranged visa.",
          "Sponsor, airline, hotel, travel agency, or self-sponsored route where applicable.",
          "Purpose, accommodation, funds, and return or onward plan.",
          "Additional bank balance or guarantee evidence for some multi-entry or exploration routes.",
        ],
        documents: visitorDocuments(
          "UAE visit visa or sponsor application",
          "Bank, sponsor, hotel, airline, or travel agency evidence required by the selected route.",
        ),
        applicationSteps: defaultVisitorSteps,
        interviewFocus: [
          "Visit purpose, sponsor or booking channel, and accommodation.",
          "Funds and departure plan.",
          "Eligibility for visa on arrival, eVisa, or pre-arranged visa.",
        ],
        commonPitfalls: [
          "Using unofficial agents or unverifiable sponsors.",
          "Wrong emirate or issuing authority selected.",
          "Passport validity or photo requirements not checked.",
        ],
        timeline:
          "Apply through the official channel or authorized sponsor before travel if not eligible for visa on arrival.",
        stay: "Varies by visit visa type, sponsor, and entry permission.",
        applicationMode: "Airline, hotel, travel agency, ICP, GDRFA, or authorized sponsor channel depending on route.",
        officialLinks: [
          {
            title: "UAE visit visas",
            href: "https://u.ae/en/information-and-services/visa-and-emirates-id/visit-visas",
            body: "Official UAE government visit visa overview.",
          },
          {
            title: "UAE tourist visa",
            href: "https://u.ae/en/information-and-services/visa-and-emirates-id/tourist-visa",
            body: "Official tourist visa information and application channels.",
          },
          {
            title: "ICP smart services",
            href: "https://smartservices.icp.gov.ae/",
            body: "Official Federal Authority for Identity, Citizenship, Customs and Port Security services.",
          },
        ],
      },
      {
        id: "uae-student-residence",
        label: "Student Residence Visa",
        shortLabel: "Student",
        category: "Study",
        summary:
          "For students sponsored by a university, parent, or eligible sponsor to study in the UAE.",
        eligibility: [
          "Admission from a UAE educational institution.",
          "Eligible sponsor or university sponsorship.",
          "Medical fitness, Emirates ID steps, and health insurance where required.",
          "Passport, photos, and financial or accommodation support.",
        ],
        documents: studentDocuments(
          "Admission or enrolment letter",
          "Parent, university, scholarship, or bank evidence showing support during residence.",
        ),
        applicationSteps: defaultStudentSteps,
        interviewFocus: [
          "Institution, program, sponsor, and accommodation.",
          "Funding and health insurance.",
          "Medical fitness and Emirates ID steps after entry.",
        ],
        commonPitfalls: [
          "Sponsor route unclear.",
          "Medical fitness or Emirates ID timing missed.",
          "University documents do not match passport details.",
        ],
        timeline:
          "Coordinate with the university or sponsor before travel because entry permit and residence steps may be sequential.",
        stay: "Tied to student residence approval and sponsor rules.",
        applicationMode: "University, sponsor, ICP, or emirate-specific immigration service channel.",
        officialLinks: [
          {
            title: "UAE student visa",
            href: "https://u.ae/en/information-and-services/education/higher-education/student-visa",
            body: "Official UAE student visa information.",
          },
          {
            title: "ICP smart services",
            href: "https://smartservices.icp.gov.ae/",
            body: "Official federal smart services portal.",
          },
          {
            title: "GDRFA Dubai",
            href: "https://www.gdrfad.gov.ae/en",
            body: "Official Dubai residency and entry services.",
          },
        ],
      },
      {
        id: "uae-work-residence",
        label: "Work Residence Visa",
        shortLabel: "Work",
        category: "Work",
        summary:
          "For employment sponsored through a UAE employer, free zone, or authorized entity, followed by residence and identity steps.",
        eligibility: [
          "Employer offer and work permit or entry permit process.",
          "Medical fitness, Emirates ID, and residence stamping or digital residence steps.",
          "Qualifications or attested certificates for regulated roles.",
          "Passport, photos, insurance, and sponsor documents.",
        ],
        documents: workDocuments(
          "Employment entry permit or work permit evidence",
          "Attested qualifications, professional licenses, resume, and role evidence required by the employer or free zone.",
        ),
        applicationSteps: defaultWorkSteps,
        interviewFocus: [
          "Employer, free zone or mainland sponsor, role, and salary.",
          "Qualification attestation and professional licensing where needed.",
          "Medical fitness, Emirates ID, and insurance steps.",
        ],
        commonPitfalls: [
          "Employer or free zone process not completed before residence steps.",
          "Unattested qualifications for regulated work.",
          "Using the wrong emirate service channel.",
        ],
        timeline:
          "Employer-led steps usually start before or immediately after entry, then medical, Emirates ID, and residence steps follow.",
        stay: "Tied to work residence approval, employer sponsorship, and residence validity.",
        applicationMode: "Employer, free zone, ICP, Ministry, or GDRFA channel depending on emirate and sponsor.",
        officialLinks: [
          {
            title: "UAE work permits",
            href: "https://u.ae/en/information-and-services/jobs/work-permits",
            body: "Official UAE government work permit information.",
          },
          {
            title: "ICP smart services",
            href: "https://smartservices.icp.gov.ae/",
            body: "Official federal smart services portal.",
          },
          {
            title: "GDRFA Dubai",
            href: "https://www.gdrfad.gov.ae/en",
            body: "Official Dubai residency and entry services.",
          },
        ],
      },
      {
        id: "uae-golden-visa",
        label: "Golden Visa",
        shortLabel: "Golden Visa",
        category: "Long-term residence",
        summary:
          "For eligible investors, entrepreneurs, exceptional talents, scientists, professionals, students, graduates, and other qualifying categories.",
        eligibility: [
          "Eligibility under a recognized Golden Visa category.",
          "Nomination, approval, investment, employment, achievement, salary, academic, or talent evidence depending on category.",
          "Passport, photo, medical fitness, insurance, and Emirates ID steps.",
          "Documents issued or attested in the format required by the issuing authority.",
        ],
        documents: [
          {
            title: "Passport and photo",
            body: "Use current identity documents that match the service channel requirements.",
            required: true,
          },
          {
            title: "Category evidence",
            body: "Investment, property, salary, degree, award, recommendation, nomination, patent, publication, or talent proof depending on route.",
            required: true,
          },
          {
            title: "Nomination or pre-approval",
            body: "Some categories require nomination, recommendation, or authority approval before final issuance.",
            required: false,
          },
          {
            title: "Medical, insurance, and Emirates ID",
            body: "Residence issuance may require medical fitness, insurance, and identity registration.",
            required: true,
          },
        ],
        applicationSteps: [
          {
            title: "Identify the category",
            body: "Choose the Golden Visa category that exactly matches your evidence.",
          },
          {
            title: "Secure nomination or approval",
            body: "If required, complete the nomination step before final residence application.",
          },
          {
            title: "Submit evidence",
            body: "Upload category proof, identity, insurance, and any attested documents through the correct authority.",
          },
          {
            title: "Complete residence steps",
            body: "Follow medical fitness, Emirates ID, and residence issuance instructions.",
          },
        ],
        interviewFocus: [
          "Which category you qualify under.",
          "How the evidence proves investment, achievement, salary, education, or talent.",
          "Sponsor, family members, and residence compliance.",
        ],
        commonPitfalls: [
          "Applying under a category with weak or mismatched evidence.",
          "Missing nomination or recommendation step.",
          "Documents not attested or issued by the required authority.",
        ],
        timeline:
          "Timing varies by category, emirate, and nomination requirements.",
        stay: "Long-term residence subject to category and approval conditions.",
        applicationMode: "ICP, GDRFA, nomination platform, or authorized category-specific channel.",
        officialLinks: [
          {
            title: "UAE Golden Visa",
            href: "https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/golden-visa",
            body: "Official Golden Visa route overview.",
          },
          {
            title: "ICP smart services",
            href: "https://smartservices.icp.gov.ae/",
            body: "Official federal smart services portal.",
          },
          {
            title: "GDRFA Dubai",
            href: "https://www.gdrfad.gov.ae/en",
            body: "Official Dubai residency and entry services.",
          },
        ],
      },
    ],
  },
];
