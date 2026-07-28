import { PrismaClient } from "@prisma/client";
import { countries as allCountries } from "../src/lib/countries";
import { seedJobreadyReferenceFixtures } from "./jobready-reference-fixtures";
import { seedKenyanLaunchCatalog } from "./jobready-launch-catalog";

const prisma = new PrismaClient();

const categories = [
  { slug: "student", label: "Student Visa" },
  { slug: "work", label: "Work Visa" },
  { slug: "tourist", label: "Tourist & Visitor Visa" },
  { slug: "family", label: "Family Visa" },
  { slug: "immigrant", label: "Immigrant & PR Visa" },
];

const fieldsByCategory = {
  student: [
    {
      key: "institutionDetails",
      label: "Institution details",
      inputType: "text",
      placeholder: "Program, school, funding, start date",
      required: true,
    },
  ],
  work: [
    {
      key: "employerDetails",
      label: "Employer details",
      inputType: "textarea",
      placeholder: "Company name, job title, contract type",
      required: true,
    },
    {
      key: "jobOfferStatus",
      label: "Job offer status",
      inputType: "text",
      placeholder: "Confirmed offer, intra-company transfer, etc.",
      required: true,
    },
    {
      key: "salaryDetails",
      label: "Salary & compensation",
      inputType: "text",
      placeholder: "Annual salary in destination currency",
      required: false,
    },
  ],
  tourist: [
    {
      key: "travelDates",
      label: "Travel dates & duration",
      inputType: "text",
      placeholder: "Arrival date, departure date, total days",
      required: true,
    },
    {
      key: "accommodationDetails",
      label: "Accommodation",
      inputType: "text",
      placeholder: "Hotel, Airbnb, staying with family - include address",
      required: false,
    },
    {
      key: "financialProof",
      label: "Financial proof",
      inputType: "textarea",
      placeholder: "Bank balance, travel budget, who is funding the trip",
      required: false,
    },
  ],
  family: [
    {
      key: "sponsorDetails",
      label: "Sponsor / petitioner details",
      inputType: "textarea",
      placeholder:
        "Name, immigration status, relationship, how long in destination country",
      required: true,
    },
    {
      key: "relationshipProof",
      label: "Relationship evidence",
      inputType: "textarea",
      placeholder: "Marriage certificate, birth certificate, legal documents",
      required: false,
    },
  ],
  immigrant: [
    {
      key: "prPathway",
      label: "PR / immigration pathway",
      inputType: "text",
      placeholder:
        "Express Entry, points-based system, employer sponsorship, etc.",
      required: true,
    },
    {
      key: "yearsInCountry",
      label: "Time spent in destination country",
      inputType: "text",
      placeholder: "Total years, visa history",
      required: false,
    },
    {
      key: "tiesAbroad",
      label: "Ties to home country",
      inputType: "textarea",
      placeholder: "Property, family, business obligations",
      required: false,
    },
  ],
} as const;

const destinationCountries = [
  { name: "United States", isoCode: "US", flagEmoji: "🇺🇸" },
  { name: "United Kingdom", isoCode: "GB", flagEmoji: "🇬🇧" },
  { name: "Canada", isoCode: "CA", flagEmoji: "🇨🇦" },
  { name: "Australia", isoCode: "AU", flagEmoji: "🇦🇺" },
  { name: "Germany", isoCode: "DE", flagEmoji: "🇩🇪" },
  { name: "France", isoCode: "FR", flagEmoji: "🇫🇷" },
];

const originCountries = [
  {
    name: "Kenya",
    isoCode: "KE",
    flagEmoji: "🇰🇪",
    originProfile:
      "Applicants from Kenya are subject to heightened scrutiny on home ties and funding source. The officer should probe returnability and financial credibility firmly. Be sceptical of vague funding answers.",
  },
  {
    name: "Nigeria",
    isoCode: "NG",
    flagEmoji: "🇳🇬",
    originProfile:
      "Nigerian applicants face strict scrutiny due to historically high refusal rates. The officer should challenge the strength of home ties, employment stability, and previous travel history aggressively.",
  },
  {
    name: "Pakistan",
    isoCode: "PK",
    flagEmoji: "🇵🇰",
    originProfile:
      "Applicants from Pakistan face rigorous questioning on intent to return. The officer should probe family ties, employment, and the credibility of the stated purpose of travel.",
  },
  {
    name: "India",
    isoCode: "IN",
    flagEmoji: "🇮🇳",
    originProfile:
      "Common applicant pool with mixed profiles. Officer should probe overstay risk for tourist visas and verify funding credibility for student visas.",
  },
  {
    name: "United States",
    isoCode: "US",
    flagEmoji: "🇺🇸",
    originProfile:
      "Low-risk origin. Officer maintains standard questioning without elevated scepticism.",
  },
  {
    name: "United Kingdom",
    isoCode: "GB",
    flagEmoji: "🇬🇧",
    originProfile: "Low-risk origin. Maintain a professional, balanced tone.",
  },
];

