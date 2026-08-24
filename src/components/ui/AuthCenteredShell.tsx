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
    <main className="flex h-dvh overflow-hidden bg-[#f4f5f2] p-2 text-[#071512] sm:p-3">
      <div className="mx-auto grid h-full min-h-0 w-full overflow-hidden rounded-[1.55rem] bg-white shadow-[0_24px_80px_rgba(7,42,32,0.12)] lg:grid-cols-[49%_51%]">
        <section className="relative hidden min-w-0 overflow-hidden lg:block">
          <AuthImagePanel />
        </section>
        <section className="auth-scroll-region flex min-h-0 min-w-0 flex-col overflow-y-auto px-6 py-4 sm:px-10 sm:py-5 lg:px-[clamp(3rem,5.2vw,5.75rem)] lg:py-4">
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
          <div className="flex min-h-full flex-none items-center justify-center py-3 lg:py-1">
            <div className="auth-form-scale mx-auto w-full max-w-[500px]">
              {children}
              {footer}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
