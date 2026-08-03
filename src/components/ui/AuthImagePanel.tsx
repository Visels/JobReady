import Image from "next/image";
import { BarChart3, Target, Trophy } from "lucide-react";

export function AuthImagePanel() {
  const features = [
    {
      icon: Target,
      title: "Realistic mock interviews",
      copy: "Role-specific, industry-relevant questions.",
    },
    {
      icon: BarChart3,
      title: "Smart feedback",
      copy: "Get personalised feedback and improve faster.",
    },
    {
      icon: Trophy,
      title: "Build confidence",
      copy: "Practise anytime and walk into interviews prepared.",
    },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_22%_18%,#f7faf4_0,#e8f0e6_42%,#dce9da_100%)]">
      <div className="absolute left-[8%] top-[4%] grid grid-cols-6 gap-4 opacity-60">
        {Array.from({ length: 30 }).map((_, index) => (
          <span key={index} className="h-1.5 w-1.5 rounded-full bg-[#8fb49a]" />
        ))}
      </div>
      <div className="absolute left-[9%] top-[17%] z-10 max-w-[650px]">
        <h1 className="text-[clamp(2.5rem,3.3vw,3.75rem)] font-bold leading-[1.03] tracking-[-0.055em] text-[#10201b]">
          Better preparation.
          <span className="block text-[#087236]">Better opportunities.</span>
        </h1>
        <p className="mt-5 max-w-[460px] text-[clamp(1rem,1.25vw,1.25rem)] font-medium leading-[1.55] text-[#27342f]">
          Practise real interviews, get expert feedback, and land the job you deserve.
        </p>
        <div className="mt-8 space-y-5">
          {features.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex max-w-[370px] items-center gap-4">
              <span className="grid h-14 w-14 flex-none place-items-center rounded-[1.15rem] bg-[#d4e4d4] text-[#087236]">
                <Icon className="h-7 w-7" strokeWidth={1.9} />
              </span>
              <div>
                <h2 className="text-[0.98rem] font-bold text-[#10201b]">{title}</h2>
                <p className="mt-0.5 text-sm font-medium leading-5 text-[#34413c]">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Image
        src="/images/auth-interview.jpg"
        alt="A professional candidate practising an interview"
        fill
        sizes="61vw"
        className="!left-auto !top-auto !h-[70%] !w-[49%] rounded-tl-[48%] object-cover object-[28%_center]"
        loading="eager"
        fetchPriority="high"
      />
      <div className="absolute bottom-[5%] left-[9%] z-20 w-[72%] max-w-[650px] overflow-hidden rounded-[1rem] bg-[#064c32] text-white shadow-[0_24px_60px_rgba(6,76,50,0.26)]">
        <section className="flex items-center gap-5 px-6 py-5">
          <div className="flex -space-x-2">
            {["1", "2", "3", "4"].map((item, index) => (
              <Image
                key={item}
                src={`/marketing/avatars/hero-applicant-${item}.jpg`}
                alt=""
                width={42}
                height={42}
                className="h-10 w-10 rounded-full border-2 border-[#064c32] object-cover"
                style={{ zIndex: 4 - index }}
              />
            ))}
          </div>
          <div>
            <div className="text-lg tracking-[0.16em] text-[#f5b51b]">★★★★★</div>
            <p className="text-sm font-semibold leading-5 text-white/90">
              Trusted by 1,200+ job seekers across Kenya &amp; Africa
            </p>
          </div>
        </section>
        <div className="border-t border-white/10 px-6 py-4 text-center text-xs font-bold tracking-[0.16em] text-white/70">
          BUILT FOR AFRICAN CAREERS
        </div>
      </div>
    </div>
  );
}
