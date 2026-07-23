"use client";

import Image from "next/image";
import { ArrowRight, ChevronsUpDown, FileText, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  getOfficerProfile,
  officerDifficulties,
} from "@/lib/visa-options";
import { InterviewPreparingScreen } from "@/components/session/InterviewPreparingScreen";

type CountryOption = {
  id: string;
  name: string;
  isoCode: string;
  flagEmoji?: string | null;
};

type VisaTypeOption = {
  id: string;
  name: string;
  destinationCountryId: string;
  category: {
    id: string;
    slug: string;
    label: string;
  };
};

type SearchableCountrySelectProps = {
  label: string;
  countries: CountryOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
};

type VisaTypeSelectProps = {
  label: string;
  visaTypes: VisaTypeOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  required?: boolean;
};

const selectClass =
  "mt-2 h-12 w-full appearance-none rounded-full border border-muted-line bg-surface-soft px-4 py-2 pr-11 text-sm font-normal text-foreground outline-none transition duration-500 ease-soft focus:border-primary focus:bg-surface focus:ring-0 focus:shadow-[0_0_0_1px_var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "flex min-h-[76px] flex-col justify-start text-sm font-medium text-foreground";
function SearchableCountrySelect({
  label,
  countries,
  value,
  onChange,
  disabled,
}: SearchableCountrySelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = countries.find((country) => country.id === value);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return countries;

    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(normalized) ||
        country.isoCode.toLowerCase().includes(normalized),
    );
  }, [countries, query]);

  return (
    <label className={`relative ${labelClass}`}>
      {label}
      <div className="relative mt-2">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          strokeWidth={1.35}
        />
        <input
          type="text"
          value={
            open
              ? query
              : selected
                ? selected.name
                : ""
          }
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          disabled={disabled}
          placeholder="Search country"
          className={`${selectClass} mt-0 pl-11 pr-11`}
        />
        <ChevronsUpDown
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          strokeWidth={1.35}
        />
        {open && !disabled ? (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-muted-line bg-surface shadow-glass">
            {filtered.length ? (
              filtered.map((country) => (
                <button
                  type="button"
                  key={country.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(country.id);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-normal text-foreground transition duration-300 ease-soft hover:bg-primary-soft"
                >
                  <span>{country.name}</span>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-muted">No countries found.</p>
            )}
          </div>
        ) : null}
      </div>
    </label>
  );
}

function VisaTypeSelect({
  label,
  visaTypes,
  value,
  onChange,
  disabled,
  required,
}: VisaTypeSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = visaTypes.find((visaType) => visaType.id === value);

  return (
    <label className={`relative ${labelClass}`}>
      <span>
        {label}
        {required ? <span className="text-accent-danger"> *</span> : null}
      </span>
      <div className="relative mt-2">
        <FileText
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          strokeWidth={1.35}
        />
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          disabled={disabled}
          className={`${selectClass} mt-0 flex items-center justify-between pl-11 text-left focus:border-primary focus:bg-surface focus:shadow-[0_0_0_1px_var(--color-primary)]`}
        >
          <span className="truncate">
            {selected?.name ?? (visaTypes.length ? "Select visa type" : "No visa types found")}
          </span>
          <ChevronsUpDown
            className="h-4 w-4 flex-none text-muted"
            strokeWidth={1.35}
          />
        </button>
        {open && !disabled ? (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-muted-line bg-surface shadow-glass">
            {visaTypes.length ? (
              visaTypes.map((visaType) => (
                <button
                  type="button"
                  key={visaType.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(visaType.id);
                    setOpen(false);
                  }}
                  className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition duration-300 ease-soft hover:bg-primary-soft"
                >
                  <span className="text-sm font-medium text-foreground">
                    {visaType.name}
                  </span>
                  <span className="text-xs font-normal text-muted">
                    {visaType.category.label}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-muted">No visa types found.</p>
            )}
          </div>
        ) : null}
      </div>
    </label>
  );
}

export function OnboardingForm({
  disabled,
  usesFreeSession = true,
  initialDestinationCountryId = "",
  initialVisaTypeId = "",
  prefillNotice,
  destinationCountries,
  originCountries,
  allVisaTypes,
}: {
  disabled: boolean;
  usesFreeSession?: boolean;
  initialDestinationCountryId?: string;
  initialVisaTypeId?: string;
  prefillNotice?: string;
  destinationCountries: CountryOption[];
  originCountries: CountryOption[];
  allVisaTypes: VisaTypeOption[];
}) {
  const router = useRouter();
  const rememberedDestination = destinationCountries.some(
    (country) => country.id === initialDestinationCountryId,
  )
    ? initialDestinationCountryId
    : destinationCountries[0]?.id ?? "";
  const [destinationCountryId, setDestinationCountryId] = useState(
    rememberedDestination,
  );
  const [originCountryId, setOriginCountryId] = useState(
    originCountries.find((country) => country.isoCode === "KE")?.id ??
      originCountries[0]?.id ??
      "",
  );
  const [visaTypeId, setVisaTypeId] = useState(
    allVisaTypes.some(
      (visaType) =>
        visaType.id === initialVisaTypeId &&
        visaType.destinationCountryId === rememberedDestination,
    )
      ? initialVisaTypeId
      : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [difficulty, setDifficulty] = useState("Realistic");
  const [error, setError] = useState("");
  const visaTypes = useMemo(
    () =>
      allVisaTypes.filter(
        (visaType) => visaType.destinationCountryId === destinationCountryId,
      ),
    [allVisaTypes, destinationCountryId],
  );
  const selectedDestinationCountry = destinationCountries.find(
    (country) => country.id === destinationCountryId,
  );
  const destinationName = selectedDestinationCountry?.name ?? "your destination";

  function chooseDestinationCountry(id: string) {
    setDestinationCountryId(id);
    setVisaTypeId("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || submitting) return;

    if (!visaTypeId || !originCountryId) {
      setError("Choose a visa type and origin country before starting.");
      return;
    }

    setSubmitting(true);
    setError("");
    const response = await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visaTypeId,
        originCountryId,
        difficulty,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Could not start the interview.");
      setSubmitting(false);
      return;
    }

    const interviewUrl = `/session/${data.id}`;
    router.prefetch(interviewUrl);
    router.push(interviewUrl);
  }

  return (
    <form onSubmit={submit} className="grid gap-7">
      {submitting ? <InterviewPreparingScreen stage="creating" /> : null}
      {prefillNotice ? (
        <p className="rounded-xl border border-primary/15 bg-primary-soft px-4 py-3 text-sm font-semibold leading-6 text-primary">
          {prefillNotice}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <SearchableCountrySelect
          label="Destination country"
          countries={destinationCountries}
          value={destinationCountryId}
          onChange={chooseDestinationCountry}
          disabled={disabled}
        />

        <VisaTypeSelect
          label="Visa type"
          visaTypes={visaTypes}
          value={visaTypeId}
          onChange={setVisaTypeId}
          disabled={disabled || !visaTypes.length}
          required
        />
      </div>

      <section className="grid gap-4">
        <div className="max-w-md">
          <SearchableCountrySelect
            label="Origin country"
            countries={originCountries}
            value={originCountryId}
            onChange={setOriginCountryId}
            disabled={disabled}
          />
        </div>
      </section>

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-foreground">
          Choose your officer difficulty
        </legend>
        <div className="grid gap-3 md:grid-cols-3">
          {officerDifficulties.map((option) => {
            const selected = difficulty === option;
            const officer = getOfficerProfile(destinationName, option);

            return (
              <button
                type="button"
                key={option}
                onClick={() => setDifficulty(option)}
                className={`group overflow-hidden rounded-xl border bg-surface text-left transition duration-500 ease-soft active:scale-press ${selected
                  ? "border-primary ring-4 ring-primary/20 shadow-[0_26px_70px_color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
                  : "border-muted-line hover:-translate-y-0.5 hover:border-muted-line-strong"
                  }`}
                aria-pressed={selected}
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-primary">
                  <Image
                    src={officer.avatarSrc}
                    alt={`${officer.name}, ${option} interview officer`}
                    fill
                    sizes="(min-width: 768px) 220px, 100vw"
                    className="object-cover transition duration-700 ease-soft group-hover:scale-[1.03]"
                  />
                  {selected ? (
                    <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_3px_color-mix(in_srgb,var(--color-primary)_74%,transparent),inset_0_0_38px_color-mix(in_srgb,var(--color-primary)_22%,transparent)]" />
                  ) : null}
                </span>
                <span className="block p-3">
                  <span className="block text-sm font-semibold leading-5 text-foreground">
                    {officer.name}
                  </span>
                  <span className="mt-1 block text-xs leading-4 text-muted">
                    {officer.summary}
                  </span>
                  <span
                    className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${selected
                      ? "bg-primary text-primary-contrast shadow-[0_10px_24px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]"
                      : "bg-surface-soft text-muted"
                      }`}
                  >
                    {option} difficulty
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {error ? (
        <p className="rounded-xl border border-accent-danger/25 bg-accent-surface px-4 py-3 text-sm font-normal text-accent-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 border-t border-muted-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-accent">
          {usesFreeSession ? "Uses your free session" : "Included in your paid access"}
        </p>
        <button
          type="submit"
          disabled={disabled || submitting || !visaTypeId || !originCountryId}
          className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary py-1.5 pl-6 pr-1.5 text-sm font-bold text-primary-contrast transition duration-500 ease-soft hover:bg-primary/92 active:scale-press disabled:cursor-not-allowed disabled:opacity-55"
        >
          {disabled
            ? "Choose a plan to start"
            : submitting
              ? "Starting interview"
              : "Enter interview room"}
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/12 transition duration-700 ease-soft group-hover:translate-x-1 group-hover:-translate-y-px group-hover:scale-105">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.35} />
            ) : (
              <ArrowRight className="h-4 w-4" strokeWidth={1.35} />
            )}
          </span>
        </button>
      </div>
    </form>
  );
}
