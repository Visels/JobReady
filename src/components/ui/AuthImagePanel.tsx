import Image from "next/image";
import { BarChart3, Target, Trophy } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";

const features = [
  {
    icon: Target,
    title: "Realistic mock interviews",
    copy: "Role-specific and industry-relevant questions.",
  },
  {
    icon: BarChart3,
    title: "Smart feedback",
    copy: "Personalised insights to help you improve faster.",
  },
  {
    icon: Trophy,
    title: "Build confidence",
    copy: "Practise anytime and walk into interviews prepared.",
  },
];

export function AuthImagePanel() {
  return (
    <div className="relative isolate h-full min-h-[620px] overflow-hidden bg-[#004b3b] text-white">
      <Image
        src="/marketing/consulting.png"
        alt="Two professionals preparing for an interview together"
        fill
        priority
        sizes="62vw"
        className="-z-20 object-cover object-[62%_center]"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,58,43,0.98)_0%,rgba(0,76,57,0.9)_38%,rgba(0,70,52,0.42)_76%,rgba(0,48,36,0.35)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(0,40,30,0.78)_0%,transparent_44%,rgba(0,44,33,0.22)_100%)]" />

      <div className="relative flex h-full flex-col px-[clamp(1.5rem,5vw,4.75rem)] py-[clamp(1.5rem,4.2vh,3.25rem)]">
        <BrandMark
          tone="reversed"
          className="inline-flex w-fit items-center gap-2.5 text-[1.75rem] font-bold tracking-[-0.04em] text-white"
        />

        <div className="mt-[clamp(3.5rem,10vh,7rem)] max-w-[34rem]">
          <h1 className="text-[clamp(2.2rem,4.3vw,3.8rem)] font-bold leading-[1.04] tracking-[-0.055em] text-white">
            Better preparation.
            <span className="block text-[#f6bd22]">Better opportunities.</span>
          </h1>
          <div className="mt-4 h-0.5 w-7 bg-[#1b9a71]" />
          <p className="mt-4 max-w-[30rem] text-[clamp(0.95rem,1.35vw,1.15rem)] leading-7 text-white/85">
            Realistic practice, expert feedback, and the confidence to land the job you deserve.
          </p>

          <div className="mt-7 space-y-4">
            {features.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex items-center gap-4">
                <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-[#087457]/80 text-white ring-1 ring-white/5">
                  <Icon className="h-7 w-7" strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="text-[0.98rem] font-bold text-white">{title}</h2>
                  <p className="mt-1 text-sm leading-5 text-white/75">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto max-w-[32rem]">
          <blockquote className="rounded-2xl border border-[#27a57a]/30 bg-[#005b44]/80 px-7 py-5 shadow-[0_18px_40px_rgba(0,36,27,0.18)] backdrop-blur-sm">
            <p className="text-3xl font-bold leading-none text-[#f6bd22]">“</p>
            <p className="-mt-1 pl-8 text-sm font-medium leading-6 text-white/90">
              Jiandae helped me find my voice and confidence. I got the job I always wanted.
            </p>
            <cite className="mt-2 block pl-8 text-sm font-semibold not-italic text-[#f6bd22]">
              — Brian M., Nairobi, Kenya
            </cite>
          </blockquote>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-white/85">
            <span className="mr-1 text-white/80">Trusted by job seekers across Africa.</span>
            <span>🇰🇪 Kenya</span>
            <span>🇳🇬 Nigeria</span>
            <span>🇬🇭 Ghana</span>
            <span>🇿🇦 South Africa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
