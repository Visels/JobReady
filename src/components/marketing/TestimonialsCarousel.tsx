"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, Star } from "lucide-react";

type Testimonial = {
  image: string;
  location: string;
  name: string;
  quote: string;
  role: string;
};

const testimonialPages: Testimonial[][] = [
  [
    {
      name: "Brian O.",
      role: "Product Designer at Twiga Foods",
      location: "Nairobi, Kenya",
      image: "hero-applicant-2.jpg",
      quote:
        "Jiandae helped me gain the confidence I needed for interviews. The mock sessions and feedback were spot on! I landed my dream job in Nairobi.",
    },
    {
      name: "Amina K.",
      role: "Data Analyst at Safaricom",
      location: "Nairobi, Kenya",
      image: "hero-applicant-1.jpg",
      quote:
        "The AI feedback on my answers helped me improve my responses so much. I am now more confident and performing better.",
    },
    {
      name: "Tunde A.",
      role: "Software Engineer at Andela",
      location: "Lagos, Nigeria",
      image: "hero-applicant-4.jpg",
      quote:
        "I found verified opportunities that matched my skills and goals. Jiandae is now my go-to platform for career growth.",
    },
  ],
  [
    {
      name: "Miriam N.",
      role: "Customer Success Lead at M-KOPA",
      location: "Kisumu, Kenya",
      image: "testimonial-miriam.jpg",
      quote:
        "The practice sessions helped me speak clearly about my experience. I walked into the interview calmer and left feeling proud.",
    },
    {
      name: "Daniel K.",
      role: "Operations Associate at KCB",
      location: "Nakuru, Kenya",
      image: "testimonial-daniel.jpg",
      quote:
        "I used Jiandae to prepare for tough behavioral questions. The feedback showed me exactly where my answers needed structure.",
    },
    {
      name: "Nadia W.",
      role: "Marketing Coordinator at Flutterwave",
      location: "Accra, Ghana",
      image: "testimonial-nadia.jpg",
      quote:
        "Finding roles and preparing in one place made the job search feel less scattered. I could focus on the next best step.",
    },
  ],
  [
    {
      name: "Grace M.",
      role: "Graduate Trainee at Equity Bank",
      location: "Mombasa, Kenya",
      image: "hero-applicant-3.jpg",
      quote:
        "The interview prompts felt close to the roles I was applying for. I learned how to connect my school projects to real business impact.",
    },
    {
      name: "Kevin A.",
      role: "Frontend Developer at Branch",
      location: "Remote within Kenya",
      image: "hero-applicant-4.jpg",
      quote:
        "The feedback helped me tighten my technical stories and stop rambling. My answers became shorter, stronger, and easier to follow.",
    },
    {
      name: "Lilian S.",
      role: "Analyst at Deloitte",
      location: "Kampala, Uganda",
      image: "hero-applicant-1.jpg",
      quote:
        "I finally understood how to prepare without memorising scripts. Jiandae helped me sound like myself, only clearer.",
    },
  ],
];

function nextIndex(index: number) {
  return (index + 1) % testimonialPages.length;
}

function previousIndex(index: number) {
  return (index - 1 + testimonialPages.length) % testimonialPages.length;
}

export function TestimonialsCarousel() {
  const [activePage, setActivePage] = useState(0);
  const testimonials = testimonialPages[activePage] ?? testimonialPages[0];

  return (
    <>
      <div className="relative mt-[52px]">
        <button
          type="button"
          aria-label="Show previous testimonials"
          onClick={() => setActivePage(previousIndex)}
          className="absolute left-0 top-1/2 z-10 hidden h-12 w-12 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full bg-[#e9eee9] text-[#004735] transition hover:bg-[#dfe8e1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006148] active:scale-[0.98] xl:flex"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2.2} />
        </button>

        <div
          key={activePage}
          aria-live="polite"
          className="mx-auto grid max-w-[1110px] gap-6 md:grid-cols-3 md:gap-7"
        >
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="rounded-lg border border-[#e5e9e6] bg-white px-7 py-7 shadow-[0_12px_30px_rgba(28,43,38,0.08)] md:px-8 md:py-8"
            >
              <div className="flex items-center gap-7 md:gap-8">
                <Image
                  src={`/marketing/avatars/${testimonial.image}`}
                  alt={`${testimonial.name} testimonial portrait`}
                  width={76}
                  height={76}
                  sizes="76px"
                  className="h-[76px] w-[76px] rounded-full object-cover"
                />
                <p
                  className="flex items-center gap-1 text-[#006148]"
                  aria-label="Five star rating"
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className="h-[17px] w-[17px] fill-current"
                      strokeWidth={1.4}
                    />
                  ))}
                </p>
              </div>

              <span
                aria-hidden="true"
                className="mt-3 block h-8 text-[4rem] font-bold leading-none text-[#bfd5c8]"
              >
                &ldquo;
              </span>
              <p className="mt-2 min-h-[8.7rem] text-[1.08rem] font-medium leading-7 text-[#243243]">
                {testimonial.quote}
              </p>

              <div className="mt-6 border-t border-[#dfe5e1] pt-6">
                <h3 className="text-[1.08rem] font-extrabold leading-5 tracking-[-0.03em] text-[#081722]">
                  {testimonial.name}
                </h3>
                <p className="mt-2 text-[0.95rem] font-medium leading-5 text-[#273342]">
                  {testimonial.role}
                </p>
                <p className="mt-3 flex items-center gap-2 text-[0.9rem] font-medium text-[#273342]">
                  <MapPin
                    className="h-4 w-4 flex-none text-[#081722]"
                    strokeWidth={2}
                  />
                  {testimonial.location}
                </p>
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          aria-label="Show next testimonials"
          onClick={() => setActivePage(nextIndex)}
          className="absolute right-0 top-1/2 z-10 hidden h-12 w-12 translate-x-2 -translate-y-1/2 items-center justify-center rounded-full bg-[#e9eee9] text-[#004735] transition hover:bg-[#dfe8e1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006148] active:scale-[0.98] xl:flex"
        >
          <ArrowRight className="h-6 w-6" strokeWidth={2.2} />
        </button>
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Show previous testimonials"
          onClick={() => setActivePage(previousIndex)}
          className="grid h-10 w-10 place-items-center rounded-full bg-[#e9eee9] text-[#004735] transition hover:bg-[#dfe8e1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006148] active:scale-[0.98] xl:hidden"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
        </button>

        <div className="flex items-center justify-center gap-5">
          {testimonialPages.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show testimonial page ${index + 1}`}
              aria-current={activePage === index ? "true" : undefined}
              onClick={() => setActivePage(index)}
              className={`h-2.5 w-2.5 rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006148] ${
                activePage === index ? "bg-[#004735]" : "bg-[#cdd1d0]"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Show next testimonials"
          onClick={() => setActivePage(nextIndex)}
          className="grid h-10 w-10 place-items-center rounded-full bg-[#e9eee9] text-[#004735] transition hover:bg-[#dfe8e1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006148] active:scale-[0.98] xl:hidden"
        >
          <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </div>
    </>
  );
}
