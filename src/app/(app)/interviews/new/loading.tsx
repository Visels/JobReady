export default function InterviewOnboardingLoading() {
  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#f7efe5] px-4 py-5 text-[#071512] md:px-7">
      <div className="mx-auto grid max-w-[1180px] gap-7">
        <section className="rounded-[2.2rem] border border-[#d9cbb8] bg-[#fffaf3] p-6 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:p-9">
          <div className="h-4 w-52 rounded-full skeleton-shimmer" />
          <div className="mt-6 h-24 max-w-4xl rounded-[2rem] skeleton-shimmer" />
          <div className="mt-5 h-7 max-w-3xl rounded-full skeleton-shimmer" />
        </section>
        <section className="rounded-[2rem] border border-[#d9cbb8] bg-white p-6 shadow-[0_18px_52px_rgba(21,35,29,0.06)]">
          <div className="grid gap-4">
            <div className="h-5 w-44 rounded-full skeleton-shimmer" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-32 rounded-[1.5rem] skeleton-shimmer" />
              <div className="h-32 rounded-[1.5rem] skeleton-shimmer" />
              <div className="h-32 rounded-[1.5rem] skeleton-shimmer" />
            </div>
            <div className="h-52 rounded-[1.5rem] skeleton-shimmer" />
          </div>
        </section>
      </div>
    </main>
  );
}
