"use client";

import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Coins,
  FileText,
  ListChecks,
  Mic,
  Sparkles,
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
import { InterviewRoomLaunchScreen } from "@/components/interviews/InterviewRoomLaunchScreen";
import {
  INTERVIEW_DURATION_OPTIONS,
  interviewCreditCost,
} from "@/lib/credits";

const STORAGE_KEY = "jobready-interview-onboarding-draft-v1";
const DRAFT_SCHEMA_VERSION = "task17.v3";
const controlClass =
  "min-h-[46px] w-full min-w-0 rounded-lg border border-muted-line bg-surface px-3.5 py-2 text-[14px] text-foreground outline-none transition duration-200 hover:border-muted-line-strong focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-muted";
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
  const [launchStep, setLaunchStep] = useState(0);
  const [isNavigating, startTransition] = useTransition();
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
  const marketLocked = Boolean(publicTarget || privateTarget?.marketId);
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
  const reviewedPlanAvailable = hasReviewedPlanForDraft(draft, options);
  const roleLabel =
    (draft.targetSelection === "manual" ? draft.manualJobTitle.trim() || undefined : target?.title) ??
    options.jobRoles.find((role) => role.id === draft.jobRoleId)?.label ??
    options.roleFamilies.find((family) => family.id === draft.roleFamilyId)
      ?.label ??
    "role";
  const companyLabel =
    ((draft.targetSelection === "manual" ? draft.otherCompanyName.trim() || undefined : target?.companyLabel) ??
      options.companies.find((company) => company.id === draft.companyId)
        ?.label ??
      draft.otherCompanyName.trim()) ||
    "General practice";
  const seniorityLabel =
    options.seniorityLevels.find(
      (level) => level.id === draft.seniorityLevelId,
    )?.label ?? "Choose a level";

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
        setDraft({
          ...next,
          interviewMode: "voice",
          durationMinutes: INTERVIEW_DURATION_OPTIONS.includes(next.durationMinutes as 15 | 30 | 60)
            ? next.durationMinutes
            : 15,
        });
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

  useEffect(() => {
    if (!submitting) return;

    const questionTimer = window.setTimeout(
      () => setLaunchStep((current) => Math.max(current, 1)),
      650,
    );
    return () => window.clearTimeout(questionTimer);
  }, [submitting]);

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
    setJobQuery("");
  }

  function clearJob() {
    patchDraft({
      entryPath: "standalone",
      targetSelection: "site",
      publicJobPostingVersionId: "",
      privateJobTargetVersionId: "",
    });
  }

  function updateManualTitle(title: string) {
    const normalized = title.trim().toLowerCase();
    const matchedRole = options.jobRoles
      .filter((role) => !role.companyId && (!role.marketId || role.marketId === draft.marketId))
      .sort((left, right) => right.label.length - left.label.length)
      .find((role) => normalized.includes(role.label.toLowerCase()));
    patchDraft({
      manualJobTitle: title,
      ...(matchedRole
        ? { jobRoleId: matchedRole.id, roleFamilyId: matchedRole.roleFamilyId }
        : {}),
    });
  }

  function resetToDefaults() {
    removeStoredDraft();
    updateDraft(createDefaultInterviewOnboardingDraft(options));
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
      if (build.fieldErrors.marketId || build.fieldErrors.interviewStageId)
        setMoreOptions(true);
      window.requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }

    submitLock.current = true;
    setLaunchStep(0);
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
      setLaunchStep(2);
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
        className="grid min-h-[620px] gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"
      >
        <div className="rounded-xl border border-muted-line bg-surface p-6">
          <div className="h-full rounded-lg skeleton-shimmer" />
        </div>
        <div className="hidden rounded-xl bg-primary-soft p-6 lg:block">
          <div className="h-full rounded-lg skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      aria-busy={pending}
      aria-label="Interview setup"
      className="relative grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      {pending ? (
        <InterviewRoomLaunchScreen
          activeStep={launchStep}
          interviewMode={draft.interviewMode}
          role={roleLabel}
        />
      ) : null}

      <fieldset
        disabled={pending}
        className="min-w-0 overflow-hidden rounded-xl border border-muted-line bg-surface shadow-[0_18px_48px_rgba(27,36,48,0.045)] lg:max-h-[calc(100dvh-168px)] lg:overflow-y-auto lg:[scrollbar-width:thin]"
      >
        <legend className="sr-only">Interview details</legend>
        <section className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary-soft text-[16px] font-bold text-primary">
              1
            </span>
            <div className="min-w-0 pt-0.5">
              <h2 className="text-[17px] font-bold tracking-[-0.025em] text-foreground">
                Interview target
              </h2>
              <p className="mt-1 text-[12px] leading-5 text-muted">
                Choose a job or enter the details manually.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => { if (draft.targetSelection === "manual") clearJob(); }}
              aria-pressed={draft.targetSelection === "site"}
              className={`group flex min-h-[60px] items-center gap-3 rounded-lg border p-3 text-left outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-primary/25 ${draft.targetSelection === "site" ? "border-accent bg-accent-surface/65" : "border-muted-line hover:bg-surface-soft"}`}
            >
              <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-accent-soft text-accent-strong">
                <ListChecks size={18} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-foreground">
                  Select a job from Jiandae
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-muted">
                  Search our jobs and select one
                </span>
              </span>
              <span className={`h-4 w-4 flex-none rounded-full border-[5px] ${draft.targetSelection === "site" ? "border-accent" : "border-muted-line-strong"}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => updateDraft({ ...draft, entryPath: "standalone", targetSelection: "manual", publicJobPostingVersionId: "", privateJobTargetVersionId: "", companyId: "", otherCompanyName: draft.targetSelection === "site" ? "" : draft.otherCompanyName, roleFamilyId: draft.targetSelection === "site" ? "" : draft.roleFamilyId, jobRoleId: draft.targetSelection === "site" ? "" : draft.jobRoleId })}
              aria-pressed={draft.targetSelection === "manual"}
              className={`group flex min-h-[60px] items-center gap-3 rounded-lg border p-3 text-left outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-primary/25 ${draft.targetSelection === "manual" ? "border-accent bg-accent-surface/65" : "border-muted-line hover:bg-surface-soft"}`}
            >
              <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-surface-soft text-primary"><BriefcaseBusiness size={18} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold text-foreground">Enter details manually</span><span className="mt-0.5 block text-[11px] leading-4 text-muted">Add the title, company and description</span></span>
              <span className={`h-4 w-4 flex-none rounded-full border-[5px] ${draft.targetSelection === "manual" ? "border-accent" : "border-muted-line-strong"}`} aria-hidden="true" />
            </button>
          </div>

          {draft.targetSelection === "site" ? (
            <div id="interview-job-picker" className="mt-4 grid gap-3 rounded-lg bg-surface-soft p-4">
              <Field label="Search jobs" error={fieldErrors.publicJobPostingVersionId ?? fieldErrors.privateJobTargetVersionId}>
                {(props) => <input {...props} type="search" value={jobQuery} onChange={(event) => setJobQuery(event.target.value)} placeholder="Search by job title or company" className={controlClass} />}
              </Field>
              {target && !jobQuery ? <p className="text-[12px] font-semibold text-primary">Selected: {target.title}{target.companyLabel ? ` at ${target.companyLabel}` : ""}</p> : null}
              <div className="max-h-52 overflow-y-auto rounded-lg border border-muted-line bg-surface">
                {publicJobs.map((item) => <button key={item.jobPostingVersionId} type="button" onClick={() => chooseJob(`public:${item.jobPostingVersionId}`)} aria-pressed={targetValue === `public:${item.jobPostingVersionId}`} className="block w-full border-b border-muted-line px-4 py-3 text-left last:border-0 hover:bg-primary-soft focus-visible:bg-primary-soft"><span className="block text-[13px] font-semibold">{item.title}</span><span className="text-[11px] text-muted">{item.companyLabel}{item.location ? ` · ${item.location}` : ""}</span></button>)}
                {privateJobs.map((item) => <button key={item.privateJobTargetVersionId} type="button" onClick={() => chooseJob(`private:${item.privateJobTargetVersionId}`)} aria-pressed={targetValue === `private:${item.privateJobTargetVersionId}`} className="block w-full border-b border-muted-line px-4 py-3 text-left last:border-0 hover:bg-primary-soft focus-visible:bg-primary-soft"><span className="block text-[13px] font-semibold">{item.title}</span><span className="text-[11px] text-muted">{item.companyLabel ?? "Saved target"}</span></button>)}
                {!publicJobs.length && !privateJobs.length ? <p className="px-4 py-3 text-[12px] text-muted">No matching jobs. Try another search or enter the details manually.</p> : null}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              <Field label="Job title" error={fieldErrors.manualJobTitle}>{(props) => <input {...props} value={draft.manualJobTitle} onChange={(event) => updateManualTitle(event.target.value)} placeholder="e.g. Product Manager" maxLength={200} className={controlClass} />}</Field>
              <Field label="Company" error={fieldErrors.otherCompanyName}>{(props) => <input {...props} value={draft.otherCompanyName} onChange={(event) => patchDraft({ otherCompanyName: event.target.value })} placeholder="Company name" maxLength={120} className={controlClass} />}</Field>
              <Field label="Job description" error={fieldErrors.manualJobDescription}>{(props) => <textarea {...props} value={draft.manualJobDescription} onChange={(event) => patchDraft({ manualJobDescription: event.target.value })} placeholder="Paste or describe the role and its responsibilities" rows={5} maxLength={12000} className={controlClass} />}</Field>
            </div>
          )}

          <div className="mt-4 grid gap-4">
          <Field
            label="Role area for questions"
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
          {draft.targetSelection === "manual" && !draft.roleFamilyId ? (
            <p className="text-[12px] text-muted">Choose the closest role area so we can select relevant questions.</p>
          ) : null}
          <div className="grid gap-4">
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
          </div>
        </section>

        <section className="border-t border-muted-line p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary-soft text-[16px] font-bold text-primary">2</span>
            <div className="min-w-0 pt-0.5">
              <h2 className="text-[17px] font-bold tracking-[-0.025em] text-foreground">Session length</h2>
              <p className="mt-1 text-[12px] leading-5 text-muted">Choose how long you want to practise.</p>
            </div>
          </div>

          <fieldset className="mt-4 min-w-0">
            <legend className="sr-only">Duration choices</legend>
            <div className="grid grid-cols-3 gap-3">
              {INTERVIEW_DURATION_OPTIONS.map((minutes) => (
                <label key={minutes} className={`relative flex min-h-[64px] cursor-pointer flex-col justify-center rounded-lg border px-3.5 py-2.5 transition duration-200 focus-within:ring-2 focus-within:ring-primary/25 ${draft.durationMinutes === minutes ? "border-accent bg-accent-surface/65" : "border-muted-line hover:bg-surface-soft"}`}>
                  <input type="radio" name="duration-choice" value={minutes} checked={draft.durationMinutes === minutes} onChange={() => patchDraft({ durationMinutes: minutes })} className="sr-only" />
                  <span className="text-[12px] font-bold text-foreground">{minutes} minutes</span>
                  <span className="mt-0.5 text-[10px] text-muted">{interviewCreditCost(minutes)} credits</span>
                  <span className={`absolute right-3 top-3 h-3.5 w-3.5 rounded-full border-[4px] ${draft.durationMinutes === minutes ? "border-accent" : "border-muted-line-strong"}`} aria-hidden="true" />
                </label>
              ))}
            </div>
            <label className="sr-only" htmlFor="interview-duration-select">Duration</label>
            <select id="interview-duration-select" aria-label="Duration" value={draft.durationMinutes} onChange={(event) => patchDraft({ durationMinutes: Number(event.target.value) })} className="sr-only">
              {INTERVIEW_DURATION_OPTIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
            </select>
          </fieldset>

        <details
          open={moreOptions}
          onToggle={(event) => setMoreOptions(event.currentTarget.open)}
          className="group mt-5 border-t border-muted-line pt-3"
        >
          <summary className="flex min-h-[42px] cursor-pointer list-none items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
            <SlidersHorizontal
              size={17}
              className="text-primary"
              aria-hidden="true"
            />
            <span className="text-[12px] font-bold">More options</span>
            <span className="ml-1 hidden text-[11px] text-muted sm:inline">
              Focus area, interview stage and market
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
            <button
              type="button"
              onClick={resetToDefaults}
              className={`${textButtonClass} mt-1 justify-self-start`}
            >
              Reset to defaults
            </button>
          </div>
        </details>
        </section>

        <div className="sticky bottom-0 z-10 border-t border-muted-line bg-accent-surface/95 px-5 py-4 backdrop-blur sm:px-6">
        {formError ? (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-danger/5 px-4 py-3 text-[13px] leading-5 text-danger"
          >
            {formError}
          </p>
        ) : null}
        {!reviewedPlanAvailable && draft.roleFamilyId && !formError ? (
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent-strong"><Coins size={19} aria-hidden="true" /></span>
            <p>
              <span className="block text-[14px] font-bold text-foreground">{draft.durationMinutes} minutes · {interviewCreditCost(draft.durationMinutes)} credits</span>
              <span className="mt-0.5 block text-[10px] text-muted">{focusLabel} · {market?.label ?? "Choose a market"}</span>
            </p>
          </div>
          <button
            type="submit"
            disabled={pending || !reviewedPlanAvailable || (draft.targetSelection === "site" && !target)}
            className="inline-flex min-h-[46px] min-w-[190px] items-center justify-center gap-3 rounded-lg bg-primary px-6 text-[13px] font-bold text-white transition duration-200 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:scale-press disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start interview
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
        <p aria-live="polite" className="sr-only">
          {statusText}
        </p>
      </div>
      </fieldset>

      <aside className="rounded-xl bg-primary-soft/80 p-5 text-foreground shadow-[inset_0_0_0_1px_rgba(0,83,58,0.04)] lg:sticky lg:top-[86px] sm:p-6" aria-labelledby="interview-summary-title">
        <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-primary"><CalendarDays size={18} aria-hidden="true" /></span>
          <h2 id="interview-summary-title" className="text-[15px] font-bold tracking-[-0.02em]">Your interview</h2>
        </div>

        <dl className="mt-4 grid gap-4">
          {([
            { label: "Role", value: draft.targetSelection === "site" && !target ? "Select a job" : roleLabel === "role" ? "Choose a role" : roleLabel, icon: BriefcaseBusiness },
            { label: "Company", value: draft.targetSelection === "site" && !target ? "Select a job" : draft.targetSelection === "manual" && !draft.otherCompanyName.trim() ? "Enter company" : companyLabel, icon: FileText },
            { label: "Experience level", value: seniorityLabel, icon: BarChart3 },
            { label: "Format", value: "Audio practice", icon: Mic },
            { label: "Duration", value: `${draft.durationMinutes} minutes (${interviewCreditCost(draft.durationMinutes)} credits)`, icon: Clock3 },
          ] as const).map(({ label, value, icon: Icon }) => (
            <div key={label} className="grid grid-cols-[24px_1fr] gap-3">
              <Icon size={17} className="mt-0.5 text-primary" strokeWidth={2.1} aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-[11px] text-muted">{label}</dt>
                <dd className="mt-0.5 truncate text-[13px] font-medium text-foreground">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <fieldset disabled={pending} className="mt-5 border-t border-primary/10 pt-5">
          <legend className="text-[13px] font-bold">Optional resume</legend>
          <p className="mb-3 mt-1 text-[11px] leading-5 text-muted">Use a saved CV or resume to tailor your questions.</p>
          <Field label="Personalize with a CV or resume" error={fieldErrors.candidateDocumentVersionId}>
            {(props) => (
              <select {...props} value={draft.candidateDocumentChoice === "use" ? draft.candidateDocumentVersionId : ""} onChange={(event) => patchDraft({ candidateDocumentChoice: event.target.value ? "use" : "skip", candidateDocumentVersionId: event.target.value })} className={controlClass}>
                <option value="">Skip resume</option>
                {options.candidateDocuments.map((document) => <option key={document.versionId} value={document.versionId}>{document.title} — version {document.versionNumber}</option>)}
              </select>
            )}
          </Field>
          <p className="mt-2 text-[11px] leading-5 text-muted">
            {cvDocument && draft.candidateDocumentChoice === "use"
              ? "Jiandae uses up to 10 saved facts to personalize questions. Your full document is not shared."
              : options.candidateDocuments.length
                ? "Your document is only used if you select it."
                : "No saved CV or resume yet. You can continue without one."}
          </p>
          {cvDocument && draft.candidateDocumentChoice === "use" && cvDocument.facts.length > 0 ? (
            <details className="mt-3 rounded-lg bg-white/60 px-3 py-2">
              <summary className="cursor-pointer text-[11px] font-semibold text-primary">Preview saved details</summary>
              <ul className="mt-2 grid gap-2 text-[11px] leading-4 text-muted">
                {cvDocument.facts.map((fact) => <li key={fact.id}><span className="font-semibold text-foreground">{fact.label}</span>{fact.skillName ? ` · ${fact.skillName}` : ""}{fact.sourceExcerpt ? <span className="block">{fact.sourceExcerpt}</span> : null}</li>)}
              </ul>
            </details>
          ) : null}
        </fieldset>

        <div className="mt-5 border-t border-primary/10 pt-5">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-primary" aria-hidden="true" />
            <h3 className="text-[13px] font-bold">What to expect</h3>
          </div>
          <ul className="mt-3 grid gap-2 text-[11px] leading-5 text-muted">
            <li className="flex gap-2"><Check size={15} className="mt-0.5 flex-none text-primary" aria-hidden="true" /><span>Questions tailored to your role and level</span></li>
            <li className="flex gap-2"><Check size={15} className="mt-0.5 flex-none text-primary" aria-hidden="true" /><span>Realistic, conversational practice</span></li>
          </ul>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl bg-white/45 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-primary">Ready when you are</p>
              <p className="mt-1 max-w-[17rem] text-[10px] leading-4 text-muted">You can adjust every option before the interview begins.</p>
            </div>
            <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-accent-soft text-accent-strong"><Mic size={22} aria-hidden="true" /></span>
          </div>
        </div>
      </aside>
    </form>
  );
}
