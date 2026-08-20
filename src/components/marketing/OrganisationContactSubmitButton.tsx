"use client";

import { Loader2, Send } from "lucide-react";
import { useFormStatus } from "react-dom";

export function OrganisationContactSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#00533f] px-7 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_rgba(0,83,63,0.16)] transition duration-300 ease-soft hover:-translate-y-px hover:bg-[#043b30] hover:shadow-[0_14px_28px_rgba(0,83,63,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00533f] active:scale-press disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-65"
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.9} />
      ) : (
        <Send className="h-5 w-5" strokeWidth={1.9} />
      )}
      {pending ? "Sending" : "Talk to us"}
    </button>
  );
}
