function SkeletonBlock({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block bg-surface-subtle ${className}`} />;
}

function MetricSkeleton() {
  return (
    <div className="flex min-h-[76px] items-center gap-3 rounded-xl border border-muted-line bg-surface px-3.5">
      <SkeletonBlock className="h-10 w-10 flex-none rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-8 rounded-md" />
        <SkeletonBlock className="h-2.5 w-20 rounded" />
      </div>
      <SkeletonBlock className="h-4 w-4 flex-none rounded" />
    </div>
  );
}

function SavedJobSkeleton() {
  return (
    <article className="rounded-2xl border border-muted-line bg-surface px-4 py-4 shadow-[0_12px_34px_rgba(15,47,40,0.025)] md:px-5">
      <div className="grid gap-4 sm:grid-cols-[3.5rem_minmax(0,1fr)]">
        <SkeletonBlock className="h-14 w-14 rounded-xl" />

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-[min(17rem,72%)] rounded-md" />
              <SkeletonBlock className="h-2.5 w-32 rounded" />
            </div>
            <SkeletonBlock className="h-7 w-20 flex-none rounded-lg" />
          </div>

          <div className="mt-3 flex flex-wrap gap-4">
            <SkeletonBlock className="h-2.5 w-28 rounded" />
            <SkeletonBlock className="h-2.5 w-32 rounded" />
          </div>

          <div className="mt-3 space-y-2">
            <SkeletonBlock className="h-2.5 w-full rounded" />
            <SkeletonBlock className="h-2.5 w-[68%] rounded" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-muted-line/80 pt-3">
            <SkeletonBlock className="h-6 w-24 rounded-md" />
            <div className="flex gap-2">
              <SkeletonBlock className="h-9 w-24 rounded-lg" />
              <SkeletonBlock className="h-9 w-24 rounded-lg" />
              <SkeletonBlock className="h-9 w-16 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SavedJobsLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="min-h-[calc(100dvh-64px)] px-4 pb-24 pt-5 text-foreground md:px-6 lg:px-8 lg:pb-10"
    >
      <span className="sr-only">Loading saved jobs</span>
      <div className="mx-auto max-w-[1180px] animate-pulse motion-reduce:animate-none">
        <header className="flex flex-col gap-5 border-b border-muted-line pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-2xl">
            <SkeletonBlock className="h-2.5 w-20 rounded" />
            <SkeletonBlock className="mt-4 h-12 w-[min(24rem,78%)] rounded-xl md:h-14" />
            <SkeletonBlock className="mt-4 h-3 w-[min(29rem,90%)] rounded" />
          </div>
          <SkeletonBlock className="h-10 w-36 rounded-xl" />
        </header>

        <section aria-hidden="true" className="mt-5 grid gap-2.5 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <MetricSkeleton key={index} />
          ))}
        </section>

        <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_270px]">
          <section aria-hidden="true" className="min-w-0">
            <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_172px_auto]">
              <SkeletonBlock className="h-11 w-full rounded-xl" />
              <SkeletonBlock className="h-11 w-full rounded-xl" />
              <SkeletonBlock className="h-11 w-20 rounded-xl" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {["w-[72px]", "w-[104px]", "w-[104px]", "w-[72px]", "w-[78px]"].map(
                (widthClass, index) => (
                  <SkeletonBlock
                    key={`${widthClass}-${index}`}
                    className={`h-8 rounded-lg ${widthClass}`}
                  />
                ),
              )}
            </div>

            <div className="mt-4 grid gap-2.5">
              {Array.from({ length: 3 }, (_, index) => (
                <SavedJobSkeleton key={index} />
              ))}
            </div>
          </section>

          <aside aria-hidden="true" className="grid gap-3">
            <section className="rounded-2xl border border-primary/10 bg-primary-soft/45 p-5">
              <SkeletonBlock className="h-2.5 w-24 rounded" />
              <SkeletonBlock className="mt-4 h-5 w-48 rounded-md" />
              <SkeletonBlock className="mt-2 h-5 w-36 rounded-md" />
              <div className="mt-6 space-y-4">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="grid grid-cols-[36px_1fr] gap-3 border-b border-primary/8 pb-4 last:border-0 last:pb-0">
                    <SkeletonBlock className="h-9 w-9 rounded-lg bg-surface" />
                    <div className="space-y-2 pt-1">
                      <SkeletonBlock className="h-2.5 w-32 rounded" />
                      <SkeletonBlock className="h-2 w-full rounded" />
                      <SkeletonBlock className="h-2 w-4/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-muted-line bg-surface p-4">
              <SkeletonBlock className="h-3 w-32 rounded" />
              <SkeletonBlock className="mt-4 h-2.5 w-full rounded" />
              <SkeletonBlock className="mt-2 h-2.5 w-5/6 rounded" />
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
