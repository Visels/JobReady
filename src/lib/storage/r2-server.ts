import "server-only";

import { buildR2StorageConfig, type R2StorageEnv } from "./r2-config";
import { CloudflareR2ObjectStorage } from "./r2-storage";

export function createR2ObjectStorage(env: R2StorageEnv = process.env) {
  return new CloudflareR2ObjectStorage(buildR2StorageConfig(env));
}
