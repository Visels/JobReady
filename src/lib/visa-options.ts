const genericVisaTypes = ["Visitor visa", "Student visa"];

const destinationVisaTypes: Record<string, string[]> = {
  "United States": [
    "US F1 Student",
    "US B1/B2 Tourist",
    "US J1 Exchange Visitor",
    "US H1B Work",
    "US K1 Fiance",
  ],
  "United Kingdom": [
    "UK Student Visa",
    "UK Standard Visitor",
    "UK Skilled Worker",
    "UK Global Talent",
  ],
  Canada: [
    "Canada Express Entry",
    "Canada Study Permit",
    "Canada Visitor Visa",
    "Canada Work Permit",
  ],
  Australia: [
    "Australia Student",
    "Australia Visitor",
    "Australia Skilled Independent",
    "Australia Working Holiday",
  ],
  France: [
    "Schengen Tourist",
    "Schengen Business",
    "France Student Visa",
    "France Long-Stay Visitor",
  ],
  Germany: [
    "Schengen Tourist",
    "Schengen Business",
    "Germany Student Visa",
    "Germany Job Seeker",
  ],
  Italy: [
    "Schengen Tourist",
    "Schengen Business",
    "Italy Student Visa",
    "Italy Work Visa",
  ],
  Spain: [
    "Schengen Tourist",
    "Schengen Business",
    "Spain Student Visa",
    "Spain Work Visa",
  ],
  Netherlands: [
    "Schengen Tourist",
    "Schengen Business",
    "Netherlands Student Visa",
    "Netherlands Highly Skilled Migrant",
  ],
  Kenya: ["Kenya eTA", "Kenya Student Pass", "Kenya Work Permit"],
  "United Arab Emirates": [
    "UAE Tourist Visa",
    "UAE Student Visa",
    "UAE Work Visa",
    "UAE Golden Visa",
  ],
};

const officerTitles: Record<string, string> = {
  "United States": "Consular Officer, Nonimmigrant Visa Unit",
  "United Kingdom": "Entry Clearance Officer, UK Visas and Immigration",
  Canada: "Visa Officer, Immigration, Refugees and Citizenship Canada",
  Australia: "Visa Case Officer, Department of Home Affairs",
  France: "Consular Visa Officer, French Consulate",
  Germany: "Visa Officer, German Consular Section",
  Italy: "Visa Officer, Italian Consulate",
  Spain: "Visa Officer, Spanish Consular Section",
  Netherlands: "Consular Visa Officer, Netherlands Mission",
  Kenya: "Immigration Officer, Directorate of Immigration Services",
  "United Arab Emirates": "Visa Officer, Federal Authority for Identity and Citizenship",
};

export type OfficerDifficulty = "Beginner" | "Realistic" | "Brutal";

export type OfficerProfile = {
  difficulty: OfficerDifficulty;
  name: string;
  title: string;
  avatarSrc: string;
  summary: string;
};

const officerRealtimeVoices: Record<OfficerDifficulty, string> = {
  Beginner: "shimmer",
  Realistic: "coral",
  Brutal: "echo",
};

const officerProfiles: Record<
  OfficerDifficulty,
  Omit<OfficerProfile, "title">
> = {
  Beginner: {
    difficulty: "Beginner",
    name: "Officer Sarah Johnson",
    avatarSrc: "/officer-avatar-beginner-v2.png",
    summary: "Warm, patient, and good for building confidence.",
  },
  Realistic: {
    difficulty: "Realistic",
    name: "Officer Amelia Hart",
    avatarSrc: "/officer-avatar-realistic.png",
    summary: "Balanced, professional, and close to a real interview pace.",
  },
  Brutal: {
    difficulty: "Brutal",
    name: "Officer David Miller",
    avatarSrc: "/officer-avatar-brutal-v3.png",
    summary: "Strict, skeptical, and designed for pressure testing.",
  },
};

export const featuredDestinationCountries = Object.keys(destinationVisaTypes);
export const officerDifficulties = Object.keys(
  officerProfiles,
) as OfficerDifficulty[];

export function getVisaTypesForDestination(destinationCountry: string) {
  return destinationVisaTypes[destinationCountry] ?? genericVisaTypes;
}

export function normalizeOfficerDifficulty(
  difficulty?: string | null,
): OfficerDifficulty {
  if (
    difficulty === "Beginner" ||
    difficulty === "Realistic" ||
    difficulty === "Brutal"
  ) {
    return difficulty;
  }

  return "Realistic";
}

export function getOfficerProfile(
  destinationCountry: string,
  difficulty?: string | null,
): OfficerProfile {
  const normalizedDifficulty = normalizeOfficerDifficulty(difficulty);
  const profile = officerProfiles[normalizedDifficulty];

  return {
    ...profile,
    title:
      officerTitles[destinationCountry] ??
      `Visa Officer, ${destinationCountry} Immigration Desk`,
  };
}

export function getOfficerRealtimeVoice(difficulty?: string | null) {
  const normalizedDifficulty = normalizeOfficerDifficulty(difficulty);
  const environmentVoice =
    process.env[
      `AZURE_OPENAI_REALTIME_VOICE_${normalizedDifficulty.toUpperCase()}`
    ];

  return environmentVoice || officerRealtimeVoices[normalizedDifficulty];
}
