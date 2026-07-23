export type MarketingVisaOption = {
  slug: string;
  label: string;
  shortLabel: string;
  countryIsoCode: string;
  visaTypeNames: string[];
};

export const marketingVisaOptions: MarketingVisaOption[] = [
  {
    slug: "us-f1-student",
    label: "US F-1 Student",
    shortLabel: "F-1 Student",
    countryIsoCode: "US",
    visaTypeNames: ["US F1 Student", "US F-1 Student"],
  },
  {
    slug: "us-j1-exchange",
    label: "US J-1 Exchange",
    shortLabel: "J-1 Exchange",
    countryIsoCode: "US",
    visaTypeNames: ["US J1 Exchange", "US J-1 Exchange"],
  },
  {
    slug: "us-m1-vocational",
    label: "US M-1 Vocational Student",
    shortLabel: "M-1 Vocational",
    countryIsoCode: "US",
    visaTypeNames: ["US M1 Vocational Student", "US M-1 Vocational Student"],
  },
  {
    slug: "us-f2-j2-dependent",
    label: "US F-2/J-2 Dependent",
    shortLabel: "F-2/J-2 Dependent",
    countryIsoCode: "US",
    visaTypeNames: ["US F2/J2 Dependent", "US F-2/J-2 Dependent"],
  },
  {
    slug: "us-b1-b2-visitor",
    label: "US B-1/B-2 Visitor",
    shortLabel: "B-1/B-2 Visitor",
    countryIsoCode: "US",
    visaTypeNames: ["US B1/B2 Tourist", "US B-1/B-2 Visitor", "US B1/B2 Visitor"],
  },
  {
    slug: "us-h1b-specialty-worker",
    label: "US H-1B Specialty Worker",
    shortLabel: "H-1B Specialty Work",
    countryIsoCode: "US",
    visaTypeNames: ["US H1B Specialty Worker", "US H-1B Specialty Worker"],
  },
  {
    slug: "us-l1-transfer",
    label: "US L-1 Transfer",
    shortLabel: "L-1 Transfer",
    countryIsoCode: "US",
    visaTypeNames: ["US L1 Transfer", "US L-1 Transfer"],
  },
  {
    slug: "us-o1-extraordinary-ability",
    label: "US O-1 Extraordinary Ability",
    shortLabel: "O-1 Ability",
    countryIsoCode: "US",
    visaTypeNames: ["US O1 Extraordinary Ability", "US O-1 Extraordinary Ability"],
  },
  {
    slug: "us-k1-fiance",
    label: "US K-1 Fiance",
    shortLabel: "K-1 Fiance",
    countryIsoCode: "US",
    visaTypeNames: ["US K1 Fiance", "US K-1 Fiance"],
  },
  {
    slug: "us-cr1-ir1-spouse",
    label: "US CR-1/IR-1 Spouse",
    shortLabel: "CR-1/IR-1 Spouse",
    countryIsoCode: "US",
    visaTypeNames: ["US CR1/IR1 Spouse", "US CR-1/IR-1 Spouse"],
  },
  {
    slug: "uk-student",
    label: "UK Student Visa",
    shortLabel: "UK Student",
    countryIsoCode: "GB",
    visaTypeNames: ["UK Student Visa"],
  },
  {
    slug: "uk-standard-visitor",
    label: "UK Standard Visitor",
    shortLabel: "UK Visitor",
    countryIsoCode: "GB",
    visaTypeNames: ["UK Standard Visitor", "UK Visitor Visa"],
  },
  {
    slug: "uk-skilled-worker",
    label: "UK Skilled Worker",
    shortLabel: "UK Skilled Worker",
    countryIsoCode: "GB",
    visaTypeNames: ["UK Skilled Worker", "UK Skilled Worker Visa"],
  },
  {
    slug: "uk-health-care-worker",
    label: "UK Health and Care Worker",
    shortLabel: "Health & Care Worker",
    countryIsoCode: "GB",
    visaTypeNames: ["UK Health and Care Worker", "UK Health and Care Worker Visa"],
  },
  {
    slug: "canada-study-permit",
    label: "Canada Study Permit",
    shortLabel: "Canada Study",
    countryIsoCode: "CA",
    visaTypeNames: ["Canada Study Permit"],
  },
  {
    slug: "canada-visitor",
    label: "Canada Visitor Visa",
    shortLabel: "Canada Visitor",
    countryIsoCode: "CA",
    visaTypeNames: ["Canada Visitor Visa"],
  },
  {
    slug: "canada-work-permit",
    label: "Canada Work Permit",
    shortLabel: "Canada Work",
    countryIsoCode: "CA",
    visaTypeNames: ["Canada Work Permit"],
  },
  {
    slug: "canada-express-entry",
    label: "Canada Express Entry",
    shortLabel: "Express Entry",
    countryIsoCode: "CA",
    visaTypeNames: ["Canada Express Entry"],
  },
  {
    slug: "australia-student",
    label: "Australia Student Visa",
    shortLabel: "Australia Student",
    countryIsoCode: "AU",
    visaTypeNames: ["Australia Student Visa (Subclass 500)", "Australia Student"],
  },
  {
    slug: "australia-visitor",
    label: "Australia Visitor Visa",
    shortLabel: "Australia Visitor",
    countryIsoCode: "AU",
    visaTypeNames: ["Australia Visitor Visa"],
  },
  {
    slug: "australia-partner",
    label: "Australia Partner Visa",
    shortLabel: "Australia Partner",
    countryIsoCode: "AU",
    visaTypeNames: [
      "Australia Partner Visa (Subclasses 309/100 or 820/801)",
      "Australia Partner Visa",
    ],
  },
  {
    slug: "schengen-tourist",
    label: "Schengen Tourist Visa",
    shortLabel: "Schengen Tourist",
    countryIsoCode: "FR",
    visaTypeNames: ["Schengen Tourist", "Tourist Schengen"],
  },
  {
    slug: "schengen-business",
    label: "Schengen Business Visa",
    shortLabel: "Schengen Business",
    countryIsoCode: "FR",
    visaTypeNames: ["Schengen Business", "Business Schengen"],
  },
  {
    slug: "germany-student",
    label: "Germany Student Visa",
    shortLabel: "Germany Student",
    countryIsoCode: "DE",
    visaTypeNames: ["Germany Student Visa"],
  },
  {
    slug: "germany-job-seeker",
    label: "Germany Job Seeker",
    shortLabel: "Germany Job Seeker",
    countryIsoCode: "DE",
    visaTypeNames: ["Germany Job Seeker"],
  },
  {
    slug: "germany-eu-blue-card",
    label: "Germany EU Blue Card",
    shortLabel: "EU Blue Card",
    countryIsoCode: "DE",
    visaTypeNames: ["Germany EU Blue Card", "EU Blue Card"],
  },
];

