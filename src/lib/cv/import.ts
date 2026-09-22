import { cvDraftSchema, emptyCvDraft, type CvDraft } from "./contracts";

type ImportSection =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "languages"
  | "additional";

const SECTION_HEADINGS: Record<string, ImportSection> = {
  "professional summary": "summary",
  summary: "summary",
  profile: "summary",
  "professional profile": "summary",
  objective: "summary",
  "career objective": "summary",
  "about me": "summary",
  experience: "experience",
  "work experience": "experience",
  "professional experience": "experience",
  "employment history": "experience",
  "work history": "experience",
  education: "education",
  "academic background": "education",
  qualifications: "education",
  "education and training": "education",
  skills: "skills",
  "key skills": "skills",
  "core skills": "skills",
  "core competencies": "skills",
  "technical skills": "skills",
  projects: "projects",
  "selected projects": "projects",
  "personal projects": "projects",
  certifications: "certifications",
  certification: "certifications",
  "certifications and licences": "certifications",
  "certifications and licenses": "certifications",
  achievements: "achievements",
  awards: "achievements",
  "awards and achievements": "achievements",
  languages: "languages",
  "language skills": "languages",
  "additional information": "additional",
  interests: "additional",
  references: "additional",
};

const BULLET = /^\s*[-*•▪◦]\s*/;
const DATE_WORD =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const DATE_VALUE = `(?:${DATE_WORD}\\s+)?(?:19|20)\\d{2}|present|current|now`;
const DATE_RANGE = new RegExp(
  `^\\s*(${DATE_VALUE})\\s*(?:[-–—]|to)\\s*(${DATE_VALUE})\\s*$`,
  "i",
);

function normalizedHeading(line: string) {
  if (line.length > 64) return null;
  const normalized = line
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[:|/]+$/g, "")
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return SECTION_HEADINGS[normalized] ?? null;
}

function importedTitle(fileName: string) {
  const title = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (title || "Imported CV").slice(0, 120);
}

function joinLines(lines: string[]) {
  return lines.map((line) => line.trim()).filter(Boolean).join("\n");
}

function looksLikeDateLine(line: string) {
  return line
    .split(/[|·]/)
    .some((part) => DATE_RANGE.test(part.trim()));
}

function dateAndLocation(line: string) {
  const parts = line
    .split(/[|·]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const datePart = parts.find((part) => DATE_RANGE.test(part));
  const match = datePart?.match(DATE_RANGE);
  return {
    startDate: match?.[1] ?? "",
    endDate: match?.[2] ?? "",
    location: parts.filter((part) => part !== datePart).join(" | "),
  };
}

function roleAndCompany(line: string) {
  const at = /^(.+?)\s+at\s+(.+)$/i.exec(line);
  if (at) return { role: at[1].trim(), company: at[2].trim() };
  const parts = line.split(/\s+(?:[|·]|[-–—])\s+/).map((part) => part.trim());
  if (parts.length === 2) return { role: parts[0], company: parts[1] };
  return { role: line.trim(), company: "" };
}

function degreeAndInstitution(line: string) {
  const at = /^(.+?)\s+(?:at|from)\s+(.+)$/i.exec(line);
  if (at) return { degree: at[1].trim(), institution: at[2].trim() };
  const parts = line.split(/\s+(?:[|·]|[-–—])\s+/).map((part) => part.trim());
  if (parts.length === 2)
    return { degree: parts[0], institution: parts[1] };
  return { degree: line.trim(), institution: "" };
}

function entryGroups(lines: string[]) {
  const clean = lines.map((line) => line.trim()).filter(Boolean);
  if (!clean.length) return [];
  const starts = clean
    .map((line, index) =>
      !BULLET.test(line) && looksLikeDateLine(clean[index + 1] ?? "")
        ? index
        : -1,
    )
    .filter((index) => index >= 0);
  if (!starts.length) return [clean];
  if (starts[0] !== 0) starts.unshift(0);
  return starts.map((start, index) => clean.slice(start, starts[index + 1]));
}

function parseExperience(lines: string[]): CvDraft["experience"] {
  return entryGroups(lines).slice(0, 20).map((group) => {
    const header = group[0] ?? "";
    const dateIndex = group.findIndex(looksLikeDateLine);
    const dates = dateIndex >= 0 ? dateAndLocation(group[dateIndex]) : null;
    const details = group.filter((_, index) => index !== 0 && index !== dateIndex);
    const identity = BULLET.test(header)
      ? { role: "", company: "" }
      : roleAndCompany(header);
    return {
      id: crypto.randomUUID(),
      ...identity,
      location: dates?.location ?? "",
      startDate: dates?.startDate ?? "",
      endDate: dates?.endDate ?? "",
      description: joinLines(BULLET.test(header) ? group : details),
    };
  });
}

function parseEducation(lines: string[]): CvDraft["education"] {
  return entryGroups(lines).slice(0, 20).map((group) => {
    const header = group[0] ?? "";
    const dateIndex = group.findIndex(looksLikeDateLine);
    const dates = dateIndex >= 0 ? dateAndLocation(group[dateIndex]) : null;
    const details = group.filter((_, index) => index !== 0 && index !== dateIndex);
    const identity = BULLET.test(header)
      ? { degree: "", institution: "" }
      : degreeAndInstitution(header);
    return {
      id: crypto.randomUUID(),
      ...identity,
      location: dates?.location ?? "",
      startDate: dates?.startDate ?? "",
      endDate: dates?.endDate ?? "",
      details: joinLines(BULLET.test(header) ? group : details),
    };
  });
}

function parseProjects(lines: string[]): CvDraft["projects"] {
  const groups = entryGroups(lines);
  return groups.slice(0, 20).map((group) => ({
    id: crypto.randomUUID(),
    name: BULLET.test(group[0] ?? "") ? "" : (group[0] ?? ""),
    details: joinLines(BULLET.test(group[0] ?? "") ? group : group.slice(1)),
  }));
}

function contactDetails(lines: string[]) {
  const text = lines.join("\n");
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone =
    (text.match(/(?:\+?\d[\d ().-]{7,}\d)/g) ?? [])
      .map((value) => value.trim())
      .find((value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 8 && digits.length <= 15;
      }) ?? "";
  const urls = text.match(/(?:https?:\/\/|www\.)\S+|\b\S+\.com\/[\w/?=&%.-]+/gi) ?? [];
  const linkedin = urls.find((url) => /linkedin\.com/i.test(url)) ?? "";
  const website = urls.find((url) => url !== linkedin) ?? "";
  const locationLine = lines.find((line) => /^(?:location|address)\s*:/i.test(line));
  return {
    email,
    phone,
    website: website.replace(/[),.;]+$/, ""),
    linkedin: linkedin.replace(/[),.;]+$/, ""),
    location: locationLine?.replace(/^(?:location|address)\s*:\s*/i, "").trim() ?? "",
  };
}

