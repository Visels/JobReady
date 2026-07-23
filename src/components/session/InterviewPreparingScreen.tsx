import { BrandMark } from "@/components/ui/BrandMark";

type PreparationStage = "creating" | "loading" | "connecting";

const stages = [
  { id: "creating", label: "Session created", detail: "Your interview preferences are secured." },
  { id: "loading", label: "Room prepared", detail: "Your officer profile and case context are loading." },
  { id: "connecting", label: "Audio connected", detail: "Your microphone and officer audio are being checked." },
] as const;

export function InterviewPreparingScreen({
  stage = "connecting",
}: {
  stage?: PreparationStage;
}) {
  const activeIndex = stages.findIndex((item) => item.id === stage);

  return (
    <div
      className="fixed inset-0 z-[80] grid min-h-[100dvh] place-items-center overflow-hidden bg-[#e8efec] px-4 py-6 sm:px-6"
      role="status"
      aria-live="polite"
      aria-label="Preparing your live interview"
    >
      <div className="pointer-events-none absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full border border-primary/10 bg-primary/5" />
      <div className="pointer-events-none absolute -bottom-56 -left-28 h-[32rem] w-[32rem] rounded-full border border-white/70 bg-white/25" />

      <section className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/80 bg-surface shadow-[0_32px_90px_rgba(20,61,52,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]">
        <header className="flex items-center justify-between border-b border-muted-line px-6 py-5 sm:px-8">
          <BrandMark />
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            Live setup
          </span>
        </header>

        <div className="grid md:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-primary px-6 py-9 text-primary-contrast sm:px-9 sm:py-12">
            <p className="text-eyebrow font-bold uppercase tracking-badge text-primary-tint/70">
              Before you enter
            </p>
            <h1 className="mt-4 max-w-md text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              We’re preparing a quiet, uninterrupted start.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-primary-tint/75">
              The room will open only after your session and live audio are ready. The officer will speak first.
            </p>
            <div className="mt-9 flex items-center gap-3 border-t border-white/15 pt-5 text-xs text-primary-tint/65">
              <span className="font-mono tabular-nums">01</span>
              <span>Your camera remains on this device.</span>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-9 sm:py-10">
            <p className="text-sm font-semibold text-foreground">Room readiness</p>
            <p className="mt-1 text-sm leading-6 text-muted">Keep this page open for a moment.</p>

            <ol className="mt-7 grid gap-1">
              {stages.map((item, index) => {
                const complete = index < activeIndex;
                const active = index === activeIndex;
                return (
                  <li
                    key={item.id}
                    className={`grid grid-cols-[2rem_1fr] gap-3 rounded-xl px-3 py-3 transition-colors duration-300 ${
                      active ? "bg-primary-soft" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-7 w-7 place-items-center rounded-full border font-mono text-[11px] font-bold tabular-nums ${
                        complete
                          ? "border-primary bg-primary text-primary-contrast"
                          : active
                            ? "border-primary text-primary motion-safe:animate-pulse"
                            : "border-muted-line text-muted"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted">{item.detail}</span>
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-7 h-1 overflow-hidden rounded-full bg-primary/10">
              <span
                className={`block h-full origin-left rounded-full bg-primary transition-transform duration-700 ease-soft ${
                  activeIndex === 0
                    ? "scale-x-[0.18]"
                    : activeIndex === 1
                      ? "scale-x-[0.58]"
                      : "scale-x-[0.88] motion-safe:animate-pulse"
                }`}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
