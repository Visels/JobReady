import { strict as assert } from "node:assert";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { chromium, expect } from "@playwright/test";
import { createJobInterviewSessionRequestSchema } from "../src/lib/interviews/job-interview-session-contracts";

async function main() {
  const root = process.cwd();
  const output = path.join(root, "tmp/interview-onboarding-browser");
  await mkdir(output, { recursive: true });
  const pageSource = await readFile(path.join(root, "src/app/(app)/interviews/new/page.tsx"), "utf8");
  const header = pageSource.match(/<header>[\s\S]*?<\/header>/)?.[0];
  assert.ok(header);

  await build({
    stdin: {
      contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
        import {JobInterviewOnboardingClient} from './src/components/interviews/JobInterviewOnboardingClient';
        import {interviewOnboardingFixture} from './scripts/fixtures/interview-onboarding';
        import {createInitialInterviewOnboardingDraft} from './src/lib/interviews/interview-onboarding-contracts';
        const options = interviewOnboardingFixture();
        if (new URLSearchParams(location.search).has('empty')) { options.publicTargets=[]; options.privateTargets=[]; options.candidateDocuments=[]; }
        const initialDraft = createInitialInterviewOnboardingDraft({options, publicJobSlug: new URLSearchParams(location.search).get('job')});
        createRoot(document.getElementById('root')).render(<main className="min-h-[calc(100dvh-64px)] bg-background px-4 py-5 text-foreground md:px-6 lg:py-5"><div className="mx-auto grid max-w-[1180px] gap-4">${header}<JobInterviewOnboardingClient options={options} initialDraft={initialDraft}/></div></main>);`,
      resolveDir: root,
      loader: "tsx",
    },
    bundle: true,
    outfile: path.join(output, "form.js"),
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"development"' },
    plugins: [{
      name: "isolated-router",
      setup(builder) {
        builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: "router", namespace: "test" }));
        builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({
          contents: "export const useRouter = () => ({push: (href) => {window.interviewDestination = href;}});",
        }));
      },
    }],
  });

  const cssPath = path.join(root, "src/app/globals.css");
  const css = await postcss([tailwind({ base: root })]).process(await readFile(cssPath, "utf8"), { from: cssPath });
  await writeFile(path.join(output, "form.css"), css.css);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url!, "http://localhost");
    try {
      if (url.pathname === "/") {
        response.setHeader("Content-Type", "text/html");
        response.end('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/form.css"><style>body{margin:0;padding-top:64px;font-family:Arial,sans-serif}#root{margin-left:276px}@media(max-width:1023px){body{padding-top:16px}#root{margin-left:0}}</style></head><body><div id="root"></div><script src="/form.js"></script></body></html>');
      } else {
        response.setHeader("Content-Type", url.pathname.endsWith(".css") ? "text/css" : "text/javascript");
        response.end(await readFile(path.join(output, path.basename(url.pathname))));
      }
    } catch {
      response.statusCode = 404;
      response.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const requests: ReturnType<typeof createJobInterviewSessionRequestSchema.parse>[] = [];
    await page.route("**/api/job-interviews", async (route) => {
      requests.push(createJobInterviewSessionRequestSchema.parse(route.request().postDataJSON()));
      await route.fulfill({ json: { session: { id: "interview-123" } } });
    });
    const origin = `http://127.0.0.1:${address.port}`;
    const start = page.getByRole("button", { name: "Start interview" });
    async function fresh(query = "") {
      await page.goto(origin);
      await page.evaluate(() => localStorage.clear());
      await page.goto(`${origin}/${query}`);
    }
    async function destination() {
      await expect.poll(() => page.evaluate(() => (window as Window & { interviewDestination?: string }).interviewDestination))
        .toBe("/interviews/interview-123/voice");
    }

    await fresh();
    await expect(page.getByRole("button", { name: /Select a job from Jiandae/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Search jobs")).toBeVisible();
    await expect(start).toBeDisabled();
    await expect(page.getByText("Interview format")).toHaveCount(0);
    await expect(page.getByRole("radio", { name: /15 minutes/ })).toBeVisible();
    await expect(page.getByRole("radio", { name: /30 minutes/ })).toBeVisible();
    await expect(page.getByRole("radio", { name: /60 minutes/ })).toBeVisible();
    await expect(page.getByRole("radio", { name: /45 minutes/ })).toHaveCount(0);
    await expect(page.getByLabel("Personalize with a CV or resume")).toBeVisible();
    await page.screenshot({ path: path.join(output, "desktop.png"), fullPage: true });

    await page.getByLabel("Search jobs").fill("KCB");
    await page.getByRole("button", { name: /Software Engineer KCB Group/ }).click();
    await expect(page.getByText("Selected: Software Engineer at KCB Group")).toBeVisible();
    await expect(start).toBeEnabled();
    await page.getByLabel("Duration", { exact: true }).selectOption("60");
    await expect(page.getByRole("radio", { name: /60 minutes/ })).toBeChecked();
    await page.getByLabel("Personalize with a CV or resume").selectOption("cv-v1");
    await start.click();
    await destination();
    assert.equal(requests.at(-1)?.target.type, "public_job");
    assert.equal(requests.at(-1)?.durationMinutes, 60);
    assert.equal(requests.at(-1)?.candidateDocument?.versionId, "cv-v1");

    await fresh("?job=software-engineer");
    await expect(page.getByText("Selected: Software Engineer at KCB Group")).toBeVisible();
    await expect(start).toBeEnabled();

    await fresh();
    await page.getByRole("button", { name: /Enter details manually/ }).click();
    await page.getByLabel("Job title").fill("Product Manager");
    await page.getByLabel("Company", { exact: true }).fill("Mwangaza Studio");
    await page.getByLabel("Job description").fill("Lead customer research and prioritize the product roadmap with the team.");
    await page.screenshot({ path: path.join(output, "manual.png"), fullPage: true });
    await start.click();
    await destination();
    assert.deepEqual(requests.at(-1)?.target, {
      type: "manual_job",
      roleTitle: "Product Manager",
      companyName: "Mwangaza Studio",
      description: "Lead customer research and prioritize the product roadmap with the team.",
    });

    await fresh("?empty");
    await expect(page.getByText(/No matching jobs/)).toBeVisible();
    await page.getByRole("button", { name: /Enter details manually/ }).click();
    await expect(page.getByLabel("Job title")).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, "mobile.png"), fullPage: true });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
      "Mobile setup should not overflow horizontally.",
    );
    assert.deepEqual(errors, []);
    console.log("Interview onboarding browser: passed");
  } finally {
    await browser.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
