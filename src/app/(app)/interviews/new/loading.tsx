export default function InterviewOnboardingLoading() {
  return (
    <main
      aria-label="Loading interview setup"
      role="status"
      className="min-h-[calc(100dvh-64px)] bg-background px-4 py-6 text-foreground md:px-6 md:py-8"
    >
      <div className="mx-auto grid max-w-[720px] gap-6" aria-hidden="true">
        <section>
          <div className="h-3 w-36 rounded-md skeleton-shimmer" />
          <div className="mt-2 h-9 max-w-xl rounded-lg skeleton-shimmer" />
          <div className="mt-3 h-4 max-w-2xl rounded-md skeleton-shimmer" />
        </section>
        <section className="rounded-2xl border border-muted-line bg-surface p-5 sm:p-7">
          <div className="grid gap-5">
            <div className="h-5 w-56 rounded-md skeleton-shimmer" />
            <div className="h-16 rounded-lg skeleton-shimmer" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-16 rounded-lg skeleton-shimmer" />
              <div className="h-16 rounded-lg skeleton-shimmer" />
            </div>
            <div className="h-24 rounded-lg skeleton-shimmer" />
            <div className="h-10 rounded-lg skeleton-shimmer" />
            <div className="h-12 rounded-lg skeleton-shimmer" />
          </div>
        </section>
      </div>
    </main>
  );
}
