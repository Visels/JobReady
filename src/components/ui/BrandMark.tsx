export function BrandMark({
  className = "inline-flex items-center gap-2 text-brand font-bold text-foreground",
  markClassName = "bg-accent",
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={className}>
      <span className="grid h-5 w-5 grid-cols-2 gap-0.5">
        <span className={`h-2 w-2 rounded-full ${markClassName}`} />
        <span className={`mt-2 h-2 w-2 rounded-full ${markClassName}`} />
        <span className={`col-span-2 mx-auto h-2 w-2 rounded-full ${markClassName}`} />
      </span>
      <span className="min-w-0 truncate">VisaInterview</span>
    </span>
  );
}
