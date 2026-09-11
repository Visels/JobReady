"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  MessageSquare,
  Mic,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  buildJobInterviewSessionRequestFromDraft,
  createDefaultInterviewOnboardingDraft,
  hasReviewedPlanForDraft,
  prefillDraftFromPrivateTarget,
  prefillDraftFromPublicTarget,
  roleSpecificFocusDescriptor,
  sanitizeInterviewOnboardingDraft,
  type InterviewOnboardingDraft,
  type InterviewOnboardingOptions,
} from "@/lib/interviews/interview-onboarding-contracts";

const STORAGE_KEY = "jobready-interview-onboarding-draft-v1";
const DRAFT_SCHEMA_VERSION = "task17.v2";
const controlClass =
  "min-h-[44px] w-full min-w-0 rounded-lg border border-muted-line bg-surface px-3 py-2 text-[14px] text-foreground outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-surface-soft disabled:text-muted";
const textButtonClass =
  "rounded-md text-[12px] font-semibold text-primary underline-offset-4 transition duration-200 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:opacity-50";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="grid min-w-0 content-start gap-2">
      <label htmlFor={id} className="text-[13px] font-semibold text-foreground">
        {label}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? `${id}-error` : undefined,
      })}
      {error ? (
        <p id={`${id}-error`} className="text-[12px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function readStoredDraft() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { schemaVersion?: string; draft?: unknown };
  return parsed.schemaVersion === DRAFT_SCHEMA_VERSION
    ? sanitizeInterviewOnboardingDraft(parsed.draft)
    : null;
}

function removeStoredDraft() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage is optional; an interview can still be created when it is blocked.
  }
}

