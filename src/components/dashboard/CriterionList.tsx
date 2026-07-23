"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { CriterionBar } from "@/components/dashboard/CriterionBar";
import type { CriterionScore } from "@/types/dashboard";

export function CriterionList({
  criteria,
  children,
  initialCount = 3,
}: {
  criteria: CriterionScore[];
  children: ReactNode;
  initialCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleCriteria = expanded ? criteria : criteria.slice(0, initialCount);
  const canToggle = criteria.length > initialCount;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium leading-5 text-primary">
          Overall readiness
        </h2>
        {canToggle ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="!text-xs !font-medium !leading-4 text-muted transition hover:text-primary active:scale-press"
          >
            {expanded ? "Hide" : "See all"}
          </button>
        ) : null}
      </div>
      {children}
      <div className="mt-5 grid gap-3">
        {visibleCriteria.map((criterion) => (
          <CriterionBar key={criterion.key} criterion={criterion} />
        ))}
      </div>
    </div>
  );
}
