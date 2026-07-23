import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AuthCenteredShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-viewport bg-[#fffdf9] px-5 py-5 text-[#071512] md:px-8">
      <Link
        href="/"
        className="absolute left-5 top-5 inline-flex items-center gap-2 text-sm font-bold text-[#071512] transition duration-300 ease-soft hover:text-[#00533f] md:left-8"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
        Home
      </Link>
      <div className="mx-auto flex w-full max-w-[480px] items-center justify-center py-16">
        <section className="w-full rounded-[1.25rem] border border-[#ebe5dc] bg-white px-6 py-7 shadow-[0_24px_70px_rgba(17,32,27,0.08)] md:px-8 md:py-8">
          {children}
          {footer}
        </section>
      </div>
    </main>
  );
}
