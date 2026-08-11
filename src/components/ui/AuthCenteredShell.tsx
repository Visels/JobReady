import Link from "next/link";
import { AuthImagePanel } from "@/components/ui/AuthImagePanel";
import { BrandMark } from "@/components/ui/BrandMark";

export function AuthCenteredShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center bg-[#f5f6f4] p-3 text-[#071512] sm:p-5 lg:p-3">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] w-full max-w-[1520px] overflow-hidden rounded-[1.35rem] bg-white shadow-[0_20px_70px_rgba(11,45,35,0.1)] lg:h-[calc(100dvh-1.5rem)] lg:min-h-0 lg:grid-cols-[62.5%_37.5%]">
        <section className="relative hidden min-w-0 overflow-hidden lg:block">
          <AuthImagePanel />
        </section>
        <section className="flex min-w-0 flex-col px-6 py-7 sm:px-10 sm:py-9 lg:px-[clamp(2.25rem,5vw,5rem)] lg:py-8">
          <div className="flex items-center justify-between lg:justify-end">
            <Link
              href="/"
              className="text-sm font-semibold text-[#51615c] transition-colors hover:text-[#00533f] lg:hidden"
            >
              Back to home
            </Link>
            <Link href="/" aria-label="Jiandae home" className="lg:hidden">
              <BrandMark className="inline-flex items-center gap-2 text-[1.3rem] font-bold text-[#071512]" />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center py-8 lg:py-0">
            <div className="mx-auto w-full max-w-[420px]">
              {children}
              {footer}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
