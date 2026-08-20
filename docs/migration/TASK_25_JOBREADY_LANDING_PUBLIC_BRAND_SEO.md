# Task 25 - Jobready Landing Page, Public Brand, and SEO

Date: 2026-07-28

## Outcome

The public product now presents one coherent Jobready identity for candidates applying to roles in Kenya and Africa. The landing page leads with public job search, explains jobs, CV/resume tailoring, and mock interviews as independent products, and routes candidates into optional preparation without hiding free official application access.

## Implemented

- Locked the default public canonical host to `jiandae.africa` through centralized public product configuration.
- Updated environment examples, public metadata, Open Graph defaults, structured data, sitemap, robots, canonical helpers, favicon/social references, and support email defaults to Jobready.
- Replaced the legacy marketing navigation with a responsive Jobready header containing:
  - Jobs.
  - Interview Practice.
  - CV & Resume.
  - Career Resources.
  - Pricing.
  - Sign In, or Go to Workspace for authenticated candidates.
- Rebuilt the landing page in the required order:
  - Hero with public keyword/company and location job search.
  - Fresh jobs rendered on the server with official apply access.
  - Three independent product paths.
  - Optional Find -> Tailor -> Practise -> Apply -> Track journey.
  - Reviewed company and role preparation examples.
  - Controlled product/report demonstration.
  - STAR and role/technical resource entry points.
  - Transparent finite-credit pricing.
  - Focused final CTA and legal footer.
- Updated public jobs header, authenticated candidate destinations, filtered-page `noindex` behavior, eligible-job sitemap entries, and job-action analytics attributes.
- Added production analytics event forwarding for clickable/submittable elements marked with `data-analytics-event`.
- Rebranded auth, magic-link, reset-password, checkout metadata, referral, welcome email, policy, report PDF, 404, and global-error surfaces to Jobready.
- Redirected legacy public visa marketing routes to `/` and legacy private practice/session/learning routes to the closest Jobready workspace destinations.
- Removed unused legacy marketing/sidebar/promo components that were no longer referenced.

## SEO And Indexing

- The default canonical host is now `https://jiandae.africa`.
- Base `/jobs` is indexable, while filter/search states are `noindex`.
- Private workspace, checkout, admin, report, legacy visa, and thin/search routes are disallowed in `robots.ts`.
- The sitemap includes only core public pages plus currently active public jobs returned by the public jobs service.
- `SoftwareApplication` structured data now uses Jobready branding and no longer ships fake aggregate-rating data.
- JobPosting markup remains active-only through the public jobs detail helpers.

## Design And Content Policy

- The public theme uses warm paper/white, ink typography, emerald primary actions, and restrained gold readiness details.
- No fake testimonials, fake job totals, fake employer partnerships, fake scores, or fake company logos were added.
- Company preparation examples use reviewed launch content from Task 24 and include source/review dates plus non-affiliation language.
- The report demonstration is a controlled fixture until permissioned anonymized beta material exists.

## Legacy Compatibility Notes

- The old visa interview engine, seed scripts, legacy data models, and gated prompts remain in the codebase for Task 30 retirement.
- Historical billing plan names remain in legacy plan definitions so old purchase records can still be interpreted.
- Robots intentionally includes legacy visa route strings so crawlers do not index retired paths.
- Auth return-path helpers still recognize `/practice` only to normalize old links safely to `/dashboard`.

## Database Application

- No schema migration was required.
- No production/development database write was required for Task 25.
- The homepage and sitemap read public jobs through existing services and fall back safely when no active jobs are available.

## Validation

- `npm test` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed.
- `npm run build` passed with the pre-existing edge-runtime static-generation warning.
- `npx prisma validate` passed with the pre-existing Prisma 7 `package.json#prisma` deprecation warning.
- `git diff --check` passed with Windows CRLF normalization warnings only.
- `npm run test:public-jobs` was attempted but not run because the script is intentionally guarded to localhost database hosts. The configured development database is `aws-1-eu-west-2.pooler.supabase.com`, and the test creates synthetic records without cleanup.

## Notes

- Public pages are now technically prepared for Jobready indexing after cutover, but broad visual-regression and accessibility-device coverage should still be repeated in Task 27 end-to-end QA.
- Task 26 should harden privacy, security, fairness, consent, and deletion wording and controls across the newly branded surfaces.
