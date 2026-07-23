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

function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <article className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10" rounded="rounded-full" />
        <div className="flex-1">
          <SkeletonBlock className="h-4 w-44" />
          <SkeletonBlock className="mt-2 h-3 w-52 max-w-full" />
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonBlock
            key={index}
            className="h-11 w-full"
            rounded="rounded-lg"
          />
        ))}
      </div>
    </article>
  );
}

export default function Loading() {
  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#fbfcfb] px-1 py-2 text-primary md:px-3">
      <div className="mx-auto max-w-[1180px]">
        <header className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock
              className="mt-2 h-9 w-[420px] max-w-full"
              rounded="rounded-lg"
            />
            <SkeletonBlock className="mt-3 h-4 w-[560px] max-w-full" />
          </div>
          <SkeletonBlock className="h-[82px] w-full" rounded="rounded-xl" />
        </header>

        <section className="mt-3 rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <SkeletonBlock className="h-12 w-full" rounded="rounded-lg" />
            <SkeletonBlock className="h-12 w-full" rounded="rounded-lg" />
            <SkeletonBlock
              className="h-12 w-full md:w-[178px]"
              rounded="rounded-lg"
            />
          </div>
        </section>

        <div
          role="status"
          aria-live="polite"
          aria-label="Loading visa guides"
          className="mt-3 space-y-3"
        >
          <span className="sr-only">Loading visa guides</span>
          <section className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
            <CardSkeleton rows={4} />
            <CardSkeleton rows={4} />
          </section>
          <CardSkeleton rows={6} />
          <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
            <CardSkeleton rows={4} />
            <CardSkeleton rows={3} />
          </section>
        </div>
      </div>
    </main>
  );
}
