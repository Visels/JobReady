import Link from "next/link";

export function formatWorkspaceDate(date: Date | null) {
  if (!date) return "Not set";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function WorkspacePageFrame({
  eyebrow,
  title,
  body,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[calc(100dvh-86px)] px-4 py-5 text-foreground md:px-6 lg:px-7">
      <div className="mx-auto max-w-[1220px]">
        <header className="mb-5 flex flex-col gap-4 rounded-[1.7rem] border border-muted-line bg-surface p-5 shadow-panel md:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3.7rem)] font-black leading-[0.95] tracking-[-0.065em] text-foreground text-balance">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-[14px] leading-6 text-muted">
              {body}
            </p>
          </div>
          {action ? (
            <Link
              href={action.href}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-[12px] font-black text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] transition duration-300 ease-soft hover:bg-primary/92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
            >
              {action.label}
            </Link>
          ) : null}
        </header>
        {children}
      </div>
    </main>
  );
}

export function WorkspaceCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.7rem] border border-muted-line bg-surface p-5 shadow-panel ${className}`}
    >
      {children}
    </section>
  );
}

export function WorkspaceSectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-badge text-muted-subtle">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[20px] font-black tracking-[-0.04em] text-foreground">
          {title}
        </h2>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="rounded-full border border-muted-line bg-surface px-3 py-2 text-[11px] font-black text-foreground transition duration-300 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function WorkspaceEmptyState({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-muted-line bg-surface-soft p-6">
      <p className="text-[15px] font-black text-foreground">{title}</p>
      <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted">{body}</p>
      <Link
        href={href}
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full border border-muted-line bg-surface px-4 text-[12px] font-black text-foreground transition duration-300 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
      >
        {label}
      </Link>
    </div>
  );
}

export function WorkspaceBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  const className =
    tone === "success"
      ? "bg-success-surface text-success"
      : tone === "warning"
        ? "bg-warning-surface text-warning"
        : tone === "danger"
          ? "bg-danger-surface text-danger"
          : "bg-primary-soft text-primary";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black leading-none ${className}`}
    >
      {children}
    </span>
  );
}

export function WorkspaceTextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center justify-center rounded-full border border-muted-line bg-surface px-3 text-[11px] font-black text-foreground transition duration-300 ease-soft hover:border-muted-line-strong hover:bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-press motion-reduce:transition-none"
    >
      {children}
    </Link>
  );
}
