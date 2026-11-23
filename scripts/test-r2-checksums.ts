import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { buildR2StorageConfig } from "../src/lib/storage/r2-config";
import { CloudflareR2ObjectStorage } from "../src/lib/storage/r2-storage";

async function main() {
  const body = Buffer.from("Synthetic CV draft for storage regression.");
  const hex = createHash("sha256").update(body).digest("hex");
  const base64 = createHash("sha256").update(body).digest("base64");
  let writes = 0;
  const server = createServer(async (request, response) => {
    if (request.method === "PUT") {
      assert.equal(request.headers["x-amz-checksum-sha256"], base64);
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      assert.deepEqual(Buffer.concat(chunks), body);
      writes++;
    }
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Content-Length", request.method === "PUT" ? 0 : body.byteLength);
    response.setHeader("x-amz-checksum-sha256", base64);
    response.setHeader("ETag", '"synthetic-etag"');
    response.end(request.method === "GET" ? body : undefined);
  });
  await new Promise<void>(resolve => server.listen(0,"127.0.0.1",resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const config = buildR2StorageConfig({R2_ACCOUNT_ID:"a".repeat(32),R2_ACCESS_KEY_ID:"synthetic-access",R2_SECRET_ACCESS_KEY:"synthetic-secret"});
  const storage = new CloudflareR2ObjectStorage({...config,endpoint:`http://127.0.0.1:${address.port}`});
  const pointer = {bucket:"cv-checksums",key:"synthetic-cv.json"};
  try {
    const saved = await storage.putObject({...pointer,body,contentType:"application/json",checksumSha256:hex});
    assert.equal(saved.checksumSha256,hex);
    const loaded = await storage.getObject(pointer);
    assert.deepEqual(Buffer.from(loaded.body),body);
    assert.equal(loaded.checksumSha256,hex);
    const signed = await storage.presignPutObject({...pointer,contentType:"application/json",contentLength:body.length,expiresInSeconds:60,checksumSha256:hex});
    assert.equal(new URL(signed.url).searchParams.get("x-amz-checksum-sha256"),base64);
    await assert.rejects(()=>storage.putObject({...pointer,body,contentType:"application/json",checksumSha256:"bad-digest"}),/hexadecimal/);
    assert.equal(writes,1);
    console.log("R2 checksum tests passed: real SDK upload headers, read metadata, presigned uploads, and invalid checksums.");
  } finally {
    await new Promise<void>(resolve=>server.close(()=>resolve()));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
