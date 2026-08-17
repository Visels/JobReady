"use client";

import { Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/ui/BrandMark";

const testimonials = [
  {
    quote:
      "Jiandae helped me find my voice and confidence. I got the job I always wanted.",
    author: "Brian M.",
    location: "Nairobi, Kenya",
  },
  {
    quote:
      "The practice felt like the real interview. I walked in calm, prepared, and ready to answer clearly.",
    author: "Wanjiku A.",
    location: "Nakuru, Kenya",
  },
  {
    quote:
      "The feedback showed me exactly where my answers were vague. My next interview was completely different.",
    author: "Kelvin O.",
    location: "Kisumu, Kenya",
  },
];

export function AuthImagePanel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 5200);

    return () => window.clearInterval(interval);
  }, [paused]);

  return (
    <aside className="auth-showcase relative isolate h-full min-h-0 overflow-hidden bg-[#00533f] text-white">
      <div className="auth-showcase-glow absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 flex h-full flex-col px-[clamp(3rem,6vw,6.5rem)] py-[clamp(2rem,4vh,3.25rem)]">
        <div className="flex justify-end">
          <BrandMark
            tone="reversed"
            className="inline-flex w-fit items-center gap-2.5 text-[1.75rem] font-bold tracking-[-0.04em] text-white"
            wordmarkClassName="h-8"
          />
        </div>

        <div className="my-auto mx-auto w-full max-w-[640px] py-[clamp(1rem,3vh,2rem)]">
          <h2 className="text-balance text-[clamp(2.4rem,3.1vw,4rem)] font-bold leading-[1] tracking-[-0.055em] text-white">
            Better preparation.
            <span className="mt-1 block text-[#f5b913]">Better opportunities.</span>
          </h2>
          <div className="mt-6 h-0.5 w-10 bg-[#23bd86]" />
          <p className="mt-6 max-w-[34rem] text-[clamp(0.98rem,1.1vw,1.12rem)] font-medium leading-[1.55] text-white/88">
            Practice real interviews, get expert feedback, and land the job you deserve.
          </p>

          <div
            className="mt-[clamp(2rem,4vh,3.25rem)] overflow-hidden rounded-[1.3rem] border border-[#25aa7f]/55 bg-[#076047]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_70px_rgba(0,43,32,0.18)] backdrop-blur-sm"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
            aria-roledescription="carousel"
            aria-label="Candidate testimonials"
          >
            <div
              className="flex transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
              style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
            >
              {testimonials.map((testimonial, index) => (
                <blockquote
                  key={testimonial.author}
                  className="w-full flex-none px-[clamp(2rem,3.5vw,3rem)] py-[clamp(1.75rem,3.2vh,2.5rem)]"
                  aria-hidden={index !== activeIndex}
                >
                  <p className="text-[2.8rem] font-bold leading-[0.7] text-[#f5b913]" aria-hidden="true">
                    “
                  </p>
                  <p className="mt-3 max-w-[39rem] text-[clamp(0.92rem,1vw,1.02rem)] font-medium leading-7 text-white/92">
                    {testimonial.quote}
                  </p>
                  <cite className="mt-4 block text-[0.92rem] font-bold not-italic text-[#f5b913]">
                    — {testimonial.author}, {testimonial.location}
                  </cite>
                  <span className="mt-4 flex gap-2 text-[#f5b913]" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star key={starIndex} className="h-4 w-4 fill-current" strokeWidth={1.5} aria-hidden="true" />
                    ))}
                  </span>
                </blockquote>
              ))}
            </div>
            <div className="flex items-center gap-2 px-[clamp(2rem,3.5vw,3rem)] pb-5">
              {testimonials.map((testimonial, index) => (
                <button
                  key={testimonial.author}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${
                    index === activeIndex ? "w-8 bg-[#f5b913]" : "w-3 bg-white/35 hover:bg-white/65"
                  }`}
                  aria-label={`Show testimonial ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-[#0b7156] text-white ring-1 ring-white/5">
              <Users className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
            </span>
            <p className="text-[0.92rem] leading-5 text-white/78">
              <strong className="block text-[1rem] font-bold text-white">10,000+ professionals</strong>
              building confidence with Jiandae
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
