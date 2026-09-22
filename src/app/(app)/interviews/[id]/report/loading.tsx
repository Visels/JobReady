function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} />;
}

export default function JobInterviewReportLoading() {
  return (
    <main className="min-h-[calc(100dvh-64px)] px-4 py-4 text-foreground md:px-5 lg:px-6">
      <div className="mx-auto grid max-w-[1120px] gap-4">
        <div className="flex justify-between border-b border-muted-line pb-4">
          <SkeletonBlock className="h-9 w-28" />
          <div className="flex gap-2"><SkeletonBlock className="h-9 w-28" /><SkeletonBlock className="h-9 w-24" /></div>
        </div>
        <section className="rounded-2xl border border-muted-line bg-surface p-4 md:p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <SkeletonBlock className="h-3 w-32" />
              <SkeletonBlock className="mt-3 h-10 w-full max-w-[620px]" />
              <SkeletonBlock className="mt-3 h-4 w-full max-w-[560px]" />
              <SkeletonBlock className="mt-4 h-10 w-full max-w-[520px]" />
            </div>
            <SkeletonBlock className="h-40" />
          </div>
        </section>
        <div className="grid gap-3 xl:grid-cols-3">
          <SkeletonBlock className="h-52" />
          <SkeletonBlock className="h-52" />
          <SkeletonBlock className="h-52" />
        </div>
        <SkeletonBlock className="h-56" />
      </div>
    </main>
  );
}
