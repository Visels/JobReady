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

export default function Loading() {
  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#fbfcfb] px-1 py-2 text-primary md:px-3">
      <div className="mx-auto max-w-[920px] space-y-4">
        <header>
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock
            className="mt-2 h-9 w-56 max-w-full"
            rounded="rounded-lg"
          />
          <SkeletonBlock className="mt-3 h-4 w-[420px] max-w-full" />
        </header>

        <section className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <SkeletonBlock className="h-20 w-full" rounded="rounded-lg" />
          <SkeletonBlock className="mt-4 h-11 w-full" rounded="rounded-lg" />
          <SkeletonBlock className="mt-4 h-9 w-44" rounded="rounded-lg" />
        </section>

        <section className="rounded-xl border border-[#dfe6e3] bg-white p-4 shadow-[0_16px_38px_rgba(15,47,40,0.04)]">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="mt-4 h-32 w-full" rounded="rounded-lg" />
        </section>
      </div>
    </main>
  );
}
