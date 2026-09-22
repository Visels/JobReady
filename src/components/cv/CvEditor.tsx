"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import {
  Check,
  Download,
  FileText,
  MessageSquareText,
  Plus,
  Trash2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Upload,
} from "lucide-react";
import {
  cvBlocks,
  type CvDocumentOption,
  type CvDraft,
  type CvImportResult,
} from "@/lib/cv/contracts";
import { useCvDraft } from "./useCvDraft";
import { CvAiEditor } from "./CvAiEditor";
import "./cv-editor.css";

function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  maxLength = 240,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
  type?: string;
}) {
  const fieldId = useId();
  return (
    <label className="cv-field">
      <span id={fieldId}>{label}</span>
      {multiline ? (
        <textarea
          aria-labelledby={fieldId}
          rows={5}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      ) : (
        <input
          aria-labelledby={fieldId}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}
function Section({
  number,
  title,
  children,
  open = false,
}: {
  number: string;
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="cv-form-section" open={open || undefined}>
      <summary>
        <span className="cv-section-number">{number}</span>
        <h2>{title}</h2>
        <ChevronDown size={17} />
      </summary>
      <div className="cv-section-content">{children}</div>
    </details>
  );
}
function EntryActions({
  label,
  index,
  count,
  onMove,
  onRemove,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (direction: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="cv-entry-actions">
      <span>
        {label} {index + 1}
      </span>
      <button
        type="button"
        aria-label={`Move ${label.toLowerCase()} ${index + 1} up`}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={14} />
      </button>
      <button
        type="button"
        aria-label={`Move ${label.toLowerCase()} ${index + 1} down`}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={14} />
      </button>
      <button
        type="button"
        aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
        onClick={onRemove}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function CvEditor({
  documents,
  initialDocumentId,
}: {
  documents: CvDocumentOption[];
  initialDocumentId?: string;
}) {
  const editor = useCvDraft(documents, initialDocumentId);
  const { draft, update } = editor;
  const [tab, setTab] = useState<"edit" | "ai">("edit");
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [removed, setRemoved] = useState<CvDraft | null>(null);
  const uploadInput = useRef<HTMLInputElement | null>(null);
  const set = <K extends keyof CvDraft>(key: K, value: CvDraft[K]) =>
    update({ ...editor.getDraft(), [key]: value });
  const blocks = cvBlocks(draft);

  function move(
    group: "experience" | "education" | "projects",
    index: number,
    direction: number,
  ) {
    const next = structuredClone(editor.getDraft());
    const entries = next[group];
    [entries[index], entries[index + direction]] = [
      entries[index + direction],
      entries[index],
    ];
    update(next);
  }
  function remove(group: "experience" | "education" | "projects", id: string) {
    const next = structuredClone(editor.getDraft());
    setRemoved(editor.getDraft());
    if (group === "experience")
      next.experience = next.experience.filter((entry) => entry.id !== id);
    if (group === "education")
      next.education = next.education.filter((entry) => entry.id !== id);
    if (group === "projects")
      next.projects = next.projects.filter((entry) => entry.id !== id);
    update(next);
  }
  async function download(format: "pdf" | "docx") {
    setDownloading(format);
    setDownloadError(null);
    try {
      const snapshot = editor.getDraft();
      const response = await fetch("/api/cv/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: snapshot, format }),
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).error || "Couldn't download this CV.",
        );
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] || `my-cv.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "Couldn't download your CV. Please try again.",
      );
    } finally {
      setDownloading(null);
    }
  }

  async function importFile(file: File) {
    setImporting(true);
    setImportError(null);
    setImportNotice(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/cv/import", {
        method: "POST",
        body: form,
      });
      const result = (await response.json()) as CvImportResult & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error || "Couldn't import this CV.");
      if (!(await editor.createFrom(result.draft)))
        throw new Error(
          "Save or resolve the current CV before importing another file.",
        );
      setRemoved(null);
      setTab("edit");
      setMobileView("editor");
      setImportNotice(
        "CV imported into the sections below. Review the parsed details before tailoring or downloading.",
      );
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Couldn't import this CV. Please try again.",
      );
    } finally {
      setImporting(false);
      if (uploadInput.current) uploadInput.current.value = "";
    }
  }

  return (
    <section className="cv-workbench" aria-label="CV editor">
      <div className="cv-toolbar">
        <div className="cv-document-picker">
          <FileText size={20} />
          <label>
            <span className="cv-sr-only">Open a saved CV</span>
            <select
              disabled={!editor.ready}
              value={editor.documentId}
              onChange={(event) => {
                setRemoved(null);
                void editor.open(event.target.value);
              }}
            >
              <option value={editor.documentId}>
                {draft.title || "Untitled CV"}
              </option>
              {editor.documents
                .filter((option) => option.id !== editor.documentId)
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="cv-button cv-new"
            disabled={editor.status === "loading"}
            onClick={() => {
              setRemoved(null);
              void editor.create();
            }}
          >
            <Plus size={15} />
            New CV
          </button>
          <input
            ref={uploadInput}
            className="cv-sr-only"
            type="file"
            aria-label="Upload an existing CV"
            accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={!editor.ready || importing}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
            }}
          />
          <button
            type="button"
            className="cv-button cv-upload"
            disabled={!editor.ready || importing}
            onClick={() => uploadInput.current?.click()}
          >
            <Upload size={15} />
            {importing ? "Parsing CV…" : "Upload CV"}
          </button>
        </div>
        <div className="cv-download-actions">
          <span
            className={`cv-save-status cv-save-${editor.status}`}
            role="status"
          >
            {editor.status === "saved" && <Check size={13} />}
            {
              {
                loading: "Opening CV…",
                saved: editor.documents.some((option) => option.id === editor.documentId) ? "All changes saved" : "Start writing",
                unsaved: "Unsaved changes",
                saving: "Saving…",
                error: "Not saved",
                conflict: "Save conflict",
              }[editor.status]
            }
          </span>
          <button
            className="cv-button"
            disabled={!editor.ready || !!downloading}
            onClick={() => void download("docx")}
          >
            {downloading === "docx" ? "Preparing…" : "DOCX"}
          </button>
          <button
            className="cv-button cv-button-primary"
            disabled={!editor.ready || !!downloading}
            onClick={() => void download("pdf")}
          >
            <Download size={15} />
            {downloading === "pdf" ? "Preparing…" : "Download PDF"}
          </button>
        </div>
      </div>
      {importNotice && (
        <div className="cv-import-notice" role="status">
          <Check size={15} />
          <p>{importNotice}</p>
          <button
            type="button"
            aria-label="Dismiss import message"
            onClick={() => setImportNotice(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {importError && (
        <div className="cv-banner" role="alert">
          <p>{importError}</p>
          <button
            type="button"
            className="cv-button"
            onClick={() => uploadInput.current?.click()}
          >
            Choose another file
          </button>
        </div>
      )}
      {editor.error && (
        <div className="cv-banner" role="alert">
          <p>{editor.error}</p>
          {editor.status === "conflict" ? (
            <div>
              <button
                className="cv-button"
                onClick={() => void editor.open(editor.documentId, true)}
              >
                Reload saved version
              </button>
              <button
                className="cv-button"
                onClick={() => void editor.saveCopy()}
              >
                Save my edits as a new CV
              </button>
            </div>
          ) : (
            <button
              className="cv-button"
              onClick={() =>
                editor.ready
                  ? void editor.saveNow()
                  : void editor.open(initialDocumentId || "", true)
              }
            >
              Try again
            </button>
          )}
        </div>
      )}
      {downloadError && (
        <p className="cv-error" role="alert">
          {downloadError}
        </p>
      )}
      <div className="cv-mobile-views">
        <button
          aria-pressed={mobileView === "editor"}
          onClick={() => setMobileView("editor")}
        >
          Editor
        </button>
        <button
          aria-pressed={mobileView === "preview"}
          onClick={() => setMobileView("preview")}
        >
          Preview
        </button>
      </div>
      <div className={`cv-editor-layout cv-show-${mobileView}`}>
        <div className="cv-edit-pane">
          <div
            className="cv-editor-tabs"
            role="tablist"
            aria-label="Editing mode"
          >
            <button
              role="tab"
              aria-selected={tab === "edit"}
              aria-controls="cv-edit-panel"
              id="cv-edit-tab"
              onClick={() => setTab("edit")}
            >
              <FileText size={16} />
              Edit CV
            </button>
            <button
              role="tab"
              aria-selected={tab === "ai"}
              aria-controls="cv-ai-panel"
              id="cv-ai-tab"
              onClick={() => setTab("ai")}
            >
              <MessageSquareText size={16} />
              Ask AI
            </button>
          </div>
          {!editor.ready ? (
            <div className="cv-loading" role="status">
              Opening your document…
            </div>
          ) : (
            <>
              <div
                id="cv-edit-panel"
                role="tabpanel"
                aria-labelledby="cv-edit-tab"
                hidden={tab !== "edit"}
              >
                <div className="cv-editor-intro">
                  <span className="cv-kicker">Make it yours</span>
                  <p>
                    Your experience, in your own words. Edit any section; your
                    draft saves automatically.
                  </p>
                  <div className="cv-field-grid">
                    <Field
                      label="Document name"
                      value={draft.title}
                      maxLength={120}
                      onChange={(value) => set("title", value)}
                    />
                    <label className="cv-field">
                      <span>Document type</span>
                      <select
                        value={draft.kind}
                        onChange={(event) =>
                          set("kind", event.target.value as CvDraft["kind"])
                        }
                      >
                        <option value="cv">CV</option>
                        <option value="resume">Resume</option>
                      </select>
                    </label>
                  </div>
                </div>
                {removed && (
                  <div className="cv-notice">
                    Entry removed.{" "}
                    <button
                      className="cv-text-button"
                      onClick={() => {
                        const current = editor.getDraft();
                        // Restore only removed entries, preserving any subsequent edits elsewhere.
                        update({
                          ...current,
                          experience: [
                            ...current.experience,
                            ...removed.experience.filter(
                              (entry) =>
                                !current.experience.some(
                                  (item) => item.id === entry.id,
                                ),
                            ),
                          ],
                          education: [
                            ...current.education,
                            ...removed.education.filter(
                              (entry) =>
                                !current.education.some(
                                  (item) => item.id === entry.id,
                                ),
                            ),
                          ],
                          projects: [
                            ...current.projects,
                            ...removed.projects.filter(
                              (entry) =>
                                !current.projects.some(
                                  (item) => item.id === entry.id,
                                ),
                            ),
                          ],
                        });
                        setRemoved(null);
                      }}
                    >
                      Undo removal
                    </button>
                  </div>
                )}
                <Section number="01" title="Personal details" open>
                  <Field
                    label="Full name"
                    value={draft.personal.fullName}
                    onChange={(value) =>
                      set("personal", { ...draft.personal, fullName: value })
                    }
                    placeholder="Your full name"
                  />
                  <Field
                    label="Professional headline"
                    value={draft.personal.headline}
                    onChange={(value) =>
                      set("personal", { ...draft.personal, headline: value })
                    }
                    placeholder="e.g. Customer operations specialist"
                  />
                  <div className="cv-field-grid">
                    {(
                      [
                        ["email", "Email"],
                        ["phone", "Phone"],
                        ["location", "Location"],
                        ["website", "Website"],
                        ["linkedin", "LinkedIn"],
                      ] as const
                    ).map(([key, label]) => (
                      <Field
                        key={key}
                        label={label}
                        value={draft.personal[key]}
                        onChange={(value) =>
                          set("personal", { ...draft.personal, [key]: value })
                        }
                      />
                    ))}
                  </div>
                </Section>
                <Section number="02" title="Professional summary" open>
                  <Field
                    label="Summary"
                    multiline
                    maxLength={8000}
                    value={draft.summary}
                    onChange={(value) => set("summary", value)}
                    placeholder="Introduce your experience, strengths, and the value you bring."
                  />
                  <button
                    className="cv-text-button"
                    onClick={() => setTab("ai")}
                  >
                    Refine this with AI →
                  </button>
                </Section>
                <Section number="03" title="Experience">
                  {draft.experience.map((entry, index) => (
                    <div className="cv-repeat-entry" key={entry.id}>
                      <EntryActions
                        label="Role"
                        index={index}
                        count={draft.experience.length}
                        onMove={(direction) =>
                          move("experience", index, direction)
                        }
                        onRemove={() => remove("experience", entry.id)}
                      />
                      <div className="cv-field-grid">
                        {(
                          [
                            ["role", "Job title"],
                            ["company", "Company"],
                            ["location", "Work location"],
                            ["startDate", "Start date"],
                            ["endDate", "End date or Present"],
                          ] as const
                        ).map(([key, label]) => (
                          <Field
                            key={key}
                            label={label}
                            value={entry[key]}
                            onChange={(value) =>
                              set(
                                "experience",
                                draft.experience.map((item) =>
                                  item.id === entry.id
                                    ? { ...item, [key]: value }
                                    : item,
                                ),
                              )
                            }
                          />
                        ))}
                      </div>
                      <Field
                        label="Responsibilities and achievements"
                        multiline
                        maxLength={8000}
                        value={entry.description}
                        onChange={(value) =>
                          set(
                            "experience",
                            draft.experience.map((item) =>
                              item.id === entry.id
                                ? { ...item, description: value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Start each bullet with a dash. Include outcomes and numbers you can support."
                      />
                    </div>
                  ))}
                  <button
                    className="cv-button cv-add"
                    disabled={draft.experience.length >= 20}
                    onClick={() =>
                      set("experience", [
                        ...draft.experience,
                        {
                          id: crypto.randomUUID(),
                          role: "",
                          company: "",
                          location: "",
                          startDate: "",
                          endDate: "",
                          description: "",
                        },
                      ])
                    }
                  >
                    <Plus size={15} />
                    Add experience
                  </button>
                </Section>
                <Section number="04" title="Education">
                  {draft.education.map((entry, index) => (
                    <div className="cv-repeat-entry" key={entry.id}>
                      <EntryActions
                        label="Education"
                        index={index}
                        count={draft.education.length}
                        onMove={(direction) =>
                          move("education", index, direction)
                        }
                        onRemove={() => remove("education", entry.id)}
                      />
                      <div className="cv-field-grid">
                        {(
                          [
                            ["degree", "Qualification"],
                            ["institution", "Institution"],
                            ["location", "Location"],
                            ["startDate", "Start date"],
                            ["endDate", "End date"],
                          ] as const
                        ).map(([key, label]) => (
                          <Field
                            key={key}
                            label={label}
                            value={entry[key]}
                            onChange={(value) =>
                              set(
                                "education",
                                draft.education.map((item) =>
                                  item.id === entry.id
                                    ? { ...item, [key]: value }
                                    : item,
                                ),
                              )
                            }
                          />
                        ))}
                      </div>
                      <Field
                        label="Education details"
                        multiline
                        maxLength={8000}
                        value={entry.details}
                        onChange={(value) =>
                          set(
                            "education",
                            draft.education.map((item) =>
                              item.id === entry.id
                                ? { ...item, details: value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                  <button
                    className="cv-button cv-add"
                    disabled={draft.education.length >= 20}
                    onClick={() =>
                      set("education", [
                        ...draft.education,
                        {
                          id: crypto.randomUUID(),
                          degree: "",
                          institution: "",
                          location: "",
                          startDate: "",
                          endDate: "",
                          details: "",
                        },
                      ])
                    }
                  >
                    <Plus size={15} />
                    Add education
                  </button>
                </Section>
                <Section number="05" title="Skills">
                  <Field
                    label="Skills"
                    multiline
                    maxLength={8000}
                    value={draft.skills}
                    onChange={(value) => set("skills", value)}
                    placeholder="Add the tools, skills, and strengths you can demonstrate."
                  />
                </Section>
                <Section number="06" title="Projects & more">
                  {draft.projects.map((entry, index) => (
                    <div className="cv-repeat-entry" key={entry.id}>
                      <EntryActions
                        label="Project"
                        index={index}
                        count={draft.projects.length}
                        onMove={(direction) =>
                          move("projects", index, direction)
                        }
                        onRemove={() => remove("projects", entry.id)}
                      />
                      <Field
                        label="Project name"
                        value={entry.name}
                        onChange={(value) =>
                          set(
                            "projects",
                            draft.projects.map((item) =>
                              item.id === entry.id
                                ? { ...item, name: value }
                                : item,
                            ),
                          )
                        }
                      />
                      <Field
                        label="Project details"
                        multiline
                        maxLength={8000}
                        value={entry.details}
                        onChange={(value) =>
                          set(
                            "projects",
                            draft.projects.map((item) =>
                              item.id === entry.id
                                ? { ...item, details: value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                  <button
                    className="cv-button cv-add"
                    disabled={draft.projects.length >= 20}
                    onClick={() =>
                      set("projects", [
                        ...draft.projects,
                        { id: crypto.randomUUID(), name: "", details: "" },
                      ])
                    }
                  >
                    <Plus size={15} />
                    Add project
                  </button>
                  {(
                    [
                      ["certifications", "Certifications"],
                      ["achievements", "Achievements"],
                      ["languages", "Languages"],
                      [
                        "additional",
                        "Additional information or imported CV text",
                      ],
                    ] as const
                  ).map(([key, label]) => (
                    <Field
                      key={key}
                      label={label}
                      multiline
                      maxLength={key === "additional" ? 64000 : 8000}
                      value={draft[key]}
                      onChange={(value) => set(key, value)}
                    />
                  ))}
                </Section>
              </div>
              <div
                id="cv-ai-panel"
                role="tabpanel"
                aria-labelledby="cv-ai-tab"
                hidden={tab !== "ai"}
              >
                <CvAiEditor
                  key={editor.documentId}
                  draft={draft}
                  getDraft={editor.getDraft}
                  onChange={update}
                />
              </div>
            </>
          )}
        </div>
        <aside className="cv-preview-pane" aria-label="Live CV preview">
          <div className="cv-preview-label">
            <span>
              <span className="cv-live-dot" />
              Live preview
            </span>
            <span>Clean & professional</span>
          </div>
          <div className="cv-paper">
            {blocks.length ? (
              blocks.map((block, index) =>
                block.kind === "name" ? (
                  <h2 key={index} className="cv-print-name">
                    {block.text}
                  </h2>
                ) : block.kind === "heading" ? (
                  <h3 key={index} className="cv-print-heading">
                    {block.text}
                  </h3>
                ) : (
                  <p key={index} className={`cv-print-${block.kind}`}>
                    {block.kind === "bullet" && (
                      <span aria-hidden="true">• </span>
                    )}
                    {block.text}
                  </p>
                ),
              )
            ) : (
              <div className="cv-preview-empty">
                <span className="cv-empty-rule" />
                <h2>
                  Your next chapter
                  <br />
                  starts here.
                </h2>
                <p>Add your details to see your CV take shape.</p>
              </div>
            )}
          </div>
          <p className="cv-preview-footnote">
            Downloads include your latest edits. Longer CVs flow onto additional
            pages.
          </p>
        </aside>
      </div>
    </section>
  );
}
