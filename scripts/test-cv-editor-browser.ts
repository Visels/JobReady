import { strict as assert } from "node:assert";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { chromium, expect, type Route } from "@playwright/test";
import { cvFixture } from "./fixtures/cv-draft";
import type { CvDraft, SavedCvDraft } from "../src/lib/cv/contracts";
import { exportCvPdf, exportCvDocx } from "../src/lib/cv/export";

async function main() {
  const root = process.cwd();
  const output = path.join(root, "tmp/cv-tests/browser");
  await mkdir(output, { recursive: true });
  await build({
    stdin: {
      contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {CvEditor} from './src/components/cv/CvEditor'; createRoot(document.getElementById('root')).render(<CvEditor documents={[]}/>);`,
      resolveDir: root,
      loader: "tsx",
    },
    bundle: true,
    outfile: path.join(output, "editor.js"),
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"development"' },
    external: ["/fonts/*"],
    sourcemap: true,
  });
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url!, "http://localhost");
      if (url.pathname === "/") {
        response.setHeader("Content-Type", "text/html");
        response.end(
          `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/editor.css"><style>:root{--color-muted-line:#dce4df;--color-muted-line-strong:#c8d4ce;--color-surface:#fff;--color-surface-soft:#f4f7f5;--color-primary:#00533a;--color-primary-soft:#eaf4ef;--color-foreground:#1b2430;--color-muted:#53605a;--color-muted-subtle:#748079;--color-accent-danger:#b42318}*{box-sizing:border-box}body{margin:0;padding:24px;background:#fcfcfa;font-family:Arial,sans-serif}button,input,textarea,select{font:inherit}button{cursor:pointer}h1,h2,h3,p{margin:0}#root{max-width:1120px;margin:auto}@media(max-width:760px){body{padding:8px}}</style></head><body><div id="root"></div><script src="/editor.js"></script></body></html>`,
        );
        return;
      }
      const file = url.pathname.startsWith("/fonts/cv/")
        ? path.join(root, "public", url.pathname)
        : path.join(output, path.basename(url.pathname));
      response.setHeader(
        "Content-Type",
        file.endsWith("css")
          ? "text/css"
          : file.endsWith("ttf")
            ? "font/ttf"
            : "text/javascript",
      );
      response.end(await readFile(file));
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
      viewport: { width: 1360, height: 980 },
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const saved = new Map<string, SavedCvDraft>();
    let version = 0;
    let failSave = false;
    let conflict = false;
    const exports: CvDraft[] = [];
    await page.route("**/api/cv/drafts*", async (route) => {
      const request = route.request();
      if (request.method() === "GET") {
        const found = saved.get(new URL(request.url()).searchParams.get("id")!);
        await route.fulfill({
          status: found ? 200 : 404,
          json: found ?? { error: "CV unavailable" },
        });
        return;
      }
      if (failSave || conflict) {
        await route.fulfill({
          status: conflict ? 409 : 503,
          json: {
            error: conflict
              ? "This CV was updated in another tab."
              : "Connection failed. Your edits are still here.",
          },
        });
        return;
      }
      const body = request.postDataJSON();
      const entry = {
        documentId: body.documentId,
        versionId: `v${++version}`,
        updatedAt: new Date().toISOString(),
        draft: body.draft,
      };
      saved.set(body.documentId, entry);
      await route.fulfill({ json: entry });
    });
    let delayedRevision: Route | null = null;
    let delayAi = false;
    let lastAiDraft: CvDraft | null = null;
    const aiResponse = async (route: Route) => {
      const body = route.request().postDataJSON();
      lastAiDraft = body.draft;
      await route.fulfill({
        json: {
          message: "Refined your summary.",
          changes: [
            {
              fieldId: "summary",
              before: body.draft.summary,
              after:
                "A clearer summary grounded in my customer support experience.",
              sourceFieldIds: ["summary"],
            },
          ],
        },
      });
    };
    await page.route("**/api/cv/revise", async (route) => {
      if (delayAi) delayedRevision = route;
      else await aiResponse(route);
    });
    await page.route("**/api/cv/export", async (route) => {
      const { draft, format } = route.request().postDataJSON();
      exports.push(draft);
      await route.fulfill({
        body: Buffer.from(
          format === "pdf"
            ? await exportCvPdf(draft)
            : await exportCvDocx(draft),
        ),
        headers: {
          "Content-Type":
            format === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="test-cv.${format}"`,
        },
      });
    });
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.getByLabel("Full name", { exact: true }).fill("Amina Mwangi");
    await page.getByLabel("Summary", { exact: true }).fill(cvFixture().summary);
    await expect(page.getByLabel("Live CV preview")).toContainText(
      cvFixture().summary,
    );
    await expect(
      page.getByText("All changes saved", { exact: true }),
    ).toBeVisible({ timeout: 15000 });
    const documentId = [...saved.keys()][0];
    assert.equal(
      saved.get(documentId)!.draft.personal.fullName,
      "Amina Mwangi",
    );

    await page.getByRole("tab", { name: "Ask AI" }).click();
    await page
      .getByRole("button", { name: "Polish the summary more", exact: true })
      .click();
    delayAi = true;
    await page
      .getByRole("button", { name: "Suggest edits", exact: true })
      .click();
    await expect.poll(() => delayedRevision !== null).toBe(true);
    await page.getByRole("tab", { name: "Edit CV", exact: true }).click();
    await page
      .getByLabel("Summary", { exact: true })
      .fill("A newer manual summary written while AI was working.");
    await aiResponse(delayedRevision!);
    delayedRevision = null;
    delayAi = false;
    await page.getByRole("tab", { name: "Ask AI" }).click();
    await page
      .getByRole("button", { name: "Apply suggestion", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("changed");
    await expect(page.getByLabel("Live CV preview")).toContainText(
      "A newer manual summary",
    );
    await page
      .getByRole("button", { name: "Suggest edits", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Apply suggestion", exact: true })
      .click();
    assert.equal(
      (lastAiDraft as CvDraft | null)?.summary,
      "A newer manual summary written while AI was working.",
    );
    await expect(page.getByLabel("Live CV preview")).toContainText(
      "A clearer summary",
    );
    await page.getByRole("button", { name: "Undo last AI edit" }).click();
    await expect(page.getByLabel("Live CV preview")).toContainText(
      "A newer manual summary",
    );

    await page.getByRole("tab", { name: "Edit CV", exact: true }).click();
    await page
      .getByLabel("Summary", { exact: true })
      .fill("The latest manual edit, exported before autosave.");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PDF" }).click();
    await (await downloadPromise).saveAs(path.join(output, "download.pdf"));
    assert.equal(
      exports.at(-1)!.summary,
      "The latest manual edit, exported before autosave.",
    );
    const docxPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "DOCX", exact: true }).click();
    await (await docxPromise).saveAs(path.join(output, "download.docx"));

    await page.getByRole("button", { name: "New CV", exact: true }).click();
    await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("");
    await page.getByLabel("Open a saved CV").selectOption(documentId);
    await expect(page.getByLabel("Summary", { exact: true })).toHaveValue(
      "The latest manual edit, exported before autosave.",
    );
    failSave = true;
    await page
      .getByLabel("Summary", { exact: true })
      .fill("An edit made during a connection failure.");
    await expect(page.getByText("Not saved", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByLabel("Summary", { exact: true })).toHaveValue(
      "An edit made during a connection failure.",
    );
    failSave = false;
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(
      page.getByText("All changes saved", { exact: true }),
    ).toBeVisible();
    conflict = true;
    await page
      .getByLabel("Summary", { exact: true })
      .fill("Keep these edits as a copy after a conflict.");
    await expect(page.getByText("Save conflict", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    conflict = false;
    await page
      .getByRole("button", { name: "Save my edits as a new CV" })
      .click();
    await expect(
      page.getByText("All changes saved", { exact: true }),
    ).toBeVisible();
    assert.equal(saved.size, 2);
    assert.equal(
      saved.get(documentId)!.draft.summary,
      "An edit made during a connection failure.",
    );

    await page.screenshot({
      path: path.join(output, "desktop.png"),
      fullPage: true,
    });
    await page.getByRole("tab", { name: "Ask AI" }).click();
    await page.screenshot({
      path: path.join(output, "ai-panel.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(page.getByLabel("Live CV preview")).toBeVisible();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      "Mobile must not scroll horizontally",
    );
    await page.screenshot({
      path: path.join(output, "mobile.png"),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "Browser tests passed: live preview, autosave/reopen, stale AI rejection, apply/undo, PDF/DOCX downloads, failed-save retry, conflict copy, and mobile layout.",
    );
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
