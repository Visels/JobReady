export type VisaKey = "f1" | "h1b" | "b1b2" | "o1";

export type VisaResource = {
  key: VisaKey;
  label: string;
  shortLabel: string;
  tagline: string;
  purpose: string;
  eligibility: string;
  duration: string;
  officerFocus: string[];
  interviewTechniques: Array<{
    title: string;
    body: string;
  }>;
  commonQuestions: Array<{
    category: string;
    question: string;
    strong: string;
    weak: string;
  }>;
  phrases: {
    use: string[];
    avoid: string[];
  };
  mockInterview: {
    setting: string;
    pace: string;
    expectations: string[];
  };
  mistakes: Array<{
    issue: string;
    fix: string;
  }>;
  documents: Array<{
    name: string;
    note: string;
    required: boolean;
  }>;
  ds160Help: Array<{
    title: string;
    body: string;
  }>;
  timeline: Array<{
    phase: string;
    timing: string;
    tasks: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const VISA_KEYS: VisaKey[] = ["f1", "h1b", "b1b2", "o1"];

export const VISA_RESOURCES: Record<VisaKey, VisaResource> = {
  f1: {
    key: "f1",
    label: "F1 Student",
    shortLabel: "F1",
    tagline: "Academic intent, funding clarity, and return plan.",
    purpose:
      "For academic study at a SEVP-approved U.S. school, including college, university, high school, seminary, conservatory, or language training.",
    eligibility:
      "You need admission to an eligible school, a signed Form I-20, SEVIS registration, credible funding, and answers that show genuine study intent.",
    duration:
      "Generally tied to duration of status while maintaining F1 status, plus the applicable grace period after program completion.",
    officerFocus: [
      "Why this school and program fit your academic path.",
      "How tuition, living costs, and travel will be paid.",
      "Why your plan after study is credible outside the United States.",
    ],
    interviewTechniques: [
      {
        title: "Lead with the academic reason",
        body: "Name the program first, then add one course, faculty area, lab, or curriculum feature that connects to your past study and future work.",
      },
      {
        title: "Handle funding questions with numbers",
        body: "State who pays, the amount available, what documents prove it, and how the amount covers tuition plus living costs.",
      },
      {
        title: "Keep body language steady",
        body: "Stand upright, keep hands quiet, and answer in a measured tone. Officers often hear confidence as factual control, not volume.",
      },
    ],
    commonQuestions: [
      {
        category: "Study purpose",
        question: "Why did you choose this university?",
        strong:
          "I chose the MS in Data Analytics because the applied capstone and health-data courses match my statistics degree and my plan to work in hospital analytics after graduation.",
        weak:
          "It is a good school and I have always wanted to study in America.",
      },
      {
        category: "Funding",
        question: "Who is paying for your studies?",
        strong:
          "My father and I are funding it. We have bank statements showing USD 42,000 available, and my I-20 estimates the first year at USD 38,600.",
        weak: "My family will support me, so money will not be a problem.",
      },
      {
        category: "Return intent",
        question: "What will you do after graduation?",
        strong:
          "I will return to Nairobi and apply for analyst roles in private hospitals, where my current employer has already discussed a data-quality role after I complete the degree.",
        weak: "I will see what opportunities come up after I graduate.",
      },
    ],
    phrases: {
      use: [
        "The program fits my prior coursework because...",
        "My I-20 lists the estimated cost, and my funding evidence shows...",
        "After the degree, my plan is to return and...",
      ],
      avoid: [
        "I want to settle there.",
        "I do not know the exact cost.",
        "Any school in the U.S. would be fine.",
      ],
    },
    mockInterview: {
      setting:
        "Most F1 interviews are brief. Expect the officer to move quickly from school choice to funding, academic history, and plans after study.",
      pace:
        "Prepare answers that can stand alone in 20 to 40 seconds before the officer asks a follow-up.",
      expectations: [
        "Know your I-20 details without searching for them.",
        "Explain the funding source without sounding coached.",
        "Connect your return plan to real work, family, or professional ties.",
      ],
    },
    mistakes: [
      {
        issue: "Generic school choice",
        fix: "Prepare two program-specific reasons and one career link.",
      },
      {
        issue: "Unclear sponsor credibility",
        fix: "Know the sponsor's job, income source, savings amount, and relationship to you.",
      },
      {
        issue: "Sounding focused on U.S. life instead of study",
        fix: "Keep lifestyle comments short and bring the answer back to academics.",
      },
    ],
    documents: [
      {
        name: "Valid passport",
        note: "Check validity requirements for your country before the interview.",
        required: true,
      },
      {
        name: "DS-160 confirmation page",
        note: "Bring the barcode confirmation page, not the full application.",
        required: true,
      },
      {
        name: "Form I-20",
        note: "Signed by you and the school official, with your SEVIS ID and program details.",
        required: true,
      },
      {
        name: "SEVIS fee receipt",
        note: "Keep the payment record with your student visa packet.",
        required: true,
      },
      {
        name: "Admission letter and academic records",
        note: "Use transcripts, certificates, test scores, and offer letters to prove preparation.",
        required: true,
      },
      {
        name: "Financial evidence",
        note: "Bank statements, sponsor letter, scholarship letter, income records, or loan approval.",
        required: true,
      },
      {
        name: "Home-tie evidence",
        note: "Employment prospects, family obligations, property, business, or professional commitments.",
        required: false,
      },
    ],
    ds160Help: [
      {
        title: "Use I-20 details exactly",
        body: "Enter the SEVIS ID, school name, school address, and program details from the Form I-20.",
      },
      {
        title: "Keep funding consistent",
        body: "Sponsor, income, and cost answers should match your I-20 and financial documents.",
      },
      {
        title: "Save the application ID",
        body: "You need the DS-160 application ID and security answer to return to the form later.",
      },
    ],
    timeline: [
      {
        phase: "After admission",
        timing: "Start once the school issues your I-20.",
        tasks: "Pay SEVIS, complete DS-160, review school and funding facts.",
      },
      {
        phase: "Appointment planning",
        timing: "Student visas for new students can be issued up to 365 days before the program start date.",
        tasks: "Schedule early and monitor local appointment availability.",
      },
      {
        phase: "Before travel",
        timing: "New students generally cannot enter more than 30 days before the program start date.",
        tasks: "Carry passport, visa, I-20, SEVIS receipt, and school contact details.",
      },
      {
        phase: "After interview",
        timing: "Passport return timing depends on the post and any administrative processing.",
        tasks: "Follow embassy courier instructions and do not make final travel plans until the visa is issued.",
      },
    ],
    faqs: [
      {
        question: "Do I need to memorize answers?",
        answer:
          "No. Memorized answers often sound rigid. Know your facts and practice answering naturally in short, complete responses.",
      },
      {
        question: "Can I mention OPT?",
        answer:
          "Yes, if asked, but frame it as authorized training related to your field, not as the main reason for choosing the program.",
      },
      {
        question: "What if my parents are funding me?",
        answer:
          "Explain their relationship to you, occupation or business, available funds, and why the support is credible.",
      },
    ],
  },
  h1b: {
    key: "h1b",
    label: "H1B Work",
    shortLabel: "H1B",
    tagline: "Specialty occupation, employer facts, and petition consistency.",
    purpose:
      "For temporary employment in a specialty occupation that normally requires specialized knowledge and a relevant degree or equivalent.",
    eligibility:
      "You need a U.S. employer petition, role requirements that fit H-1B classification, qualifying credentials, and petition details that match your interview answers.",
    duration:
      "Generally up to 3 years initially, commonly extendable up to 6 years, with some exceptions under U.S. immigration rules.",
    officerFocus: [
      "Whether the employer, job duties, salary, and location match the approved petition.",
      "Whether your education and work history fit the specialty occupation.",
      "Whether you understand the employer relationship and work authorization limits.",
    ],
    interviewTechniques: [
      {
        title: "Describe the job like a professional",
        body: "Use the job title, employer name, worksite, reporting line, and two specialized duties. Avoid sounding like the role is informal or undefined.",
      },
      {
        title: "Answer employer-control questions calmly",
        body: "If asked about a client site or remote work, explain who supervises you, who pays you, and where the work is performed.",
      },
      {
        title: "Keep tone precise, not defensive",
        body: "Work visas can involve document checks. Pause, answer exactly, and let the petition facts do the work.",
      },
    ],
    commonQuestions: [
      {
        category: "Role fit",
        question: "What will you do for your employer?",
        strong:
          "I will work as a backend software engineer for Northline Health, building patient data APIs in Java and PostgreSQL at the Chicago office listed in the petition.",
        weak: "I will do IT work for the company and help wherever needed.",
      },
      {
        category: "Credentials",
        question: "Why are you qualified for this position?",
        strong:
          "The role requires distributed systems experience. I have a computer science degree and four years building payment APIs, which matches the main duties in the offer letter.",
        weak: "I am hardworking and my employer liked my interview.",
      },
      {
        category: "Petition details",
        question: "What salary will you earn?",
        strong:
          "My approved offer lists USD 118,400 per year, paid by Northline Health, with the Chicago worksite listed on the LCA.",
        weak: "I am not sure because HR handled that part.",
      },
    ],
    phrases: {
      use: [
        "The approved petition lists...",
        "My specialty duties are...",
        "My degree and experience match the role because...",
      ],
      avoid: [
        "I will work for whoever needs me.",
        "The salary is somewhere in the offer.",
        "The company will decide after I arrive.",
      ],
    },
    mockInterview: {
      setting:
        "H1B interviews often feel document-led. The officer may verify the petition receipt, employer, worksite, salary, education, and prior immigration history.",
      pace:
        "Expect direct checks. Keep answers factual and aligned with the I-797, LCA, offer letter, and employer support letter.",
      expectations: [
        "Know the petitioner and end-client relationship if applicable.",
        "Know the salary, worksite, job title, and start date.",
        "Explain how your degree or experience fits the role.",
      ],
    },
    mistakes: [
      {
        issue: "Not knowing petition facts",
        fix: "Review the I-797, offer letter, LCA details, and employer support letter before the interview.",
      },
      {
        issue: "Describing duties too broadly",
        fix: "Prepare two technical or specialized duties that match the petition.",
      },
      {
        issue: "Confusing employer and client",
        fix: "Know who petitions for you, who supervises you, who pays you, and where you work.",
      },
    ],
    documents: [
      {
        name: "Valid passport",
        note: "Confirm validity requirements before the appointment.",
        required: true,
      },
      {
        name: "DS-160 confirmation page",
        note: "Use the same passport and petition details across the application and interview.",
        required: true,
      },
      {
        name: "I-797 approval notice or petition receipt",
        note: "Bring the notice connected to the H-1B petition.",
        required: true,
      },
      {
        name: "Offer letter and employer support letter",
        note: "Should describe title, duties, salary, worksite, and start date.",
        required: true,
      },
      {
        name: "LCA details",
        note: "Know the wage, location, and occupational classification listed for the role.",
        required: true,
      },
      {
        name: "Education and experience evidence",
        note: "Degree certificates, transcripts, evaluations, licenses, and employment letters if relevant.",
        required: true,
      },
      {
        name: "Resume and prior work records",
        note: "Useful for explaining specialty experience and consistency.",
        required: false,
      },
    ],
    ds160Help: [
      {
        title: "Use the petition receipt accurately",
        body: "Petition-based workers should have I-129 or I-797 details available while completing the DS-160.",
      },
      {
        title: "Match employer details",
        body: "Employer name, address, job title, and contact details should align with the petition and offer letter.",
      },
      {
        title: "Review prior employment and travel",
        body: "Dates should match your resume, prior visa records, and passport stamps.",
      },
    ],
    timeline: [
      {
        phase: "After petition approval",
        timing: "Begin DS-160 and interview scheduling when your employer provides petition details.",
        tasks: "Review I-797, LCA, offer letter, job duties, salary, and worksite.",
      },
      {
        phase: "Appointment planning",
        timing: "Consular availability varies by location and season.",
        tasks: "Use local embassy instructions and the global wait time tool for planning.",
      },
      {
        phase: "Interview window",
        timing: "Bring petition and employer evidence to the appointment.",
        tasks: "Expect questions on job duties, employer relationship, salary, and qualifications.",
      },
      {
        phase: "After interview",
        timing: "Administrative processing timing varies when requested.",
        tasks: "Wait for passport return instructions before finalizing travel.",
      },
    ],
    faqs: [
      {
        question: "Do H1B applicants need to prove home ties?",
        answer:
          "The main interview focus is usually the petition, employer, job, and qualifications. Be ready to explain your plans truthfully if asked.",
      },
      {
        question: "What if I will work at a client site?",
        answer:
          "Know the petitioner, client, worksite, supervision structure, and how the role matches the petition.",
      },
      {
        question: "Can I change employers after visa issuance?",
        answer:
          "A new employer generally needs to file the appropriate petition before you work for them. Get qualified advice for your exact situation.",
      },
    ],
  },
  b1b2: {
    key: "b1b2",
    label: "B1/B2 Tourist",
    shortLabel: "B1/B2",
    tagline: "Temporary purpose, realistic budget, and return commitments.",
    purpose:
      "For temporary visits to the United States for tourism, family visits, medical treatment, or permitted short business activities.",
    eligibility:
      "You need a clear temporary purpose, funds that match the trip, truthful answers, and credible reasons to leave on time.",
    duration:
      "The visa validity can vary by nationality. The authorized stay is decided at entry and shown on the I-94.",
    officerFocus: [
      "Whether the trip purpose and length are realistic.",
      "Whether your funds support the trip without unauthorized work.",
      "Whether your work, family, school, business, or property ties support return.",
    ],
    interviewTechniques: [
      {
        title: "Give a complete trip in one sentence",
        body: "State the purpose, dates, city or cities, who travels, and who pays before adding detail.",
      },
      {
        title: "Answer tough tie questions with evidence",
        body: "Name the exact obligation that brings you home: job reporting date, school term, family duty, business contract, or property commitment.",
      },
      {
        title: "Sound temporary in your tone",
        body: "Avoid open-ended language. Short, bounded answers fit the nature of a visitor visa.",
      },
    ],
    commonQuestions: [
      {
        category: "Purpose",
        question: "Why are you traveling to the United States?",
        strong:
          "I am visiting my sister in Dallas for 12 days in August, then spending three days in Austin before returning to work on August 21.",
        weak: "I want to visit America and maybe stay with family for a while.",
      },
      {
        category: "Funding",
        question: "Who will pay for your trip?",
        strong:
          "I will pay from my savings. I budgeted USD 3,200 for flights, lodging, insurance, and daily expenses, and my bank statements show the funds.",
        weak: "My relatives can help if I need money.",
      },
      {
        category: "Return ties",
        question: "What will make you return home?",
        strong:
          "I manage payroll at Meridian Foods and my approved leave ends September 2. I also support my mother, who lives with me.",
        weak: "I love my country, so I will come back.",
      },
    ],
    phrases: {
      use: [
        "My visit is from...to...",
        "My approved leave ends on...",
        "The trip budget is..., and I will pay from...",
      ],
      avoid: [
        "I will stay as long as they allow.",
        "I may look for work while there.",
        "I do not have fixed dates yet.",
      ],
    },
    mockInterview: {
      setting:
        "B1/B2 interviews are often very short. The officer tests whether the visit is specific, temporary, affordable, and consistent with your life at home.",
      pace:
        "Prepare concise answers. If you over-explain a simple trip, the visit can sound less clear.",
      expectations: [
        "Know dates, cities, accommodation, and return date.",
        "Explain funding without relying on vague promises.",
        "Disclose U.S. relatives and prior refusals honestly.",
      ],
    },
    mistakes: [
      {
        issue: "Loose itinerary",
        fix: "Prepare dates, cities, accommodation, and a practical budget.",
      },
      {
        issue: "Trip length does not fit your life",
        fix: "Align the visit with leave approval, school breaks, business schedule, or family duties.",
      },
      {
        issue: "Undocumented sponsor story",
        fix: "Explain who pays and bring documents showing the funds are real.",
      },
    ],
    documents: [
      {
        name: "Valid passport",
        note: "Confirm passport validity and prior visa history before applying.",
        required: true,
      },
      {
        name: "DS-160 confirmation page",
        note: "Your answers should match the trip you explain at the interview.",
        required: true,
      },
      {
        name: "Appointment confirmation and fee receipt",
        note: "Follow local embassy instructions for fee and appointment proof.",
        required: true,
      },
      {
        name: "Travel itinerary",
        note: "Dates, cities, accommodation, and planned activities.",
        required: true,
      },
      {
        name: "Financial evidence",
        note: "Bank statements, income records, business records, or sponsor evidence if applicable.",
        required: true,
      },
      {
        name: "Employment, school, or business proof",
        note: "Leave letter, enrollment letter, business registration, contracts, or tax records.",
        required: false,
      },
      {
        name: "Invitation or host evidence",
        note: "Useful when visiting family, friends, or attending a business event.",
        required: false,
      },
    ],
    ds160Help: [
      {
        title: "Make the travel purpose specific",
        body: "Use dates, purpose, destination, and host information that you can explain at the interview.",
      },
      {
        title: "Disclose U.S. contacts accurately",
        body: "Do not hide relatives, hosts, or prior travel. Inconsistency creates avoidable risk.",
      },
      {
        title: "Avoid unsupported work language",
        body: "Visitor applications should not sound like employment plans or open-ended relocation.",
      },
    ],
    timeline: [
      {
        phase: "Trip planning",
        timing: "Start before making non-refundable travel commitments.",
        tasks: "Set dates, budget, accommodation, and return obligations.",
      },
      {
        phase: "DS-160 and appointment",
        timing: "Appointment wait times vary by consulate and season.",
        tasks: "Submit DS-160, pay the fee if required locally, and book the interview.",
      },
      {
        phase: "Interview",
        timing: "Plan for a brief conversation.",
        tasks: "Answer purpose, funding, itinerary, relatives, and return ties directly.",
      },
      {
        phase: "After interview",
        timing: "Passport return and any administrative processing vary by post.",
        tasks: "Follow courier instructions and check your I-94 after arrival if approved.",
      },
    ],
    faqs: [
      {
        question: "Do I need booked flights before the interview?",
        answer:
          "You should know your intended dates, but official guidance commonly warns against final travel plans before the visa is issued.",
      },
      {
        question: "Can I visit family on B1/B2?",
        answer:
          "Yes, family visits can fit B2 travel. Be clear about who you are visiting, where they live, and how long you will stay.",
      },
      {
        question: "What if I have a prior refusal?",
        answer:
          "Answer truthfully and explain what is stronger or clearer in the current application.",
      },
    ],
  },
  o1: {
    key: "o1",
    label: "O1 Extraordinary Ability",
    shortLabel: "O1",
    tagline: "Extraordinary record, specific work, and petition evidence.",
    purpose:
      "For people with extraordinary ability or achievement coming temporarily to continue work in their area of expertise.",
    eligibility:
      "You need an approved petition and evidence of sustained acclaim or extraordinary achievement in the qualifying field.",
    duration:
      "Initially up to 3 years, with extensions tied to the time needed for the event or activity.",
    officerFocus: [
      "Whether your achievements match the O-1 classification.",
      "Whether the U.S. work is specific, credible, and in your field.",
      "Whether the petitioner, agent, itinerary, and evidence are consistent.",
    ],
    interviewTechniques: [
      {
        title: "Explain acclaim without sounding inflated",
        body: "Use concrete evidence: awards, publications, press, judging, original contributions, high salary, leading roles, or critical reviews.",
      },
      {
        title: "Connect achievements to the U.S. work",
        body: "After naming an achievement, explain how it qualifies you for the specific project, company, production, event, or engagement.",
      },
      {
        title: "Use controlled confidence",
        body: "Extraordinary ability interviews reward evidence-based confidence. Avoid vague prestige language without proof.",
      },
    ],
    commonQuestions: [
      {
        category: "Evidence",
        question: "What makes you qualified for an O1 visa?",
        strong:
          "My petition documents three international design awards, eight juried exhibitions, and press in Design Week. The U.S. project uses the same exhibition design work.",
        weak: "I am very talented and many people know my work.",
      },
      {
        category: "U.S. activity",
        question: "What will you do in the United States?",
        strong:
          "I will lead the visual system for the four-city museum installation listed in the itinerary, working through the petitioning agent from July to November.",
        weak: "I will explore creative opportunities and meet companies.",
      },
      {
        category: "Petitioner",
        question: "Who filed the petition for you?",
        strong:
          "Cedar Hall Artists filed as my U.S. agent. The contract and itinerary list each engagement, venue, and payment schedule.",
        weak: "My manager arranged it, but I do not know the details.",
      },
    ],
    phrases: {
      use: [
        "The petition evidence includes...",
        "This U.S. project is in the same field because...",
        "My itinerary lists...",
      ],
      avoid: [
        "I am famous in my country.",
        "I will find projects after I arrive.",
        "The agent knows the details, not me.",
      ],
    },
    mockInterview: {
      setting:
        "O1 interviews usually verify the petition, field, achievements, petitioner or agent, itinerary, and whether the work matches the claimed ability.",
      pace:
        "You may need to summarize a complex career quickly. Build short evidence statements instead of long biographies.",
      expectations: [
        "Know the petitioner's role and your U.S. work schedule.",
        "Explain your strongest evidence in plain language.",
        "Connect awards, press, judging, or leadership to the requested work.",
      ],
    },
    mistakes: [
      {
        issue: "Achievement claims sound vague",
        fix: "Attach each claim to a specific document, award, publication, role, or review.",
      },
      {
        issue: "U.S. plans are too open-ended",
        fix: "Know the itinerary, contracts, dates, venues, clients, and deliverables.",
      },
      {
        issue: "Petitioner details are unclear",
        fix: "Review whether the filer is an employer, agent, or sponsor and how they connect to the work.",
      },
    ],
    documents: [
      {
        name: "Valid passport",
        note: "Check validity requirements before the appointment.",
        required: true,
      },
      {
        name: "DS-160 confirmation page",
        note: "Use the same petition and travel facts you will explain to the officer.",
        required: true,
      },
      {
        name: "I-797 approval notice or petition receipt",
        note: "Bring the notice connected to the O-1 petition.",
        required: true,
      },
      {
        name: "Petition support letter",
        note: "Summarizes classification, achievements, and U.S. activity.",
        required: true,
      },
      {
        name: "Contracts and itinerary",
        note: "Dates, events, venues, clients, deliverables, or worksite details.",
        required: true,
      },
      {
        name: "Evidence of acclaim",
        note: "Awards, press, publications, judging, leading roles, memberships, high compensation, or original contributions.",
        required: true,
      },
      {
        name: "Advisory opinion or consultation evidence",
        note: "If applicable, keep a copy of the consultation included in the petition.",
        required: false,
      },
    ],
    ds160Help: [
      {
        title: "Use petition details consistently",
        body: "Petitioner, agent, U.S. contact, work address, and travel purpose should match the petition packet.",
      },
      {
        title: "Prepare achievement summaries",
        body: "DS-160 work and education history should not conflict with the career record used in the petition.",
      },
      {
        title: "Keep itinerary facts ready",
        body: "Know the dates and locations of the events, productions, projects, or engagements.",
      },
    ],
    timeline: [
      {
        phase: "After petition approval",
        timing: "Begin visa scheduling after the O-1 petition is ready for consular processing.",
        tasks: "Review I-797, support letter, itinerary, contracts, and top evidence.",
      },
      {
        phase: "Appointment planning",
        timing: "Consular availability and passport return timing vary by location.",
        tasks: "Use the local embassy site and wait time tool for planning.",
      },
      {
        phase: "Interview",
        timing: "Expect verification of the field, petitioner, itinerary, and achievements.",
        tasks: "Give evidence-backed answers and avoid broad fame claims.",
      },
      {
        phase: "After interview",
        timing: "Administrative processing can extend the timeline.",
        tasks: "Follow embassy instructions and wait for passport return before travel.",
      },
    ],
    faqs: [
      {
        question: "Do I need to bring the whole petition?",
        answer:
          "Bring the approval notice and a focused packet with the support letter, itinerary, contracts, and strongest evidence. Follow local embassy instructions.",
      },
      {
        question: "How do I explain extraordinary ability briefly?",
        answer:
          "Use a three-part answer: field, strongest evidence, and why the U.S. work requires that expertise.",
      },
      {
        question: "What if I have multiple U.S. engagements?",
        answer:
          "Know the itinerary, agent or petitioner role, locations, dates, and payment structure for each engagement.",
      },
    ],
  },
};

export const REGION_TIPS = [
  {
    region: "Africa",
    note: "High-volume posts may move fast and rely on concise verbal answers.",
    tips: [
      "Carry clear funding and employment documents, but prepare to explain them without handing over every page.",
      "For student and visitor cases, make return ties concrete: employment leave, business duties, family care, or property obligations.",
      "Check local payment and courier rules before the appointment because procedures differ by post.",
    ],
  },
  {
    region: "South Asia",
    note: "Large applicant pools mean consistency across DS-160, petition, school, and work documents matters heavily.",
    tips: [
      "For F1, know why this program is different from local and regional alternatives.",
      "For H1B and O1, prepare employer, worksite, salary, itinerary, and petitioner details with exact names.",
      "Prior refusals are common follow-up topics, so explain what changed without blaming the officer.",
    ],
  },
  {
    region: "East and Southeast Asia",
    note: "Posts may emphasize document order, appointment timing, and English clarity.",
    tips: [
      "Use simple English sentences if nervous; accuracy matters more than complex phrasing.",
      "Prepare local-language documents with translations if the post requires them.",
      "For B1/B2, keep the itinerary bounded and tied to approved leave or business dates.",
    ],
  },
  {
    region: "Europe and Middle East",
    note: "Third-country applications and regional mobility can create extra questions.",
    tips: [
      "Be ready to explain residence status if you apply outside your country of nationality.",
      "For work visas, know whether the appointment post accepts your case type and what local documents it asks for.",
      "If travel history is extensive, summarize it cleanly and disclose prior overstays or refusals truthfully.",
    ],
  },
  {
    region: "Americas",
    note: "Cross-border travel history, family visits, and repeat B1/B2 use can receive close review.",
    tips: [
      "Know your I-94 history and the dates of previous U.S. trips.",
      "For visitor renewals, explain why the next trip is temporary and how it fits your current job or family commitments.",
      "For petition-based workers, keep employer and worksite answers aligned with the latest petition.",
    ],
  },
];

export const OFFICIAL_RESOURCES = [
  {
    title: "DS-160",
    href: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/forms/ds-160-online-nonimmigrant-visa-application.html",
    body: "Official Department of State DS-160 guidance and access to CEAC.",
  },
  {
    title: "CEAC application",
    href: "https://ceac.state.gov/genniv/",
    body: "Start or retrieve a nonimmigrant visa application.",
  },
  {
    title: "Find an embassy or consulate",
    href: "https://www.usembassy.gov/",
    body: "Use the local post website for appointment rules, fees, courier steps, and location details.",
  },
  {
    title: "Global visa wait times",
    href: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/global-visa-wait-times.html",
    body: "Check current appointment estimates and recent wait-time data where available.",
  },
];

export const EMBASSY_REGIONS = [
  {
    region: "Africa",
    locations: "Nairobi, Johannesburg, Accra, Lagos, Cairo, Addis Ababa",
    appointment: "Use the local U.S. embassy visa page for fee, scheduling, and courier instructions.",
    waitTimes: "Check the global wait time table, then confirm inside the appointment system.",
  },
  {
    region: "South Asia",
    locations: "New Delhi, Mumbai, Chennai, Hyderabad, Kolkata, Islamabad, Dhaka, Kathmandu",
    appointment: "Use the post-specific visa services site linked by the embassy.",
    waitTimes: "Expect high demand at major posts. New appointments may appear after initial booking.",
  },
  {
    region: "East and Southeast Asia",
    locations: "Tokyo, Seoul, Manila, Bangkok, Singapore, Ho Chi Minh City, Beijing, Shanghai",
    appointment: "Review local instructions for document delivery, photo rules, and interview waiver steps.",
    waitTimes: "Wait times vary by category and season, so verify close to booking.",
  },
  {
    region: "Europe and Middle East",
    locations: "London, Paris, Berlin, Rome, Madrid, Warsaw, Dubai, Abu Dhabi, Tel Aviv",
    appointment: "Confirm whether the post accepts third-country applicants for your visa type.",
    waitTimes: "Use local post guidance for earlier appointment rules and emergency criteria.",
  },
  {
    region: "Americas",
    locations: "Mexico City, Monterrey, Toronto, Vancouver, Bogota, Sao Paulo, Buenos Aires",
    appointment: "Use the post website to choose the right consulate and document pickup option.",
    waitTimes: "Visitor visa demand can differ sharply across posts in the same country.",
  },
];
