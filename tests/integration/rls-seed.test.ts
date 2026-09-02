import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import EmbeddedPostgres from "embedded-postgres";
import postgres, { type Sql } from "postgres";
import { demoIds, insertDemoFixture } from "@/db/fixtures/demo";

let embedded: EmbeddedPostgres; let admin: Sql; let dir: string; const password = randomUUID();
beforeAll(async () => { dir = await mkdtemp(join(tmpdir(), "nexodent-seed-")); embedded = new EmbeddedPostgres({ databaseDir: dir, port: 55433, user: "nexodent_admin", password, persistent: false, onLog: () => undefined, onError: () => undefined }); await embedded.initialise(); await embedded.start(); admin = postgres(`postgres://nexodent_admin:${password}@localhost:55433/postgres`, { max: 1 }); for (const file of ["0000_core.sql", "0001_tenant_rls.sql", "0002_auth_bootstrap.sql", "0003_scheduling_booking.sql"]) await admin.unsafe(await readFile(`db/migrations/${file}`, "utf8")); }, 60_000);
afterAll(async () => { await admin?.end(); await embedded?.stop(); await rm(dir, { recursive: true, force: true }); });
describe("demo seed", () => { it("is idempotent and carries both tenant models", async () => { await insertDemoFixture(admin); await insertDemoFixture(admin); expect(await admin<{ count: string }[]>`SELECT count(*)::text AS count FROM organizations`).toEqual([{ count: "2" }]); expect(await admin<{ count: string }[]>`SELECT count(*)::text AS count FROM memberships WHERE organization_id = ${demoIds.clinic}`).toEqual([{ count: "5" }]); expect(await admin<{ count: string }[]>`SELECT count(*)::text AS count FROM public_booking_tokens`).toEqual([{ count: "1" }]); }); });
