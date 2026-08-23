"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  buildJobInterviewSessionRequestFromDraft,
  createDefaultInterviewOnboardingDraft,
  prefillDraftFromPrivateTarget,
  prefillDraftFromPublicTarget,
  requiredOnboardingMissingFields,
  roleSpecificFocusDescriptor,
  sanitizeInterviewOnboardingDraft,
  type InterviewOnboardingDraft,
  type InterviewOnboardingOptions,
} from "@/lib/interviews/interview-onboarding-contracts";

type SelectOption = {
  id: string;
  label: string;
  description?: string | null;
  searchText: string;
};

type ApiErrorBody = {
  error?: string;
  code?: string;
  issues?: Array<{ message?: string }>;
};

const STORAGE_KEY = "jobready-interview-onboarding-draft-v1";
const DRAFT_SCHEMA_VERSION = "task17.v1";

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function idempotencyKey() {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `job-onboarding-${Date.now().toString(36)}-${random}`;
}

function searchableText(option: SelectOption) {
  return `${option.label} ${option.description ?? ""} ${option.searchText}`;
}

function optionVisible(option: SelectOption, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return searchableText(option).toLowerCase().includes(normalized);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="text-[10px] font-medium leading-4 text-danger" role="alert">
      {message}
    </p>
  );
}

