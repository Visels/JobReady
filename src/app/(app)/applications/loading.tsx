function SkeletonBlock({ className }: { className: string }) {
  return <span aria-hidden="true" className={`skeleton-shimmer block ${className}`} />;
}

function ApplicationSkeleton() {
  return (
    <article className="rounded-2xl border border-muted-line bg-surface px-4 py-4 md:px-5">
      <div className="grid gap-4 sm:grid-cols-[3.75rem_minmax(0,1fr)]">
        <SkeletonBlock className="h-[3.75rem] w-[3.75rem] rounded-xl" />
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-[min(18rem,70%)] rounded-md" />
              <SkeletonBlock className="h-2.5 w-36 rounded" />
            </div>
            <SkeletonBlock className="h-9 w-32 flex-none rounded-full" />
          </div>
          <div className="mt-4 flex flex-wrap gap-5">
            <SkeletonBlock className="h-2.5 w-32 rounded" />
            <SkeletonBlock className="h-2.5 w-40 rounded" />
          </div>
          <div className="mt-3 flex gap-2">
            <SkeletonBlock className="h-7 w-24 rounded-md" />
            <SkeletonBlock className="h-7 w-36 rounded-md" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-muted-line/80 pt-3">
            <div className="flex gap-4">
              <SkeletonBlock className="h-2.5 w-16 rounded" />
              <SkeletonBlock className="h-2.5 w-24 rounded" />
            </div>
            <div className="flex gap-2">
              <SkeletonBlock className="h-9 w-24 rounded-lg" />
              <SkeletonBlock className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ApplicationsLoading() {
  return (
    <main aria-busy="true" aria-live="polite" className="min-h-[calc(100dvh-64px)] px-4 pb-24 pt-6 text-foreground md:px-6 lg:px-8 lg:pb-10">
      <span className="sr-only">Loading applications</span>
      <div className="mx-auto max-w-[1180px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-2xl">
            <SkeletonBlock className="h-2.5 w-20 rounded" />
            <SkeletonBlock className="mt-4 h-12 w-[min(29rem,82%)] rounded-xl md:h-14" />
            <SkeletonBlock className="mt-4 h-3 w-[min(31rem,90%)] rounded" />
          </div>
          <SkeletonBlock className="h-11 w-36 rounded-xl" />
        </header>
        <div aria-hidden="true" className="mt-6 flex gap-2 overflow-hidden">
          {["w-[82px]", "w-[108px]", "w-[92px]", "w-[108px]", "w-[102px]", "w-[82px]", "w-[96px]"].map((width, index) => (
            <SkeletonBlock key={`${width}-${index}`} className={`h-10 flex-none rounded-lg ${width}`} />
          ))}
        </div>
        <div aria-hidden="true" className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_auto]">
          <SkeletonBlock className="h-12 w-full rounded-xl" />
          <SkeletonBlock className="h-12 w-full rounded-xl" />
          <SkeletonBlock className="h-12 w-20 rounded-xl" />
        </div>
        <SkeletonBlock className="mt-5 h-2.5 w-24 rounded" />
        <section aria-hidden="true" className="mt-3 grid gap-2.5">
          {Array.from({ length: 4 }, (_, index) => <ApplicationSkeleton key={index} />)}
        </section>
      </div>
    </main>
  );
}
