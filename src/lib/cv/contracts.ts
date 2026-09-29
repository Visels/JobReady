import { z } from "zod";

export const CV_DOCUMENT_SAVED_EVENT = "jiandae:cv-document-saved";
export type CvSavedDocumentDetail = {
  id: string;
  title: string;
  kind: string;
  currentVersionId: string;
  currentVersionNumber: number | null;
  factCount: number;
};

const short = z.string().max(240);
const prose = z.string().max(8_000);
const id = z.string().uuid();
const dated = { location: short, startDate: short, endDate: short };
export const cvDraftSchema = z
  .object({
    schemaVersion: z.literal(1),
    title: z.string().max(120),
    kind: z.enum(["cv", "resume"]),
    personal: z.object({
      fullName: short,
      headline: short,
      email: short,
      phone: short,
      location: short,
      website: short,
      linkedin: short,
    }),
    summary: prose,
    experience: z
      .array(
        z.object({
          id,
          role: short,
          company: short,
          ...dated,
          description: prose,
        }),
      )
      .max(20),
    education: z
      .array(
        z.object({
          id,
          degree: short,
          institution: short,
          ...dated,
          details: prose,
        }),
      )
      .max(20),
    skills: prose,
    projects: z.array(z.object({ id, name: short, details: prose })).max(20),
    certifications: prose,
    achievements: prose,
    languages: prose,
    additional: z.string().max(64_000),
  })
  .superRefine((draft, ctx) => {
    const ids = [
      ...draft.experience,
      ...draft.education,
      ...draft.projects,
    ].map((entry) => entry.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        message: "Each entry must have a unique identifier.",
      });
    if (JSON.stringify(draft).length > 100_000)
      ctx.addIssue({
        code: "custom",
        message: "This CV is too long. Keep it under 100,000 characters.",
      });
  });
export type CvDraft = z.infer<typeof cvDraftSchema>;
export type CvDocumentOption = { id: string; title: string };
export type SavedCvDraft = {
  documentId: string;
  versionId: string;
  updatedAt: string;
  draft: CvDraft;
};
export const saveCvSchema = z.object({
  documentId: z.string().min(1).max(128),
  expectedVersionId: z.string().max(128).nullable(),
  draft: cvDraftSchema,
});
export const aiChangeSchema = z.object({
  fieldId: z.string().max(120),
  before: prose,
  after: prose,
  sourceFieldIds: z.array(z.string().max(120)).min(1).max(30),
});
export const aiRevisionSchema = z.object({
  message: z.string().max(1_000),
  changes: z.array(aiChangeSchema).max(30),
});
export type CvRevision = z.infer<typeof aiRevisionSchema>;
export const revisionRequestSchema = z.object({
  draft: cvDraftSchema,
  instruction: z.string().trim().min(3).max(12_000),
  scope: z.string().max(120),
});

export type CvImportResult = {
  draft: CvDraft;
  warnings: string[];
};

