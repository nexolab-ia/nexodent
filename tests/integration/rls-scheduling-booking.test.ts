import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import EmbeddedPostgres from "embedded-postgres";
import postgres, { type Sql } from "postgres";
import { demoIds, insertDemoFixture } from "@/db/fixtures/demo";

let embedded: EmbeddedPostgres; let admin: Sql; let app: Sql; let dir: string; const password = randomUUID();
beforeAll(async () => { dir = await mkdtemp(join(tmpdir(), "nexodent-scheduling-")); embedded = new EmbeddedPostgres({ databaseDir: dir, port: 55434, user: "nexodent_admin", password, persistent: false, onLog: () => undefined, onError: () => undefined }); await embedded.initialise(); await embedded.start(); admin = postgres(`postgres://nexodent_admin:${password}@localhost:55434/postgres`, { max: 1 }); for (const file of ["0000_core.sql", "0001_tenant_rls.sql", "0002_auth_bootstrap.sql", "0003_scheduling_booking.sql"]) await admin.unsafe(await readFile(`db/migrations/${file}`, "utf8")); await insertDemoFixture(admin); await admin.unsafe(`CREATE ROLE scheduling_app LOGIN PASSWORD '${password}' NOSUPERUSER NOBYPASSRLS; GRANT USAGE ON SCHEMA public TO scheduling_app; GRANT SELECT ON appointments, boxes TO scheduling_app;`); app = postgres(`postgres://scheduling_app:${password}@localhost:55434/postgres`, { max: 1 }); }, 60_000);
afterAll(async () => { await app?.end(); await admin?.end(); await embedded?.stop(); await rm(dir, { recursive: true, force: true }); });
describe("scheduling RLS and atomic constraints", () => {
  it("hides another tenant's agenda", async () => { await app.unsafe(`SELECT set_config('app.organization_id', '${demoIds.clinic}', false)`); expect(await app<{ organizationId: string }[]>`SELECT organization_id AS "organizationId" FROM appointments`).toEqual([{ organizationId: demoIds.clinic }, { organizationId: demoIds.clinic }]); await app.unsafe(`SELECT set_config('app.organization_id', '${demoIds.independent}', false)`); expect(await app`SELECT * FROM appointments`).toEqual([]); });
  it("accepts exactly one concurrent overlapping appointment", async () => { const insert = () => admin.unsafe(`INSERT INTO appointments (organization_id, site_id, professional_membership_id, box_id, patient_name, starts_at, ends_at, status) VALUES ('${demoIds.clinic}', '${demoIds.providencia}', '${demoIds.proOne}', '${demoIds.boxOne}', 'Reserva ficticia', '2027-09-08T14:00:00Z', '2027-09-08T14:30:00Z', 'pending')`); const result = await Promise.allSettled([insert(), insert()]); expect(result.filter((item) => item.status === "fulfilled")).toHaveLength(1); expect(result.filter((item) => item.status === "rejected")).toHaveLength(1); });
});
