"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function OrganisationContactSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg bg-[#f7bd22] px-7 text-sm font-bold text-[#173127] shadow-[0_8px_18px_rgba(247,189,34,0.18)] transition duration-300 ease-soft hover:-translate-y-px hover:bg-[#ffd15a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7bd22] active:scale-press disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-65"
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.9} />
      ) : null}
      {pending ? "Sending" : "Talk to us"}
    </button>
  );
}