export function JobInterviewOnboardingClient({
  options,
  initialDraft,
}: {
  options: InterviewOnboardingOptions;
  initialDraft: InterviewOnboardingDraft;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const requestKey = useRef<string | null>(null);
  const submitLock = useRef(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draft, setDraft] = useState(initialDraft);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [statusText, setStatusText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const [showJobs, setShowJobs] = useState(false);
  const [jobQuery, setJobQuery] = useState("");
  const [moreOptions, setMoreOptions] = useState(false);
  const pending = submitting || isNavigating;
  const roleSpecific = roleSpecificFocusDescriptor(draft, options);
  const publicTarget =
    draft.entryPath === "public_job"
      ? options.publicTargets.find(
          (target) =>
            target.jobPostingVersionId === draft.publicJobPostingVersionId,
        )
      : undefined;
  const privateTarget =
    draft.entryPath === "private_job"
      ? options.privateTargets.find(
          (target) =>
            target.privateJobTargetVersionId ===
            draft.privateJobTargetVersionId,
        )
      : undefined;
  const target = publicTarget ?? privateTarget;
  const roleLocked = Boolean(publicTarget || privateTarget?.jobRoleId);
  const companyLocked = Boolean(publicTarget || privateTarget?.companyId);
  const marketLocked = Boolean(publicTarget || privateTarget?.marketId);
  const companies = options.companies.filter(
    (company) => company.marketId === draft.marketId,
  );
  const roles = options.jobRoles.filter(
    (role) =>
      (!role.marketId || role.marketId === draft.marketId) &&
      (!role.companyId || role.companyId === draft.companyId),
  );
  const cvDocument = options.candidateDocuments.find(
    (document) => document.versionId === draft.candidateDocumentVersionId,
  );
  const market = options.markets.find((item) => item.id === draft.marketId);
  const focusLabel =
    draft.focusMode === "recommended"
      ? "Balanced questions"
      : draft.focusMode === "behavioral_focus"
        ? "Behavioral focus"
        : roleSpecific.label;
  const targetValue = publicTarget
    ? `public:${publicTarget.jobPostingVersionId}`
    : privateTarget
      ? `private:${privateTarget.privateJobTargetVersionId}`
      : "";
  const normalizedQuery = jobQuery.trim().toLowerCase();
  const publicJobs = options.publicTargets.filter(
    (item) =>
      item.jobPostingVersionId === publicTarget?.jobPostingVersionId ||
      `${item.title} ${item.companyLabel} ${item.searchText}`
        .toLowerCase()
        .includes(normalizedQuery),
  );
  const privateJobs = options.privateTargets.filter(
    (item) =>
      item.privateJobTargetVersionId ===
        privateTarget?.privateJobTargetVersionId ||
      `${item.title} ${item.companyLabel ?? ""} ${item.searchText}`
        .toLowerCase()
        .includes(normalizedQuery),
  );
  const hasJobs =
    options.publicTargets.length + options.privateTargets.length > 0;
  const reviewedPlanAvailable = hasReviewedPlanForDraft(draft, options);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        // A job opened from the jobs page always takes priority over an old draft.
        const restored =
          initialDraft.entryPath === "standalone" ? readStoredDraft() : null;
        let next = restored ?? initialDraft;
        if (next.entryPath === "public_job") {
          next = prefillDraftFromPublicTarget(
            next,
            options,
            next.publicJobPostingVersionId,
          );
        } else if (next.entryPath === "private_job") {
          next = prefillDraftFromPrivateTarget(
            next,
            options,
            next.privateJobTargetVersionId,
          );
        }
        setDraft(next);
      } catch {
        setDraft(initialDraft);
      } finally {
        setDraftReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [initialDraft, options]);

  useEffect(() => {
    if (!draftReady) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          schemaVersion: DRAFT_SCHEMA_VERSION,
          savedAt: new Date().toISOString(),
          draft,
        }),
      );
    } catch {
      // Do not make browser storage a requirement for interview practice.
    }
  }, [draft, draftReady]);

  function updateDraft(next: InterviewOnboardingDraft) {
    setDraft(next);
    requestKey.current = null;
    setFieldErrors({});
    setFormError("");
    setStatusText("");
  }

  function patchDraft(patch: Partial<InterviewOnboardingDraft>) {
    // Keep text as typed; trim and validate only when building the request.
    updateDraft({ ...draft, ...patch });
  }

  function changeContext(patch: Partial<InterviewOnboardingDraft>) {
    const next = { ...draft, ...patch };
    if (
      !options.companies.some(
        (company) =>
          company.id === next.companyId && company.marketId === next.marketId,
      )
    ) {
      next.companyId = "";
    }
    const role = options.jobRoles.find((item) => item.id === next.jobRoleId);
    if (
      role &&
      ((role.marketId && role.marketId !== next.marketId) ||
        (role.companyId && role.companyId !== next.companyId))
    ) {
      // Keep the role area when an exact company- or market-specific title no longer fits.
      next.jobRoleId = "";
    }
    updateDraft(next);
  }

  function chooseJob(value: string) {
    if (value.startsWith("public:")) {
      updateDraft(prefillDraftFromPublicTarget(draft, options, value.slice(7)));
    } else if (value.startsWith("private:")) {
      updateDraft(
        prefillDraftFromPrivateTarget(draft, options, value.slice(8)),
      );
    }
    setShowJobs(false);
    setJobQuery("");
  }

  function clearJob() {
    patchDraft({
      entryPath: "standalone",
      publicJobPostingVersionId: "",
      privateJobTargetVersionId: "",
    });
    setShowJobs(false);
  }

  function resetToDefaults() {
    removeStoredDraft();
    updateDraft(createDefaultInterviewOnboardingDraft(options));
    setShowJobs(false);
    setMoreOptions(false);
    setStatusText("Setup reset.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    setFormError("");
    setFieldErrors({});
    setStatusText("");
    requestKey.current ??= `job-onboarding-${crypto.randomUUID()}`;
    const build = buildJobInterviewSessionRequestFromDraft({
      draft,
      options,
      idempotencyKey: requestKey.current,
    });

    if (!build.ok) {
      setFieldErrors(build.fieldErrors);
      setFormError(
        build.fieldErrors.form ??
          "Check the highlighted details to start your interview.",
      );
      if (
        build.fieldErrors.marketId ||
        build.fieldErrors.interviewStageId ||
        build.fieldErrors.candidateDocumentVersionId
      )
        setMoreOptions(true);
      if (
        build.fieldErrors.publicJobPostingVersionId ||
        build.fieldErrors.privateJobTargetVersionId
      )
        setShowJobs(true);
      window.requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    setStatusText("Getting your interview ready…");
    try {
      const response = await fetch("/api/job-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(build.input),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        issues?: Array<{ message?: string }>;
        session?: { id?: string };
      };
      if (!response.ok || !body.session?.id) {
        throw new Error(
          body.error ??
            body.issues?.find((issue) => issue.message)?.message ??
            "Could not create your interview. Please try again.",
        );
      }
      removeStoredDraft();
      setStatusText("Opening your interview…");
      const room = build.input.interviewMode === "voice" ? "voice" : "room";
      startTransition(() =>
        router.push(
          `/interviews/${encodeURIComponent(body.session!.id!)}/${room}`,
        ),
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not create your interview. Please try again.",
      );
      setStatusText("");
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  if (!draftReady) {
    return (
      <div
        aria-label="Loading interview setup"
        role="status"
        className="h-[460px] rounded-2xl border border-muted-line bg-surface p-6"
      >
        <div className="h-full rounded-xl skeleton-shimmer" />
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      aria-label="Interview setup"
      className="rounded-2xl border border-muted-line bg-surface"
    >
      <fieldset disabled={pending} className="min-w-0 p-5 sm:p-7">
        <legend className="sr-only">Interview details</legend>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold tracking-[-0.02em]">
            What are you preparing for?
          </h2>
          {hasJobs ? (
            <button
              type="button"
              onClick={() => setShowJobs(!showJobs)}
              aria-expanded={showJobs}
              aria-controls="interview-job-picker"
              className={`${textButtonClass} inline-flex shrink-0 items-center gap-1.5`}
            >
              <BriefcaseBusiness size={14} aria-hidden="true" />
              {target ? "Change job" : "Use a job"}
            </button>
          ) : null}
        </div>

        {showJobs ? (
          <div
            id="interview-job-picker"
            className="mb-5 grid gap-3 rounded-xl bg-surface-soft p-4"
          >
            <Field label="Search jobs">
              {(props) => (
                <input
                  {...props}
                  type="search"
                  value={jobQuery}
                  onChange={(event) => setJobQuery(event.target.value)}
                  placeholder="Job title or company"
                  className={controlClass}
                />
              )}
            </Field>
            <Field
              label="Choose a job"
              error={
                fieldErrors.publicJobPostingVersionId ??
                fieldErrors.privateJobTargetVersionId
              }
            >
              {(props) => (
                <select
                  {...props}
                  value={targetValue}
                  onChange={(event) => chooseJob(event.target.value)}
                  className={controlClass}
                >
                  <option value="">Choose a job to fill in the details</option>
                  {publicJobs.length > 0 ? (
                    <optgroup label="Public jobs">
                      {publicJobs.map((item) => (
                        <option
                          key={item.jobPostingVersionId}
                          value={`public:${item.jobPostingVersionId}`}
                        >
                          {item.title} at {item.companyLabel}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {privateJobs.length > 0 ? (
                    <optgroup label="Your saved targets">
                      {privateJobs.map((item) => (
                        <option
                          key={item.privateJobTargetVersionId}
                          value={`private:${item.privateJobTargetVersionId}`}
                        >
                          {item.title}
                          {item.companyLabel ? ` at ${item.companyLabel}` : ""}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
              )}
            </Field>
            {!publicJobs.length && !privateJobs.length ? (
              <p className="text-[12px] text-muted">
                No matching jobs. Try another search or choose your own role
                below.
              </p>
            ) : null}
            <button
              type="button"
              onClick={clearJob}
              className={`${textButtonClass} justify-self-start`}
            >
              Continue without a job
            </button>
          </div>
        ) : null}

        {target && !showJobs ? (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-lg bg-primary-soft px-4 py-3">
            <p className="min-w-0 text-[12px] leading-5 text-primary">
              <span className="font-semibold">
                {target.title}
                {target.companyLabel ? ` at ${target.companyLabel}` : ""}
              </span>
              <span className="block">
                Details filled in from{" "}
                {privateTarget ? "your private saved job" : "this job"}.
              </span>
            </p>
            <button
              type="button"
              onClick={clearJob}
              className={`${textButtonClass} shrink-0`}
            >
              Remove
            </button>
          </div>
        ) : null}

        <div className="grid gap-4">
          <Field
            label="Role"
            error={fieldErrors.jobRoleId ?? fieldErrors.roleFamilyId}
          >
            {(props) => (
              <select
                {...props}
                disabled={roleLocked}
                value={
                  draft.jobRoleId
                    ? `role:${draft.jobRoleId}`
                    : draft.roleFamilyId
                      ? `family:${draft.roleFamilyId}`
                      : ""
                }
                onChange={(event) => {
                  const value = event.target.value;
                  const role = roles.find(
                    (item) => `role:${item.id}` === value,
                  );
                  patchDraft({
                    jobRoleId: role?.id ?? "",
                    roleFamilyId: role?.roleFamilyId ?? value.slice(7),
                  });
                }}
                className={controlClass}
              >
                <option value="" disabled>
                  Choose the role you want to practise
                </option>
                {options.roleFamilies.map((family) => (
                  <optgroup key={family.id} label={family.label}>
                    <option value={`family:${family.id}`}>
                      {family.label} — general practice
                    </option>
                    {roles
                      .filter((role) => role.roleFamilyId === family.id)
                      .map((role) => (
                        <option key={role.id} value={`role:${role.id}`}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company" error={fieldErrors.companyId}>
              {(props) => (
                <select
                  {...props}
                  disabled={companyLocked}
                  value={draft.companyId}
                  onChange={(event) =>
                    changeContext({
                      companyId: event.target.value,
                      otherCompanyName: "",
                    })
                  }
                  className={controlClass}
                >
                  <option value="">Any company / other</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field
              label="Experience level"
              error={fieldErrors.seniorityLevelId}
            >
              {(props) => (
                <select
                  {...props}
                  disabled={Boolean(publicTarget?.seniorityLevelId)}
                  value={draft.seniorityLevelId}
                  onChange={(event) =>
                    patchDraft({ seniorityLevelId: event.target.value })
                  }
                  className={controlClass}
                >
                  <option value="" disabled>
                    Choose your level
                  </option>
                  {options.seniorityLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          {!draft.companyId ? (
            <Field
              label="Company name (optional)"
              error={fieldErrors.otherCompanyName}
            >
              {(props) => (
                <input
                  {...props}
                  value={draft.otherCompanyName}
                  maxLength={120}
                  onChange={(event) =>
                    patchDraft({ otherCompanyName: event.target.value })
                  }
                  placeholder="Leave blank for general role practice"
                  className={controlClass}
                />
              )}
            </Field>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 border-t border-muted-line pt-5 sm:grid-cols-[1fr_160px]">
          <fieldset className="min-w-0">
            <legend className="mb-2 text-[13px] font-semibold">
              Interview format
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    value: "text",
                    title: "Text",
                    description: "Type your answers",
                    icon: MessageSquare,
                  },
                  {
                    value: "voice",
                    title: "Voice",
                    description: "Practise out loud",
                    icon: Mic,
                  },
                ] as const
              ).map(({ value, title, description, icon: Icon }) => (
                <label
                  key={value}
                  className={`flex min-h-[72px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition duration-200 focus-within:ring-2 focus-within:ring-primary/30 ${draft.interviewMode === value ? "border-primary bg-primary-soft" : "border-muted-line hover:bg-surface-soft"}`}
                >
                  <input
                    type="radio"
                    name="interview-mode"
                    value={value}
                    checked={draft.interviewMode === value}
                    onChange={() => patchDraft({ interviewMode: value })}
                    className="sr-only"
                  />
                  <Icon
                    size={18}
                    className="shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-[13px] font-semibold">
                      {title}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-muted">
                      {description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Duration">
            {(props) => (
              <select
                {...props}
                value={draft.durationMinutes}
                onChange={(event) =>
                  patchDraft({ durationMinutes: Number(event.target.value) })
                }
                className={`${controlClass} sm:min-h-[72px]`}
              >
                {[...new Set([15, 25, 30, 45, 60, draft.durationMinutes])]
                  .sort((a, b) => a - b)
                  .map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} minutes
                    </option>
                  ))}
              </select>
            )}
          </Field>
        </div>

        <details
          open={moreOptions}
          onToggle={(event) => setMoreOptions(event.currentTarget.open)}
          className="group mt-5 border-t border-muted-line pt-4"
        >
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
            <SlidersHorizontal
              size={15}
              className="text-muted"
              aria-hidden="true"
            />
            <span className="text-[13px] font-semibold">More options</span>
            <span className="ml-1 hidden text-[11px] text-muted sm:inline">
              Focus, CV & interview stage
            </span>
            <ChevronDown
              size={16}
              className="ml-auto text-muted transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="grid gap-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Question focus">
                {(props) => (
                  <select
                    {...props}
                    value={draft.focusMode}
                    onChange={(event) =>
                      patchDraft({
                        focusMode: event.target
                          .value as InterviewOnboardingDraft["focusMode"],
                      })
                    }
                    className={controlClass}
                  >
                    <option value="recommended">Balanced (recommended)</option>
                    <option value="behavioral_focus">Behavioral focus</option>
                    <option value="role_specific_focus">
                      {roleSpecific.label}
                    </option>
                  </select>
                )}
              </Field>
              <Field
                label="Interview stage"
                error={fieldErrors.interviewStageId}
              >
                {(props) => (
                  <select
                    {...props}
                    value={draft.interviewStageId}
                    onChange={(event) =>
                      patchDraft({ interviewStageId: event.target.value })
                    }
                    className={controlClass}
                  >
                    <option value="">Any stage</option>
                    {options.interviewStages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            {options.markets.length > 1 || fieldErrors.marketId ? (
              <Field label="Market" error={fieldErrors.marketId}>
                {(props) => (
                  <select
                    {...props}
                    disabled={marketLocked}
                    value={draft.marketId}
                    onChange={(event) =>
                      changeContext({ marketId: event.target.value })
                    }
                    className={controlClass}
                  >
                    <option value="" disabled>
                      Choose a market
                    </option>
                    {options.markets.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            ) : null}
            <Field
              label="Personalize with a CV (optional)"
              error={fieldErrors.candidateDocumentVersionId}
            >
              {(props) => (
                <select
                  {...props}
                  value={
                    draft.candidateDocumentChoice === "use"
                      ? draft.candidateDocumentVersionId
                      : ""
                  }
                  onChange={(event) =>
                    patchDraft({
                      candidateDocumentChoice: event.target.value
                        ? "use"
                        : "skip",
                      candidateDocumentVersionId: event.target.value,
                    })
                  }
                  className={controlClass}
                >
                  <option value="">Skip CV</option>
                  {options.candidateDocuments.map((document) => (
                    <option key={document.versionId} value={document.versionId}>
                      {document.title} — version {document.versionNumber}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <p className="text-[12px] leading-5 text-muted">
              {cvDocument && draft.candidateDocumentChoice === "use"
                ? "By selecting this CV, you allow Jiandae to use up to 10 facts about your roles and skills, with short supporting excerpts, to personalize questions. Your raw CV text is not shared."
                : options.candidateDocuments.length
                  ? "Your CV is only used if you select it here."
                  : "No saved CV yet. You can start with just your role."}
            </p>
            {cvDocument &&
            draft.candidateDocumentChoice === "use" &&
            cvDocument.facts.length > 0 ? (
              <details className="rounded-lg bg-surface-soft px-4 py-3">
                <summary className="cursor-pointer text-[12px] font-semibold text-primary focus-visible:outline-2 focus-visible:outline-primary">
                  Preview CV details
                </summary>
                <ul className="mt-3 grid gap-2 text-[12px] leading-5 text-muted">
                  {cvDocument.facts.map((fact) => (
                    <li key={fact.id}>
                      <span className="font-semibold text-foreground">
                        {fact.label}
                      </span>
                      {fact.skillName ? ` · ${fact.skillName}` : ""}
                      {fact.sourceExcerpt ? (
                        <span className="block">{fact.sourceExcerpt}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            <button
              type="button"
              onClick={resetToDefaults}
              className={`${textButtonClass} mt-1 justify-self-start`}
            >
              Reset to defaults
            </button>
          </div>
        </details>
      </fieldset>

      <div className="border-t border-muted-line px-5 py-5 sm:px-7">
        <p className="mb-4 text-[12px] leading-5 text-muted">
          {focusLabel} · {market?.label ?? "Choose a market"} · English ·{" "}
          {draft.candidateDocumentChoice === "use"
            ? "CV included"
            : "No CV needed"}
        </p>
        {formError ? (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-danger/5 px-4 py-3 text-[13px] leading-5 text-danger"
          >
            {formError}
          </p>
        ) : null}
        {!reviewedPlanAvailable && !formError ? (
          <div
            role="status"
            className="mb-4 rounded-lg bg-warning/10 px-4 py-3 text-[13px] leading-5 text-foreground"
          >
            <p>
              This setup does not have a reviewed interview plan yet. Choose a
              different role, experience level, or question focus.
            </p>
            <button
              type="button"
              onClick={resetToDefaults}
              className={`${textButtonClass} mt-2`}
            >
              Use available defaults
            </button>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-muted">Reserves 1 interview credit</p>
          <button
            type="submit"
            disabled={pending || !reviewedPlanAvailable}
            className="inline-flex min-h-[46px] items-center justify-center gap-3 rounded-lg bg-primary px-6 text-[14px] font-semibold text-white transition duration-200 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:scale-press disabled:cursor-wait disabled:opacity-70"
          >
            {pending ? "Getting ready…" : "Start interview"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
        <p aria-live="polite" className="sr-only">
          {statusText}
        </p>
      </div>
    </form>
  );
}