const visaTypes = [
  {
    name: "US F1 Student",
    destinationIsoCode: "US",
    categorySlug: "student",
    basePrompt:
      "You are a US consular officer conducting an F1 student visa interview. Your job is to assess whether the applicant has genuine intent to study, sufficient funding, and strong ties to their home country that will compel them to return after completing their studies. Focus on: the credibility and specificity of their study plan, source and sufficiency of funding, home country ties (family, property, employment prospects), and their knowledge of the program and institution. Be professional but firm. Do not accept vague answers - press for specifics.",
  },
  {
    name: "UK Student Visa",
    destinationIsoCode: "GB",
    categorySlug: "student",
    basePrompt:
      "You are a UK Visas and Immigration officer conducting a student visa interview. Assess English language proficiency, course credibility, CAS (Confirmation of Acceptance for Studies) knowledge, financial maintenance, and genuine student intent. The UK points-based system applies - probe whether the applicant meets each requirement.",
  },
  {
    name: "US B1/B2 Tourist",
    destinationIsoCode: "US",
    categorySlug: "tourist",
    basePrompt:
      "You are a US CBP officer assessing a B1/B2 visitor visa application. Your primary concern is whether the applicant will overstay their visa. Focus on: purpose of visit, ties to home country (employment, family, property), financial sufficiency for the trip, previous US travel history, and travel itinerary. Challenge any vague answers about duration of stay or return plans.",
  },
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
    name: "US E1/E2 Treaty Trader or Investor",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting an E1 treaty trader or E2 treaty investor interview. Assess treaty nationality, ownership and control, substantial trade or investment, business viability, source of funds, applicant role, executive or essential skills where applicable, and intent to depart when E status ends. Probe vague business plans, passive investments, weak source-of-funds explanations, and inconsistencies with the DS-160 or E visa packet.",
  },
  {
    name: "US E3 Australian Specialty Worker",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting an E3 Australian specialty occupation visa interview. Assess Australian nationality, specialty occupation fit, job duties, employer legitimacy, LCA consistency, salary, qualifications, worksite, and whether the applicant understands the role and temporary classification. Challenge unclear duties, salary mismatches, or weak credential-to-role explanations.",
  },
  {
    name: "US H1B1 Chile/Singapore Specialty Worker",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting an H1B1 specialty occupation visa interview for a Chile or Singapore national. Assess nationality eligibility, specialty occupation duties, employer legitimacy, LCA consistency, salary, qualifications, worksite, and temporary professional intent. Probe vague job descriptions, weak degree fit, and answers inconsistent with the employment letter or LCA.",
  },
  {
    name: "US H2A Agricultural Worker",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting an H2A temporary agricultural worker visa interview. Assess the approved petition, employer or agent details, agricultural job duties, seasonality, worksite, wage, housing or transportation arrangements where relevant, recruitment or contract facts, prior US compliance, and intent to leave after the temporary job. Probe labor-rights awareness, recruiter-fee concerns, and inconsistent employer details.",
  },
  {
    name: "US H2B Seasonal Worker",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting an H2B temporary nonagricultural worker visa interview. Assess the approved petition, employer, temporary or seasonal need, job duties, worksite, wage, contract length, prior US compliance, and intent to leave after the authorized job. Probe unclear recruitment history, fee or debt concerns, vague job duties, and mismatches with the petition.",
  },
  {
    name: "US H3 Trainee",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting an H3 trainee visa interview. Assess the petitioned training program, why the training is not available in the applicant's home country, training schedule, host organization, compensation or expenses, career use after returning home, and whether the program is truly training rather than ordinary employment. Probe generic training plans or weak return-use explanations.",
  },
  {
    name: "US P Athlete Artist Entertainer",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting a P visa interview for an athlete, artist, entertainer, or group member. Assess the approved petition, event or performance itinerary, group membership where relevant, achievements or recognition, contract terms, support personnel if applicable, and whether the U.S. activity matches the classification. Probe unclear schedules, inflated claims, and open-ended work plans.",
  },
  {
    name: "US Q1 Cultural Exchange",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting a Q1 international cultural exchange visa interview. Assess the approved petition, sponsoring organization, cultural component, training or employment activities, program duration, compensation, housing or support details, and the applicant's plan after the program. Probe whether the role is a genuine cultural exchange rather than ordinary work.",
  },
  {
    name: "US R1 Religious Worker",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting an R1 temporary religious worker visa interview. Assess the approved petition, qualifying religious organization, applicant's membership and role, duties, compensation or support, worksite, prior religious service, and intent to comply with temporary religious-worker limits. Probe vague ministry duties, weak organizational ties, and unclear financial support.",
  },
  {
    name: "US I Media Journalist",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting an I visa interview for a foreign media representative. Assess the applicant's media employer, assignment, editorial role, credentials, U.S. itinerary, funding, and whether the planned activity qualifies as journalism or media work rather than entertainment, advertising, or ordinary employment. Probe vague assignments, freelancer documentation, and visitor-visa misuse risks.",
  },
  {
    name: "US C1/D Transit or Crew",
    destinationIsoCode: "US",
    categorySlug: "tourist",
    basePrompt:
      "You are a US consular officer conducting a C1 transit or D crewmember visa interview. Assess transit route or crew assignment, employer or vessel/airline details, joining or departure plan, contract, prior crew history, funds for transit if relevant, and intent to depart the United States on schedule. Probe unclear itineraries, missing crew letters, and overstay or unauthorized-work risks.",
  },
  {
    name: "US TN/TD Professional",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting a TN or TD visa interview. Assess Canadian or Mexican nationality where relevant, qualifying profession, job offer, duties, credentials, temporary professional assignment, employer details, and dependent eligibility for TD applicants. Probe whether the job fits the listed profession and whether credentials match the claimed role.",
  },
  {
    name: "US A/G/NATO Official",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting an A, G, or NATO official visa interview. Assess the official assignment, sending government or international organization, diplomatic note or official request, role, duration, dependents or staff where relevant, and whether the purpose fits official government, international organization, or NATO travel. Probe inconsistencies in role, assignment dates, or documentation without discussing classified matters.",
  },
  {
    name: "US BCC Border Crossing Card",
    destinationIsoCode: "US",
    categorySlug: "tourist",
    basePrompt:
      "You are a US consular officer conducting a Border Crossing Card interview for a Mexican applicant. Assess the temporary border travel purpose, residence and ties in Mexico, employment or school, family context, prior U.S. travel compliance, funds, and whether the applicant understands permitted travel limits. Probe vague purpose, frequent long stays, and weak Mexico ties.",
  },
  {
    name: "US CW1 CNMI Worker",
    destinationIsoCode: "US",
    categorySlug: "work",
    basePrompt:
      "You are a US consular officer conducting a CW1 CNMI-only transitional worker visa interview. Assess the approved petition, CNMI employer, job duties, worksite, wage, contract length, prior immigration compliance, and whether the applicant understands the classification is limited to CNMI employment. Probe unclear employer details, unauthorized mainland-work plans, and petition inconsistencies.",
  },
  {
    name: "US U/T Victim-Based Visa",
    destinationIsoCode: "US",
    categorySlug: "immigrant",
    basePrompt:
      "You are a trauma-aware but rigorous US consular officer conducting a U or T victim-based visa interview simulation. Verify identity, qualifying application or approval context, law-enforcement certification or trafficking claim where relevant, family derivatives, security and admissibility history, and consistency with submitted records. Ask clear, respectful questions, avoid pressuring the applicant to invent detail, and do not provide legal advice or announce a real decision.",
  },
  {
    name: "US V Family Nonimmigrant",
    destinationIsoCode: "US",
    categorySlug: "family",
    basePrompt:
      "You are a US consular officer conducting a V nonimmigrant visa interview for an eligible spouse or child of a lawful permanent resident. Assess qualifying petition history, relationship evidence, identity and civil documents, admissibility, prior immigration history, and understanding of the temporary family-unity classification. Probe unclear petition dates, weak relationship evidence, and inconsistency with civil records.",
  },
  {
    name: "US K3 Spouse",
    destinationIsoCode: "US",
    categorySlug: "family",
    basePrompt:
      "You are a US consular officer conducting a K3 spouse visa interview. Assess marriage bona fides, pending petition context, petitioner details, relationship timeline, prior marriages, financial support, civil documents, and consistency with submitted forms. Probe relationship contradictions calmly and distinguish temporary K3 processing from the underlying immigrant spouse case.",
  },
  {
    name: "US IR2/CR2 Child",
    destinationIsoCode: "US",
    categorySlug: "family",
    basePrompt:
      "You are a US consular officer conducting an IR2 or CR2 child immigrant visa interview. Assess the parent-child relationship, petitioning parent's status, custody or adoption facts where relevant, civil documents, financial sponsorship, identity, prior immigration history, and consistency between the child, parent, and petition records. Use age-appropriate questions and probe documentary inconsistencies carefully.",
  },
  {
    name: "US IR5 Parent",
    destinationIsoCode: "US",
    categorySlug: "family",
    basePrompt:
      "You are a US consular officer conducting an IR5 parent immigrant visa interview. Assess the parent-child relationship to the US citizen petitioner, civil documents, petitioner details, financial sponsorship, prior marriages or name changes where relevant, prior immigration history, and consistency with submitted forms. Probe unclear family records or support arrangements calmly.",
  },
  {
    name: "US F2A/F2B Family Preference",
    destinationIsoCode: "US",
    categorySlug: "family",
    basePrompt:
      "You are a US consular officer conducting an F2A or F2B family-preference immigrant visa interview. Assess the qualifying relationship to the lawful permanent resident petitioner, priority date and case readiness context, civil documents, marital status where relevant, financial sponsorship, prior immigration history, and consistency with the petition. Probe age, marital status, custody, and documentary discrepancies where material.",
  },
  {
    name: "US F3/F4 Family Preference",
    destinationIsoCode: "US",
    categorySlug: "family",
    basePrompt:
      "You are a US consular officer conducting an F3 or F4 family-preference immigrant visa interview. Assess the qualifying relationship, derivative family members, priority date and case facts, civil documents, financial sponsorship, marital or sibling evidence, prior immigration history, and consistency with submitted records. Probe long timeline gaps, name changes, derivative eligibility, and missing civil documents.",
  },
  {
    name: "US EB1/EB2/EB3 Employment Immigrant",
    destinationIsoCode: "US",
    categorySlug: "immigrant",
    basePrompt:
      "You are a US consular officer conducting an EB1, EB2, or EB3 employment-based immigrant visa interview. Assess the immigrant petition, job offer or self-petition basis, qualifications, employment history, employer or petitioner details, civil documents, admissibility, family derivatives, and consistency with labor certification or petition evidence where applicable. Probe job-offer credibility, credential mismatches, and unexplained employment history.",
  },
  {
    name: "US EB5 Investor",
    destinationIsoCode: "US",
    categorySlug: "immigrant",
    basePrompt:
      "You are a US consular officer conducting an EB5 immigrant investor visa interview. Assess the approved investor petition context, source and path of funds, investment project, job-creation basis, regional center or direct investment details, civil documents, admissibility, derivatives, and consistency with financial records. Probe unclear fund sourcing, undocumented transfers, and weak understanding of the investment.",
  },
  {
    name: "US Diversity Visa",
    destinationIsoCode: "US",
    categorySlug: "immigrant",
    basePrompt:
      "You are a US consular officer conducting a Diversity Visa immigrant interview. Assess selection and case readiness, education or qualifying work experience, identity, civil documents, police certificates, financial support or public-charge-related evidence where relevant, derivatives, prior immigration history, and consistency with the entry and DS-260. Probe education/work eligibility, family composition, and document discrepancies.",
  },
  {
    name: "Canada Study Permit",
    destinationIsoCode: "CA",
    categorySlug: "student",
    basePrompt:
      "You are a Canadian immigration officer reviewing a study permit application. Focus on: whether the applicant is a genuine student, financial sufficiency and source of funds, ties to home country to ensure departure after studies, acceptance at a DLI (Designated Learning Institution), and post-graduation plans.",
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
    name: "Canada Express Entry",
    destinationIsoCode: "CA",
    categorySlug: "immigrant",
    basePrompt:
      "You are a Canadian immigration officer reviewing an Express Entry permanent residence file. Focus on work history, NOC-aligned duties, proof of funds, education credentials, admissibility, family composition, travel history, and consistency between the application and supporting documents.",
  },
  {
    name: "Schengen Tourist",
    destinationIsoCode: "FR",
    categorySlug: "tourist",
    basePrompt:
      "You are a Schengen consular officer assessing a tourist visa applicant. Focus on itinerary credibility, main destination, travel dates, accommodation, travel medical insurance, funds, employment or study ties, host details if applicable, and proof the applicant will leave the Schengen Area on time.",
  },
  {
    name: "Schengen Business",
    destinationIsoCode: "FR",
    categorySlug: "tourist",
    basePrompt:
      "You are a Schengen consular officer assessing a business visa applicant. Focus on business purpose, inviting company details, meetings or conference itinerary, employer support, funds, accommodation, insurance, prior travel, and proof the applicant will leave the Schengen Area on time.",
  },
  {
    name: "Australia Student Visa (Subclass 500)",
    destinationIsoCode: "AU",
    categorySlug: "student",
    basePrompt:
      "You are an Australian Department of Home Affairs officer assessing a Student visa (subclass 500) applicant. Test the Genuine Student requirement through the applicant's current circumstances, reasons for choosing the course and provider, understanding of studying and living in Australia, course value, funding, immigration history, OSHC, and intended compliance with visa conditions. Ask concise credibility-focused questions and investigate inconsistencies without assuming that future lawful permanent-residence ambitions are automatically adverse.",
  },
  {
    name: "Australia Partner Visa (Subclasses 309/100 or 820/801)",
    destinationIsoCode: "AU",
    categorySlug: "family",
    basePrompt:
      "You are an Australian Department of Home Affairs officer conducting a Partner visa interview. Assess whether the spouse or de facto relationship is genuine and continuing. Test the relationship timeline, mutual commitment, financial arrangements, household responsibilities, social recognition, periods apart, previous relationships, sponsor circumstances, and consistency with submitted evidence. Do not coach the applicant or invent facts.",
  },
  {
    name: "Australia Visitor Visa",
    destinationIsoCode: "AU",
    categorySlug: "tourist",
    basePrompt:
      "You are an Australian Department of Home Affairs officer assessing a visitor visa applicant. Test genuine temporary stay, trip purpose, itinerary, funds, employment or study ties, family ties, previous travel, and reasons to return. Probe unclear travel plans, weak ties, or answers focused on long-term stay.",
  },
  {
    name: "Australia Protection Visa (Subclass 866)",
    destinationIsoCode: "AU",
    categorySlug: "immigrant",
    basePrompt:
      "You are an Australian Department of Home Affairs officer conducting a Protection visa (subclass 866) interview simulation. Ask clear, trauma-aware but rigorous questions about identity, nationality, the complete protection claim, chronology, feared harm, responsible actors, state protection, relocation, travel and immigration history, delays, documentary evidence, and inconsistencies. Never pressure the applicant to invent detail and never provide legal advice or make a real protection decision.",
  },
  {
    name: "Australia Refugee and Humanitarian Visa (Subclasses 200-204)",
    destinationIsoCode: "AU",
    categorySlug: "immigrant",
    basePrompt:
      "You are an Australian Department of Home Affairs officer conducting an offshore Refugee and Humanitarian visa interview simulation for subclasses 200 to 204. Verify identity, family composition, displacement history, the claimed persecution or substantial discrimination, current circumstances, referral or proposer details where applicable, prior applications, security and character information, and consistency with supporting evidence. Remain formal, trauma-aware, and neutral; do not provide legal advice or announce a real decision.",
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

const usStudentConcerns = [
  "Funding gap",
  "Weak home ties",
  "Prior refusal",
  "Unclear program plan",
  "SEVIS or sponsor details",
  "Prior US stay",
  "None",
];

const usWorkerConcerns = [
  "Employer credibility",
  "Role duties unclear",
  "Petition or approval details",
  "Qualification mismatch",
  "Salary or contract concern",
  "Prior refusal",
  "None",
];

const usVisitorConcerns = [
  "No strong home ties",
  "Prior overstay",
  "Frequent travel history",
  "Insufficient funds",
  "Vague itinerary",
  "US relatives or host details",
  "None",
];

const usFamilyConcerns = [
  "Relationship evidence",
  "Sponsor details unclear",
  "Timeline inconsistency",
  "Financial support",
  "Civil documents",
  "Prior refusal",
  "None",
];

const usImmigrantConcerns = [
  "Civil documents",
  "Petition or case details",
  "Financial support",
  "Immigration history",
  "Derivative family members",
  "Prior refusal",
  "None",
];

const concernOptionsByVisaName: Record<string, string[]> = {
  "US F1 Student": [
    "Funding gap",
    "Weak home ties",
    "Prior refusal",
    "Unclear study plan",
    "Gap year",
    "Low GPA",
    "Change of field",
    "None",
  ],
  "US J1 Exchange": usStudentConcerns,
  "US M1 Vocational Student": usStudentConcerns,
  "US F2/J2 Dependent": usFamilyConcerns,
  "US H1B Specialty Worker": usWorkerConcerns,
  "US L1 Transfer": usWorkerConcerns,
  "US O1 Extraordinary Ability": [
    "Achievement evidence",
    "Petitioner or agent details",
    "Itinerary unclear",
    "Field or role mismatch",
    "Prior refusal",
    "None",
  ],
  "US K1 Fiance": usFamilyConcerns,
  "US CR1/IR1 Spouse": usFamilyConcerns,
  "US E1/E2 Treaty Trader or Investor": [
    "Treaty nationality",
    "Source of funds",
    "Business viability",
    "Ownership or control",
    "Applicant role unclear",
    "None",
  ],
  "US E3 Australian Specialty Worker": usWorkerConcerns,
  "US H1B1 Chile/Singapore Specialty Worker": usWorkerConcerns,
  "US H2A Agricultural Worker": [
    "Employer or recruiter details",
    "Job contract unclear",
    "Wage or housing concern",
    "Prior US compliance",
    "Intent to depart",
    "None",
  ],
  "US H2B Seasonal Worker": [
    "Employer or recruiter details",
    "Temporary need unclear",
    "Job contract unclear",
    "Prior US compliance",
    "Intent to depart",
    "None",
  ],
  "US H3 Trainee": [
    "Training plan unclear",
    "Looks like ordinary employment",
    "Home-country use unclear",
    "Host organization details",
    "Prior refusal",
    "None",
  ],
  "US P Athlete Artist Entertainer": [
    "Itinerary unclear",
    "Recognition evidence",
    "Contract details",
    "Petition details",
    "Prior refusal",
    "None",
  ],
  "US Q1 Cultural Exchange": [
    "Cultural component unclear",
    "Sponsor details",
    "Program duration",
    "Compensation or support",
    "Intent to depart",
    "None",
  ],
  "US R1 Religious Worker": [
    "Religious organization details",
    "Membership evidence",
    "Role duties unclear",
    "Financial support",
    "Petition details",
    "None",
  ],
  "US I Media Journalist": [
    "Assignment unclear",
    "Media credentials",
    "Employer or freelancer proof",
    "Itinerary unclear",
    "Visitor visa mismatch",
    "None",
  ],
  "US C1/D Transit or Crew": [
    "Transit itinerary",
    "Crew assignment",
    "Employer or vessel details",
    "Prior overstay",
    "Intent to depart",
    "None",
  ],
  "US TN/TD Professional": [
    "Profession category fit",
    "Credential mismatch",
    "Employer letter unclear",
    "Temporary intent",
    "Dependent eligibility",
    "None",
  ],
  "US A/G/NATO Official": [
    "Official assignment details",
    "Diplomatic note",
    "Dependent or staff eligibility",
    "Role duration",
    "Documentation mismatch",
    "None",
  ],
  "US BCC Border Crossing Card": usVisitorConcerns,
  "US CW1 CNMI Worker": usWorkerConcerns,
  "US U/T Victim-Based Visa": [
    "Identity documents",
    "Application or approval context",
    "Family derivatives",
    "Admissibility history",
    "Trauma-sensitive practice",
    "None",
  ],
  "US V Family Nonimmigrant": usFamilyConcerns,
  "US K3 Spouse": usFamilyConcerns,
  "US IR2/CR2 Child": usFamilyConcerns,
  "US IR5 Parent": usFamilyConcerns,
  "US F2A/F2B Family Preference": usFamilyConcerns,
  "US F3/F4 Family Preference": usFamilyConcerns,
  "US EB1/EB2/EB3 Employment Immigrant": usImmigrantConcerns,
  "US EB5 Investor": [
    "Source of funds",
    "Investment project details",
    "Fund transfer path",
    "Derivative family members",
    "Civil documents",
    "None",
  ],
  "US Diversity Visa": [
    "Education or work eligibility",
    "Civil documents",
    "Police certificates",
    "Family derivatives",
    "DS-260 consistency",
    "None",
  ],
  "UK Student Visa": [
    "Funding gap",
    "Weak home ties",
    "Prior refusal",
    "Unclear study plan",
    "CAS knowledge gap",
    "English proficiency",
    "None",
  ],
  "Canada Study Permit": [
    "Funding gap",
    "Weak home ties",
    "Prior refusal",
    "Unclear study plan",
    "DLI knowledge gap",
    "Post-study plan",
    "None",
  ],
  "Canada Express Entry": [
    "Work history inconsistency",
    "Proof of funds",
    "NOC duty mismatch",
    "Travel history",
    "Family composition",
    "None",
  ],
  "Schengen Tourist": [
    "Vague itinerary",
    "Weak return proof",
    "Insufficient funds",
    "Wrong main destination",
    "Host details unclear",
    "None",
  ],
  "Australia Student Visa (Subclass 500)": [
    "Course relevance",
    "Funding gap",
    "Study gap",
    "Prior refusal",
    "Unclear return plan",
    "None",
  ],
  "US B1/B2 Tourist": [
    "No strong home ties",
    "Prior overstay",
    "Frequent travel history",
    "Insufficient funds",
    "Vague itinerary",
    "Travelling alone",
    "None",
  ],
};

type SeedDocument = {
  name: string;
  description: string;
  isMandatory?: boolean;
};

const usNonimmigrantBasics: SeedDocument[] = [
  {
    name: "Valid passport",
    description: "Use the passport you will travel with and check local validity rules before the appointment.",
  },
  {
    name: "DS-160 confirmation page",
    description: "Bring the barcode confirmation page and keep application answers consistent with the interview.",
  },
  {
    name: "Appointment confirmation and fee receipt",
    description: "Follow the local U.S. embassy or consulate scheduling, payment, and courier instructions.",
  },
];

const usImmigrantBasics: SeedDocument[] = [
  {
    name: "Valid passport",
    description: "Use the passport you will travel with and check post-specific validity instructions.",
  },
  {
    name: "DS-260 or case confirmation",
    description: "Know the case number, category, petitioner or selection basis, and interview appointment details.",
  },
  {
    name: "Civil documents",
    description: "Prepare birth, marriage, divorce, adoption, police, court, military, and translation records that apply to the case.",
  },
  {
    name: "Medical exam and vaccination records",
    description: "Complete the panel physician process according to the embassy or consulate instructions.",
  },
];

function withDocuments(
  baseDocuments: SeedDocument[],
  extraDocuments: SeedDocument[],
) {
  return [...baseDocuments, ...extraDocuments];
}

const requiredDocumentsByVisaName: Record<string, SeedDocument[]> = {
  "US F1 Student": withDocuments(usNonimmigrantBasics, [
    {
      name: "Signed Form I-20",
      description: "Know the SEVIS ID, school, program, start date, and cost estimate.",
    },
    {
      name: "SEVIS fee receipt",
      description: "Bring proof of I-901 SEVIS fee payment.",
    },
    {
      name: "Admission and academic records",
      description: "Admission letter, transcripts, certificates, test scores, and evidence connecting prior study to the program.",
    },
    {
      name: "Funding and sponsor evidence",
      description: "Bank statements, scholarship letters, loan approval, income records, or sponsor documents covering tuition and living costs.",
    },
    {
      name: "Home-tie or post-study evidence",
      description: "Employment plans, business ties, family obligations, property, or other return-plan evidence.",
      isMandatory: false,
    },
  ]),
  "US J1 Exchange": withDocuments(usNonimmigrantBasics, [
    {
      name: "Form DS-2019",
      description: "Know the program sponsor, category, dates, SEVIS ID, and funding section.",
    },
    {
      name: "SEVIS fee receipt",
      description: "Bring proof of I-901 SEVIS fee payment unless exempt.",
    },
    {
      name: "Program sponsor and funding evidence",
      description: "Sponsor letter, placement information, funding proof, and program-purpose details.",
    },
    {
      name: "Home-residency or return-plan evidence",
      description: "Use when the program, field, or funding raises return-intent questions.",
      isMandatory: false,
    },
  ]),
  "US M1 Vocational Student": withDocuments(usNonimmigrantBasics, [
    {
      name: "Signed Form I-20",
      description: "Know the vocational school, program, dates, SEVIS ID, and cost estimate.",
    },
    {
      name: "SEVIS fee receipt",
      description: "Bring proof of I-901 SEVIS fee payment.",
    },
    {
      name: "Vocational training and academic records",
      description: "Admission letter, prior training, certificates, and evidence that the course fits the career plan.",
    },
    {
      name: "Funding evidence",
      description: "Proof that tuition, living costs, and travel are covered without unauthorized work.",
    },
  ]),
  "US F2/J2 Dependent": withDocuments(usNonimmigrantBasics, [
    {
      name: "Principal applicant status documents",
      description: "Copy of the principal applicant's I-20 or DS-2019, visa/status evidence, and school or sponsor details.",
    },
    {
      name: "Relationship documents",
      description: "Marriage certificate, birth certificate, adoption record, or other proof of qualifying relationship.",
    },
    {
      name: "Funding and living-arrangement evidence",
      description: "Proof that the family can afford U.S. living costs and understands dependent limits.",
    },
  ]),
  "US B1/B2 Tourist": withDocuments(usNonimmigrantBasics, [
    {
      name: "Trip itinerary",
      description: "Dates, cities, accommodation, host, event, medical, or business-meeting details.",
    },
    {
      name: "Financial evidence",
      description: "Bank, income, business, sponsor, or employer records that match the trip budget.",
    },
    {
      name: "Return-tie evidence",
      description: "Employment leave, school enrollment, business obligations, family duties, property, or contracts.",
      isMandatory: false,
    },
    {
      name: "Invitation, event, or medical evidence",
      description: "Use when visiting a host, attending an event, receiving treatment, or traveling for business.",
      isMandatory: false,
    },
  ]),
  "US C1/D Transit or Crew": withDocuments(usNonimmigrantBasics, [
    {
      name: "Transit itinerary or crew letter",
      description: "Show flight, vessel, airline, cruise line, employer, joining port, or departure details.",
    },
    {
      name: "Employment contract or crew ID",
      description: "Bring employer-issued evidence of assignment and work terms.",
    },
    {
      name: "Prior travel or compliance evidence",
      description: "Useful when prior U.S. stays, crew travel, or transit history may be reviewed.",
      isMandatory: false,
    },
  ]),
  "US BCC Border Crossing Card": withDocuments(usNonimmigrantBasics, [
    {
      name: "Mexico residence and identity evidence",
      description: "Show residence, employment, study, family, and border travel purpose.",
    },
    {
      name: "Financial and travel-purpose evidence",
      description: "Prepare proof that the temporary cross-border travel is affordable and permitted.",
    },
  ]),
  "US H1B Specialty Worker": withDocuments(usNonimmigrantBasics, [
    {
      name: "I-797 approval notice or petition receipt",
      description: "Know the petitioner, receipt number, classification, and validity period.",
    },
    {
      name: "LCA, offer letter, and employer support letter",
      description: "Know the title, duties, salary, worksite, supervisor, and start date.",
    },
    {
      name: "Education and work-history evidence",
      description: "Degree, transcripts, evaluations, licenses, resume, and employment letters supporting specialty fit.",
    },
  ]),
  "US L1 Transfer": withDocuments(usNonimmigrantBasics, [
    {
      name: "I-797 approval notice or blanket L documents",
      description: "Know whether the case is L1A, L1B, individual, or blanket and how the entities relate.",
    },
    {
      name: "Foreign and U.S. company evidence",
      description: "Prepare entity relationship, employment abroad, worksite, assignment, and salary details.",
    },
    {
      name: "Role evidence",
      description: "Managerial, executive, or specialized-knowledge duties should match the petition.",
    },
  ]),
  "US O1 Extraordinary Ability": withDocuments(usNonimmigrantBasics, [
    {
      name: "I-797 approval notice or petition receipt",
      description: "Know the petitioner or agent, classification, and validity period.",
    },
    {
      name: "Support letter, contracts, and itinerary",
      description: "Prepare dates, locations, engagements, clients, venues, deliverables, and payment facts.",
    },
    {
      name: "Evidence of acclaim or achievement",
      description: "Awards, publications, press, judging, leading roles, critical reviews, high pay, or original contributions.",
    },
  ]),
  "US E1/E2 Treaty Trader or Investor": withDocuments(usNonimmigrantBasics, [
    {
      name: "E visa company packet",
      description: "Prepare treaty ownership, trade or investment evidence, business plan, financials, and organizational chart.",
    },
    {
      name: "Source and path of funds",
      description: "For E2, be ready to explain how funds were earned, transferred, and committed.",
    },
    {
      name: "Applicant role evidence",
      description: "Show executive, supervisory, essential-skill, owner, or investor role details.",
    },
  ]),
  "US E3 Australian Specialty Worker": withDocuments(usNonimmigrantBasics, [
    {
      name: "Australian passport and LCA",
      description: "Confirm nationality eligibility and LCA consistency.",
    },
    {
      name: "Offer letter and employer evidence",
      description: "Know the specialty occupation duties, salary, worksite, and start date.",
    },
    {
      name: "Degree and credential evidence",
      description: "Prepare proof that qualifications fit the specialty occupation.",
    },
  ]),
  "US H1B1 Chile/Singapore Specialty Worker": withDocuments(usNonimmigrantBasics, [
    {
      name: "Chile or Singapore nationality proof and LCA",
      description: "Confirm route eligibility and LCA consistency.",
    },
    {
      name: "Offer letter and employer evidence",
      description: "Know the specialty occupation duties, salary, worksite, and start date.",
    },
    {
      name: "Degree and credential evidence",
      description: "Prepare proof that qualifications fit the specialty occupation.",
    },
  ]),
  "US H2A Agricultural Worker": withDocuments(usNonimmigrantBasics, [
    {
      name: "I-797 approval notice or petition details",
      description: "Know the employer, job, worksite, season, and petition validity.",
    },
    {
      name: "Job contract and wage or housing details",
      description: "Bring job-order, contract, wage, housing, transportation, or recruiter details available to you.",
    },
    {
      name: "Prior U.S. compliance evidence",
      description: "Useful if you previously held H-2 or other U.S. status.",
      isMandatory: false,
    },
  ]),
  "US H2B Seasonal Worker": withDocuments(usNonimmigrantBasics, [
    {
      name: "I-797 approval notice or petition details",
      description: "Know the employer, job, worksite, season or temporary need, and petition validity.",
    },
    {
      name: "Job contract and wage details",
      description: "Bring job-order, contract, wage, housing, transportation, or recruiter details available to you.",
    },
  ]),
  "US H3 Trainee": withDocuments(usNonimmigrantBasics, [
    {
      name: "I-797 approval notice or petition details",
      description: "Know the host organization, training category, and validity period.",
    },
    {
      name: "Training plan",
      description: "Prepare schedule, objectives, supervision, compensation, and why training is not available at home.",
    },
    {
      name: "Home-country career-use evidence",
      description: "Show how the training will be used after returning.",
    },
  ]),
  "US P Athlete Artist Entertainer": withDocuments(usNonimmigrantBasics, [
    {
      name: "I-797 approval notice or petition details",
      description: "Know the petitioner, classification, event or performance dates, and validity period.",
    },
    {
      name: "Contracts and itinerary",
      description: "Prepare venues, events, team/group role, support staff, compensation, and travel schedule.",
    },
    {
      name: "Recognition or group-membership evidence",
      description: "Use achievements, rankings, reviews, press, awards, or group proof where relevant.",
    },
  ]),
  "US Q1 Cultural Exchange": withDocuments(usNonimmigrantBasics, [
    {
      name: "I-797 approval notice or petition details",
      description: "Know the sponsor, program dates, and cultural-exchange basis.",
    },
    {
      name: "Program and compensation evidence",
      description: "Prepare cultural component, duties, schedule, wages, support, and housing facts.",
    },
  ]),
  "US R1 Religious Worker": withDocuments(usNonimmigrantBasics, [
    {
      name: "I-797 approval notice or petition details",
      description: "Know the petitioning religious organization, role, worksite, and validity period.",
    },
    {
      name: "Religious membership and role evidence",
      description: "Prepare proof of membership, ordination or training if relevant, duties, and compensation or support.",
    },
  ]),
  "US I Media Journalist": withDocuments(usNonimmigrantBasics, [
    {
      name: "Media employer or assignment letter",
      description: "Show employer, editorial role, assignment, U.S. itinerary, and funding.",
    },
    {
      name: "Press credentials and work samples",
      description: "Use credentials, employer ID, publications, broadcasts, or portfolio evidence.",
    },
  ]),
  "US TN/TD Professional": withDocuments(usNonimmigrantBasics, [
    {
      name: "Nationality, job letter, and profession evidence",
      description: "Prepare Canadian or Mexican nationality proof where relevant, employer letter, profession category, duties, and dates.",
    },
    {
      name: "Credentials and licenses",
      description: "Bring degrees, transcripts, licenses, evaluations, and experience records required by the profession.",
    },
    {
      name: "Relationship documents for TD dependents",
      description: "Marriage or birth documents are needed for dependent cases.",
      isMandatory: false,
    },
  ]),
  "US A/G/NATO Official": withDocuments(usNonimmigrantBasics, [
    {
      name: "Diplomatic note or official request",
      description: "Show sending government, international organization, NATO assignment, role, and dates.",
    },
    {
      name: "Official identity and assignment evidence",
      description: "Prepare passport type, employer, posting details, dependents, or staff documents where relevant.",
    },
  ]),
  "US CW1 CNMI Worker": withDocuments(usNonimmigrantBasics, [
    {
      name: "I-797 approval notice or petition details",
      description: "Know the CNMI employer, job, worksite, wage, and classification limits.",
    },
    {
      name: "Job contract and qualification evidence",
      description: "Prepare duties, wage, start date, employer contact, and qualification records.",
    },
  ]),
  "US K1 Fiance": withDocuments(usNonimmigrantBasics, [
    {
      name: "I-129F petition approval and case documents",
      description: "Know petitioner details, case number, and relationship timeline.",
    },
    {
      name: "Relationship and in-person meeting evidence",
      description: "Photos, travel records, chats, call logs, affidavits, and meeting proof.",
    },
    {
      name: "Civil, police, medical, and support documents",
      description: "Follow the embassy checklist for civil records, police certificates, medical exam, and financial support.",
    },
  ]),
  "US K3 Spouse": withDocuments(usNonimmigrantBasics, [
    {
      name: "Marriage and petition documents",
      description: "Prepare marriage certificate, petition notices, case details, and petitioner information.",
    },
    {
      name: "Relationship evidence",
      description: "Bring proof of bona fide marriage, visits, shared life, and communication.",
    },
    {
      name: "Civil, police, medical, and support documents",
      description: "Follow the embassy checklist for civil records, police certificates, medical exam, and financial support.",
    },
  ]),
  "US CR1/IR1 Spouse": withDocuments(usImmigrantBasics, [
    {
      name: "Marriage and petitioner evidence",
      description: "Marriage certificate, divorce records if any, petitioner status, and relationship timeline.",
    },
    {
      name: "Bona fide relationship evidence",
      description: "Shared finances, visits, photos, communication, household proof, children, or affidavits where relevant.",
    },
    {
      name: "Affidavit of Support evidence",
      description: "Prepare sponsor tax, income, domicile, joint sponsor, or household member evidence where required.",
    },
  ]),
  "US IR2/CR2 Child": withDocuments(usImmigrantBasics, [
    {
      name: "Parent-child relationship evidence",
      description: "Birth, adoption, legitimation, custody, name-change, or parent-marriage records where relevant.",
    },
    {
      name: "Petitioner and support evidence",
      description: "Prepare petitioner status, Affidavit of Support, and domicile or income evidence.",
    },
  ]),
  "US IR5 Parent": withDocuments(usImmigrantBasics, [
    {
      name: "Parent-child relationship evidence",
      description: "Birth, adoption, name-change, marriage, or civil documents proving the qualifying relationship.",
    },
    {
      name: "Petitioner and support evidence",
      description: "Prepare petitioner status, Affidavit of Support, and domicile or income evidence.",
    },
  ]),
  "US F2A/F2B Family Preference": withDocuments(usImmigrantBasics, [
    {
      name: "Qualifying relationship evidence",
      description: "Marriage, birth, custody, divorce, name-change, or marital-status records that fit the category.",
    },
    {
      name: "Petitioner and support evidence",
      description: "Prepare petitioner LPR status, Affidavit of Support, and priority-date/case details.",
    },
  ]),
  "US F3/F4 Family Preference": withDocuments(usImmigrantBasics, [
    {
      name: "Qualifying relationship evidence",
      description: "Marriage, birth, sibling, parent, name-change, and derivative-family records that fit the category.",
    },
    {
      name: "Petitioner and support evidence",
      description: "Prepare petitioner status, Affidavit of Support, and priority-date/case details.",
    },
  ]),
  "US V Family Nonimmigrant": withDocuments(usNonimmigrantBasics, [
    {
      name: "Qualifying petition and relationship evidence",
      description: "Prepare petition history, marriage or birth records, petitioner status, and case details.",
    },
    {
      name: "Civil and support documents",
      description: "Bring records requested by the post and evidence of support or family-unity context.",
    },
  ]),
  "US U/T Victim-Based Visa": withDocuments(usImmigrantBasics, [
    {
      name: "Application or approval context",
      description: "Know the U or T case status, certification or claim context, and family derivative details where relevant.",
    },
    {
      name: "Identity, civil, and admissibility documents",
      description: "Prepare records requested by the post and any waiver, police, or court documents that apply.",
    },
  ]),
  "US EB1/EB2/EB3 Employment Immigrant": withDocuments(usImmigrantBasics, [
    {
      name: "Immigrant petition and job evidence",
      description: "Prepare I-140 approval context, job offer or self-petition basis, employer details, and priority-date facts.",
    },
    {
      name: "Qualifications and work-history evidence",
      description: "Degrees, licenses, employment letters, labor certification facts, achievements, or NIW evidence where relevant.",
    },
  ]),
  "US EB5 Investor": withDocuments(usImmigrantBasics, [
    {
      name: "Investor petition and project evidence",
      description: "Know the investment project, regional center or direct investment facts, job-creation basis, and case status.",
    },
    {
      name: "Source and path of funds",
      description: "Prepare financial records explaining how funds were earned, transferred, invested, and documented.",
    },
  ]),
  "US Diversity Visa": withDocuments(usImmigrantBasics, [
    {
      name: "DV selection and DS-260 records",
      description: "Know the entrant, case number, derivative family members, and DS-260 answers.",
    },
    {
      name: "Education or qualifying work evidence",
      description: "Prepare diplomas, transcripts, certificates, or work records showing DV eligibility.",
    },
    {
      name: "Financial or support evidence",
      description: "Useful where the post asks about ability to settle without becoming a public charge.",
      isMandatory: false,
    },
  ]),
};

const practiceQuestions = [
  {
    slug: "us-f1-purpose-program-fit",
    visaType: "US F1 Student",
    displayOrder: 1,
    question: "What is the strongest answer to 'Why did you choose this program?'",
    options: [
      "Because studying in the United States is better than studying anywhere else.",
      "Because the program has specific courses and training that connect to my career plan at home.",
      "Because my friends said the university is good and the city is safe.",
      "Because any US degree will help me find work in America.",
    ],
    correctAnswer:
      "Because the program has specific courses and training that connect to my career plan at home.",
    explanation:
      "The strongest F1 answer connects specific academic features to a credible future plan outside the United States.",
  },
  {
    slug: "us-f1-funding-source",
    visaType: "US F1 Student",
    displayOrder: 2,
    question: "Which funding answer is most credible for an F1 interview?",
    options: [
      "My uncle will help whenever I need money.",
      "I will work part-time after I arrive and cover most costs.",
      "My parents are sponsoring me, and their bank statements and income records cover tuition and living costs.",
      "I have not calculated the full cost yet, but I know it will work out.",
    ],
    correctAnswer:
      "My parents are sponsoring me, and their bank statements and income records cover tuition and living costs.",
    explanation:
      "Officers expect a clear sponsor, documented source of funds, and enough money for tuition plus living expenses.",
  },
  {
    slug: "us-f1-home-ties",
    visaType: "US F1 Student",
    displayOrder: 3,
    question: "Which statement best shows home ties for a Kenyan F1 applicant?",
    options: [
      "I love Kenya and all my friends are there.",
      "My family, internship pathway, and planned return to my father's logistics business are in Kenya.",
      "I might return if I do not get a good job in the United States.",
      "I have no exact plan yet because I want to see what happens after graduation.",
    ],
    correctAnswer:
      "My family, internship pathway, and planned return to my father's logistics business are in Kenya.",
    explanation:
      "Strong home ties are concrete and verifiable. Family helps, but career, business, property, or obligations make the answer stronger.",
  },
  {
    slug: "us-f1-school-knowledge",
    visaType: "US F1 Student",
    displayOrder: 4,
    question: "What should you know before answering questions about your university?",
    options: [
      "Only the university ranking.",
      "The city weather and social life.",
      "The program name, start date, tuition, course structure, and why it fits your background.",
      "Only the name printed on the I-20.",
    ],
    correctAnswer:
      "The program name, start date, tuition, course structure, and why it fits your background.",
    explanation:
      "The officer may use school details to test whether you are a genuine student or simply using admission as a travel route.",
  },
  {
    slug: "us-f1-rejection-reapply",
    visaType: "US F1 Student",
    displayOrder: 5,
    question: "If your F1 visa was previously refused, what is the best approach?",
    options: [
      "Avoid mentioning the refusal unless the officer asks.",
      "Blame the previous officer and insist the decision was unfair.",
      "Acknowledge it briefly and explain what has changed in your evidence or answers.",
      "Apply again immediately with the same documents.",
    ],
    correctAnswer:
      "Acknowledge it briefly and explain what has changed in your evidence or answers.",
    explanation:
      "A calm, specific explanation of what changed is stronger than defensiveness or repeating the same weak case.",
  },
  {
    slug: "us-b1-b2-trip-purpose",
    visaType: "US B1/B2 Tourist",
    displayOrder: 1,
    question: "Which answer gives the clearest B1/B2 trip purpose?",
    options: [
      "I want to visit the US and maybe stay for a while.",
      "I will visit New York and Washington, DC for 12 days in August for tourism, then return to work.",
      "I am going because many people say America is nice.",
      "I have not decided the cities yet, but I will choose after the visa.",
    ],
    correctAnswer:
      "I will visit New York and Washington, DC for 12 days in August for tourism, then return to work.",
    explanation:
      "A strong visitor visa answer gives dates, places, purpose, and a clear return point.",
  },
  {
    slug: "us-b1-b2-length-of-stay",
    visaType: "US B1/B2 Tourist",
    displayOrder: 2,
    question: "Which phrase creates the most risk in a tourist visa interview?",
    options: [
      "I plan to stay for ten days.",
      "My leave approval ends on September 4.",
      "I will stay as long as the officer allows me.",
      "My return ticket reservation matches my work resumption date.",
    ],
    correctAnswer: "I will stay as long as the officer allows me.",
    explanation:
      "Open-ended stay language can signal weak temporary intent and possible overstay risk.",
  },
  {
    slug: "us-b1-b2-funding",
    visaType: "US B1/B2 Tourist",
    displayOrder: 3,
    question: "What should your funding answer prove?",
    options: [
      "That someone in the United States can pay if needed.",
      "That your budget is realistic and the money source is documented.",
      "That the trip will be cheap because you can reduce costs later.",
      "That you can borrow money after approval.",
    ],
    correctAnswer:
      "That your budget is realistic and the money source is documented.",
    explanation:
      "Visitor visa funding should match the itinerary, trip length, and your financial situation.",
  },
  {
    slug: "us-b1-b2-us-relative",
    visaType: "US B1/B2 Tourist",
    displayOrder: 4,
    question: "How should you answer if you have relatives in the United States?",
    options: [
      "Hide it unless the officer already knows.",
      "Mention them clearly and explain whether you will visit or stay with them.",
      "Say they are only distant relatives even if they are immediate family.",
      "Change the topic to your hotel bookings.",
    ],
    correctAnswer:
      "Mention them clearly and explain whether you will visit or stay with them.",
    explanation:
      "Honesty matters. Relatives are not automatically a refusal reason, but hiding them damages credibility.",
  },
  {
    slug: "us-b1-b2-return-ties",
    visaType: "US B1/B2 Tourist",
    displayOrder: 5,
    question: "Which return-tie answer is strongest?",
    options: [
      "I promise I will come back.",
      "I have a permanent job, approved annual leave, and a return date before a scheduled client project.",
      "I do not know yet because I may extend the trip.",
      "My friends are at home.",
    ],
    correctAnswer:
      "I have a permanent job, approved annual leave, and a return date before a scheduled client project.",
    explanation:
      "The best return-tie answers are specific, dated, and supported by real obligations.",
  },
  {
    slug: "uk-student-cas",
    visaType: "UK Student Visa",
    displayOrder: 1,
    question: "What should you know about your CAS before a UK student interview?",
    options: [
      "Only that the university issued it.",
      "Your CAS number, course, level, start date, tuition, and sponsor details.",
      "Only the name of the city.",
      "Nothing, because the officer already has the CAS.",
    ],
    correctAnswer:
      "Your CAS number, course, level, start date, tuition, and sponsor details.",
    explanation:
      "CAS knowledge helps show that you understand your own application and are a genuine student.",
  },
  {
    slug: "uk-student-course-choice",
    visaType: "UK Student Visa",
    displayOrder: 2,
    question: "Which answer best explains choosing a UK course?",
    options: [
      "The UK is popular and the visa route is attractive.",
      "The course has modules in my field and fits the career path I plan to return to.",
      "My agent selected the course for me.",
      "I mainly want to work after arriving.",
    ],
    correctAnswer:
      "The course has modules in my field and fits the career path I plan to return to.",
    explanation:
      "Genuine student intent is stronger when course details connect to your background and career plan.",
  },
  {
    slug: "uk-student-maintenance",
    visaType: "UK Student Visa",
    displayOrder: 3,
    question: "What does a strong UK maintenance funds answer include?",
    options: [
      "A rough statement that family can help.",
      "Tuition, living costs, source of funds, and documents showing the money is available.",
      "A plan to find work first.",
      "Only the amount in your local currency.",
    ],
    correctAnswer:
      "Tuition, living costs, source of funds, and documents showing the money is available.",
    explanation:
      "UK student interviews often test whether the financial evidence is understood and credible.",
  },
  {
    slug: "uk-student-work-focus",
    visaType: "UK Student Visa",
    displayOrder: 4,
    question: "Which statement can weaken genuine student credibility?",
    options: [
      "I chose this module because it supports my career plan.",
      "My main reason is to work as many hours as possible.",
      "My sponsor has provided bank evidence.",
      "I understand the course start date and tuition.",
    ],
    correctAnswer: "My main reason is to work as many hours as possible.",
    explanation:
      "Work-focused answers can make the application sound less like a genuine study plan.",
  },
  {
    slug: "uk-student-refusal",
    visaType: "UK Student Visa",
    displayOrder: 5,
    question: "If asked about a previous UK refusal, what should you do?",
    options: [
      "Say you do not remember the reason.",
      "Give a brief truthful answer and explain what evidence is different now.",
      "Argue that refusals do not matter.",
      "Avoid answering and repeat your course name.",
    ],
    correctAnswer:
      "Give a brief truthful answer and explain what evidence is different now.",
    explanation:
      "A previous refusal needs a calm explanation that shows the weak point has been addressed.",
  },
  {
    slug: "canada-express-entry-work-history",
    visaType: "Canada Express Entry",
    displayOrder: 1,
    question: "What is the safest way to discuss your work history?",
    options: [
      "Use the same dates, roles, and duties shown in your application and reference letters.",
      "Improve the job title verbally to sound more senior.",
      "Estimate dates if you cannot remember.",
      "Describe duties that fit a better NOC even if you did not perform them.",
    ],
    correctAnswer:
      "Use the same dates, roles, and duties shown in your application and reference letters.",
    explanation:
      "Express Entry interviews often test consistency between claimed points and supporting evidence.",
  },
  {
    slug: "canada-express-entry-proof-of-funds",
    visaType: "Canada Express Entry",
    displayOrder: 2,
    question: "What should proof-of-funds answers show?",
    options: [
      "That money appeared recently, even if the source is unclear.",
      "That the funds are available, documented, and legally sourced.",
      "That a friend can send money later.",
      "That settlement funds are optional after invitation.",
    ],
    correctAnswer:
      "That the funds are available, documented, and legally sourced.",
    explanation:
      "IRCC needs confidence that settlement funds are real, available, and not borrowed only for appearance.",
  },
  {
    slug: "canada-express-entry-noc",
    visaType: "Canada Express Entry",
    displayOrder: 3,
    question: "Why might an officer ask about daily job duties?",
    options: [
      "To see whether your experience matches the occupation claimed.",
      "To test your memory for unnecessary details only.",
      "To decide whether your employer is famous enough.",
      "To ask about salary negotiation.",
    ],
    correctAnswer:
      "To see whether your experience matches the occupation claimed.",
    explanation:
      "Job duties are central to whether your skilled work experience supports the points claimed.",
  },
  {
    slug: "canada-express-entry-settlement-plan",
    visaType: "Canada Express Entry",
    displayOrder: 4,
    question: "Which settlement-plan answer is strongest?",
    options: [
      "I will decide everything after landing.",
      "I researched roles in Ontario, have settlement funds, and plan short-term housing near likely job markets.",
      "I will rely completely on people I meet after arrival.",
      "I am not sure which province I will choose.",
    ],
    correctAnswer:
      "I researched roles in Ontario, have settlement funds, and plan short-term housing near likely job markets.",
    explanation:
      "A practical settlement plan shows preparation, employability, and realistic use of funds.",
  },
  {
    slug: "canada-express-entry-discrepancy",
    visaType: "Canada Express Entry",
    displayOrder: 5,
    question: "What should you do if the officer asks about a document discrepancy?",
    options: [
      "Guess an explanation quickly.",
      "Acknowledge the difference and explain it with dates or supporting records.",
      "Say documents are not important if your score is high.",
      "Blame the employer without any evidence.",
    ],
    correctAnswer:
      "Acknowledge the difference and explain it with dates or supporting records.",
    explanation:
      "Credibility improves when you address inconsistencies directly and support your explanation.",
  },
  {
    slug: "schengen-main-destination",
    visaType: "Schengen Tourist",
    displayOrder: 1,
    question: "How should you explain your main Schengen destination?",
    options: [
      "Name the country where you spend the most days and match it to your bookings.",
      "Choose any country because all Schengen visas are the same.",
      "Say you will decide after the visa is issued.",
      "Name the country with the easiest appointment only.",
    ],
    correctAnswer:
      "Name the country where you spend the most days and match it to your bookings.",
    explanation:
      "The consulate expects your application country to match the main destination rule.",
  },
  {
    slug: "schengen-itinerary",
    visaType: "Schengen Tourist",
    displayOrder: 2,
    question: "Which itinerary answer sounds most credible?",
    options: [
      "I may travel around Europe for a few months.",
      "I will spend four nights in Paris and three nights in Rome, with hotel bookings and return travel.",
      "I do not want to book anything until I get the visa.",
      "I will stay wherever is cheapest.",
    ],
    correctAnswer:
      "I will spend four nights in Paris and three nights in Rome, with hotel bookings and return travel.",
    explanation:
      "Schengen officers look for a coherent route, dates, accommodation, and return plan.",
  },
  {
    slug: "schengen-insurance",
    visaType: "Schengen Tourist",
    displayOrder: 3,
    question: "Why is travel insurance discussed in a Schengen interview?",
    options: [
      "It proves you are wealthy.",
      "It is one requirement and should cover the travel dates and Schengen area.",
      "It replaces the need for bank statements.",
      "It allows you to stay longer.",
    ],
    correctAnswer:
      "It is one requirement and should cover the travel dates and Schengen area.",
    explanation:
      "Valid travel medical insurance is part of a credible and compliant Schengen application.",
  },
  {
    slug: "schengen-return-proof",
    visaType: "Schengen Tourist",
    displayOrder: 4,
    question: "Which answer best proves return intent?",
    options: [
      "I have a job, approved leave, and I return before a scheduled work obligation.",
      "I will return because Europe is expensive.",
      "I promise not to overstay.",
      "My return depends on whether I enjoy the trip.",
    ],
    correctAnswer:
      "I have a job, approved leave, and I return before a scheduled work obligation.",
    explanation:
      "Return proof is strongest when tied to verifiable work, school, family, or business obligations.",
  },
  {
    slug: "schengen-host-details",
    visaType: "Schengen Tourist",
    displayOrder: 5,
    question: "If visiting a host, what should you know?",
    options: [
      "Only their first name.",
      "Their full name, address, relationship to you, status, and how the visit is funded.",
      "Nothing, because the invitation letter is enough.",
      "Only their social media profile.",
    ],
    correctAnswer:
      "Their full name, address, relationship to you, status, and how the visit is funded.",
    explanation:
      "Host details help the officer verify that the invitation and purpose of visit are genuine.",
  },
  {
    slug: "australia-student-course-relevance",
    visaType: "Australia Student Visa (Subclass 500)",
    displayOrder: 1,
    question: "Which answer best supports genuine student intent for Australia?",
    options: [
      "The course is easy and gives me a chance to work.",
      "The course builds on my background and gives skills I need for my career plan.",
      "I chose it because my agent recommended it.",
      "Any course in Australia is fine for me.",
    ],
    correctAnswer:
      "The course builds on my background and gives skills I need for my career plan.",
    explanation:
      "Australia student credibility improves when the course choice is connected to your education, work, and future plan.",
  },
  {
    slug: "australia-student-funds",
    visaType: "Australia Student Visa (Subclass 500)",
    displayOrder: 2,
    question: "What should your financial answer include?",
    options: [
      "Tuition, living costs, source of funds, and documents proving access to the money.",
      "Only the first tuition payment.",
      "A plan to work enough hours after arrival.",
      "A general statement that your family is comfortable.",
    ],
    correctAnswer:
      "Tuition, living costs, source of funds, and documents proving access to the money.",
    explanation:
      "The officer wants confidence that you can study without breaching visa work limits.",
  },
  {
    slug: "australia-student-visa-conditions",
    visaType: "Australia Student Visa (Subclass 500)",
    displayOrder: 3,
    question: "Why might an officer ask about visa conditions?",
    options: [
      "To confirm you understand study load, work limits, and compliance responsibilities.",
      "To see whether you know tourist attractions.",
      "To replace financial questions.",
      "To check if you can negotiate conditions.",
    ],
    correctAnswer:
      "To confirm you understand study load, work limits, and compliance responsibilities.",
    explanation:
      "Knowing visa conditions supports genuine intent and reduces compliance concerns.",
  },
  {
    slug: "australia-student-study-gap",
    visaType: "Australia Student Visa (Subclass 500)",
    displayOrder: 4,
    question: "How should you explain a study gap?",
    options: [
      "Ignore it unless asked twice.",
      "Give honest dates, explain what you did, and connect the current course to your next step.",
      "Say the gap does not matter.",
      "Invent a job if the gap looks long.",
    ],
    correctAnswer:
      "Give honest dates, explain what you did, and connect the current course to your next step.",
    explanation:
      "A clear explanation of gaps protects credibility and shows the course choice is intentional.",
  },
  {
    slug: "australia-student-after-study",
    visaType: "Australia Student Visa (Subclass 500)",
    displayOrder: 5,
    question: "Which post-study answer is safest?",
    options: [
      "I will stay permanently no matter what.",
      "I will follow lawful options, but my main plan is to use the qualification in my career path.",
      "I have no plan after the course.",
      "I will work full-time immediately even if the visa does not allow it.",
    ],
    correctAnswer:
      "I will follow lawful options, but my main plan is to use the qualification in my career path.",
    explanation:
      "The answer should respect visa conditions and show a realistic purpose for the education.",
  },
] as const;

async function main() {
  const categoryBySlug = new Map<string, { id: string }>();

  for (const category of categories) {
    const saved = await prisma.visaCategory.upsert({
      where: { slug: category.slug },
      update: { label: category.label },
      create: category,
      select: { id: true },
    });
    categoryBySlug.set(category.slug, saved);
  }

  for (const [slug, fields] of Object.entries(fieldsByCategory)) {
    const category = categoryBySlug.get(slug);
    if (!category) continue;
    const fieldKeys = fields.map((field) => field.key);

    await prisma.onboardingField.deleteMany({
      where: {
        visaCategoryId: category.id,
        key: { notIn: [...fieldKeys] },
      },
    });

    for (const [index, field] of fields.entries()) {
      await prisma.onboardingField.upsert({
        where: {
          visaCategoryId_key: {
            visaCategoryId: category.id,
            key: field.key,
          },
        },
        update: {
          label: field.label,
          placeholder: field.placeholder,
          inputType: field.inputType,
          required: field.required,
          displayOrder: index + 1,
        },
        create: {
          visaCategoryId: category.id,
          key: field.key,
          label: field.label,
          placeholder: field.placeholder,
          inputType: field.inputType,
          required: field.required,
          displayOrder: index + 1,
        },
      });
    }
  }

  for (const country of destinationCountries) {
    await prisma.country.upsert({
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
    });
  }

  await prisma.country.createMany({
    data: allCountries.map((country) => ({
      name: country.name,
      isoCode: country.code,
      isOrigin: true,
      isActive: true,
    })),
    skipDuplicates: true,
  });
  await prisma.country.updateMany({
    where: { isoCode: { in: allCountries.map((country) => country.code) } },
    data: { isOrigin: true, isActive: true },
  });

  for (const country of originCountries) {
    await prisma.country.upsert({
      where: { isoCode: country.isoCode },
      update: {
        name: country.name,
        flagEmoji: country.flagEmoji,
        originProfile: country.originProfile,
        isOrigin: true,
        isActive: true,
      },
      create: {
        ...country,
        isOrigin: true,
        isActive: true,
      },
    });
  }

  const countries = await prisma.country.findMany({
    select: { id: true, isoCode: true },
  });
  const countryByIsoCode = new Map(
    countries.map((country) => [country.isoCode, country]),
  );

  for (const visaType of visaTypes) {
    const destinationCountry = countryByIsoCode.get(visaType.destinationIsoCode);
    const category = categoryBySlug.get(visaType.categorySlug);
    if (!destinationCountry || !category) continue;

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

    const concernOptions = concernOptionsByVisaName[savedVisaType.name] ?? [
      "Prior refusal",
      "Weak documentation",
      "Unclear intent",
      "None",
    ];

    await prisma.concernOption.deleteMany({
      where: {
        visaTypeId: savedVisaType.id,
        label: { notIn: concernOptions },
      },
    });

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
    }

    const requiredDocuments = requiredDocumentsByVisaName[savedVisaType.name] ?? [];
    if (requiredDocuments.length > 0) {
      await prisma.requiredDocument.deleteMany({
        where: { visaTypeId: savedVisaType.id },
      });

      await prisma.requiredDocument.createMany({
        data: requiredDocuments.map((document, index) => ({
          visaTypeId: savedVisaType.id,
          name: document.name,
          description: document.description,
          isMandatory: document.isMandatory ?? true,
          displayOrder: index + 1,
        })),
      });
    }
  }

  const australia = countryByIsoCode.get("AU");
  if (australia) {
    await prisma.visaType.updateMany({
      where: {
        destinationCountryId: australia.id,
        name: "Australia Student",
      },
      data: { isActive: false },
    });
  }

  for (const question of practiceQuestions) {
    await prisma.practiceQuestion.upsert({
      where: { slug: question.slug },
      update: {
        visaType: question.visaType,
        type: "mcq",
        question: question.question,
        options: [...question.options],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        isActive: true,
        displayOrder: question.displayOrder,
      },
      create: {
        slug: question.slug,
        visaType: question.visaType,
        type: "mcq",
        question: question.question,
        options: [...question.options],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        isActive: true,
        displayOrder: question.displayOrder,
      },
    });
  }

  await seedJobreadyReferenceFixtures(prisma);
  await seedKenyanLaunchCatalog(prisma);
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
