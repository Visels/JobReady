# Task 01 - Product Configuration and Feature Flags

Date: 2026-07-25

Scope: central Jobready identity, public-safe configuration, feature flags,
brand asset paths, theme tokens, and config validation. No product routes,
database schema, migrations, production callbacks, or DNS were changed.

## Configuration Contract

Public-safe configuration lives in `src/config/public.ts`.

- `publicProductConfig` is safe for Server and Client Components.
- `buildPublicProductConfig(env)` is pure and used by tests.
- `isFeatureEnabled(feature)` reads the typed public feature map.
- Only `NEXT_PUBLIC_*` values are read in this module, so secrets stay out of
  client bundles.

Server validation lives in `src/config/server.ts`.

- `validateRequiredProductionConfig(env)` fails clearly when required production
  canonical config is missing.
- `getServerProductConfig(env)` wraps public config with runtime metadata.
- The server config currently contains no secrets.

Canonical URL behavior lives in `src/lib/site-url.ts`.

- `NEXT_PUBLIC_JOBREADY_CANONICAL_HOST` controls the canonical host.
- `NEXT_PUBLIC_APP_URL` may still point at a local or preview origin.
- Localhost is preserved in development and normalized to the canonical host in
  production.
- Non-local preview hosts are normalized to the configured canonical host.

## Environment Values

Documented in `.env.example`:

- `NEXT_PUBLIC_JOBREADY_CANONICAL_HOST`
- `NEXT_PUBLIC_JOBREADY_BRAND_NAME`
- `NEXT_PUBLIC_JOBREADY_WORDMARK_TEXT`
- `NEXT_PUBLIC_JOBREADY_LEGAL_NAME`
- `NEXT_PUBLIC_JOBREADY_SUPPORT_EMAIL`
- `NEXT_PUBLIC_JOBREADY_DEFAULT_MARKET`
- `NEXT_PUBLIC_JOBREADY_X_HANDLE`
- `NEXT_PUBLIC_JOBREADY_LINKEDIN_URL`
- `NEXT_PUBLIC_JOBREADY_FACEBOOK_URL`
- `NEXT_PUBLIC_JOBREADY_INSTAGRAM_URL`
- `NEXT_PUBLIC_FEATURE_LEGACY_VISA_FLOW`
- `NEXT_PUBLIC_FEATURE_PUBLIC_JOBS`
- `NEXT_PUBLIC_FEATURE_CV_RESUME_TAILORING`
- `NEXT_PUBLIC_FEATURE_JOB_INTERVIEWS`
- `NEXT_PUBLIC_FEATURE_APPLICATION_TRACKING`
- `NEXT_PUBLIC_FEATURE_NATIVE_APPLICATIONS`

Safe defaults:

- Legacy visa flow defaults on.
- Public jobs, CV/resume tailoring, job interviews, application tracking, and
  native applications default off.
- Default market is `KE`.
- Canonical host remains `www.visainterview.ai` until the owner resolves D01 and
  production callbacks are changed in later tasks.

## Brand and Theme

Brand assets were added under `public/brand/jobready/`:

- `wordmark.svg`
- `wordmark-light.svg`
- `wordmark-dark.svg`
- `compact-mark.svg`
- `favicon.svg`
- `social-og.svg`

These are provisional SVG assets because the final approved production logo pack
is still Decision Gate D17. The component API and paths are stable so final
assets can replace these files later.

`src/components/ui/BrandMark.tsx` now supports:

- `mode="full"`
- `mode="compact"`
- `mode="text-fallback"`
- `tone="default"`
- `tone="reversed"`

Theme tokens are centralized through:

- `src/config/theme-tokens.js`
- `tailwind.config.js`
- `src/app/globals.css`

The token palette maps:

- Primary actions to emerald.
- Primary text/navigation to ink.
- Readiness highlights to restrained gold.
- Coral is no longer the central `accent` token.

## Validation

Commands run:

- `npm test`
- `.\node_modules\.bin\tsc.cmd --noEmit --pretty false`
- `.\node_modules\.bin\prisma.cmd validate`
- `npm run build`
- `.\node_modules\.bin\eslint.cmd .`

Results:

- Config tests passed.
- TypeScript passed.
- Prisma validation passed with the existing Prisma 7 `package.json#prisma`
  deprecation warning.
- Production build passed with the existing edge-runtime static-generation
  warning.
- ESLint passed.

## Follow-Ups

- D01 still needs the final canonical public domain before Task 25.
- D02 still needs the final legal company name and support ownership before Task
  25.
- D17 still needs the approved production logo asset pack before Task 25.
- Later tasks should consume `publicProductConfig`, `BrandMark`, and token
  variables instead of adding new hardcoded brand constants.