export function emptyCvDraft(): CvDraft {
  return {
    schemaVersion: 1,
    title: "My CV",
    kind: "cv",
    personal: {
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: "",
    projects: [],
    certifications: "",
    achievements: "",
    languages: "",
    additional: "",
  };
}

/** An editable example for a new CV. It is never persisted until the user edits it. */
export function exampleCvDraft(): CvDraft {
  return {
    schemaVersion: 1,
    title: "My CV",
    kind: "cv",
    personal: {
      fullName: "John Doe",
      headline: "Partnerships and Business Development Specialist",
      email: "john.doe@example.com",
      phone: "+254 700 000 000",
      location: "Nairobi, Kenya",
      website: "",
      linkedin: "linkedin.com/in/john-doe-example",
    },
    summary:
      "Partnerships and business development professional with 6+ years of experience building strategic relationships, driving growth, and managing stakeholder engagements across Africa. Proven track record in programme design, partnership management, and cross-functional collaboration.",
    experience: [
      {
        id: "1a5aeed0-f76e-4a19-9e8b-1ed24b949f77",
        role: "Partnerships Manager",
        company: "Example Growth Partners",
        location: "Nairobi, Kenya",
        startDate: "Jan 2022",
        endDate: "Present",
        description:
          "- Lead the development and management of strategic partnerships across East Africa, resulting in 40% growth in partner network.\n- Design and implement partnership strategies aligned with organisational goals.\n- Manage stakeholder relationships with government, NGOs and private sector partners.",
      },
      {
        id: "61136273-7576-4900-8da4-5f752705ee51",
        role: "Partnerships Associate",
        company: "Sample Impact Initiative",
        location: "Nairobi, Kenya",
        startDate: "Mar 2019",
        endDate: "Dec 2021",
        description:
          "- Supported partnership development and stakeholder engagement.\n- Coordinated joint programmes with regional partners.\n- Prepared partnership reports and tracked key performance metrics.",
      },
    ],
    education: [
      {
        id: "08923e54-2a60-4f0e-9418-daaefb33ec6c",
        degree: "Bachelor of Business Administration",
        institution: "Example University",
        location: "Nairobi, Kenya",
        startDate: "2014",
        endDate: "2018",
        details: "Business strategy and management",
      },
    ],
    skills:
      "Partnership Management, Stakeholder Engagement, Business Development, Programme Management, Strategic Planning, Proposal Writing, Communication",
    projects: [
      {
        id: "a3697983-b0d7-4d8f-91ae-3dce012058d9",
        name: "East Africa Partner Network",
        details:
          "Coordinated a regional partner programme connecting organisations across Kenya, Uganda, and Tanzania.",
      },
    ],
    certifications: "Project Management Fundamentals — 2021",
    achievements: "Expanded a regional partner network by 40% in two years.",
    languages: "English, Kiswahili",
    additional: "",
  };
}

export function cvTextFields(draft: CvDraft) {
  return [
    { id: "summary", label: "Summary", text: draft.summary },
    ...draft.experience.map((entry, i) => ({
      id: `experience.${entry.id}.description`,
      label: entry.role || `Experience ${i + 1}`,
      text: entry.description,
    })),
    ...draft.education.map((entry, i) => ({
      id: `education.${entry.id}.details`,
      label: entry.degree || `Education ${i + 1}`,
      text: entry.details,
    })),
    { id: "skills", label: "Skills", text: draft.skills },
    ...draft.projects.map((entry, i) => ({
      id: `projects.${entry.id}.details`,
      label: entry.name || `Project ${i + 1}`,
      text: entry.details,
    })),
    {
      id: "certifications",
      label: "Certifications",
      text: draft.certifications,
    },
    { id: "achievements", label: "Achievements", text: draft.achievements },
    { id: "languages", label: "Languages", text: draft.languages },
    // Long imported text remains manually editable; it is evidence, not a rewrite target.
  ];
}

export function applyCvRevision(draft: CvDraft, revision: CvRevision): CvDraft {
  const next = structuredClone(draft);
  const fields = new Map(
    cvTextFields(draft).map((field) => [field.id, field.text]),
  );
  const seen = new Set<string>();
  for (const change of revision.changes) {
    if (
      seen.has(change.fieldId) ||
      fields.get(change.fieldId) !== change.before
    )
      throw new Error(
        "This section has changed. Ask for a fresh suggestion to keep your latest edits.",
      );
    seen.add(change.fieldId);
    const [group, entryId] = change.fieldId.split(".");
    if (group === "experience")
      next.experience.find((entry) => entry.id === entryId)!.description =
        change.after;
    else if (group === "education")
      next.education.find((entry) => entry.id === entryId)!.details =
        change.after;
    else if (group === "projects")
      next.projects.find((entry) => entry.id === entryId)!.details =
        change.after;
    else if (
      [
        "summary",
        "skills",
        "certifications",
        "achievements",
        "languages",
      ].includes(group)
    )
      next[group as "summary"] = change.after;
    else throw new Error("Unknown CV section.");
  }
  return cvDraftSchema.parse(next);
}

export type CvBlock = {
  kind:
    | "name"
    | "headline"
    | "contact"
    | "heading"
    | "entry"
    | "meta"
    | "body"
    | "bullet";
  text: string;
};
export function cvBlocks(draft: CvDraft): CvBlock[] {
  const blocks: CvBlock[] = [];
  const add = (kind: CvBlock["kind"], text: string) => {
    if (text.trim()) blocks.push({ kind, text: text.trim() });
  };
  const lines = (text: string) =>
    text
      .split(/\r?\n/)
      .forEach((line) =>
        add(
          /^\s*[-*•]\s/.test(line) ? "bullet" : "body",
          line.replace(/^\s*[-*•]\s+/, ""),
        ),
      );
  const section = (heading: string, text: string) => {
    if (text.trim()) {
      add("heading", heading);
      lines(text);
    }
  };
  add("name", draft.personal.fullName);
  add("headline", draft.personal.headline);
  add(
    "contact",
    [draft.personal.email, draft.personal.phone, draft.personal.location]
      .filter(Boolean)
      .join("  |  "),
  );
  add(
    "contact",
    [draft.personal.website, draft.personal.linkedin]
      .filter(Boolean)
      .join("  |  "),
  );
  section("Professional summary", draft.summary);
  const experience = draft.experience.filter((entry) =>
    [entry.role, entry.company, entry.description].some((text) => text.trim()),
  );
  if (experience.length) add("heading", "Experience");
  for (const entry of experience) {
    add("entry", [entry.role, entry.company].filter(Boolean).join(" · "));
    add(
      "meta",
      [
        [entry.startDate, entry.endDate].filter(Boolean).join(" – "),
        entry.location,
      ]
        .filter(Boolean)
        .join("  |  "),
    );
    lines(entry.description);
  }
  const education = draft.education.filter((entry) =>
    [entry.degree, entry.institution, entry.details].some((text) =>
      text.trim(),
    ),
  );
  if (education.length) add("heading", "Education");
  for (const entry of education) {
    add("entry", [entry.degree, entry.institution].filter(Boolean).join(" · "));
    add(
      "meta",
      [
        [entry.startDate, entry.endDate].filter(Boolean).join(" – "),
        entry.location,
      ]
        .filter(Boolean)
        .join("  |  "),
    );
    lines(entry.details);
  }
  section("Skills", draft.skills);
  const projects = draft.projects.filter(
    (entry) => entry.name.trim() || entry.details.trim(),
  );
  if (projects.length) add("heading", "Projects");
  for (const entry of projects) {
    add("entry", entry.name);
    lines(entry.details);
  }
  section("Certifications", draft.certifications);
  section("Achievements", draft.achievements);
  section("Languages", draft.languages);
  section("Additional information", draft.additional);
  return blocks;
}

export function cvEvidence(draft: CvDraft) {
  return [
    ...cvTextFields(draft),
    ...draft.experience.map((entry) => ({
      id: `experience.${entry.id}.context`,
      label: "Employment details",
      text: [entry.role, entry.company, entry.startDate, entry.endDate]
        .filter(Boolean)
        .join("; "),
    })),
    ...draft.education.map((entry) => ({
      id: `education.${entry.id}.context`,
      label: "Education details",
      text: [entry.degree, entry.institution, entry.startDate, entry.endDate]
        .filter(Boolean)
        .join("; "),
    })),
    {
      id: "additional",
      label: "Additional information",
      text: draft.additional,
    },
  ];
}
