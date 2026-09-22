import { strict as assert } from "node:assert";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { chromium, expect, type Route } from "@playwright/test";
import { createDefaultInterviewOnboardingDraft } from "../src/lib/interviews/interview-onboarding-contracts";
import { createJobInterviewSessionRequestSchema } from "../src/lib/interviews/job-interview-session-contracts";
import { interviewOnboardingFixture } from "./fixtures/interview-onboarding";

// Runs the real form and Tailwind CSS with an isolated API and router: no account,
// database writes, interview credits, or voice-provider calls are needed.
async function main() {
  const root = process.cwd();
  const output = path.join(root, "tmp/interview-onboarding-browser");
  await mkdir(output, { recursive: true });
  const pageSource = await readFile(
    path.join(root, "src/app/(app)/interviews/new/page.tsx"),
    "utf8",
  );
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
        createRoot(document.getElementById('root')).render(<main className="min-h-[calc(100dvh-64px)] bg-background px-4 py-6 text-foreground md:px-6 md:py-8"><div className="mx-auto grid max-w-[720px] gap-6">${header}<JobInterviewOnboardingClient options={options} initialDraft={initialDraft}/></div></main>);`,
      resolveDir: root,
      loader: "tsx",
    },
    bundle: true,
    outfile: path.join(output, "form.js"),
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"development"' },
    plugins: [
      {
        name: "isolated-router",
        setup(builder) {
          builder.onResolve({ filter: /^next\/navigation$/ }, () => ({
            path: "router",
            namespace: "test",
          }));
          builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({
            contents:
              "export const useRouter = () => ({push: (href) => {window.interviewDestination = href;}});",
          }));
        },
      },
    ],
  });
  const cssPath = path.join(root, "src/app/globals.css");
  const css = await postcss([tailwind({ base: root })]).process(
    await readFile(cssPath, "utf8"),
    { from: cssPath },
  );
  await writeFile(path.join(output, "form.css"), css.css);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url!, "http://localhost");
    try {
      if (url.pathname === "/") {
        response.setHeader("Content-Type", "text/html");
        response.end(
          '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/form.css"><style>body{margin:0;padding-top:64px;font-family:Arial,sans-serif}#root{margin-left:220px}@media(max-width:767px){body{padding-top:16px}#root{margin-left:0}}</style></head><body><div id="root"></div><script src="/form.js"></script></body></html>',
        );
      } else {
        response.setHeader(
          "Content-Type",
          url.pathname.endsWith(".css") ? "text/css" : "text/javascript",
        );
        response.end(
          await readFile(path.join(output, path.basename(url.pathname))),
        );
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
    const page = await browser.newPage({
      viewport: { width: 1366, height: 768 },
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const requests: ReturnType<
      typeof createJobInterviewSessionRequestSchema.parse
    >[] = [];
    let fail = false;
    let delay = false;
    let delayedRoute: Route | null = null;
    await page.route("**/api/job-interviews", async (route) => {
      requests.push(
        createJobInterviewSessionRequestSchema.parse(
          route.request().postDataJSON(),
        ),
      );
      if (delay) {
        delayedRoute = route;
        return;
      }
      await route.fulfill({
        status: fail ? 503 : 200,
        json: fail
          ? { error: "Connection failed. Try again." }
          : { session: { id: "interview-123" } },
      });
    });
    const origin = `http://127.0.0.1:${address.port}`;
    const start = page.getByRole("button", {
      name: "Start interview",
      exact: true,
    });
    const more = page.locator("summary").filter({ hasText: "More options" });
    async function fresh(query = "") {
      await page.goto(origin);
      await page.evaluate(() => localStorage.clear());
      await page.goto(`${origin}/${query}`);
      await expect(start).toBeEnabled();
    }
    async function destination(expected: string) {
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as Window & { interviewDestination?: string })
                .interviewDestination,
          ),
        )
        .toBe(expected);
    }

    await fresh();
    await expect(
      page.getByLabel("Question focus", { exact: true }),
    ).not.toBeVisible();
    await expect(page.getByLabel("Role", { exact: true })).toHaveValue(
      "role:pm",
    );
    await expect(start).toBeInViewport();
    const startBounds = await start.boundingBox();
    assert.ok(
      startBounds && startBounds.y + startBounds.height <= 768,
      "Start must be fully visible on a small laptop.",
    );
    await page.screenshot({
      path: path.join(output, "desktop.png"),
      fullPage: true,
    });
    await page
      .getByLabel("Role", { exact: true })
      .selectOption("role:engineer");
    delay = true;
    await start.dblclick();
    await expect.poll(() => requests.length).toBe(1);
    await expect(
      page.getByRole("heading", { name: "Your room is getting ready" }),
    ).toBeVisible();
    await expect(
      page.getByText("Saving your interview setup", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: path.join(output, "launch-progress.png"),
      fullPage: true,
    });
    await expect(page.getByLabel("Company", { exact: true })).toBeDisabled();
    await expect.poll(() => delayedRoute !== null).toBe(true);
    await delayedRoute!.fulfill({ json: { session: { id: "interview-123" } } });
    delay = false;
    await destination("/interviews/interview-123/room");
    assert.equal(requests[0].roleFamilyId, "engineering");
    assert.equal(requests[0].candidateDocument, undefined);
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("jobready-interview-onboarding-draft-v1"),
      ),
      null,
    );

    await fresh();
    await more.click();
    await page
      .getByLabel("Question focus", { exact: true })
      .selectOption("role_specific_focus");
    await page
      .getByLabel("Personalize with a CV (optional)", { exact: true })
      .selectOption("cv-v1");
    await page
      .getByLabel("Interview stage", { exact: true })
      .selectOption("screen");
    await page.getByText("Voice", { exact: true }).click();
    const voiceChoice = page.getByRole("radio", {
      name: "Voice Practise out loud",
    });
    await expect(voiceChoice).toBeChecked();
    await voiceChoice.press("ArrowLeft");
    await expect(
      page.getByRole("radio", { name: "Text Type your answers" }),
    ).toBeChecked();
    await page
      .getByRole("radio", { name: "Text Type your answers" })
      .press("ArrowRight");
    await expect(voiceChoice).toBeChecked();
    await page.getByLabel("Duration", { exact: true }).selectOption("15");
    await more.click();
    await start.click();
    await destination("/interviews/interview-123/voice");
    assert.equal(
      requests.at(-1)!.candidateDocument?.useForPersonalization,
      true,
    );
    assert.equal(requests.at(-1)!.preferredFrameworkKey, "product_case");
    assert.equal(requests.at(-1)!.durationMinutes, 15);
    assert.equal(requests.at(-1)!.interviewStageId, "screen");

    await fresh();
    await page.getByRole("button", { name: "Use a job" }).click();
    await page.getByLabel("Search jobs", { exact: true }).fill("KCB");
    await page
      .getByLabel("Choose a job", { exact: true })
      .selectOption("public:public-v1");
    await expect(page.getByLabel("Role", { exact: true })).toHaveValue(
      "role:engineer",
    );
    await expect(page.getByLabel("Role", { exact: true })).toBeDisabled();
    await expect(
      page.getByLabel("Experience level", { exact: true }),
    ).toHaveValue("senior");
    await start.click();
    await destination("/interviews/interview-123/room");
    assert.equal(requests.at(-1)!.target.type, "public_job");

    await fresh();
    await page.getByRole("button", { name: "Use a job" }).click();
    await page
      .getByLabel("Choose a job", { exact: true })
      .selectOption("private:private-v1");
    await expect(
      page.getByLabel("Company name (optional)", { exact: true }),
    ).toHaveValue("Mwangaza Studio");
    await start.click();
    await destination("/interviews/interview-123/room");
    assert.equal(requests.at(-1)!.target.type, "private_job");
    assert.equal(requests.at(-1)!.clientLabels?.company, "Mwangaza Studio");

    await fresh();
    await page
      .getByLabel("Experience level", { exact: true })
      .selectOption("entry");
    await page.reload();
    await expect(
      page.getByLabel("Experience level", { exact: true }),
    ).toHaveValue("entry");
    await expect(
      page.getByText("This setup does not have a reviewed interview plan yet."),
    ).toBeVisible();
    await expect(start).toBeDisabled();
    await page.goto(`${origin}/?job=software-engineer`);
    await expect(page.getByLabel("Role", { exact: true })).toHaveValue(
      "role:engineer",
    );
    await expect(
      page.getByLabel("Experience level", { exact: true }),
    ).toHaveValue("senior");
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(page.getByLabel("Role", { exact: true })).toBeEnabled();

    await fresh();
    await page
      .getByLabel("Role", { exact: true })
      .selectOption("role:safaricom-engineer");
    await page.getByLabel("Company", { exact: true }).selectOption("kcb");
    await expect(page.getByLabel("Role", { exact: true })).toHaveValue(
      "family:engineering",
    );
    await more.click();
    await page.getByLabel("Market", { exact: true }).selectOption("ug");
    await expect(page.getByLabel("Company", { exact: true })).toHaveValue("");
    await page
      .getByLabel("Company name (optional)", { exact: true })
      .pressSequentially("Kampala Studio");
    await expect(
      page.getByLabel("Company name (optional)", { exact: true }),
    ).toHaveValue("Kampala Studio");

    await fresh();
    fail = true;
    await start.click();
    await expect(page.getByRole("alert")).toContainText("Connection failed");
    const failedKey = requests.at(-1)!.idempotencyKey;
    await start.click();
    await expect(start).toBeEnabled();
    assert.equal(requests.at(-1)!.idempotencyKey, failedKey);
    await page.getByLabel("Duration", { exact: true }).selectOption("45");
    fail = false;
    await start.click();
    await destination("/interviews/interview-123/room");
    assert.notEqual(requests.at(-1)!.idempotencyKey, failedKey);

    await fresh();
    const staleDraft = {
      ...createDefaultInterviewOnboardingDraft(interviewOnboardingFixture()),
      candidateDocumentChoice: "use",
      candidateDocumentVersionId: "deleted-cv",
    };
    await page.evaluate(
      (draft) =>
        localStorage.setItem(
          "jobready-interview-onboarding-draft-v1",
          JSON.stringify({ schemaVersion: "task17.v2", draft }),
        ),
      staleDraft,
    );
    await page.reload();
    await start.click();
    await expect(
      page.getByLabel("Personalize with a CV (optional)", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Personalize with a CV (optional)", { exact: true }),
    ).toBeFocused();
    await page
      .getByLabel("Personalize with a CV (optional)", { exact: true })
      .selectOption("");
    await start.click();
    await destination("/interviews/interview-123/room");

    await fresh("?empty");
    await expect(
      page.getByRole("button", { name: "Use a job" }),
    ).not.toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(output, "mobile.png"),
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    await start.click();
    await destination("/interviews/interview-123/room");
    await page.addInitScript(`
      for (const method of ["getItem", "setItem", "removeItem"]) {
        Object.defineProperty(Storage.prototype, method, { value() { throw new Error("Storage blocked"); } });
      }
    `);
    await page.goto(origin);
    await start.click();
    await destination("/interviews/interview-123/room");
    assert.deepEqual(errors, []);
    console.log(
      "Interview onboarding browser checks passed: direct text/voice launch, target prefill, draft priority, CV consent, validation, dependent choices, retries, duplicate protection, and responsive layout.",
    );
    console.log(`Screenshots: ${output}`);
  } finally {
    await browser.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
