import { publicProductConfig } from "@/config/public";

type BrandMarkMode = "full" | "compact" | "text-fallback";
type BrandMarkTone = "default" | "reversed";

export function BrandMark({
  mode = "full",
  tone = "default",
  className = "inline-flex items-center gap-2 font-bold text-foreground",
  markClassName = "",
  wordmarkClassName = "",
}: {
  mode?: BrandMarkMode;
  tone?: BrandMarkTone;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  const { brand } = publicProductConfig;
  const isReversed = tone === "reversed";
  const wordmarkSrc = isReversed ? brand.assets.wordmarkDark : brand.assets.wordmark;
  const textColor = isReversed ? "text-white" : "text-foreground";

  return (
    <span className={className}>
      {mode === "compact" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.assets.compactMark}
          alt=""
          width={32}
          height={32}
          className={`h-8 w-8 flex-none ${markClassName}`}
        />
      ) : null}
      {mode === "full" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={wordmarkSrc}
          alt={brand.name}
          width={194}
          height={50}
          className={`h-9 w-auto flex-none ${wordmarkClassName}`}
        />
      ) : null}
      {mode === "text-fallback" ? (
        <span className={`min-w-0 truncate ${textColor}`}>
          {brand.wordmarkText}
        </span>
      ) : null}
      {mode === "compact" ? (
        <span className="sr-only">{brand.name}</span>
      ) : null}
    </span>
  );
}