function isContactLine(line: string, contact: ReturnType<typeof contactDetails>) {
  return (
    Boolean(contact.email && line.includes(contact.email)) ||
    Boolean(contact.phone && line.includes(contact.phone)) ||
    Boolean(contact.website && line.includes(contact.website)) ||
    Boolean(contact.linkedin && line.includes(contact.linkedin)) ||
    /^(?:location|address)\s*:/i.test(line)
  );
}

type ImportedDraftResult = {
  draft: CvDraft;
  warnings: string[];
};

function constrainImportedDraft(draft: CvDraft): ImportedDraftResult {
  let shortened = false;
  const clip = (value: string, maxLength: number) => {
    if (value.length <= maxLength) return value;
    shortened = true;
    return value.slice(0, maxLength);
  };
  const next: CvDraft = {
    ...draft,
    title: clip(draft.title, 120),
    personal: {
      fullName: clip(draft.personal.fullName, 240),
      headline: clip(draft.personal.headline, 240),
      email: clip(draft.personal.email, 240),
      phone: clip(draft.personal.phone, 240),
      location: clip(draft.personal.location, 240),
      website: clip(draft.personal.website, 240),
      linkedin: clip(draft.personal.linkedin, 240),
    },
    summary: clip(draft.summary, 8_000),
    experience: draft.experience.slice(0, 20).map((entry) => ({
      ...entry,
      role: clip(entry.role, 240),
      company: clip(entry.company, 240),
      location: clip(entry.location, 240),
      startDate: clip(entry.startDate, 240),
      endDate: clip(entry.endDate, 240),
      description: clip(entry.description, 8_000),
    })),
    education: draft.education.slice(0, 20).map((entry) => ({
      ...entry,
      degree: clip(entry.degree, 240),
      institution: clip(entry.institution, 240),
      location: clip(entry.location, 240),
      startDate: clip(entry.startDate, 240),
      endDate: clip(entry.endDate, 240),
      details: clip(entry.details, 8_000),
    })),
    skills: clip(draft.skills, 8_000),
    projects: draft.projects.slice(0, 20).map((entry) => ({
      ...entry,
      name: clip(entry.name, 240),
      details: clip(entry.details, 8_000),
    })),
    certifications: clip(draft.certifications, 8_000),
    achievements: clip(draft.achievements, 8_000),
    languages: clip(draft.languages, 8_000),
    additional: clip(draft.additional, 64_000),
  };

  type Reclaimer = { get: () => string; set: (value: string) => void };
  const reclaimers: Reclaimer[] = [];
  const add = (get: Reclaimer["get"], set: Reclaimer["set"]) =>
    reclaimers.push({ get, set });
  add(
    () => next.additional,
    (value) => {
      next.additional = value;
    },
  );
  for (const key of [
    "languages",
    "achievements",
    "certifications",
  ] as const)
    add(
      () => next[key],
      (value) => {
        next[key] = value;
      },
    );
  for (const entry of [...next.projects].reverse()) {
    add(
      () => entry.details,
      (value) => {
        entry.details = value;
      },
    );
    add(
      () => entry.name,
      (value) => {
        entry.name = value;
      },
    );
  }
  add(
    () => next.skills,
    (value) => {
      next.skills = value;
    },
  );
  for (const entry of [...next.education].reverse()) {
    for (const key of [
      "details",
      "location",
      "endDate",
      "startDate",
      "institution",
      "degree",
    ] as const)
      add(
        () => entry[key],
        (value) => {
          entry[key] = value;
        },
      );
  }
  for (const entry of [...next.experience].reverse()) {
    for (const key of [
      "description",
      "location",
      "endDate",
      "startDate",
      "company",
      "role",
    ] as const)
      add(
        () => entry[key],
        (value) => {
          entry[key] = value;
        },
      );
  }
  add(
    () => next.summary,
    (value) => {
      next.summary = value;
    },
  );
  for (const key of [
    "linkedin",
    "website",
    "location",
    "phone",
    "email",
    "headline",
    "fullName",
  ] as const)
    add(
      () => next.personal[key],
      (value) => {
        next.personal[key] = value;
      },
    );
  add(
    () => next.title,
    (value) => {
      next.title = value;
    },
  );

  const totalLimit = 98_000;
  for (const field of reclaimers) {
    const overflow = JSON.stringify(next).length - totalLimit;
    if (overflow <= 0) break;
    const value = field.get();
    if (!value) continue;
    field.set(value.slice(0, Math.max(0, value.length - overflow)));
    shortened = true;
  }

  return {
    draft: cvDraftSchema.parse(next),
    warnings: shortened
      ? [
          "Some imported text exceeded the editor limits and was shortened. Compare the parsed sections with the original file.",
        ]
      : [],
  };
}

