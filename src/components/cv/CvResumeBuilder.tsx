"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CV_DOCUMENT_SAVED_EVENT, type CvSavedDocumentDetail } from "@/lib/cv/contracts";
import type { ReactNode } from "react";
import {
  Check,
  ChevronRight,
  Download,
  FileText,
  PenLine,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  createManualCvDocumentAction,
  createTailoringRunAction,
  finalizeTailoringRunAction,
  loadTailoringRunReviewAction,
  type CvBuilderExport,
  type CvBuilderFinalizeResult,
  type CvBuilderReview,
} from "@/app/(app)/cv-resume/actions";

export type CvBuilderDocumentOption = {
  id: string;
  title: string;
  kind: string;
  currentVersionId: string;
  currentVersionNumber: number | null;
  factCount: number;
};

export type CvBuilderPublicTargetOption = {
  versionId: string;
  slug: string;
  title: string;
  companyName: string;
  detailHref: string;
  closesAt: string;
};

export type CvBuilderExistingRun = {
  runId: string;
  roleTitle: string;
  companyName: string | null;
  status: string;
  statusLabel: string;
  exportFormats: string[];
};

type DecisionChoice = "accepted" | "rejected" | "user_edited";

type DecisionDraft = {
  decision: DecisionChoice;
  text: string;
};

type BuilderStage = "document" | "target" | "review" | "done";

type CvResumeBuilderProps = {
  documents: CvBuilderDocumentOption[];
  publicTargets: CvBuilderPublicTargetOption[];
  existingRuns: CvBuilderExistingRun[];
  initialPublicJobSlug?: string;
  initialApplicationId?: string;
};

const fieldClass =
  "w-full rounded-lg border border-muted-line bg-surface px-3 py-2.5 text-[12px] text-foreground outline-none transition duration-200 ease-soft placeholder:text-muted-subtle focus:border-primary focus:ring-2 focus:ring-primary/15";
const labelClass = "text-[11px] font-semibold text-foreground";
const helperClass = "text-[10px] leading-4 text-muted";

const sampleText = [
  "Summary: Customer operations associate with experience resolving high-volume support issues and improving response quality.",
  "Experience: Resolved 45+ customer cases daily while maintaining documented service standards.",
  "Experience: Coordinated weekly reporting across support, sales, and finance teams.",
  "Skills: CRM hygiene, customer support, Excel reporting, stakeholder communication",
  "Project: Built a handover tracker that reduced repeated escalations for priority accounts.",
  "Education: Diploma in Business Management",
  "Achievement: Recognized for improving team documentation during a product-change cycle.",
].join("\n");

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitSkills(value: string) {
  return value
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}

function categoryLabel(value: string) {
  return value
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `cv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildStructuredText(input: {
  summary: string;
  experience: string;
  skills: string;
  projects: string;
  education: string;
  certifications: string;
  achievements: string;
  rawText: string;
}) {
  if (input.rawText.trim()) return input.rawText.trim();

  const lines = [
    ...splitLines(input.summary).map((line) => `Summary: ${line}`),
    ...splitLines(input.experience).map((line) => `Experience: ${line}`),
    splitSkills(input.skills).length
      ? `Skills: ${splitSkills(input.skills).join(", ")}`
      : "",
    ...splitLines(input.projects).map((line) => `Project: ${line}`),
    ...splitLines(input.education).map((line) => `Education: ${line}`),
    ...splitLines(input.certifications).map(
      (line) => `Certification: ${line}`,
    ),
    ...splitLines(input.achievements).map((line) => `Achievement: ${line}`),
  ].filter(Boolean);

  return lines.join("\n");
}

function StepPill({
  active,
  done,
  children,
}: {
  active: boolean;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${
        active
          ? "border-primary bg-primary text-white"
          : done
            ? "border-primary/30 bg-primary-soft text-primary"
            : "border-muted-line bg-surface-soft text-muted"
      }`}
    >
      {done ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className={labelClass}>{label}</span>
      {children}
      {helper ? <span className={helperClass}>{helper}</span> : null}
    </label>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[11px] font-semibold text-white transition duration-200 ease-soft hover:bg-primary/90 active:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-muted-line bg-surface px-4 text-[11px] font-semibold text-foreground transition duration-200 ease-soft hover:bg-surface-soft active:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
    >
      {children}
    </button>
  );
}

