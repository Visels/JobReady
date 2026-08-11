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
    <p className="text-[12px] font-semibold leading-5 text-danger" role="alert">
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
    <div className="grid gap-2">
      <label
        htmlFor={`${id}-search`}
        className="text-[13px] font-black uppercase tracking-[0.14em] text-[#173a32]"
      >
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {helper ? (
        <p id={helperId} className="text-[13px] leading-5 text-[#5f6b67]">
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
        className="h-11 rounded-2xl border border-[#d8cbb9] bg-white px-4 text-[14px] font-semibold text-[#071512] outline-none transition duration-300 ease-soft placeholder:text-[#8a8075] focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/15 disabled:cursor-not-allowed disabled:bg-[#f4efe7]"
      />
      <select
        value={value}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={classes(helper ? helperId : null, error ? errorId : null)}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-2xl border border-[#d8cbb9] bg-white px-4 py-3 text-[14px] font-bold text-[#071512] outline-none transition duration-300 ease-soft focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/15 disabled:cursor-not-allowed disabled:bg-[#f4efe7]"
      >
        {allowEmpty ? <option value="">{placeholder}</option> : null}
        {selectOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#d8cbb9] bg-[#fffaf3] px-4 py-3 text-[13px] font-semibold text-[#6a5b49]">
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
        "group relative min-h-32 cursor-pointer rounded-[1.6rem] border bg-white p-5 transition duration-300 ease-soft focus-within:ring-4 focus-within:ring-[#00533f]/15",
        checked
          ? "border-[#00533f] shadow-[0_18px_48px_rgba(0,83,63,0.12)]"
          : "border-[#d8cbb9] hover:-translate-y-0.5 hover:border-[#bca875]",
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
          "absolute right-5 top-5 h-4 w-4 rounded-full border transition duration-300",
          checked ? "border-[#00533f] bg-[#00533f]" : "border-[#b9a996]",
        )}
      />
      <span className="block pr-8 text-[16px] font-black leading-5 text-[#071512]">
        {title}
      </span>
      <span className="mt-3 block text-[13px] leading-5 text-[#52605b]">
        {body}
      </span>
    </label>
  );
}

