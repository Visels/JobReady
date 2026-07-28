import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/ui/BrandMark";

type PolicySection = {
  id: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

type PolicyShellProps = {
  title: string;
  description: string;
  badge: string;
  lastUpdated: string;
  sections: PolicySection[];
};

export function PolicyShell({
  title,
  description,
  badge,
  lastUpdated,
  sections,
}: PolicyShellProps) {
  return (
    <main className="min-h-viewport bg-[#fffaf4] text-[#071512]">
      <section className="border-y border-[#e4dbcf] bg-[#063c31] px-5 py-20 text-white md:px-9 md:py-28">
        <div className="mx-auto grid max-w-[1450px] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#a7dccb]">
              {badge}
            </p>
            <h1 className="mt-5 max-w-4xl text-[clamp(3rem,6vw,7.5rem)] font-bold leading-none tracking-[-0.06em] text-balance">
              {title}
            </h1>
          </div>
          <div className="max-w-3xl lg:justify-self-end">
            <p className="text-xl leading-9 text-white/76">{description}</p>
            <p className="mt-8 inline-flex rounded-full border border-white/18 px-5 py-3 text-sm font-bold text-white/76">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-9 md:py-24">
        <div className="mx-auto grid max-w-[1450px] gap-10 lg:grid-cols-[0.34fr_0.66fr]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-[#e4dbcf]">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#00624c]">
                On this page
              </p>
              <nav className="mt-5 space-y-3">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-sm font-semibold leading-6 text-[#4b596b] transition duration-300 ease-soft hover:text-[#00533f]"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-5">
            {sections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-8 rounded-[1.5rem] bg-white p-7 ring-1 ring-[#e4dbcf] md:p-10"
              >
                {section.eyebrow ? (
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#00624c]">
                    {section.eyebrow}
                  </p>
                ) : null}
                <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#071512] md:text-4xl">
                  {section.title}
                </h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-[#4b596b] md:text-lg">
                  {section.children}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#063c31] px-5 py-10 text-white md:px-9">
        <div className="mx-auto flex max-w-[1450px] flex-col justify-between gap-6 text-sm text-white/64 md:flex-row md:items-center">
          <BrandMark className="inline-flex items-center gap-3 text-xl font-bold tracking-tight text-white" />
          <div className="flex flex-wrap gap-6">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/#pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export function PolicyEmailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="inline break-all rounded-sm font-bold text-[#00533f] transition duration-300 ease-soft hover:text-[#063c31] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f]"
    >
      {email}
    </a>
  );
}
