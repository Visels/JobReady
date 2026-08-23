export default function InterviewOnboardingLoading() {
  return (
    <main className="min-h-[calc(100dvh-64px)] bg-background px-4 py-4 text-foreground md:px-5 lg:px-6">
      <div className="mx-auto grid max-w-[1040px] gap-4">
        <section className="border-b border-muted-line pb-5 pt-1">
          <div className="h-3 w-36 rounded-md skeleton-shimmer" />
          <div className="mt-2 h-9 max-w-xl rounded-lg skeleton-shimmer" />
          <div className="mt-3 h-4 max-w-2xl rounded-md skeleton-shimmer" />
        </section>
        <section className="rounded-2xl border border-muted-line bg-surface p-4">
          <div className="grid gap-3">
            <div className="h-4 w-36 rounded-md skeleton-shimmer" />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="h-24 rounded-xl skeleton-shimmer" />
              <div className="h-24 rounded-xl skeleton-shimmer" />
              <div className="h-24 rounded-xl skeleton-shimmer" />
            </div>
            <div className="h-40 rounded-xl skeleton-shimmer" />
          </div>
        </section>
      </div>
    </main>
  );
}
