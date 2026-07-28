export default function InterviewVoiceLoading() {
  return (
    <main className="min-h-[calc(100dvh-40px)] bg-[radial-gradient(circle_at_12%_8%,rgba(215,168,79,0.2),transparent_28%),#f7efe5] px-4 py-5 text-[#071512] md:px-7">
      <section className="mx-auto max-w-[1180px] rounded-[2.25rem] border border-[#d9cbb8] bg-[#fffaf3] p-6 shadow-[0_24px_80px_rgba(21,35,29,0.08)] md:p-8">
        <div className="h-4 w-44 rounded-full bg-[#d7a84f]/35" />
        <div className="mt-5 h-16 max-w-3xl rounded-[1.2rem] bg-[#eadfce]" />
        <div className="mt-4 h-5 max-w-2xl rounded-full bg-[#eadfce]/80" />
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-24 rounded-[1.3rem] border border-[#eadfce] bg-white"
            />
          ))}
        </div>
        <div className="mt-7 h-56 rounded-[2rem] bg-[#071512]" />
      </section>
    </main>
  );
}
