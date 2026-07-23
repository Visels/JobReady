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

function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10" rounded="rounded-full" />
        <div className="flex-1">
          <SkeletonBlock className="h-4 w-44" />
          <SkeletonBlock className="mt-2 h-3 w-36" />
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonBlock key={index} className="h-10 w-full" rounded="rounded-lg" />
        ))}
      </div>
    </article>
  );
}

export default function Loading() {
  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#fbfcfb] px-1 py-2 text-primary md:px-3">
      <div className="mx-auto max-w-[1180px]">
        <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-2 h-9 w-72 max-w-full" rounded="rounded-lg" />
            <SkeletonBlock className="mt-3 h-4 w-[520px] max-w-full" />
          </div>
          <SkeletonBlock className="h-10 w-36" rounded="rounded-lg" />
        </header>

        <section className="mb-3 rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-12 w-12" rounded="rounded-full" />
            <div className="flex-1">
              <SkeletonBlock className="h-5 w-64 max-w-full" />
              <SkeletonBlock className="mt-2 h-3 w-52 max-w-full" />
            </div>
          </div>
        </section>

        <div role="status" aria-live="polite" aria-label="Loading learning center">
          <span className="sr-only">Loading learning center</span>
          <section className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <CardSkeleton />
            <CardSkeleton rows={4} />
          </section>

          <section className="mt-3 rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10" rounded="rounded-full" />
              <div>
                <SkeletonBlock className="h-4 w-40" />
                <SkeletonBlock className="mt-2 h-3 w-52" />
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <SkeletonBlock className="h-32 w-full" rounded="rounded-lg" />
              <SkeletonBlock className="h-32 w-full" rounded="rounded-lg" />
              <SkeletonBlock className="h-32 w-full" rounded="rounded-lg" />
              <SkeletonBlock className="h-32 w-full" rounded="rounded-lg" />
            </div>
          </section>

          <section className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
            <CardSkeleton rows={3} />
            <CardSkeleton rows={4} />
          </section>
        </div>
      </div>
    </main>
  );
}
