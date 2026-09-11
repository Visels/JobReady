import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import path from "node:path";
import { build } from "esbuild";
import { loadEnvConfig } from "@next/env";
import { cvFixture } from "./fixtures/cv-draft";

async function main() {
  assert.equal(
    process.env.CV_AI_LIVE_TEST,
    "true",
    "Set CV_AI_LIVE_TEST=true to opt into one paid AI request using synthetic CV data.",
  );
  loadEnvConfig(process.cwd());
  const output = path.resolve("tmp/cv-tests/ai-route.cjs");
  // Run the actual route with a synthetic identity and in-memory usage ledger.
  // No real account or application database is read or written.
  await build({
    entryPoints: ["src/app/api/cv/revise/route.ts"],
    outfile: output,
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    plugins: [
      {
        name: "synthetic-account",
        setup(builder) {
          builder.onResolve(
            { filter: /^(@\/lib\/session-guards|@\/lib\/prisma|server-only)$/ },
            (args) => ({ path: args.path, namespace: "synthetic" }),
          );
          builder.onLoad(
            { filter: /[\\/]cv[\\/]server\.ts$/ },
            async (args) => {
              const { readFile } = await import("node:fs/promises");
              const content = await readFile(args.path, "utf8");
              return {
                contents: content.replace(
                  'error instanceof Error ? error.name : "UnknownError"',
                  'error instanceof Error ? error.message.replace(/https?:[^ ]+/g, "[provider endpoint]") : "UnknownError"',
                ),
                loader: "ts",
              };
            },
          );
          builder.onLoad({ filter: /.*/, namespace: "synthetic" }, (args) => ({
            contents:
              args.path === "server-only"
                ? ""
                : args.path.endsWith("session-guards")
                  ? `export async function requireUser(){return {user:{id:'10000000-0000-4000-8000-000000000099'},response:null}}`
                  : `const modelUsage={count:async()=>0,create:async()=>({id:'test-usage'}),update:async()=>({})};export const prisma={modelUsage,$transaction:async(fn)=>fn({$queryRaw:async()=>[],modelUsage})};`,
            loader: "js",
          }));
        },
      },
    ],
  });
  const { POST } = createRequire(import.meta.url)(output) as {
    POST: (request: Request) => Promise<Response>;
  };
  const response = await POST(
    new Request("http://localhost/api/cv/revise", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost",
      },
      body: JSON.stringify({
        draft: cvFixture(),
        instruction:
          "Polish the summary more. Make it concise and professional without adding facts.",
        scope: "summary",
      }),
    }),
  );
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  assert.ok(
    result.changes.length > 0,
    "The AI should propose a summary improvement",
  );
  assert.ok(
    result.changes.every(
      (change: { fieldId: string }) => change.fieldId === "summary",
    ),
  );
  console.log(
    "Live AI route passed using synthetic CV data:",
    result.changes[0].after,
  );
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Live AI test failed");
  process.exitCode = 1;
});
