function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-[1.2rem] ${className}`} />;
}

export default function JobInterviewReportLoading() {
  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[radial-gradient(circle_at_10%_6%,rgba(215,168,79,0.18),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(0,83,63,0.14),transparent_32%),#f7efe5] px-4 py-5 text-[#071512] md:px-7">
      <div className="mx-auto grid max-w-[1180px] gap-6">
        <section className="rounded-[2.2rem] border border-[#d9cbb8] bg-[#fffaf3] p-6 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:p-8">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="mt-5 h-16 w-full max-w-[720px]" />
          <SkeletonBlock className="mt-4 h-5 w-full max-w-[620px]" />
          <div className="mt-7 grid gap-4 md:grid-cols-[1fr_280px]">
            <SkeletonBlock className="h-32" />
            <SkeletonBlock className="h-32" />
          </div>
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonBlock className="h-44" />
          <SkeletonBlock className="h-44" />
        </div>
        <SkeletonBlock className="h-72" />
      </div>
    </main>
  );
}
