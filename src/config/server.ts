import {
  buildPublicProductConfig,
  type PublicProductEnv,
} from "@/config/public";

export type ServerProductEnv = PublicProductEnv &
  Partial<{
    NODE_ENV: string;
  }>;

const REQUIRED_PRODUCTION_ENV = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_JIANDAE_CANONICAL_HOST",
] as const;

export function validateRequiredProductionConfig(
  env: ServerProductEnv = process.env,
) {
  if (env.NODE_ENV !== "production") return;

  const missing = REQUIRED_PRODUCTION_ENV.filter((name) => !env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required production Jiandae configuration: ${missing.join(
        ", ",
      )}. Set these public values before deploying.`,
    );
  }
}

export function getServerProductConfig(env: ServerProductEnv = process.env) {
  validateRequiredProductionConfig(env);

  return {
    ...buildPublicProductConfig(env),
    runtime: {
      nodeEnv: env.NODE_ENV ?? "development",
    },
  };
}
