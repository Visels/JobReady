import { redirect } from "next/navigation";

export default function LegacyPracticePage() {
  redirect("/interviews/new");
}
