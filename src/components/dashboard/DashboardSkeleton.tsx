function SkeletonBlock({
  className = "",
  rounded = "rounded-md",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton-shimmer block ${rounded} ${className}`}
    />
  );
}

function NextActionSkeleton() {
  return (
    <section
      aria-busy="true"
      className="rounded-xl border border-[#dfe6e3] bg-white p-5 shadow-[0_16px_38px_rgba(15,47,40,0.04)] md:p-6"
    >
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex gap-4">
          <SkeletonBlock className="h-11 w-11" rounded="rounded-lg" />
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-2 h-6 w-64 max-w-full" />
            <SkeletonBlock className="mt-3 h-3 w-[460px] max-w-full" />
            <SkeletonBlock className="mt-2 h-3 w-72 max-w-full" />
          </div>
        </div>
        <SkeletonBlock className="h-11 w-full md:w-40" rounded="rounded-lg" />
      </div>
    </section>
  );
}

function ListRowSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-[#edf1ef] bg-[#fbfcfb] px-3 py-3">
      <div className="min-w-0">
        <SkeletonBlock className="h-3.5 w-44 max-w-full" />
        <SkeletonBlock className="mt-2 h-2.5 w-32 max-w-full" />
      </div>
      <SkeletonBlock className="h-8 w-[86px]" rounded="rounded-lg" />
    </div>
  );
}

function LearningRowSkeleton() {
  return (
    <div className="grid grid-cols-[36px_1fr_20px] items-center gap-3 rounded-lg border border-[#edf1ef] bg-[#fbfcfb] p-3">
      <SkeletonBlock className="h-9 w-9" rounded="rounded-lg" />
      <div className="min-w-0">
        <SkeletonBlock className="h-3.5 w-32 max-w-full" />
        <SkeletonBlock className="mt-2 h-2.5 w-full" />
      </div>
      <SkeletonBlock className="h-4 w-4" rounded="rounded-sm" />
    </div>
  );
}

function PanelSkeleton({ kind }: { kind: "sessions" | "learning" }) {
  return (
    <article
      aria-busy="true"
      className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)] md:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-4 w-4" rounded="rounded-sm" />
          <SkeletonBlock className="h-4 w-28" />
        </div>
        {kind === "sessions" ? <SkeletonBlock className="h-3 w-12" /> : null}
      </div>
      <div className="mt-4 grid gap-2.5">
        {kind === "sessions" ? (
          <>
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </>
        ) : (
          <>
            <LearningRowSkeleton />
            <LearningRowSkeleton />
            <LearningRowSkeleton />
          </>
        )}
      </div>
    </article>
  );
}

function QuickRoutesSkeleton() {
  return (
    <section aria-busy="true" className="grid gap-3 sm:grid-cols-3">
      <SkeletonBlock className="h-10 w-full" rounded="rounded-lg" />
      <SkeletonBlock className="h-10 w-full" rounded="rounded-lg" />
      <SkeletonBlock className="h-10 w-full" rounded="rounded-lg" />
    </section>
  );
}

export function DashboardTopBarSkeleton() {
  return null;
}

export function DashboardHeaderSkeleton() {
  return (
    <header
      className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
      aria-busy="true"
    >
      <div>
        <SkeletonBlock className="h-8 w-64 max-w-full" />
        <SkeletonBlock className="mt-2 h-3.5 w-[520px] max-w-full" />
      </div>
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-9 w-44" rounded="rounded-lg" />
        <SkeletonBlock className="h-9 w-9" rounded="rounded-lg" />
      </div>
    </header>
  );
}

export function DashboardMetricsSkeleton() {
  return <NextActionSkeleton />;
}

export function DashboardReadinessSkeleton() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <PanelSkeleton kind="sessions" />
      <PanelSkeleton kind="learning" />
    </section>
  );
}

export function DashboardBodySkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading dashboard"
      className="space-y-5"
    >
      <span className="sr-only">Loading dashboard</span>
      <NextActionSkeleton />
      <DashboardReadinessSkeleton />
      <QuickRoutesSkeleton />
    </div>
  );
}

export function DashboardRouteSkeleton() {
  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#fbfcfb] px-1 py-4 text-primary md:px-3 md:py-5">
      <div className="mx-auto max-w-[1040px]">
        <DashboardHeaderSkeleton />
        <DashboardBodySkeleton />
      </div>
    </main>
  );
}
