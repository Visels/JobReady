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

function SessionRowSkeleton() {
  return (
    <tr className="border-b border-[#edf1ef] last:border-b-0">
      <td className="px-4 py-3">
        <SkeletonBlock className="h-4 w-36" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-4 w-28" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-4 w-20" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-6 w-20" rounded="rounded-md" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-6 w-20" rounded="rounded-md" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-4 w-20" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-4 w-24" />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end">
          <SkeletonBlock className="h-9 w-24" rounded="rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

export default function Loading() {
  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#fbfcfb] px-1 py-2 text-primary md:px-3">
      <div className="mx-auto max-w-[1180px]">
        <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="mt-2 h-9 w-44" rounded="rounded-lg" />
            <SkeletonBlock className="mt-3 h-4 w-[420px] max-w-full" />
          </div>
          <SkeletonBlock className="h-10 w-32" rounded="rounded-lg" />
        </header>

        <section
          role="status"
          aria-live="polite"
          aria-label="Loading sessions"
          className="overflow-hidden rounded-xl border border-[#dfe6e3] bg-white shadow-[0_16px_38px_rgba(15,47,40,0.04)]"
        >
          <span className="sr-only">Loading sessions</span>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf1ef] bg-[#f8fbfa]">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <th key={index} className="px-4 py-3">
                      <SkeletonBlock className="h-3 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <SessionRowSkeleton />
                <SessionRowSkeleton />
                <SessionRowSkeleton />
                <SessionRowSkeleton />
                <SessionRowSkeleton />
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