function LoadingShell() {
  return (
    <div className="rounded-[2rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_18px_52px_rgba(21,35,29,0.06)]">
      <div className="grid gap-4">
        <div className="h-5 w-44 rounded-full skeleton-shimmer" />
        <div className="h-16 rounded-[1.4rem] skeleton-shimmer" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 rounded-[1.4rem] skeleton-shimmer" />
          <div className="h-40 rounded-[1.4rem] skeleton-shimmer" />
        </div>
        <div className="h-24 rounded-[1.4rem] skeleton-shimmer" />
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
    <form onSubmit={submit} className="grid gap-6">
      <div className="rounded-[2rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)] md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#956615]">
              Step 1
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#071512]">
              Choose your interview path
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#52605b]">
              Start from a saved public job, a private target, or a standalone
              company and role. Jobs and CVs stay optional.
            </p>
          </div>
          <button
            type="button"
            onClick={resetDraft}
            className="rounded-full border border-[#d9cbb8] px-4 py-2 text-[12px] font-black uppercase tracking-[0.14em] text-[#52605b] transition duration-300 ease-soft hover:-translate-y-0.5 hover:border-[#00533f] hover:text-[#00533f] active:scale-press"
          >
            Reset draft
          </button>
        </div>

        <fieldset className="mt-5">
          <legend className="sr-only">Interview entry path</legend>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
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
          <div className="mt-5 grid gap-4 rounded-[1.6rem] border border-[#eadfce] bg-[#fffaf3] p-4">
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
              <div className="rounded-[1.3rem] border border-[#d7a84f]/50 bg-white px-4 py-3 text-[13px] leading-5 text-[#52605b]">
                <p className="font-black uppercase tracking-[0.14em] text-[#6c4b00]">
                  Trustworthy prefill
                </p>
                <p className="mt-2">
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
          <div className="mt-5 grid gap-4 rounded-[1.6rem] border border-[#eadfce] bg-[#fffaf3] p-4">
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
              <div className="rounded-[1.3rem] border border-[#d7a84f]/50 bg-white px-4 py-3 text-[13px] leading-5 text-[#52605b]">
                <p className="font-black uppercase tracking-[0.14em] text-[#6c4b00]">
                  Private prefill
                </p>
                <p className="mt-2">
                  This uses your private target version {privateTarget.versionNumber}.
                  If a field was missing, the role controls below provide the
                  fallback used for the session.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <section className="rounded-[2rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)] md:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#956615]">
          Required setup
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#071512]">
          Market, role, seniority
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#52605b]">
          You choose familiar job language. Jiandae maps it to reviewed
          interview plans internally, without asking you to configure rubrics.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
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

          <fieldset className="grid gap-3">
            <legend className="text-[13px] font-black uppercase tracking-[0.14em] text-[#173a32]">
              Company
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="grid gap-2 rounded-[1.5rem] border border-[#d7a84f]/50 bg-[#fffaf3] p-4">
              <label
                htmlFor="other-company-name"
                className="text-[13px] font-black uppercase tracking-[0.14em] text-[#173a32]"
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
                className="h-12 rounded-2xl border border-[#d8cbb9] bg-white px-4 text-[14px] font-semibold text-[#071512] outline-none transition duration-300 ease-soft placeholder:text-[#8a8075] focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/15"
              />
              <p className="text-[13px] leading-5 text-[#5f6b67]">
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

      <section className="rounded-[2rem] border border-[#d9cbb8] bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)] md:p-6">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#956615]">
          Practice shape
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#071512]">
          Focus, mode, duration
        </h2>

        <fieldset className="mt-5">
          <legend className="sr-only">Interview focus</legend>
          <div className="grid gap-4 lg:grid-cols-3">
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

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-[13px] font-black uppercase tracking-[0.14em] text-[#173a32]">
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
              className="h-12 rounded-2xl border border-[#d8cbb9] bg-white px-4 text-[14px] font-bold text-[#071512] outline-none transition duration-300 ease-soft focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/15"
            >
              <option value="text">Text interview</option>
              <option value="voice">Voice interview</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-[13px] font-black uppercase tracking-[0.14em] text-[#173a32]">
              Duration
            </span>
            <select
              value={draft.durationMinutes}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                patchDraft({ durationMinutes: Number(event.target.value) })
              }
              className="h-12 rounded-2xl border border-[#d8cbb9] bg-white px-4 text-[14px] font-bold text-[#071512] outline-none transition duration-300 ease-soft focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/15"
            >
              {[15, 25, 30, 45, 60].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-[13px] font-black uppercase tracking-[0.14em] text-[#173a32]">
              Language
            </span>
            <select
              value={draft.language}
              onChange={() => patchDraft({ language: "en" })}
              className="h-12 rounded-2xl border border-[#d8cbb9] bg-white px-4 text-[14px] font-bold text-[#071512] outline-none transition duration-300 ease-soft focus:border-[#00533f] focus:ring-4 focus:ring-[#00533f]/15"
            >
              <option value="en">English</option>
            </select>
            <span className="text-[12px] leading-5 text-[#5f6b67]">
              More languages can be added after the English-first launch.
            </span>
          </label>
        </div>
      </section>

      <section
        className={classes(
          "rounded-[2rem] border bg-white p-5 shadow-[0_18px_52px_rgba(21,35,29,0.06)] transition duration-300 md:p-6",
          setupComplete ? "border-[#d9cbb8]" : "border-[#eadfce] opacity-80",
        )}
      >
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#956615]">
          Optional personalization
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#071512]">
          CV/resume context
        </h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#52605b]">
          This appears after required setup and never blocks interview creation.
          There is no upload here.
        </p>

        {!setupComplete ? (
          <p className="mt-4 rounded-[1.4rem] border border-dashed border-[#d8cbb9] bg-[#fffaf3] px-4 py-3 text-[13px] font-semibold text-[#6a5b49]">
            Complete market, role, seniority, and any selected target first.
            You can still skip CV.
          </p>
        ) : null}

        <fieldset className="mt-5" disabled={!setupComplete}>
          <legend className="sr-only">CV personalization choice</legend>
          <div className="grid gap-4 md:grid-cols-2">
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
          <div className="mt-5 grid gap-4 rounded-[1.6rem] border border-[#eadfce] bg-[#fffaf3] p-4">
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
              <div className="rounded-[1.4rem] border border-[#d7a84f]/50 bg-white p-4 text-[13px] leading-5 text-[#52605b]">
                <p className="font-black uppercase tracking-[0.14em] text-[#6c4b00]">
                  Exactly what will be used
                </p>
                <p className="mt-2">
                  Jiandae will use up to 10 structured facts from this version:
                  fact labels, skill names, confirmation status, evidence type,
                  and short source excerpts. It will not use raw file text,
                  private storage objects, other documents, or upload metadata.
                </p>
                {cvDocument.facts.length > 0 ? (
                  <ul className="mt-3 grid gap-2">
                    {cvDocument.facts.map((fact) => (
                      <li
                        key={fact.id}
                        className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-3 py-2"
                      >
                        <span className="font-bold text-[#173a32]">
                          {fact.label}
                        </span>
                        {fact.skillName ? (
                          <span> / {fact.skillName}</span>
                        ) : null}
                        {fact.sourceExcerpt ? (
                          <span className="block text-[#697671]">
                            {fact.sourceExcerpt}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-2xl border border-dashed border-[#d8cbb9] bg-[#fffaf3] px-3 py-2 font-semibold text-[#6a5b49]">
                    This document has no allowlisted facts yet. Skip CV for now.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {setupComplete && options.candidateDocuments.length === 0 ? (
          <p className="mt-5 rounded-[1.4rem] border border-dashed border-[#d8cbb9] bg-[#fffaf3] px-4 py-3 text-[13px] font-semibold text-[#6a5b49]">
            No parsed CV/resume is available yet. Choose Skip CV and start from
            the job setup.
          </p>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-[#173a32] bg-[#071512] p-5 text-white shadow-[0_24px_70px_rgba(7,21,18,0.18)] md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#d7a84f]">
              Review
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
              {focusModeText(draft.focusMode)} / {draft.durationMinutes} minutes
            </h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-white/72">
              Submitting creates one valid job-interview session, reserves one
              interview credit, persists the selected question set, and routes
              you to preparation.
            </p>
            {draft.companyId ? null : (
              <p className="mt-3 rounded-2xl border border-[#d7a84f]/40 bg-[#d7a84f]/10 px-4 py-3 text-[13px] leading-5 text-[#ffe8ae]">
                Other Company is active. Company-specific content will fall back
                to reviewed role and industry-style coverage.
              </p>
            )}
            {formError ? (
              <p
                role="alert"
                className="mt-4 rounded-2xl border border-[#f7c9c6] bg-[#fff1ef] px-4 py-3 text-[13px] font-bold text-[#9a2218]"
              >
                {formError}
              </p>
            ) : null}
            <p className="sr-only" aria-live="polite">
              {statusText}
            </p>
            {statusText ? (
              <p className="mt-3 text-[13px] font-semibold text-white/72">
                {statusText}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-14 min-w-[220px] items-center justify-center rounded-full bg-[#d7a84f] px-7 text-[13px] font-black uppercase tracking-[0.16em] text-[#071512] shadow-[0_18px_44px_rgba(215,168,79,0.22)] transition duration-300 ease-soft hover:-translate-y-0.5 hover:bg-[#e6b94c] focus:outline-none focus:ring-4 focus:ring-[#d7a84f]/25 active:scale-press disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Creating setup" : "Create interview setup"}
          </button>
        </div>
      </section>
    </form>
  );
}
