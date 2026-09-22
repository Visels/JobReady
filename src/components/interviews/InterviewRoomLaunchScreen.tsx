import { Check, LoaderCircle, MessageSquare, Mic } from "lucide-react";

const launchSteps = [
  "Saving your interview setup",
  "Preparing reviewed questions",
  "Opening your interview room",
] as const;

type InterviewRoomLaunchScreenProps = {
  activeStep?: number;
  interviewMode: "voice" | "text";
  role?: string;
};

function BlurredRoom({ interviewMode }: Pick<InterviewRoomLaunchScreenProps, "interviewMode">) {
  return (
    <div
      className="absolute inset-[-18px] overflow-hidden bg-[#e9e4da] blur-[7px] saturate-[0.82]"
      aria-hidden="true"
    >
      <div className="mx-auto flex min-h-dvh max-w-[1240px] flex-col px-3 py-4 sm:px-7 sm:py-6">
        <div className="flex min-h-16 items-center justify-between rounded-t-[1.6rem] border border-[#d7ddda] bg-[#fffdf8] px-6">
          <div>
            <div className="h-2.5 w-24 rounded-full bg-[#0b4b40]" />
            <div className="mt-2 h-2 w-44 rounded-full bg-[#c8d0cc]" />
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-20 rounded-full bg-[#e1e5e2]" />
            <div className="h-8 w-8 rounded-full bg-[#d7a84f]" />
          </div>
        </div>

        <div className="relative flex flex-1 overflow-hidden rounded-b-[1.6rem] bg-[#073d34] p-4 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(116,163,145,0.34),transparent_45%),radial-gradient(circle_at_8%_100%,rgba(215,168,79,0.16),transparent_34%)]" />
          {interviewMode === "voice" ? (
            <div className="relative grid min-h-[460px] flex-1 gap-5 md:grid-cols-2">
              <div
                className="relative overflow-hidden rounded-[1.35rem] border border-white/20 bg-[#17352e] bg-cover bg-top"
                style={{ backgroundImage: "url('/interviewer-kenyan.png')" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="relative overflow-hidden rounded-[1.35rem] border border-white/20 bg-[#d9e2dc]">
                <div className="absolute left-1/2 top-[38%] h-40 w-40 -translate-x-1/2 rounded-full bg-[#9caea6]" />
                <div className="absolute bottom-0 left-1/2 h-[45%] w-[72%] -translate-x-1/2 rounded-t-[50%] bg-[#b5c3bd]" />
              </div>
            </div>
          ) : (
            <div className="relative grid min-h-[460px] flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[1.35rem] bg-[#fffdf8] p-7">
                <div className="h-3 w-36 rounded-full bg-[#0b4b40]" />
                <div className="mt-8 h-24 rounded-2xl bg-[#e8e1d5]" />
                <div className="mt-5 h-40 rounded-2xl border border-[#d7ddda] bg-white" />
              </div>
              <div className="grid content-start gap-5">
                <div className="h-36 rounded-[1.35rem] bg-[#fffdf8]" />
                <div className="h-64 rounded-[1.35rem] bg-[#dce6e0]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function InterviewRoomLaunchScreen({
  activeStep = 2,
  interviewMode,
  role = "role",
}: InterviewRoomLaunchScreenProps) {
  const progress = [28, 68, 94][activeStep] ?? 94;
  const label = role === "role" ? "your interview" : `your ${role} interview`;

  return (
    <div
      className="fixed inset-0 z-50 grid min-h-dvh place-items-center overflow-hidden bg-[#071512] px-4 py-8"
      role="status"
      aria-live="polite"
      aria-label={`Preparing ${label}`}
    >
      <BlurredRoom interviewMode={interviewMode} />
      <div className="absolute inset-0 bg-[#04120f]/56" aria-hidden="true" />

      <section className="relative w-full max-w-[520px] overflow-hidden rounded-[1.75rem] border border-white/55 bg-[#fffaf3]/96 p-6 text-[#071512] shadow-[0_32px_100px_rgba(3,18,14,0.48)] backdrop-blur-xl sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#d7a84f]/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex items-center gap-3 text-[12px] font-semibold text-[#52605b]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0b4b40] text-white">
              {interviewMode === "voice" ? (
                <Mic size={16} aria-hidden="true" />
              ) : (
                <MessageSquare size={16} aria-hidden="true" />
              )}
            </span>
            {interviewMode === "voice" ? "Voice interview" : "Text interview"}
          </div>

          <h2 className="mt-6 text-[clamp(1.8rem,6vw,2.7rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-balance">
            Your room is getting ready
          </h2>
          <p className="mt-3 max-w-[46ch] text-[14px] leading-6 text-[#52605b]">
            We’re preparing {label}. Keep this window open; the room will become
            available automatically.
          </p>

          <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-[#e8dfd2]" aria-hidden="true">
            <div
              className="h-full rounded-full bg-[#0b4b40] transition-[width] duration-700 ease-out motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>

          <ol className="mt-7 grid gap-4">
            {launchSteps.map((step, index) => {
              const complete = index < activeStep;
              const active = index === activeStep;
              return (
                <li
                  key={step}
                  className={`flex items-center gap-3 text-[13px] transition-colors duration-300 ${
                    complete || active ? "text-[#173a32]" : "text-[#8a958f]"
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                      complete
                        ? "border-[#0b4b40] bg-[#0b4b40] text-white"
                        : active
                          ? "border-[#d7a84f] bg-[#f7ead0] text-[#7d5916]"
                          : "border-[#d9d2c8] bg-white text-[#8a958f]"
                    }`}
                  >
                    {complete ? (
                      <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                    ) : active ? (
                      <LoaderCircle
                        size={14}
                        className="animate-spin motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="text-[11px] font-semibold">{index + 1}</span>
                    )}
                  </span>
                  <span className={active ? "font-semibold" : "font-medium"}>{step}</span>
                </li>
              );
            })}
          </ol>

          <p className="mt-7 border-t border-[#e8dfd2] pt-4 text-[12px] leading-5 text-[#6c7772]">
            This usually takes only a few seconds.
          </p>
        </div>
      </section>
    </div>
  );
}
