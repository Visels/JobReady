# SEO Agent Todo

Work on **one batch at a time**. After each batch, run the stated checks, report changed files, then stop. Preserve existing behavior and follow `AGENTS.md`.

## Keyword Ownership

| Page | Primary target |
|---|---|
| `/` | visa interview practice |
| `/visa-interview-questions` | visa interview questions |
| `/us-visa-interview` | US visa interview questions |
| `/guides/us-f1-student-visa` | F1 visa interview practice |
| `/blog/f1-visa-interview-questions-2026` | F1 visa interview questions 2026 |
| `/guides/us-b1-b2-tourist-visa` | B1/B2 visa interview questions |

Do not assign the same primary keyword to multiple pages.

## Batch 1: F1 Page Positioning

- Make the F1 guide own `F1 visa interview practice`.
- SEO title: `F1 Visa Interview Practice: Free US Student Visa Mock Interview`.
- H1: `Free F1 Visa Interview Practice for US Students`.
- Description must mention questions, answer frameworks, AI follow-ups, and a free session.
- Above the fold, clearly link to the free F1 practice experience.
- Only call it free if the available session is genuinely free; state limits accurately.

**Check:** canonical is self-referencing; title, H1, and description render correctly.

## Batch 2: F1 Guide Content

Add crawlable content that does not depend on database questions:

- What the officer evaluates: study purpose, funding, academic preparation, and intent to depart.
- At least 15 questions grouped by university, funding, academics, and home ties.
- Strong answer framework and red flags for important questions; avoid scripts.
- F1 document checklist.
- Difficult cases: previous refusal, study gap, US relatives, loans, and OPT.
- One realistic mock interview with follow-up questions.
- Official State Department, USCIS, and ICE sources.
- Accurate author/reviewer and updated date.
- Disclaimer that practice cannot guarantee approval.

**Check:** useful content remains visible when there are zero active MCQs.

## Batch 3: Free F1 Search Intent

Use these phrases naturally where relevant:

- free F1 visa interview
- free F1 visa interview practice
- free F1 visa mock interview
- F1 visa interview practice online
- F1 visa interview simulator
- AI F1 visa interview
- US student visa interview practice
- free US visa interview practice

Do not stuff keywords. The page must provide a usable free practice action matching the wording.

**Check:** copy reads naturally and all practice links reach the correct F1 flow.

## Batch 4: Stop F1 Cannibalization

- Keep the F1 guide focused on practice and preparation.
- Keep the 2026 blog article focused on questions and answer frameworks.
- Remove practice-focused targeting from the article metadata.
- From the article, link to the guide as `practice your F1 visa interview for free`.
- From the guide, link back as `F1 visa interview questions for 2026`.
- Keep separate self-referencing canonicals.

**Check:** each page has a distinct title, H1, description, and search intent.

## Batch 5: US Visa Hub

Create `/us-visa-interview` targeting:

- US visa interview
- US visa interview questions
- US visa interview practice
- free US visa interview practice
- US embassy interview questions

Explain supported US visa categories and link prominently to F1 and B1/B2 pages. Do not add unsupported visa categories merely for SEO.

**Check:** add the page to the sitemap and include breadcrumb/schema metadata.

## Batch 6: Internal Links

- Link to F1 practice from the homepage, guide index, relevant articles, and footer/resource navigation.
- Link the home-ties article to the F1 guide.
- Connect the US hub, F1 guide, F1 article, and B1/B2 guide.
- Use descriptive anchors instead of `read more`.

**Check:** no broken links; no page is orphaned.

## Batch 7: Trust And Technical SEO

- Add appropriate Article/WebPage structured data to guides.
- Keep breadcrumbs and ensure FAQ schema matches visible content exactly.
- Include author/reviewer, published/updated dates, and official sources.
- Verify canonical URLs, robots directives, sitemap entries, and crawlable server-rendered text.
- Run lint, type checks, and production build.

**Check:** report test results and any unresolved warnings.

## Batch 8: Supporting Content

Create these only as substantial, distinct articles, one at a time:

1. F1 visa interview sample answers
2. Why did you choose this university?
3. F1 sponsor and funding questions
4. F1 home-ties sample answers
5. F1 visa interview experience 2026
6. F1 visa rejection and 214(b)
7. F1 interview document checklist

Every article must link to the F1 practice guide. Avoid thin or duplicated content.

## After Deployment

- Submit changed URLs in Google Search Console.
- Compare clicks, impressions, CTR, and average position in rolling 28-day periods.
- Track queries containing: `f1`, `US visa`, `free`, `practice`, `mock`, `questions`, and `student visa`.
