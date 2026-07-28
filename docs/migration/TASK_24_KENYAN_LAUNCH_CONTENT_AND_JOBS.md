# Task 24 - Kenyan Launch Content and Jobs

Date: 2026-07-28

## Outcome

A reviewed Kenyan launch catalog exists for Safaricom, KCB Bank Kenya, and Kenya Pipeline Company. The catalog is deliberately small and deep: it supports exact interview preparation for the initial employers and role families without claiming leaked or exact interview questions.

## Implemented

- Added `prisma/jobready-launch-catalog.ts` with idempotent Task 24 seed data.
- Added focused seed and verification scripts:
  - `npm run seed:kenyan-launch-catalog`
  - `npm run test:kenyan-launch-catalog`
- Wired the launch catalog into the normal Prisma seed after the existing Jobready reference fixtures.
- Added reviewed official content sources, company records, role families, job roles, competencies, rubrics, questions, signals, red flags, follow-up intents, and interview plans.
- Added v2 Safaricom launch plans for:
  - Software Engineering, graduate-entry, recommended.
  - Software Engineering, graduate-entry, behavioral focus.
  - Software Engineering, graduate-entry, technical focus.
  - Product Management, graduate-entry and mid-level, recommended.
- Added KCB launch plans for:
  - Customer Service Officer, graduate-entry, recommended.
  - Relationship Manager, mid-level, recommended.
- Added Kenya Pipeline launch plans for:
  - Graduate Trainee Engineer, graduate-entry, recommended.
  - Pipeline Engineer, mid-level, recommended.
- Added reviewed generic Kenya fallback plans for customer service, relationship management, and energy engineering.
- Tightened interview question selection so role-mapped questions cannot cross into unrelated role families through industry match alone.
- Added explicit fallback warnings when a reviewed generic plan or non-company questions are used for a requested company.

## Official Sources Used

- Safaricom Careers: https://www.safaricom.co.ke/careers/
- Safaricom annual reports index: https://www.safaricom.co.ke/investor-relations-landing/reports/annual-reports
- Safaricom 2026 Annual Report: https://www.safaricom.co.ke/images/Downloads/2026-Annual-Report.pdf
- KCB Group Careers: https://kcbgroup.com/careers
- KCB Group Integrated Reports: https://kcbgroup.com/integrated-reports
- KCB Applications Specialist - Customer Experience Systems: https://ke.kcbgroup.com/applications-specialist-customer-experience-systems
- KCB Senior Relationship Manager - Infrastructure and Energy: https://ke.kcbgroup.com/senior-relationship-manager-infrastructure-energy
- Kenya Pipeline Careers: https://www.kpc.co.ke/career/
- Kenya Pipeline About: https://kpc.co.ke/about/
- Morendat Institute of Oil and Gas: https://www.kpc.co.ke/morendat-institute-of-oil-gas/
- KPC Western Kenya Pipeline Flowrate Upgrade: https://kpc.co.ke/kpc-upgrades-western-kenya-pipeline-boosting-the-flowrate-to-515m3-per-hour/

## Database Application

- `npx prisma migrate deploy` timed out against the configured Supabase pooler.
- Pending additive Task 23 migration `20260728120000_task23_admin_content_operations` was applied manually with `psql -f` and recorded in `_prisma_migrations`.
- Task 24 required no schema migration.
- `npm run seed:kenyan-launch-catalog` seeded the configured development database at `aws-1-eu-west-2.pooler.supabase.com`.
- Seed summary:
  - 3 companies.
  - 11 official sources.
  - 34 questions.
  - 3 custom rubrics.
  - 12 plans.
  - 0 published Task 24 live jobs.

## Live Job Policy

No live public job was published for Task 24. Reviewed KCB role pages had a 24 July 2026 application deadline, which was already past on the 28 July 2026 review date. KPC visible vacancies did not match the graduate trainee or engineering launch-role scope with sufficient closing-date evidence. This avoids inflating inventory with stale or unsupported jobs.

## Validation

- `npx prisma validate`
- `npx tsc --noEmit`
- `npm run seed:kenyan-launch-catalog`
- `npm run test:kenyan-launch-catalog`
- `npm run lint`
- `npm test`
- `npm run build`
- `git diff --check`

Focused validation composed:

- Safaricom Software Engineering using `scenario-b-safaricom-software-engineering-recommended-graduate-entry@2`.
- Safaricom Product Management using `scenario-a-safaricom-product-manager-recommended-mid-level@2`.
- KCB Customer Service using `launch-kcb-customer-service-officer-recommended-graduate-entry@1`.
- KCB Relationship Management using `launch-kcb-relationship-manager-recommended-mid-level@1`.
- Kenya Pipeline Graduate Engineering using `launch-kpc-graduate-trainee-engineer-recommended-graduate-entry@1`.
- Kenya Pipeline Engineering using `launch-kpc-pipeline-engineer-recommended-mid-level@1`.
- Unsupported Safaricom Relationship Management fallback using `launch-kenya-relationship-manager-recommended-mid-level@1` with explicit generic-plan and company-question fallback warnings.

## Notes

- All company-specific prompts are synthetic practice prompts. They are not leaked, exact, or confirmed employer interview questions.
- Every company-specific question association has a reviewed official source and rationale.
- Every published Task 24 rubric has a published content review.
- Equity Group and Co-operative Bank were not added, because Task 24 requires the first three employers to meet quality gates first.
