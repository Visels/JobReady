import Image from "next/image";

export function AuthImagePanel() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e9f0ec]">
      <Image
        src="/images/auth-interview.jpg"
        alt="An interviewer speaking with a candidate in an office"
        fill
        sizes="45vw"
        className="object-cover object-center"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,21,18,0.08)_0%,rgba(7,21,18,0.18)_42%,rgba(7,21,18,0.5)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 p-6 xl:p-9">
        <section className="max-w-xl rounded-[1.25rem] border border-white/80 bg-[#fffdf9] p-6 text-[#071512] shadow-[0_28px_80px_rgba(7,21,18,0.28)]">
          <div className="mb-5 h-1 w-14 rounded-full bg-[#00533f]" />
          <h1 className="max-w-[13ch] text-[clamp(2rem,3.1vw,2.85rem)] font-bold leading-[1.04] tracking-normal text-balance">
            Prepare around the role, not a script.
          </h1>
          <p className="mt-4 max-w-md text-[1rem] font-semibold leading-7 text-[#354254]">
            Find sourced jobs, tailor your CV/resume truthfully, and practise
            realistic company and role interviews in one private workspace.
          </p>
        </section>
      </div>
    </div>
  );
}
