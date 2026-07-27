export default function InterviewRoomLoading() {
  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[#f7efe5] px-4 py-5 md:px-7">
      <div className="mx-auto grid max-w-[1180px] gap-6">
        <header className="rounded-[2.2rem] border border-[#d9cbb8] bg-[#fffaf3] p-6 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:p-9">
          <div className="h-4 w-44 animate-pulse rounded-full bg-[#eadfce]" />
          <div className="mt-5 h-16 max-w-3xl animate-pulse rounded-[1.4rem] bg-[#eadfce]" />
          <div className="mt-4 h-5 max-w-xl animate-pulse rounded-full bg-[#eadfce]" />
        </header>
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-[2rem] border border-[#d9cbb8] bg-white p-6">
            <div className="h-5 w-32 animate-pulse rounded-full bg-[#eadfce]" />
            <div className="mt-5 h-24 animate-pulse rounded-[1.5rem] bg-[#eadfce]" />
            <div className="mt-6 h-44 animate-pulse rounded-[1.5rem] bg-[#eadfce]" />
          </div>
          <aside className="grid gap-5">
            <div className="h-44 animate-pulse rounded-[1.8rem] bg-white" />
            <div className="h-72 animate-pulse rounded-[1.8rem] bg-white" />
          </aside>
        </section>
      </div>
    </main>
  );
}
