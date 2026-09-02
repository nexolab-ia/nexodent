import { z } from "zod";

const optionalUrl = z.string().url().optional();
const schema = z.object({
  DATABASE_URL: optionalUrl,
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_URL: optionalUrl,
  APP_URL: z.string().url().default("http://localhost:3000"),
  DEMO_EMAIL: z.string().email().default("emilia.demo@nexodent.invalid"),
  DEMO_PASSWORD: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type AppEnv = z.infer<typeof schema>;

export function readEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  return schema.parse(source);
}

export function missingRuntimeConfiguration(source: Record<string, string | undefined> = process.env): string[] {
  const parsed = readEnv(source);
  return [
    ...(parsed.DATABASE_URL ? [] : ["DATABASE_URL"]),
    ...(parsed.AUTH_SECRET ? [] : ["AUTH_SECRET"]),
    ...(parsed.AUTH_URL ? [] : ["AUTH_URL"]),
  ];
}

export function runtimeIsConfigured(source: Record<string, string | undefined> = process.env): boolean {
  return missingRuntimeConfiguration(source).length === 0;
}
