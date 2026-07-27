export default function InterviewPreparationLoading() {
  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#f7efe5] px-4 py-5 text-[#071512] md:px-7">
      <div className="mx-auto grid max-w-[1080px] gap-6">
        <section className="rounded-[2.2rem] border border-[#d9cbb8] bg-[#fffaf3] p-6 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:p-9">
          <div className="h-4 w-44 rounded-full skeleton-shimmer" />
          <div className="mt-6 h-24 max-w-4xl rounded-[2rem] skeleton-shimmer" />
          <div className="mt-5 h-7 max-w-3xl rounded-full skeleton-shimmer" />
          <div className="mt-6 flex gap-3">
            <div className="h-9 w-36 rounded-full skeleton-shimmer" />
            <div className="h-9 w-32 rounded-full skeleton-shimmer" />
            <div className="h-9 w-28 rounded-full skeleton-shimmer" />
          </div>
        </section>
        <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="h-[520px] rounded-[2rem] border border-[#d9cbb8] bg-white p-5 skeleton-shimmer" />
          <div className="grid gap-5">
            <div className="h-64 rounded-[2rem] border border-[#d9cbb8] bg-white p-5 skeleton-shimmer" />
            <div className="h-72 rounded-[2rem] border border-[#173a32] bg-[#071512] p-5 skeleton-shimmer" />
          </div>
        </section>
      </div>
    </main>
  );
}
