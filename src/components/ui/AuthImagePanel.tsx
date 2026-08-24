import Image from "next/image";
import leftPanel from "../../../public/marketing/left_panel.png";

export function AuthImagePanel() {
  return (
    <aside className="relative h-full min-h-0 overflow-hidden bg-[#00492f]">
      <Image
        src={leftPanel}
        alt="Jiandae interview preparation features and candidate testimonial"
        fill
        priority
        sizes="(min-width: 1024px) 49vw, 0px"
        className="object-cover object-center"
      />
    </aside>
  );
}
