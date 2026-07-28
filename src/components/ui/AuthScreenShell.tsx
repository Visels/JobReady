import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AuthImagePanel } from "@/components/ui/AuthImagePanel";
import { BrandMark } from "@/components/ui/BrandMark";

export function AuthLegalFootnote({
  action = "continuing",
}: {
  action?: string;
}) {
  return (
    <p className="mx-auto mt-5 max-w-md text-center text-[0.72rem] font-medium leading-5 text-[#667385]">
      By {action}, you agree to our{" "}
      <Link
        href="/terms"
        className="font-bold text-[#00533f] transition duration-300 ease-soft hover:text-[#043b30] hover:underline"
      >
        Terms and Conditions
      </Link>{" "}
      and{" "}
      <Link
        href="/privacy"
        className="font-bold text-[#00533f] transition duration-300 ease-soft hover:text-[#043b30] hover:underline"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}

export function AuthScreenShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-viewport bg-[#fffdf9] text-[#071512] lg:h-dvh lg:overflow-hidden">
      <div className="grid min-h-viewport lg:h-full lg:grid-cols-[45%_55%]">
        <section className="relative hidden overflow-hidden border-r border-[#e6dfd5] bg-[#f7f3ec] lg:block">
          <AuthImagePanel />
        </section>

        <section className="flex min-h-viewport flex-col bg-[#fffdf9] px-5 py-5 md:px-8 lg:min-h-0">
          <div className="mx-auto flex min-h-0 w-full max-w-[650px] flex-1 flex-col">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#071512] transition duration-300 ease-soft hover:text-[#00533f]"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
                Home
              </Link>
              <div className="lg:hidden">
                <Link href="/" aria-label="Jobready home">
                  <BrandMark className="inline-flex items-center gap-2.5 text-[1.35rem] font-bold tracking-normal text-[#071512]" />
                </Link>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center py-5">
              <div className="w-full max-w-[390px]">
                {children}
                {footer}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function AuthLoadingCard() {
  return (
    <div
      className="reveal-up w-full"
      aria-busy="true"
      aria-label="Loading authentication page"
    >
      <div className="mx-auto h-8 w-56 rounded-full skeleton-shimmer" />
      <div className="mx-auto mt-3 h-5 w-72 max-w-full rounded-full skeleton-shimmer" />
      <div className="mt-8 h-11 rounded-lg skeleton-shimmer" />
      <div className="my-5 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#d9dee5]" />
        <Loader2 className="h-5 w-5 animate-spin text-[#00533f]" strokeWidth={1.7} />
        <div className="h-px flex-1 bg-[#d9dee5]" />
      </div>
      <div className="h-5 w-28 rounded-full skeleton-shimmer" />
      <div className="mt-2 h-12 rounded-lg skeleton-shimmer" />
      <div className="mt-4 h-5 w-24 rounded-full skeleton-shimmer" />
      <div className="mt-2 h-12 rounded-lg skeleton-shimmer" />
      <div className="mt-5 h-12 rounded-lg skeleton-shimmer" />
    </div>
  );
}
