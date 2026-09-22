"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, BriefcaseBusiness, Check, Undo2, X } from "lucide-react";
import {
  applyCvRevision,
  cvTextFields,
  type CvDraft,
  type CvRevision,
} from "@/lib/cv/contracts";
import { cvRequest } from "./useCvDraft";

export function CvAiEditor({
  draft,
  getDraft,
  onChange,
}: {
  draft: CvDraft;
  getDraft: () => CvDraft;
  onChange: (draft: CvDraft) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [jobDetails, setJobDetails] = useState("");
  const [scope, setScope] = useState("all");
  const [pending, setPending] = useState(false);
  const [pendingAction, setPendingAction] = useState<"tailor" | "edit" | null>(
    null,
  );
  const [revision, setRevision] = useState<CvRevision | null>(null);
  const [undo, setUndo] = useState<CvRevision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const fields = cvTextFields(draft);
  useEffect(() => () => controller.current?.abort(), []);

  async function ask(input: {
    instruction: string;
    scope: string;
    action: "tailor" | "edit";
  }) {
    setPending(true);
    setPendingAction(input.action);
    setError(null);
    setNotice(null);
    setRevision(null);
    controller.current = new AbortController();
    try {
      const result = await cvRequest<CvRevision>("/api/cv/revise", {
        method: "POST",
        signal: controller.current.signal,
        body: JSON.stringify({
          draft: getDraft(),
          instruction: input.instruction,
          scope:
            input.scope === "all" ||
            cvTextFields(getDraft()).some(
              (field) => field.id === input.scope,
            )
              ? input.scope
              : "all",
        }),
      });
      setRevision(result);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError")
        setError(error.message);
    } finally {
      setPending(false);
      setPendingAction(null);
    }
  }

  function apply(changes: CvRevision["changes"]) {
    try {
      onChange(applyCvRevision(getDraft(), { message: "", changes }));
      setUndo({
        message: "",
        changes: changes.map((change) => ({
          ...change,
          before: change.after,
          after: change.before,
        })),
      });
      setRevision((current) =>
        current
          ? {
              ...current,
              changes: current.changes.filter(
                (change) =>
                  !changes.some(
                    (applied) => applied.fieldId === change.fieldId,
                  ),
              ),
            }
          : null,
      );
      setError(null);
      setNotice("Applied to your CV. You can keep editing or download it now.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn't apply the suggestion.",
      );
    }
  }

  return (
    <section className="cv-ai" aria-label="AI writing assistant">
      <div className="cv-section-intro">
        <span className="cv-kicker">Tailor in one prompt</span>
        <h2>
          Bring the job.
          <br />Keep your facts.
        </h2>
        <p>
          Paste the role details once. We&apos;ll suggest changes across the
          relevant CV sections, and nothing changes until you approve it.
        </p>
      </div>
      <form
        className="cv-tailor-form"
        onSubmit={(event) => {
          event.preventDefault();
          void ask({
            action: "tailor",
            scope: "all",
            instruction: [
              "Tailor this CV to the job details below. Prioritize the candidate's existing relevant experience and useful matching language. Keep every claim truthful and do not add qualifications, skills, employers, dates, responsibilities, or results that are not supported by the CV.",
              "JOB DETAILS:",
              jobDetails.trim(),
            ].join("\n\n"),
          });
        }}
      >
        <div className="cv-tailor-label">
          <BriefcaseBusiness size={17} />
          <div>
            <strong>Tailor to a job</strong>
            <span>Job title, responsibilities, and requirements</span>
          </div>
        </div>
        <label className="cv-field">
          <span>Job details</span>
          <textarea
            aria-label="Job details"
            rows={7}
            maxLength={10_000}
            value={jobDetails}
            onChange={(event) => setJobDetails(event.target.value)}
            placeholder="Paste the job title and description here…"
          />
        </label>
        <div className="cv-ai-submit">
          <span>You&apos;ll review every suggested change first.</span>
          <button
            className="cv-button cv-button-primary"
            disabled={pending || jobDetails.trim().length < 10}
            type="submit"
          >
            {pendingAction === "tailor" ? "Tailoring…" : "Tailor my CV"}
            <ArrowUp size={16} />
          </button>
        </div>
      </form>

      <div className="cv-ai-divider">
        <span>Or refine selected sections</span>
      </div>
      <div className="cv-prompt-examples">
        {[
          "Polish the summary more",
          "Make my experience bullets more concise",
          "Emphasize leadership already shown in my CV",
        ].map((text) => (
          <button key={text} type="button" onClick={() => setInstruction(text)}>
            {text}
          </button>
        ))}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void ask({ instruction, scope, action: "edit" });
        }}
      >
        <label className="cv-field">
          <span>Focus on</span>
          <select
            value={fields.some((field) => field.id === scope) ? scope : "all"}
            onChange={(event) => setScope(event.target.value)}
          >
            <option value="all">Let AI choose the relevant sections</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label}
              </option>
            ))}
          </select>
        </label>
        <label className="cv-field">
          <span>What would you like to change?</span>
          <textarea
            aria-label="What would you like to change?"
            rows={4}
            maxLength={1500}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="Polish the summary more, keeping it warm and professional…"
          />
        </label>
        <div className="cv-ai-submit">
          <span>Suggestions use the content of your CV.</span>
          <button
            className="cv-button cv-button-primary"
            disabled={pending || instruction.trim().length < 3}
            type="submit"
          >
            {pendingAction === "edit" ? "Working on it…" : "Suggest edits"}
            <ArrowUp size={16} />
          </button>
        </div>
        <p className="cv-disclosure">
          Your CV content is sent to our AI provider when you ask. Contact
          fields are excluded. Check each suggestion for accuracy before
          applying it.
        </p>
      </form>
      {pending && (
        <div className="cv-ai-progress" role="status">
          {pendingAction === "tailor"
            ? "Comparing the job details with your latest CV…"
            : "Reading your latest draft and refining the wording…"}
        </div>
      )}
      {error && (
        <p className="cv-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="cv-notice" role="status">
          {notice}
        </p>
      )}
      {undo && (
        <button
          className="cv-button"
          onClick={() => {
            try {
              onChange(applyCvRevision(getDraft(), undo));
              setUndo(null);
              setNotice("AI edit undone.");
              setError(null);
            } catch {
              setError(
                "You've edited this text since applying the suggestion. Undo would replace those edits, so it hasn't been applied.",
              );
            }
          }}
        >
          <Undo2 size={15} />
          Undo last AI edit
        </button>
      )}
      {revision && (
        <div className="cv-revisions" aria-label="Suggested changes">
          <p>{revision.message}</p>
          {revision.changes.map((change) => (
            <article key={change.fieldId} className="cv-revision">
              <h3>
                {fields.find((field) => field.id === change.fieldId)?.label ??
                  "Section"}
              </h3>
              <div className="cv-before">
                <span>Current</span>
                <p>{change.before || "Empty section"}</p>
              </div>
              <div className="cv-after">
                <span>Suggested</span>
                <p>{change.after || "Remove this text"}</p>
              </div>
              <div className="cv-revision-actions">
                <button
                  className="cv-button"
                  onClick={() =>
                    setRevision({
                      ...revision,
                      changes: revision.changes.filter(
                        (item) => item.fieldId !== change.fieldId,
                      ),
                    })
                  }
                >
                  <X size={14} />
                  Dismiss
                </button>
                <button
                  className="cv-button cv-button-primary"
                  onClick={() => apply([change])}
                >
                  <Check size={14} />
                  Apply suggestion
                </button>
              </div>
            </article>
          ))}
          {revision.changes.length > 1 && (
            <button
              className="cv-button cv-button-primary"
              onClick={() => apply(revision.changes)}
            >
              Apply all suggestions
            </button>
          )}
        </div>
      )}
    </section>
  );
}
