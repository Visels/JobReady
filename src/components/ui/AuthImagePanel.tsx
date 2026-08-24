import { ChartNoAxesCombined, FileText, Mic } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";

const benefits = [
  { icon: Mic, title: "Realistic mock interviews", description: "Practice and get AI feedback" },
  { icon: FileText, title: "Tailored CVs & cover letters", description: "Optimized for every application" },
  { icon: ChartNoAxesCombined, title: "Track your progress", description: "See how you improve over time" },
];

export function AuthImagePanel() {
  return (
    <aside className="auth-showcase relative isolate h-full min-h-0 overflow-hidden bg-[#00492f] text-white">
      <div className="auth-showcase-glow absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 flex h-full flex-col px-[clamp(2.4rem,4.5vw,5rem)] py-[clamp(2rem,3.6vh,3.25rem)]">
        <BrandMark tone="reversed" className="inline-flex w-fit items-center text-white" wordmarkClassName="h-[clamp(2.4rem,4.5vh,3.7rem)]" />
        <div className="my-auto max-w-[34rem] py-8">
          <h2 className="text-balance text-[clamp(2.4rem,3.15vw,4rem)] font-bold leading-[1.04] tracking-[-0.05em] text-white">
            Prepare today.
            <span className="block">Get <span className="text-[#f5b913]">hired</span> tomorrow.</span>
          </h2>
          <p className="mt-5 max-w-[31rem] text-[clamp(1rem,1.15vw,1.22rem)] font-medium leading-[1.48] text-white/88">
            AI-powered mock interviews, CV tailoring and expert feedback to help you stand out and land your dream job.
          </p>
          <ul className="mt-[clamp(1.7rem,3.5vh,3rem)] space-y-[clamp(1rem,2.2vh,1.55rem)]">
            {benefits.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-center gap-4">
                <span className="grid h-12 w-12 flex-none place-items-center rounded-full border border-[#dcb312]/55 bg-[#064d36]/70 text-[#f5b913]">
                  <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span>
                  <strong className="block text-[0.94rem] font-bold text-white">{title}</strong>
                  <span className="mt-0.5 block text-[0.88rem] font-medium text-white/80">{description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="max-w-[31rem] border-t border-white/15 pt-5 text-[0.82rem] font-medium leading-5 text-white/62">
          Private by design. Your interview practice and career documents stay securely in your workspace.
        </p>
      </div>
    </aside>
  );
}