const visaOptionsBySlug = new Map(
  marketingVisaOptions.map((option) => [option.slug, option]),
);

const visaSlugByDisplayLabel = new Map<string, string>(
  [
    ["F-1 student", "us-f1-student"],
    ["J-1 exchange visitor", "us-j1-exchange"],
    ["M-1 vocational student", "us-m1-vocational"],
    ["F-2 and J-2 dependants", "us-f2-j2-dependent"],
    ["B-1/B-2 visitor", "us-b1-b2-visitor"],
    ["H-1B specialty worker", "us-h1b-specialty-worker"],
    ["L-1 transfer", "us-l1-transfer"],
    ["O-1 ability", "us-o1-extraordinary-ability"],
    ["K-1 fiance", "us-k1-fiance"],
    ["CR-1/IR-1 spouse", "us-cr1-ir1-spouse"],
    ["Study permit", "canada-study-permit"],
    ["SDS applications", "canada-study-permit"],
    ["Visitor visa", "canada-visitor"],
    ["Work permit", "canada-work-permit"],
    ["Student visa", "uk-student"],
    ["Standard visitor", "uk-standard-visitor"],
    ["Skilled worker", "uk-skilled-worker"],
    ["Health and care worker", "uk-health-care-worker"],
    ["Job seeker", "germany-job-seeker"],
    ["EU Blue Card", "germany-eu-blue-card"],
    ["Partner visa", "australia-partner"],
    ["Tourist Schengen", "schengen-tourist"],
    ["Business Schengen", "schengen-business"],
  ] as const,
);

export function findMarketingVisaOption(slug?: string | null) {
  if (!slug) return null;
  return visaOptionsBySlug.get(slug) ?? null;
}

export function findMarketingVisaSlugByDisplayLabel(label: string) {
  return visaSlugByDisplayLabel.get(label) ?? null;
}

export function practicePathForVisa(slug: string) {
  return `/practice?visa=${encodeURIComponent(slug)}`;
}

export function loginHrefForVisa(slug: string) {
  return `/login?callbackUrl=${encodeURIComponent(practicePathForVisa(slug))}`;
}