export function CvResumeBuilder({
  documents,
  publicTargets,
  existingRuns,
  initialPublicJobSlug,
  initialApplicationId,
}: CvResumeBuilderProps) {
  const initialPublicTarget =
    publicTargets.find((target) => target.slug === initialPublicJobSlug) ??
    publicTargets[0] ??
    null;
  const [stage, setStage] = useState<BuilderStage>(
    documents.length > 0 ? "target" : "document",
  );
  const [documentOptions, setDocumentOptions] = useState(documents);
  const [selectedDocumentVersionId, setSelectedDocumentVersionId] = useState(
    documents[0]?.currentVersionId ?? "",
  );
  const [documentMode, setDocumentMode] = useState<"builder" | "paste">(
    "builder",
  );
  const [title, setTitle] = useState("My Jobready CV");
  const [kind, setKind] = useState<"cv" | "resume">("cv");
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [projects, setProjects] = useState("");
  const [education, setEducation] = useState("");
  const [certifications, setCertifications] = useState("");
  const [achievements, setAchievements] = useState("");
  const [rawText, setRawText] = useState("");
  const [targetMode, setTargetMode] = useState<
    "public_job" | "private_target" | "company_role_only"
  >(initialPublicTarget ? "public_job" : "private_target");
  const [publicJobPostingVersionId, setPublicJobPostingVersionId] = useState(
    initialPublicTarget?.versionId ?? "",
  );
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [targetDescription, setTargetDescription] = useState("");
  const [targetRequirements, setTargetRequirements] = useState("");
  const [targetSkills, setTargetSkills] = useState("");
  const [review, setReview] = useState<CvBuilderReview | null>(null);
  const [decisions, setDecisions] = useState<Record<string, DecisionDraft>>({});
  const [finalized, setFinalized] = useState<CvBuilderFinalizeResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function onDocumentSaved(event: Event) {
      const option = (event as CustomEvent<CvSavedDocumentDetail>).detail;
      const previous = documentOptions.find((document) => document.id === option.id);
      setDocumentOptions((current) => [option, ...current.filter((document) => document.id !== option.id)]);
      setSelectedDocumentVersionId((current) => !current || current === previous?.currentVersionId ? option.currentVersionId : current);
    }
    window.addEventListener(CV_DOCUMENT_SAVED_EVENT, onDocumentSaved);
    return () => window.removeEventListener(CV_DOCUMENT_SAVED_EVENT, onDocumentSaved);
  }, [documentOptions]);

  const structuredText = useMemo(
    () =>
      buildStructuredText({
        summary,
        experience,
        skills,
        projects,
        education,
        certifications,
        achievements,
        rawText: documentMode === "paste" ? rawText : "",
      }),
    [
      achievements,
      certifications,
      documentMode,
      education,
      experience,
      projects,
      rawText,
      skills,
      summary,
    ],
  );
  const selectedDocument = documentOptions.find(
    (document) => document.currentVersionId === selectedDocumentVersionId,
  );

  function hydrateReview(nextReview: CvBuilderReview) {
    setReview(nextReview);
    setDecisions(
      Object.fromEntries(
        nextReview.suggestions.map((suggestion) => [
          suggestion.key,
          { decision: "accepted", text: suggestion.proposedText },
        ]),
      ),
    );
    setFinalized(null);
    setStage("review");
  }

  function saveDocument() {
    setError(null);
    startTransition(async () => {
      const result = await createManualCvDocumentAction({
        title,
        kind,
        text: structuredText,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const option = {
        id: result.data.documentId,
        title: result.data.title,
        kind: result.data.kind,
        currentVersionId: result.data.documentVersionId,
        currentVersionNumber: 1,
        factCount: result.data.factCount,
      };
      setDocumentOptions((current) => [option, ...current]);
      setSelectedDocumentVersionId(option.currentVersionId);
      setStage("target");
    });
  }

  function startTailoring() {
    setError(null);
    startTransition(async () => {
      const target =
        targetMode === "public_job"
          ? {
              type: "public_job" as const,
              jobPostingVersionId: publicJobPostingVersionId,
            }
          : targetMode === "private_target"
            ? {
                type: "private_target" as const,
                companyName,
                roleTitle,
                description: targetDescription,
                requirements: splitLines(targetRequirements),
                skills: splitSkills(targetSkills),
              }
            : {
                type: "company_role_only" as const,
                companyName,
                roleTitle,
              };
      const result = await createTailoringRunAction({
        sourceDocumentVersionId: selectedDocumentVersionId,
        idempotencyKey: makeIdempotencyKey(),
        target,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      hydrateReview(result.data);
    });
  }

  function loadRun(runId: string) {
    setError(null);
    startTransition(async () => {
      const result = await loadTailoringRunReviewAction(runId);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      hydrateReview(result.data);
    });
  }

  function finalize() {
    if (!review) return;
    setError(null);
    startTransition(async () => {
      const result = await finalizeTailoringRunAction({
        tailoringRunId: review.runId,
        applicationId: initialApplicationId,
        decisions: review.suggestions.map((suggestion) => {
          const draft = decisions[suggestion.key] ?? {
            decision: "accepted" as DecisionChoice,
            text: suggestion.proposedText,
          };

          return {
            suggestionKey: suggestion.key,
            decision: draft.decision,
            userEditedText:
              draft.decision === "user_edited" ? draft.text : undefined,
            sourceFactIds:
              draft.decision === "user_edited"
                ? suggestion.sourceFactIds
                : undefined,
          };
        }),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setFinalized(result.data);
      setStage("done");
    });
  }

  return (
    <section className="rounded-xl border border-muted-line bg-surface p-4 shadow-[0_18px_42px_rgba(19,55,43,0.045)] md:p-5">
      <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="rounded-lg border border-muted-line bg-surface-soft p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-white">
              <PenLine className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                Builder
              </p>
              <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-foreground">
                Create and tailor a truthful CV/resume
              </h2>
              <p className="mt-2 text-[11px] leading-5 text-muted">
                Start with a structured draft or pasted text, choose a role
                target, then review every suggested change before export.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <StepPill active={stage === "document"} done={stage !== "document"}>
              Base document
            </StepPill>
            <StepPill
              active={stage === "target"}
              done={stage === "review" || stage === "done"}
            >
              Target
            </StepPill>
            <StepPill active={stage === "review"} done={stage === "done"}>
              Review
            </StepPill>
            <StepPill active={stage === "done"} done={false}>
              Export
            </StepPill>
          </div>

          <div className="mt-5 grid gap-3 border-t border-muted-line pt-4">
            <div className="flex items-start gap-2 text-[10px] leading-4 text-muted">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              The builder only uses facts present in your selected document or
              edits you explicitly make. Missing target requirements stay as
              gaps.
            </div>
            {selectedDocument ? (
              <div className="rounded-lg border border-primary/20 bg-primary-soft p-3">
                <p className="text-[10px] font-semibold text-primary">
                  Selected base
                </p>
                <p className="mt-1 text-[12px] font-semibold text-foreground">
                  {selectedDocument.title}
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  {selectedDocument.factCount} allowlisted facts, version{" "}
                  {selectedDocument.currentVersionNumber ?? "new"}
                </p>
              </div>
            ) : null}
            {existingRuns.length > 0 ? (
              <div className="grid gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Recent tailoring
                </p>
                {existingRuns.slice(0, 3).map((run) => (
                  <button
                    key={run.runId}
                    type="button"
                    onClick={() => loadRun(run.runId)}
                    className="grid rounded-lg border border-muted-line bg-surface p-3 text-left transition duration-200 ease-soft hover:bg-surface-soft active:-translate-y-px"
                  >
                    <span className="text-[11px] font-semibold text-foreground">
                      {run.roleTitle}
                    </span>
                    <span className="mt-0.5 text-[10px] text-muted">
                      {run.companyName ?? "Company not specified"} /{" "}
                      {run.statusLabel}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-w-0">
          {error ? (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg border border-accent-danger/25 bg-red-50 px-3 py-2.5 text-[11px] leading-5 text-accent-danger"
            >
              <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          ) : null}

          {stage === "document" ? (
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <Field label="Document title">
                  <input
                    className={fieldClass}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </Field>
                <Field label="Type">
                  <select
                    className={fieldClass}
                    value={kind}
                    onChange={(event) =>
                      setKind(event.target.value === "resume" ? "resume" : "cv")
                    }
                  >
                    <option value="cv">CV</option>
                    <option value="resume">Resume</option>
                  </select>
                </Field>
              </div>

              <div className="flex flex-wrap gap-2">
                <SecondaryButton onClick={() => setDocumentMode("builder")}>
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Guided fields
                </SecondaryButton>
                <SecondaryButton onClick={() => setDocumentMode("paste")}>
                  <PenLine className="h-4 w-4" aria-hidden="true" />
                  Paste text
                </SecondaryButton>
                <SecondaryButton
                  onClick={() => {
                    setDocumentMode("paste");
                    setRawText(sampleText);
                  }}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Sample
                </SecondaryButton>
              </div>

              {documentMode === "builder" ? (
                <div className="grid gap-3">
                  <Field label="Summary">
                    <textarea
                      className={fieldClass}
                      rows={3}
                      value={summary}
                      onChange={(event) => setSummary(event.target.value)}
                    />
                  </Field>
                  <Field
                    label="Experience"
                    helper="One achievement or responsibility per line."
                  >
                    <textarea
                      className={fieldClass}
                      rows={5}
                      value={experience}
                      onChange={(event) => setExperience(event.target.value)}
                    />
                  </Field>
                  <Field
                    label="Skills"
                    helper="Separate skills with commas or new lines."
                  >
                    <textarea
                      className={fieldClass}
                      rows={2}
                      value={skills}
                      onChange={(event) => setSkills(event.target.value)}
                    />
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Projects">
                      <textarea
                        className={fieldClass}
                        rows={3}
                        value={projects}
                        onChange={(event) => setProjects(event.target.value)}
                      />
                    </Field>
                    <Field label="Education">
                      <textarea
                        className={fieldClass}
                        rows={3}
                        value={education}
                        onChange={(event) => setEducation(event.target.value)}
                      />
                    </Field>
                    <Field label="Certifications">
                      <textarea
                        className={fieldClass}
                        rows={2}
                        value={certifications}
                        onChange={(event) =>
                          setCertifications(event.target.value)
                        }
                      />
                    </Field>
                    <Field label="Achievements">
                      <textarea
                        className={fieldClass}
                        rows={2}
                        value={achievements}
                        onChange={(event) =>
                          setAchievements(event.target.value)
                        }
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                <Field
                  label="CV/resume text"
                  helper="For best matching, keep lines like Experience:, Skills:, Project:, Education:, Certification:, and Achievement:."
                >
                  <textarea
                    className={`${fieldClass} font-mono text-[11px] leading-5`}
                    rows={16}
                    value={rawText}
                    onChange={(event) => setRawText(event.target.value)}
                  />
                </Field>
              )}

              <div className="flex flex-wrap justify-end gap-2 border-t border-muted-line pt-4">
                {documentOptions.length > 0 ? (
                  <SecondaryButton onClick={() => setStage("target")}>
                    Use existing document
                  </SecondaryButton>
                ) : null}
                <PrimaryButton
                  onClick={saveDocument}
                  disabled={isPending || structuredText.length < 80}
                >
                  {isPending ? "Saving..." : "Save base document"}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </PrimaryButton>
              </div>
            </div>
          ) : null}

          {stage === "target" ? (
            <div className="grid gap-4">
              <Field label="Base CV/resume">
                <select
                  className={fieldClass}
                  value={selectedDocumentVersionId}
                  onChange={(event) =>
                    setSelectedDocumentVersionId(event.target.value)
                  }
                >
                  {documentOptions.map((document) => (
                    <option
                      key={document.currentVersionId}
                      value={document.currentVersionId}
                    >
                      {document.title} ({document.factCount} facts)
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["public_job", "Public job"],
                  ["private_target", "Private target"],
                  ["company_role_only", "Company and role"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setTargetMode(
                        value as
                          | "public_job"
                          | "private_target"
                          | "company_role_only",
                      )
                    }
                    className={`rounded-lg border px-3 py-2 text-left text-[11px] font-semibold transition duration-200 ease-soft active:-translate-y-px ${
                      targetMode === value
                        ? "border-primary bg-primary text-white"
                        : "border-muted-line bg-surface-soft text-foreground hover:bg-surface"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {targetMode === "public_job" ? (
                <Field label="Reviewed public job">
                  <select
                    className={fieldClass}
                    value={publicJobPostingVersionId}
                    onChange={(event) =>
                      setPublicJobPostingVersionId(event.target.value)
                    }
                  >
                    {publicTargets.map((target) => (
                      <option key={target.versionId} value={target.versionId}>
                        {target.title} at {target.companyName}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <div className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Company name">
                      <input
                        className={fieldClass}
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                      />
                    </Field>
                    <Field label="Role title">
                      <input
                        className={fieldClass}
                        value={roleTitle}
                        onChange={(event) => setRoleTitle(event.target.value)}
                      />
                    </Field>
                  </div>
                  {targetMode === "private_target" ? (
                    <>
                      <Field label="Role description">
                        <textarea
                          className={fieldClass}
                          rows={4}
                          value={targetDescription}
                          onChange={(event) =>
                            setTargetDescription(event.target.value)
                          }
                        />
                      </Field>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field
                          label="Requirements"
                          helper="One requirement per line."
                        >
                          <textarea
                            className={fieldClass}
                            rows={5}
                            value={targetRequirements}
                            onChange={(event) =>
                              setTargetRequirements(event.target.value)
                            }
                          />
                        </Field>
                        <Field
                          label="Skills"
                          helper="Separate skills with commas or new lines."
                        >
                          <textarea
                            className={fieldClass}
                            rows={5}
                            value={targetSkills}
                            onChange={(event) =>
                              setTargetSkills(event.target.value)
                            }
                          />
                        </Field>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              <div className="flex flex-wrap justify-between gap-2 border-t border-muted-line pt-4">
                <SecondaryButton onClick={() => setStage("document")}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Back
                </SecondaryButton>
                <PrimaryButton
                  onClick={startTailoring}
                  disabled={
                    isPending ||
                    !selectedDocumentVersionId ||
                    (targetMode === "public_job" && !publicJobPostingVersionId) ||
                    (targetMode !== "public_job" && roleTitle.trim().length < 2)
                  }
                >
                  {isPending ? "Building review..." : "Generate review"}
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </PrimaryButton>
              </div>
            </div>
          ) : null}

          {stage === "review" && review ? (
            <div className="grid gap-4">
              <div className="rounded-lg border border-muted-line bg-surface-soft p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  Review target
                </p>
                <h3 className="mt-1 text-[16px] font-semibold tracking-[-0.02em] text-foreground">
                  {review.target.roleTitle}
                  {review.target.companyName
                    ? ` at ${review.target.companyName}`
                    : ""}
                </h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {review.matches.slice(0, 8).map((match) => (
                    <div
                      key={match.requirementKey}
                      className="rounded-lg border border-muted-line bg-surface p-3"
                    >
                      <p className="text-[10px] font-semibold text-foreground">
                        {match.requirementLabel}
                      </p>
                      <p className="mt-1 text-[10px] text-muted">
                        {categoryLabel(match.category)} / {match.confidence}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                {review.suggestions.length > 0 ? (
                  review.suggestions.map((suggestion) => {
                    const draft = decisions[suggestion.key] ?? {
                      decision: "accepted" as DecisionChoice,
                      text: suggestion.proposedText,
                    };

                    return (
                      <article
                        key={suggestion.key}
                        className="rounded-lg border border-muted-line bg-surface p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                              {suggestion.kind} / {suggestion.confidence}
                            </p>
                            <h4 className="mt-1 text-[13px] font-semibold text-foreground">
                              {suggestion.title}
                            </h4>
                          </div>
                          <div className="flex rounded-lg border border-muted-line bg-surface-soft p-1">
                            {(["accepted", "user_edited", "rejected"] as const).map(
                              (choice) => (
                                <button
                                  key={choice}
                                  type="button"
                                  onClick={() =>
                                    setDecisions((current) => ({
                                      ...current,
                                      [suggestion.key]: {
                                        decision: choice,
                                        text:
                                          current[suggestion.key]?.text ??
                                          suggestion.proposedText,
                                      },
                                    }))
                                  }
                                  className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${
                                    draft.decision === choice
                                      ? "bg-primary text-white"
                                      : "text-muted hover:bg-surface"
                                  }`}
                                >
                                  {choice === "user_edited"
                                    ? "Edit"
                                    : choice === "accepted"
                                      ? "Accept"
                                      : "Reject"}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                        {draft.decision === "user_edited" ? (
                          <textarea
                            className={`${fieldClass} mt-3`}
                            rows={3}
                            value={draft.text}
                            onChange={(event) =>
                              setDecisions((current) => ({
                                ...current,
                                [suggestion.key]: {
                                  decision: "user_edited",
                                  text: event.target.value,
                                },
                              }))
                            }
                          />
                        ) : (
                          <p
                            className={`mt-3 rounded-lg p-3 text-[11px] leading-5 ${
                              draft.decision === "rejected"
                                ? "bg-surface-soft text-muted line-through"
                                : "bg-primary-soft text-foreground"
                            }`}
                          >
                            {suggestion.proposedText}
                          </p>
                        )}
                        <p className="mt-2 text-[10px] leading-4 text-muted">
                          {suggestion.rationale}
                        </p>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-muted-line bg-surface-soft p-4">
                    <p className="text-[13px] font-semibold text-foreground">
                      No attributable suggestions yet
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-muted">
                      Add more evidence to the base document, then run tailoring
                      again.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-between gap-2 border-t border-muted-line pt-4">
                <SecondaryButton onClick={() => setStage("target")}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Target
                </SecondaryButton>
                <PrimaryButton
                  onClick={finalize}
                  disabled={isPending || review.suggestions.length === 0}
                >
                  {isPending ? "Exporting..." : "Finalize exports"}
                  <Download className="h-4 w-4" aria-hidden="true" />
                </PrimaryButton>
              </div>
            </div>
          ) : null}

          {stage === "done" && finalized ? (
            <div className="grid gap-4">
              <div className="rounded-lg border border-primary/25 bg-primary-soft p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                  Complete
                </p>
                <h3 className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-foreground">
                  Your tailored version is ready
                </h3>
                <p className="mt-2 text-[11px] leading-5 text-muted">
                  The exported document is linked to an immutable tailored
                  version and kept private to your account.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {finalized.exports.map((item: CvBuilderExport) => (
                    <a
                      key={item.id}
                      href={item.href}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[11px] font-semibold text-white transition duration-200 ease-soft hover:bg-primary/90 active:-translate-y-px"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      {item.format.toUpperCase()} {formatBytes(item.sizeBytes)}
                    </a>
                  ))}
                </div>
              </div>
              <div className="max-h-[360px] overflow-auto rounded-lg border border-muted-line bg-surface p-3">
                <pre className="whitespace-pre-wrap font-mono text-[10px] leading-5 text-foreground">
                  {finalized.plainText}
                </pre>
              </div>
              <div className="flex justify-end">
                <SecondaryButton
                  onClick={() => {
                    setFinalized(null);
                    setReview(null);
                    setStage("target");
                  }}
                >
                  Tailor another version
                </SecondaryButton>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