function SearchableSelect({
  label,
  helper,
  value,
  options,
  onChange,
  placeholder = "Choose an option",
  emptyText = "No matching options.",
  required = false,
  disabled = false,
  allowEmpty = true,
  error,
}: {
  label: string;
  helper?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  required?: boolean;
  disabled?: boolean;
  allowEmpty?: boolean;
  error?: string;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.id === value) ?? null;
  const visible = options.filter((option) => optionVisible(option, query));
  const selectOptions =
    selected && !visible.some((option) => option.id === selected.id)
      ? [selected, ...visible]
      : visible;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={`${id}-search`}
        className="text-[11px] font-semibold text-foreground"
      >
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {helper ? (
        <p id={helperId} className="text-[10px] leading-4 text-muted">
          {helper}
        </p>
      ) : null}
      <input
        id={`${id}-search`}
        type="search"
        value={query}
        disabled={disabled}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search ${label.toLowerCase()}`}
        aria-describedby={helper ? helperId : undefined}
        className="h-9 rounded-lg border border-muted-line bg-surface px-3 text-[11px] font-medium text-foreground outline-none transition duration-200 ease-soft placeholder:text-muted-subtle focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-surface-soft"
      />
      <select
        value={value}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={classes(helper ? helperId : null, error ? errorId : null)}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-lg border border-muted-line bg-surface px-3 py-2 text-[11px] font-semibold text-foreground outline-none transition duration-200 ease-soft focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-surface-soft"
      >
        {allowEmpty ? <option value="">{placeholder}</option> : null}
        {selectOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-muted-line bg-surface-soft px-3 py-2 text-[10px] font-medium text-muted">
          {emptyText}
        </p>
      ) : null}
      <span id={errorId}>
        <FieldError message={error} />
      </span>
    </div>
  );
}

function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  body,
  disabled = false,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  body: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={classes(
        "group relative min-h-[98px] cursor-pointer rounded-xl border bg-surface p-3.5 transition duration-200 ease-soft focus-within:ring-2 focus-within:ring-primary/15",
        checked
          ? "border-primary bg-primary-soft/60"
          : "border-muted-line hover:border-muted-line-strong hover:bg-surface-soft",
        disabled ? "cursor-not-allowed opacity-55" : null,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={classes(
          "absolute right-3.5 top-3.5 h-3.5 w-3.5 rounded-full border transition duration-200",
          checked ? "border-primary bg-primary" : "border-muted-line-strong",
        )}
      />
      <span className="block pr-7 text-[12px] font-semibold leading-4 text-foreground">
        {title}
      </span>
      <span className="mt-1.5 block text-[10px] leading-[1.5] text-muted">
        {body}
      </span>
    </label>
  );
}

function LoadingShell() {
  return (
    <div className="rounded-2xl border border-muted-line bg-surface p-4">
      <div className="grid gap-3">
        <div className="h-4 w-36 rounded-md skeleton-shimmer" />
        <div className="h-10 rounded-lg skeleton-shimmer" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-28 rounded-xl skeleton-shimmer" />
          <div className="h-28 rounded-xl skeleton-shimmer" />
        </div>
        <div className="h-20 rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}

function storageValue(draft: InterviewOnboardingDraft) {
  return JSON.stringify({
    schemaVersion: DRAFT_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    draft,
  });
}

function readStoredDraft() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  const parsed = JSON.parse(raw) as {
    schemaVersion?: string;
    draft?: unknown;
  };
  if (parsed.schemaVersion !== DRAFT_SCHEMA_VERSION) return null;

  return sanitizeInterviewOnboardingDraft(parsed.draft);
}

function requiredSetupComplete(
  draft: InterviewOnboardingDraft,
  options: InterviewOnboardingOptions,
) {
  const fieldErrors = requiredOnboardingMissingFields(
    {
      ...draft,
      candidateDocumentChoice: "skip",
      candidateDocumentVersionId: "",
    },
    options,
  );

  return Object.keys(fieldErrors).length === 0;
}

function selectedDocument(
  draft: InterviewOnboardingDraft,
  options: InterviewOnboardingOptions,
) {
  return (
    options.candidateDocuments.find(
      (document) => document.versionId === draft.candidateDocumentVersionId,
    ) ?? options.candidateDocuments.at(0) ?? null
  );
}

function focusModeText(value: InterviewOnboardingDraft["focusMode"]) {
  if (value === "behavioral_focus") return "Behavioral Focus";
  if (value === "role_specific_focus") return "Role-specific Focus";
  return "Recommended";
}

export function JobInterviewOnboardingClient({
  options,
  initialDraft,
}: {
  options: InterviewOnboardingOptions;
  initialDraft: InterviewOnboardingDraft;
}) {
  const router = useRouter();
  const [draftReady, setDraftReady] = useState(false);
  const [draft, setDraft] = useState(initialDraft);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [statusText, setStatusText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const pending = submitting || isNavigating;
  const setupComplete = requiredSetupComplete(draft, options);
  const roleSpecific = roleSpecificFocusDescriptor(draft, options);
  const filteredCompanies = options.companies.filter(
    (company) => !draft.marketId || company.marketId === draft.marketId,
  );
  const filteredRoles = options.jobRoles.filter((role) => {
    if (draft.roleFamilyId && role.roleFamilyId !== draft.roleFamilyId) {
      return false;
    }
    if (role.marketId && draft.marketId && role.marketId !== draft.marketId) {
      return false;
    }
    if (role.companyId && draft.companyId && role.companyId !== draft.companyId) {
      return false;
    }
    if (role.companyId && !draft.companyId) return false;

    return true;
  });
  const publicTarget = options.publicTargets.find(
    (target) => target.jobPostingVersionId === draft.publicJobPostingVersionId,
  );
  const privateTarget = options.privateTargets.find(
    (target) =>
      target.privateJobTargetVersionId === draft.privateJobTargetVersionId,
  );
  const cvDocument = selectedDocument(draft, options);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        setDraft(readStoredDraft() ?? initialDraft);
      } catch {
        setDraft(initialDraft);
      } finally {
        setDraftReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [initialDraft]);

  useEffect(() => {
    if (!draftReady) return;

    window.localStorage.setItem(STORAGE_KEY, storageValue(draft));
  }, [draft, draftReady]);

  function patchDraft(patch: Partial<InterviewOnboardingDraft>) {
    setDraft((current) => sanitizeInterviewOnboardingDraft({ ...current, ...patch }));
    setFieldErrors({});
    setFormError("");
  }

  function resetDraft() {
    const next = createDefaultInterviewOnboardingDraft(options);
    window.localStorage.removeItem(STORAGE_KEY);
    setDraft(next);
    setFieldErrors({});
    setFormError("");
    setStatusText("Draft reset.");
  }

  function changeEntryPath(value: string) {
    const entryPath = value as InterviewOnboardingDraft["entryPath"];
    if (entryPath === "public_job") {
      const selected =
        publicTarget?.jobPostingVersionId ??
        options.publicTargets.at(0)?.jobPostingVersionId;
      if (selected) {
        setDraft((current) =>
          prefillDraftFromPublicTarget(current, options, selected),
        );
        return;
      }
    }

    if (entryPath === "private_job") {
      const selected =
        privateTarget?.privateJobTargetVersionId ??
        options.privateTargets.at(0)?.privateJobTargetVersionId;
      if (selected) {
        setDraft((current) =>
          prefillDraftFromPrivateTarget(current, options, selected),
        );
        return;
      }
    }

    patchDraft({ entryPath });
  }

  function changeRoleFamily(value: string) {
    const nextRole =
      options.jobRoles.find(
        (role) =>
          role.roleFamilyId === value &&
          (!role.marketId || role.marketId === draft.marketId) &&
          (!role.companyId || role.companyId === draft.companyId),
      ) ?? null;

    patchDraft({
      roleFamilyId: value,
      jobRoleId: nextRole?.id ?? "",
    });
  }

  function changeCompanyMode(value: string) {
    if (value === "listed") {
      patchDraft({
        companyId: filteredCompanies.at(0)?.id ?? options.defaults.companyId,
        otherCompanyName: "",
      });
      return;
    }

    patchDraft({ companyId: "", otherCompanyName: draft.otherCompanyName });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});
    setStatusText("");

    const build = buildJobInterviewSessionRequestFromDraft({
      draft,
      options,
      idempotencyKey: idempotencyKey(),
    });

    if (!build.ok) {
      setFieldErrors(build.fieldErrors);
      setFormError(build.fieldErrors.form ?? "Complete the required setup.");
      return;
    }

    setSubmitting(true);
    setStatusText("Creating your interview setup.");

    try {
      const response = await fetch("/api/job-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(build.input),
      });
      const body = (await response.json().catch(() => ({}))) as ApiErrorBody & {
        session?: { id?: string };
      };

      if (!response.ok || !body.session?.id) {
        const issue = body.issues?.find((item) => item.message)?.message;
        throw new Error(body.error ?? issue ?? "Could not create interview.");
      }

      window.localStorage.removeItem(STORAGE_KEY);
      setStatusText("Interview setup created. Opening preparation.");
      startTransition(() => {
        router.push(`/interviews/${body.session?.id}/prepare`);
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not create this interview setup.",
      );
      setStatusText("");
    } finally {
      setSubmitting(false);
    }
  }

  if (!draftReady) return <LoadingShell />;

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="rounded-2xl border border-muted-line bg-surface p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-semibold text-primary">
              Step 1
            </p>
            <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.025em] text-foreground">
              Choose your interview path
            </h2>
            <p className="mt-1.5 max-w-2xl text-[10px] leading-4 text-muted">
              Start from a saved public job, a private target, or a standalone
              company and role. Jobs and CVs stay optional.
            </p>
          </div>
          <button
            type="button"
            onClick={resetDraft}
            className="rounded-lg border border-muted-line px-3 py-2 text-[10px] font-semibold text-muted transition duration-200 ease-soft hover:border-primary hover:text-primary active:scale-press"
          >
            Reset draft
          </button>
        </div>

        <fieldset className="mt-4">
          <legend className="sr-only">Interview entry path</legend>
          <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr]">
            <RadioCard
              name="entry-path"
              value="standalone"
              checked={draft.entryPath === "standalone"}
              onChange={changeEntryPath}
              title="Standalone company/role"
              body="Prepare without attaching a job. Use a listed company or Other Company with role fallback."
            />
            <RadioCard
              name="entry-path"
              value="public_job"
              checked={draft.entryPath === "public_job"}
              onChange={changeEntryPath}
              title="Public job target"
              body="Prefill from a stored public job version so company, market, role, and seniority stay traceable."
              disabled={options.publicTargets.length === 0}
            />
            <RadioCard
              name="entry-path"
              value="private_job"
              checked={draft.entryPath === "private_job"}
              onChange={changeEntryPath}
              title="Private target"
              body="Use a private saved target or application context without publishing that target."
              disabled={options.privateTargets.length === 0}
            />
          </div>
        </fieldset>

        {draft.entryPath === "public_job" ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-muted-line bg-surface-soft p-3.5">
            <SearchableSelect
              label="Public job"
              helper="Search by title, company, market, role, location, source, or application host."
              value={draft.publicJobPostingVersionId}
              options={options.publicTargets.map((target) => ({
                id: target.jobPostingVersionId,
                label: `${target.title} at ${target.companyLabel}`,
                description: `${target.roleFamilyLabel} / ${target.status}`,
                searchText: target.searchText,
              }))}
              onChange={(value) =>
                setDraft((current) =>
                  prefillDraftFromPublicTarget(current, options, value),
                )
              }
              emptyText="No public jobs match that search."
              error={fieldErrors.publicJobPostingVersionId}
            />
            {publicTarget ? (
              <div className="rounded-lg border border-accent/35 bg-surface px-3 py-2.5 text-[10px] leading-4 text-muted">
                <p className="font-semibold text-accent-strong">
                  Trustworthy prefill
                </p>
                <p className="mt-1.5">
                  {publicTarget.prefillSourceLabel} Selected context:
                  {" "}
                  {publicTarget.companyLabel}, {publicTarget.marketLabel},{" "}
                  {publicTarget.jobRoleLabel ?? publicTarget.roleFamilyLabel}
                  {publicTarget.seniorityLabel
                    ? `, ${publicTarget.seniorityLabel}`
                    : ""}
                  .
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {draft.entryPath === "private_job" ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-muted-line bg-surface-soft p-3.5">
            <SearchableSelect
              label="Private target"
              helper="Search your private saved targets by role, company, market, or requirements."
              value={draft.privateJobTargetVersionId}
              options={options.privateTargets.map((target) => ({
                id: target.privateJobTargetVersionId,
                label: `${target.title}${target.companyLabel ? ` at ${target.companyLabel}` : ""}`,
                description: target.roleFamilyLabel,
                searchText: target.searchText,
              }))}
              onChange={(value) =>
                setDraft((current) =>
                  prefillDraftFromPrivateTarget(current, options, value),
                )
              }
              emptyText="No private targets match that search."
              error={fieldErrors.privateJobTargetVersionId}
            />
            {privateTarget ? (
              <div className="rounded-lg border border-accent/35 bg-surface px-3 py-2.5 text-[10px] leading-4 text-muted">
                <p className="font-semibold text-accent-strong">
                  Private prefill
                </p>
                <p className="mt-1.5">
                  This uses your private target version {privateTarget.versionNumber}.
                  If a field was missing, the role controls below provide the
                  fallback used for the session.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <section className="rounded-2xl border border-muted-line bg-surface p-4">
        <p className="text-[10px] font-semibold text-primary">
          Required setup
        </p>
        <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.025em] text-foreground">
          Market, role, seniority
        </h2>
        <p className="mt-1.5 max-w-2xl text-[10px] leading-4 text-muted">
          You choose familiar job language. Jiandae maps it to reviewed
          interview plans internally, without asking you to configure rubrics.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <SearchableSelect
            label="Market"
            helper="English-first setup for Kenya launch content."
            value={draft.marketId}
            options={options.markets}
            onChange={(value) => patchDraft({ marketId: value })}
            required
            allowEmpty={false}
            error={fieldErrors.marketId}
          />

          <fieldset className="grid gap-2.5">
            <legend className="text-[11px] font-semibold text-foreground">
              Company
            </legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <RadioCard
                name="company-mode"
                value="listed"
                checked={Boolean(draft.companyId)}
                onChange={changeCompanyMode}
                title="Listed company"
                body="Use reviewed company context where available."
              />
              <RadioCard
                name="company-mode"
                value="other"
                checked={!draft.companyId}
                onChange={changeCompanyMode}
                title="Other Company"
                body="Use the role and industry fallback when company-specific content is unsupported."
              />
            </div>
          </fieldset>

          {draft.companyId ? (
            <SearchableSelect
              label="Company from reviewed list"
              helper="Search by company, industry, careers URL, or focus area."
              value={draft.companyId}
              options={filteredCompanies}
              onChange={(value) =>
                patchDraft({ companyId: value, otherCompanyName: "" })
              }
              required
              allowEmpty={false}
              emptyText="No listed companies match that market search."
              error={fieldErrors.companyId}
            />
          ) : (
            <div className="grid gap-1.5 rounded-xl border border-accent/35 bg-surface-soft p-3.5">
              <label
                htmlFor="other-company-name"
                className="text-[11px] font-semibold text-foreground"
              >
                Other company name
              </label>
              <input
                id="other-company-name"
                type="text"
                value={draft.otherCompanyName}
                onChange={(event) =>
                  patchDraft({ otherCompanyName: event.target.value })
                }
                placeholder="Example: Nairobi fintech, county agency, NGO"
                className="h-10 rounded-lg border border-muted-line bg-surface px-3 text-[11px] font-medium text-foreground outline-none transition duration-200 ease-soft placeholder:text-muted-subtle focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <p className="text-[10px] leading-4 text-muted">
                If we do not have reviewed company-specific content, the session
                uses the selected market, role, seniority, and industry-style
                questions. The company name is stored as a client label only.
              </p>
              <FieldError message={fieldErrors.otherCompanyName} />
            </div>
          )}

          <SearchableSelect
            label="Role area"
            helper="Broad area such as Product Management or Software Engineering."
            value={draft.roleFamilyId}
            options={options.roleFamilies}
            onChange={changeRoleFamily}
            required
            allowEmpty={false}
            error={fieldErrors.roleFamilyId}
          />

          <SearchableSelect
            label="Role"
            helper="Choose the closest role title. The role remains optional when a target lacks an exact match."
            value={draft.jobRoleId}
            options={filteredRoles}
            onChange={(value) => patchDraft({ jobRoleId: value })}
            placeholder="No exact role"
            emptyText="No roles match. Broaden the role area or use no exact role."
            error={fieldErrors.jobRoleId}
          />

          <SearchableSelect
            label="Seniority"
            helper="This keeps question difficulty aligned with your job level."
            value={draft.seniorityLevelId}
            options={options.seniorityLevels}
            onChange={(value) => patchDraft({ seniorityLevelId: value })}
            required
            allowEmpty={false}
            error={fieldErrors.seniorityLevelId}
          />

          <SearchableSelect
            label="Interview stage"
            helper="Optional. Leave blank if you are not sure yet."
            value={draft.interviewStageId}
            options={options.interviewStages}
            onChange={(value) => patchDraft({ interviewStageId: value })}
            placeholder="No stage selected"
            error={fieldErrors.interviewStageId}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-muted-line bg-surface p-4">
        <p className="text-[10px] font-semibold text-primary">
          Practice shape
        </p>
        <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.025em] text-foreground">
          Focus, mode, duration
        </h2>

        <fieldset className="mt-4">
          <legend className="sr-only">Interview focus</legend>
          <div className="grid gap-3 lg:grid-cols-3">
            <RadioCard
              name="focus-mode"
              value="recommended"
              checked={draft.focusMode === "recommended"}
              onChange={(value) =>
                patchDraft({
                  focusMode: value as InterviewOnboardingDraft["focusMode"],
                })
              }
              title="Recommended"
              body="Balanced coverage across behavioral, role, and practical readiness. This is the default."
            />
            <RadioCard
              name="focus-mode"
              value="behavioral_focus"
              checked={draft.focusMode === "behavioral_focus"}
              onChange={(value) =>
                patchDraft({
                  focusMode: value as InterviewOnboardingDraft["focusMode"],
                })
              }
              title="Behavioral Focus"
              body="More practice on STAR stories, ownership, judgment, communication, and evidence."
            />
            <RadioCard
              name="focus-mode"
              value="role_specific_focus"
              checked={draft.focusMode === "role_specific_focus"}
              onChange={(value) =>
                patchDraft({
                  focusMode: value as InterviewOnboardingDraft["focusMode"],
                })
              }
              title={roleSpecific.label}
              body={roleSpecific.description}
            />
          </div>
        </fieldset>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold text-foreground">
              Mode
            </span>
            <select
              value={draft.interviewMode}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                patchDraft({
                  interviewMode: event.target
                    .value as InterviewOnboardingDraft["interviewMode"],
                })
              }
              className="h-10 rounded-lg border border-muted-line bg-surface px-3 text-[11px] font-semibold text-foreground outline-none transition duration-200 ease-soft focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="text">Text interview</option>
              <option value="voice">Voice interview</option>
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold text-foreground">
              Duration
            </span>
            <select
              value={draft.durationMinutes}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                patchDraft({ durationMinutes: Number(event.target.value) })
              }
              className="h-10 rounded-lg border border-muted-line bg-surface px-3 text-[11px] font-semibold text-foreground outline-none transition duration-200 ease-soft focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {[15, 25, 30, 45, 60].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold text-foreground">
              Language
            </span>
            <select
              value={draft.language}
              onChange={() => patchDraft({ language: "en" })}
              className="h-10 rounded-lg border border-muted-line bg-surface px-3 text-[11px] font-semibold text-foreground outline-none transition duration-200 ease-soft focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="en">English</option>
            </select>
            <span className="text-[10px] leading-4 text-muted">
              More languages can be added after the English-first launch.
            </span>
          </label>
        </div>
      </section>

      <section
        className={classes(
          "rounded-2xl border bg-surface p-4 transition duration-200",
          setupComplete ? "border-muted-line" : "border-muted-line opacity-75",
        )}
      >
        <p className="text-[10px] font-semibold text-primary">
          Optional personalization
        </p>
        <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.025em] text-foreground">
          CV/resume context
        </h2>
        <p className="mt-1.5 max-w-2xl text-[10px] leading-4 text-muted">
          This appears after required setup and never blocks interview creation.
          There is no upload here.
        </p>

        {!setupComplete ? (
          <p className="mt-3 rounded-lg border border-dashed border-muted-line bg-surface-soft px-3 py-2.5 text-[10px] font-medium text-muted">
            Complete market, role, seniority, and any selected target first.
            You can still skip CV.
          </p>
        ) : null}

        <fieldset className="mt-4" disabled={!setupComplete}>
          <legend className="sr-only">CV personalization choice</legend>
          <div className="grid gap-3 md:grid-cols-2">
            <RadioCard
              name="cv-choice"
              value="skip"
              checked={draft.candidateDocumentChoice === "skip"}
              onChange={() =>
                patchDraft({
                  candidateDocumentChoice: "skip",
                  candidateDocumentVersionId: "",
                })
              }
              title="Skip CV"
              body="Create the interview from role, company, target, seniority, and selected focus only."
              disabled={!setupComplete}
            />
            <RadioCard
              name="cv-choice"
              value="use"
              checked={draft.candidateDocumentChoice === "use"}
              onChange={() =>
                patchDraft({
                  candidateDocumentChoice: "use",
                  candidateDocumentVersionId: cvDocument?.versionId ?? "",
                })
              }
              title="Use selected CV/resume"
              body="Add allowlisted structured facts from one parsed document version to personalize prompts."
              disabled={!setupComplete || options.candidateDocuments.length === 0}
            />
          </div>
        </fieldset>

        {setupComplete &&
        draft.candidateDocumentChoice === "use" &&
        options.candidateDocuments.length > 0 ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-muted-line bg-surface-soft p-3.5">
            <SearchableSelect
              label="CV/resume version"
              helper="Choose one already parsed version. Uploading belongs to the documents flow, not this setup."
              value={draft.candidateDocumentVersionId || cvDocument?.versionId || ""}
              options={options.candidateDocuments.map((document) => ({
                id: document.versionId,
                label: `${document.title} - version ${document.versionNumber}`,
                description: `${document.factCount} available structured facts`,
                searchText: `${document.title} ${document.kind} ${document.status}`,
              }))}
              onChange={(value) =>
                patchDraft({ candidateDocumentVersionId: value })
              }
              allowEmpty={false}
              error={fieldErrors.candidateDocumentVersionId}
            />
            {cvDocument ? (
              <div className="rounded-lg border border-accent/35 bg-surface p-3 text-[10px] leading-4 text-muted">
                <p className="font-semibold text-accent-strong">
                  Exactly what will be used
                </p>
                <p className="mt-1.5">
                  Jiandae will use up to 10 structured facts from this version:
                  fact labels, skill names, confirmation status, evidence type,
                  and short source excerpts. It will not use raw file text,
                  private storage objects, other documents, or upload metadata.
                </p>
                {cvDocument.facts.length > 0 ? (
                  <ul className="mt-2.5 grid gap-1.5">
                    {cvDocument.facts.map((fact) => (
                      <li
                        key={fact.id}
                        className="rounded-lg border border-muted-line bg-surface-soft px-3 py-2"
                      >
                        <span className="font-semibold text-foreground">
                          {fact.label}
                        </span>
                        {fact.skillName ? (
                          <span> / {fact.skillName}</span>
                        ) : null}
                        {fact.sourceExcerpt ? (
                          <span className="block text-muted">
                            {fact.sourceExcerpt}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2.5 rounded-lg border border-dashed border-muted-line bg-surface-soft px-3 py-2 font-medium text-muted">
                    This document has no allowlisted facts yet. Skip CV for now.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {setupComplete && options.candidateDocuments.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-muted-line bg-surface-soft px-3 py-2.5 text-[10px] font-medium text-muted">
            No parsed CV/resume is available yet. Choose Skip CV and start from
            the job setup.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-primary bg-primary p-4 text-white">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold text-white/58">
              Review
            </p>
            <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.025em]">
              {focusModeText(draft.focusMode)} / {draft.durationMinutes} minutes
            </h2>
            <p className="mt-1.5 max-w-2xl text-[10px] leading-4 text-white/70">
              Submitting creates one valid job-interview session, reserves one
              interview credit, persists the selected question set, and routes
              you to preparation.
            </p>
            {draft.companyId ? null : (
              <p className="mt-2.5 rounded-lg border border-accent/35 bg-accent/10 px-3 py-2.5 text-[10px] leading-4 text-accent-soft">
                Other Company is active. Company-specific content will fall back
                to reviewed role and industry-style coverage.
              </p>
            )}
            {formError ? (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-danger/25 bg-danger-surface px-3 py-2.5 text-[10px] font-semibold text-danger"
              >
                {formError}
              </p>
            ) : null}
            <p className="sr-only" aria-live="polite">
              {statusText}
            </p>
            {statusText ? (
              <p className="mt-2.5 text-[10px] font-medium text-white/70">
                {statusText}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-10 min-w-[180px] items-center justify-center rounded-lg bg-accent px-4 text-[11px] font-semibold text-foreground transition duration-200 ease-soft hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/30 active:scale-press disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Creating setup" : "Create interview setup"}
          </button>
        </div>
      </section>
    </form>
  );
}