export function draftAndWarningsFromImportedCvText(input: {
  fileName: string;
  text: string;
}): ImportedDraftResult {
  const lines = input.text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
  const contact = contactDetails(lines);
  const preamble: string[] = [];
  const sections = new Map<ImportSection, string[]>();
  let active: ImportSection | null = null;

  for (const line of lines) {
    const heading = normalizedHeading(line);
    if (heading) {
      active = heading;
      if (!sections.has(heading)) sections.set(heading, []);
      continue;
    }
    if (active) sections.get(active)!.push(line);
    else preamble.push(line);
  }

  const identityLines = preamble.filter(
    (line) =>
      !isContactLine(line, contact) &&
      !/^(?:curriculum vitae|cv|resume)$/i.test(line) &&
      !/^\s*[-|·]+\s*$/.test(line),
  );
  const fullName =
    identityLines.find(
      (line) => line.length <= 80 && !/\d/.test(line) && !/^https?:/i.test(line),
    ) ?? "";
  const headline = identityLines.find((line) => line !== fullName) ?? "";
  const additional = [
    ...(sections.get("additional") ?? []),
    ...identityLines.filter((line) => line !== fullName && line !== headline),
  ];

  const draft: CvDraft = {
    ...emptyCvDraft(),
    title: importedTitle(input.fileName),
    personal: {
      fullName,
      headline,
      ...contact,
    },
    summary: joinLines(sections.get("summary") ?? []),
    experience: parseExperience(sections.get("experience") ?? []),
    education: parseEducation(sections.get("education") ?? []),
    skills: joinLines(sections.get("skills") ?? []),
    projects: parseProjects(sections.get("projects") ?? []),
    certifications: joinLines(sections.get("certifications") ?? []),
    achievements: joinLines(sections.get("achievements") ?? []),
    languages: joinLines(sections.get("languages") ?? []),
    additional: joinLines(additional),
  };
  return constrainImportedDraft(draft);
}

export function draftFromImportedCvText(input: {
  fileName: string;
  text: string;
}): CvDraft {
  return draftAndWarningsFromImportedCvText(input).draft;
}
