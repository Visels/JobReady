"use client";

import { useState, useTransition } from "react";

type AdminOperation = {
  label: string;
  action: string;
  description: string;
  sample: Record<string, unknown>;
};

const operations: AdminOperation[] = [
  {
    label: "Dry-run import",
    action: "preview_import",
    description: "Validate JSON or CSV without writing catalog rows.",
    sample: {
      format: "json",
      resourceType: "question",
      content: JSON.stringify(
        [
          {
            resourceType: "question",
            slug: "sample-company-question",
            version: 1,
            prompt: "Tell me about a time you improved a customer journey.",
            frameworkKey: "behavioral_star",
            companySlug: "safaricom",
            sourceUrl: "https://example.com/company-source",
            rationale: "Official company source describes customer-first work.",
          },
        ],
        null,
        2,
      ),
    },
  },
  {
    label: "Upsert taxonomy",
    action: "upsert_taxonomy",
    description: "Create or update a market, role, skill, competency, or framework.",
    sample: {
      kind: "competency",
      slug: "customer-trust",
      name: "Customer Trust",
      description: "Builds confidence through truthful communication and ownership.",
      isActive: true,
    },
  },
  {
    label: "Upsert company",
    action: "upsert_company",
    description: "Create or update a reviewed company profile.",
    sample: {
      slug: "sample-company",
      displayName: "Sample Company",
      legalName: "Sample Company PLC",
      marketSlug: "kenya",
      websiteUrl: "https://example.com",
      careersUrl: "https://example.com/careers",
      publicationStatus: "needs_review",
      confidence: "medium",
      focusAreas: ["Customer experience", "Digital products"],
    },
  },
  {
    label: "Upsert source",
    action: "upsert_source",
    description: "Record an official or reviewed source before publishing content.",
    sample: {
      type: "company_site",
      title: "Sample Company careers page",
      publisher: "Sample Company",
      url: "https://example.com/careers",
      isOfficial: true,
      confidence: "high",
    },
  },
  {
    label: "Upsert question",
    action: "upsert_question",
    description: "Create or update a reviewed interview question and preview wording.",
    sample: {
      slug: "sample-ownership-question",
      version: 1,
      prompt: "Tell me about a time you owned a difficult delivery.",
      frameworkKey: "behavioral_star",
      publicationStatus: "needs_review",
      confidence: "medium",
      roleAssociations: [
        {
          roleFamilySlug: "software-engineering",
          weight: 2,
          rationale: "Ownership evidence is relevant for engineering delivery.",
        },
      ],
      competencies: [
        {
          competencySlug: "ownership",
          weight: 2,
          rationale: "Question directly tests ownership behavior.",
        },
      ],
      strongAnswerSignals: [
        {
          label: "Clear ownership",
          description: "Candidate explains their personal action and decision.",
        },
      ],
      redFlags: [
        {
          label: "Vague team-only answer",
          description: "Candidate cannot explain their own contribution.",
          severity: 2,
        },
      ],
    },
  },
  {
    label: "Record review",
    action: "record_content_review",
    description: "Publish, retire, or mark content as needing review.",
    sample: {
      resourceType: "question",
      resourceId: "question-id",
      status: "published",
      notes: "Reviewed against official source and rubric wording.",
      nextReviewAt: "2026-08-28T00:00:00.000Z",
    },
  },
  {
    label: "Retire content",
    action: "retire_content",
    description: "Delete drafts when safe; retire content used by completed sessions.",
    sample: {
      resourceType: "question",
      resourceId: "question-id",
      reason: "Replaced by a better sourced version.",
    },
  },
  {
    label: "Job action",
    action: "job_action",
    description: "Submit, review, publish, expire, close, retire, or reject a job.",
    sample: {
      jobAction: "publish",
      jobPostingId: "job-posting-id",
      reason: "All review decisions approved.",
    },
  },
];

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function AdminOperationsPanel() {
  const [operationIndex, setOperationIndex] = useState(0);
  const [payload, setPayload] = useState(pretty(operations[0].sample));
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const operation = operations[operationIndex];

  function selectOperation(index: number) {
    setOperationIndex(index);
    setPayload(pretty(operations[index].sample));
    setResult(null);
    setError(null);
  }

  function submit() {
    setError(null);
    setResult(null);

    startTransition(async () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(payload);
      } catch {
        setError("Payload must be valid JSON before it can be sent.");
        return;
      }

      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: operation.action,
          payload: parsed,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(pretty(body));
        return;
      }

      setResult(pretty(body.result));
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.42fr_0.58fr]">
      <div className="rounded-[1.35rem] border border-muted-line bg-surface-soft p-4">
        <label
          htmlFor="admin-operation"
          className="text-[10px] font-black uppercase tracking-badge text-muted-subtle"
        >
          Operation
        </label>
        <select
          id="admin-operation"
          value={operationIndex}
          onChange={(event) => selectOperation(Number(event.target.value))}
          className="mt-2 min-h-11 w-full rounded-2xl border border-muted-line bg-surface px-3 text-[13px] font-bold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {operations.map((item, index) => (
            <option key={item.action} value={index}>
              {item.label}
            </option>
          ))}
        </select>
        <p className="mt-3 text-[13px] leading-6 text-muted">
          {operation.description}
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-4 text-[12px] font-black text-primary-contrast transition duration-300 ease-soft hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55 active:scale-press motion-reduce:transition-none"
        >
          {isPending ? "Running..." : "Run admin action"}
        </button>
      </div>

      <div className="grid gap-4">
        <label
          htmlFor="admin-payload"
          className="text-[10px] font-black uppercase tracking-badge text-muted-subtle"
        >
          JSON payload
        </label>
        <textarea
          id="admin-payload"
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
          spellCheck={false}
          className="min-h-[320px] rounded-[1.35rem] border border-muted-line bg-[#101923] p-4 font-mono text-[12px] leading-5 text-[#EAF2EF] shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        {error ? (
          <pre className="overflow-auto rounded-[1.2rem] border border-danger/30 bg-danger-surface p-4 text-[12px] leading-5 text-danger">
            {error}
          </pre>
        ) : null}
        {result ? (
          <pre className="overflow-auto rounded-[1.2rem] border border-success/30 bg-success-surface p-4 text-[12px] leading-5 text-success">
            {result}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
