"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-muted-line bg-surface text-primary transition duration-500 ease-soft hover:border-primary hover:bg-primary-soft active:scale-press"
      title="Sign out"
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.35} />
    </button>
  );
}
