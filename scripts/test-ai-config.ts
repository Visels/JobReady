import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import path from "node:path";
import { build } from "esbuild";
import { cvFixture } from "./fixtures/cv-draft";

async function main() {
  const output = path.resolve("tmp/ai-config-tests/routes.cjs");
  // Exercise real routes/SDK code with synthetic auth, persistence, and HTTP.
  const modules: Record<string, string> = {
    "test:state": `
      export const state = { authenticated: true, connected: 0, prepared: [], writes: [] };
      export const interview = {
        id: 'test-session', status: 'ongoing', difficulty: 'Realistic', onboardingData: {},
        previousRejections: 'Not collected before interview', concerns: null,
        visaType: { name: 'Practice interview', basePrompt: 'Conduct a practice interview.', destinationCountry: { name: 'Kenya' } },
        originCountry: { name: 'Kenya' }, messages: [],
        realtimeInterview: { id: 'test-realtime', openingQuestion: 'What brings you in today?',
          createdAt: new Date(), startedAt: null, turns: [], events: [] }
      };
    `,
    "@/lib/session-guards": `
      import { state, interview } from 'test:state';
      export async function requireUser() {
        return state.authenticated ? { user: { id: '10000000-0000-4000-8000-000000000099' } }
          : { user: null, response: Response.json({error:'Unauthorized'}, {status:401}) };
      }
      export async function requireOwnedSession() { return { interviewSession: interview }; }
    `,
    "@/lib/prisma": `
      import { state } from 'test:state';
      const modelUsage = { count: async()=>0, create: async()=>({id:'usage'}), update: async()=>({}) };
      const realtimeInterview = { update: async(input)=>{state.writes.push(input); return input;} };
      export const prisma = { modelUsage, realtimeInterview, realtimeInterviewEvent: { create: async()=>({}) },
        $transaction: async(fn)=> typeof fn === 'function' ? fn({$queryRaw:async()=>[], modelUsage}) : Promise.all(fn) };
    `,
    "@/lib/interviews": `
      import { state } from 'test:state';
      export const getJobInterviewSessionParamsSchema = { parse: value=>value };
      export class JobInterviewVoiceSessionService {
        async prepareConnection(input) {
          state.prepared.push(input);
          return { instructions: 'Conduct the selected job interview.', durationLimitSeconds:300,
            state:{session:{language:'en'}} };
        }
        async markConnected() { state.connected++; }
      }
    `,
    "../../../route-utils": `export function jsonJobInterviewError() { return Response.json({error:'Request failed.'}, {status:500}); }`,
    "server-only": "",
  };
  await build({
    stdin: {
      contents: `
        export * from '@/lib/ai-config';
        export * from '@/lib/llm';
        export * from '@/lib/question-audio';
        export { POST as revise } from './src/app/api/cv/revise/route';
        export { POST as jobVoice } from './src/app/api/job-interviews/[id]/voice/connect/route';
        export { POST as visaVoice } from './src/app/api/session/[id]/realtime/connect/route';
        export * from 'test:state';
      `,
      resolveDir: process.cwd(),
      loader: "ts",
    },
    outfile: output,
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    plugins: [{
      name: "synthetic-services",
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, (args) =>
          args.path in modules ? { path: args.path, namespace: "synthetic" } : undefined,
        );
        builder.onLoad({ filter: /.*/, namespace: "synthetic" }, (args) => ({
          contents: modules[args.path], loader: "js",
        }));
      },
    }],
  });
  type VoiceRoute = (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>;
  const app = createRequire(import.meta.url)(output) as
    typeof import("../src/lib/ai-config") & typeof import("../src/lib/llm") &
    typeof import("../src/lib/question-audio") & {
      revise: (request: Request) => Promise<Response>;
      jobVoice: VoiceRoute;
      visaVoice: VoiceRoute;
      interview: Parameters<typeof import("../src/lib/llm").generateNextQuestion>[0];
      state: { authenticated: boolean; connected: number; prepared: Array<{ model: string; voice: string }> };
    };
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  let failRealtime = false;
  const sharedKey = "synthetic-shared-openai-key";
  try {
    for (const name of Object.keys(process.env)) {
      if (/^(OPENAI_|AZURE_OPENAI_|LLM_PROVIDER|CV_LLM_PROVIDER|QUESTION_AUDIO_|DEEPSEEK_|ELEVENLABS_)/.test(name)) delete process.env[name];
    }
    process.env.OPENAI_API_KEY = sharedKey;
    process.env.OPENAI_MODEL = "gpt-4o-mini";
    // Stale deployment variables must never take precedence over the shared key.
    process.env.LLM_PROVIDER = "azure-foundry";
    process.env.CV_LLM_PROVIDER = "deepseek";
    process.env.QUESTION_AUDIO_PROVIDER = "azure-openai";
    process.env.AZURE_OPENAI_API_KEY = "unused-azure-key";
    process.env.AZURE_OPENAI_ENDPOINT = "https://unused.openai.azure.com";
    process.env.OPENAI_BASE_URL = "https://unused.example.com/v1";

    globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      assert.equal(new URL(request.url).origin, "https://api.openai.com");
      assert.equal(request.headers.get("authorization"), `Bearer ${sharedKey}`);
      assert.equal(request.headers.has("api-key"), false);
      const endpoint = new URL(request.url).pathname;
      requests.push(endpoint);
      if (endpoint === "/v1/realtime/calls") {
        assert.match(request.headers.get("content-type") ?? "", /^multipart\/form-data; boundary=/);
        const form = await request.formData();
        assert.equal(form.get("sdp"), "synthetic SDP offer");
        const session = JSON.parse(String(form.get("session")));
        assert.equal(session.type, "realtime");
        assert.equal(session.model, "gpt-realtime-mini");
        assert.equal(session.audio.input.transcription.model, "gpt-4o-mini-transcribe");
        assert.ok(session.tools.some((tool: { name: string }) => tool.name === "complete_interview"));
        return new Response(failRealtime ? "upstream details must stay private" : "synthetic SDP answer", {
          status: failRealtime ? 503 : 201,
        });
      }
      const body = await request.json();
      if (endpoint === "/v1/audio/speech") {
        assert.equal(body.model, "gpt-4o-mini-tts");
        assert.equal(body.input, "Tell me about yourself.");
        return new Response(new Uint8Array([73, 68, 51]), { headers: { "Content-Type": "audio/mpeg" } });
      }
      assert.equal(endpoint, "/v1/chat/completions");
      assert.equal(body.model, "gpt-4o-mini");
      const answer = body.response_format.type === "json_schema"
        ? { message: "Your summary is already concise.", changes: [] }
        : { question: "What experience prepares you for this role?", question_guidance: ["Describe your relevant experience.", "Give a specific example."] };
      return Response.json({
        choices: [{ finish_reason: "stop", message: { role: "assistant", content: JSON.stringify(answer) } }],
        usage: { prompt_tokens: 20, completion_tokens: 20 },
      });
    };
    assert.equal(app.getTextGenerationClient().provider, "openai");
    assert.throws(() => app.getOpenAiApiKey({ NODE_ENV: "test", AZURE_OPENAI_API_KEY: "unused" }), /OPENAI_API_KEY/);
    const cvRequest = () => new Request("http://localhost/api/cv/revise", {
      method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost" },
      body: JSON.stringify({ draft: cvFixture(), instruction: "Polish the summary.", scope: "summary" }),
    });
    const voiceRequest = () => new Request("http://localhost/api/voice", { method: "POST", body: "synthetic SDP offer" });
    const context = { params: Promise.resolve({ id: "test-session" }) };
    const cv = await app.revise(cvRequest());
    assert.equal(cv.status, 200, await cv.text());
    const question = await app.generateNextQuestion(app.interview, []);
    assert.match(question.question, /experience/);
    const audio = await app.generateQuestionAudio("Tell me about yourself.");
    assert.equal(audio.status, "ready");
    assert.equal(audio.provider, "openai");
    for (const route of [app.jobVoice, app.visaVoice]) {
      const response = await route(voiceRequest(), context);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), "synthetic SDP answer");
      assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    }
    assert.equal(app.state.connected, 1);
    assert.equal(app.state.prepared[0].model, "gpt-realtime-mini");
    assert.equal(requests.filter((url) => url === "/v1/realtime/calls").length, 2);

    const beforeBlocked = requests.length;
    app.state.authenticated = false;
    assert.equal((await app.revise(cvRequest())).status, 401);
    for (const route of [app.jobVoice, app.visaVoice]) assert.equal((await route(voiceRequest(), context)).status, 401);
    app.state.authenticated = true;
    delete process.env.OPENAI_API_KEY;
    assert.equal((await app.revise(cvRequest())).status, 503);
    for (const route of [app.jobVoice, app.visaVoice]) assert.equal((await route(voiceRequest(), context)).status, 503);
    await assert.rejects(app.generateNextQuestion(app.interview, []), /OPENAI_API_KEY/);
    assert.equal(requests.length, beforeBlocked, "Rejected requests must not contact a provider.");

    process.env.OPENAI_API_KEY = sharedKey;
    failRealtime = true;
    for (const route of [app.jobVoice, app.visaVoice]) {
      const response = await route(voiceRequest(), context);
      assert.equal(response.status, 502);
      const body = await response.text();
      assert.equal(body.includes("upstream details"), false);
      assert.equal(body.includes(sharedKey), false);
    }
    assert.equal(app.state.connected, 1, "An upstream failure must not mark a voice session connected.");
    console.log("Shared OpenAI integration passed: CV, interview text, speech, both voice routes, credential isolation, and failure handling.");
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
