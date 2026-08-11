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
    <main className="flex min-h-viewport items-center bg-[#f7f4ef] p-3 text-[#10201b] sm:p-6 lg:h-dvh lg:p-8">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] w-full max-w-[1480px] overflow-hidden rounded-[1.35rem] bg-white shadow-[0_24px_80px_rgba(59,45,30,0.12)] sm:min-h-[calc(100dvh-3rem)] lg:min-h-0 lg:h-[min(930px,calc(100dvh-4rem))] lg:grid-cols-[39%_61%]">
        <section className="flex min-w-0 flex-col px-6 py-7 sm:px-10 sm:py-9 lg:px-[clamp(2.5rem,4.2vw,5rem)] lg:py-[clamp(2.25rem,4vh,4rem)]">
          <Link href="/" aria-label="Jiandae home" className="w-fit">
            <BrandMark className="inline-flex items-center gap-2.5 text-[1.65rem] font-bold tracking-[-0.04em] text-[#10201b]" />
          </Link>
          <div className="flex flex-1 items-center py-8">
            <div className="mx-auto w-full max-w-[450px]">
              {children}
              {footer}
            </div>
          </div>
        </section>
        <section className="relative hidden min-w-0 overflow-hidden bg-[#eaf1e8] lg:block">
          <AuthImagePanel />
        </section>
      </div>
    </main>
  );
}
