import { strict as assert } from "node:assert";
import { loadEnvConfig } from "@next/env";
import { chromium } from "@playwright/test";
import { createOpenAiRealtimeCall, getOpenAiRealtimeConfig } from "../src/lib/ai-config";

async function main() {
  assert.equal(process.env.AI_VOICE_LIVE_TEST, "true", "Set AI_VOICE_LIVE_TEST=true for one real synthetic voice connection.");
  loadEnvConfig(process.cwd());
  const config = getOpenAiRealtimeConfig();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    const sdp = await page.evaluate(async () => {
      const pc = new RTCPeerConnection();
      const data = pc.createDataChannel("oai-events");
      const events: string[] = [];
      data.onmessage = (event) => events.push(JSON.parse(event.data).type);
      Object.assign(window, { testPeer: pc, testEvents: events });
      // Negotiate audio without reading the microphone or sending candidate audio.
      pc.addTransceiver("audio", { direction: "recvonly" });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      return offer.sdp!;
    });
    const response = await createOpenAiRealtimeCall(config.apiKey, sdp, {
      type: "realtime",
      model: config.model,
      instructions: "This is a synthetic connection test. Do not speak unless asked.",
      audio: {
        input: {
          transcription: { model: config.transcriptionModel, language: "en" },
          turn_detection: { type: "server_vad", create_response: false },
        },
        output: { voice: config.voice },
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI voice connection failed (HTTP ${response.status}, code ${error.error?.code ?? "unavailable"}).`);
    }
    await page.evaluate(async (answer) => {
      const testWindow = window as unknown as { testPeer: RTCPeerConnection };
      await testWindow.testPeer.setRemoteDescription({ type: "answer", sdp: answer });
    }, await response.text());
    await page.waitForFunction(() => {
      const testWindow = window as unknown as { testEvents: string[] };
      return testWindow.testEvents.includes("session.created");
    }, undefined, { timeout: 25_000 });
    await page.evaluate(() => (window as unknown as { testPeer: RTCPeerConnection }).testPeer.close());
    console.log(`Live OpenAI voice connection passed (${config.model}); session.created received, then connection closed. No microphone or application database used.`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  // Provider errors may contain request context; print only this test's safe summary.
  console.error(error instanceof Error ? error.message : "Voice connection test failed.");
  process.exitCode = 1;
});
