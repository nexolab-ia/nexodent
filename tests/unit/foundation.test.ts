import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { missingRuntimeConfiguration, readEnv, runtimeIsConfigured } from "@/lib/env";
import { readinessStatus } from "@/app/api/health/ready/route";

describe("foundation configuration", () => {
  it("reports missing required configuration names without values", () => {
    expect(missingRuntimeConfiguration({ APP_URL: "http://localhost:3000" })).toEqual(["DATABASE_URL", "AUTH_SECRET", "AUTH_URL"]);
    expect(runtimeIsConfigured({ APP_URL: "http://localhost:3000" })).toBe(false);
  });
  it("accepts a complete runtime configuration", () => {
    expect(readEnv({ DATABASE_URL: "postgres://localhost/db", AUTH_SECRET: "a".repeat(32), AUTH_URL: "http://localhost:3000", APP_URL: "http://localhost:3000" }).APP_URL).toBe("http://localhost:3000");
  });
  it("returns not-ready when a configured database probe is unreachable", async () => {
    expect(await readinessStatus(async () => false, true)).toBe(503);
  });
  it("defines a non-root standalone runtime and a fixed worker command", async () => {
    const dockerfile = await readFile("Dockerfile", "utf8");
    const compose = await readFile("docker-compose.yml", "utf8");
    expect(dockerfile).toContain("USER nexodent");
    expect(compose).toContain("workers/entrypoint.mjs");
  });
});
