import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import postgres, { type Sql } from "postgres";
import { activeMembershipForUser, claimsForMembership } from "@/lib/auth";
import { changeMembership, changeSiteAssignment, postgresTenantIdentityStore } from "@/features/tenant-identity/actions";

const orgA = "11111111-1111-4111-8111-111111111111";
const orgB = "22222222-2222-4222-8222-222222222222";
const siteA = "33333333-3333-4333-8333-333333333333";
const siteB = "44444444-4444-4444-8444-444444444444";
const userA = "55555555-5555-4555-8555-555555555555";
const userB = "66666666-6666-4666-8666-666666666666";
const membershipA = "77777777-7777-4777-8777-777777777777";
const membershipB = "88888888-8888-4888-8888-888888888888";
const testPassword = randomUUID();
const port = 55432;
let embedded: EmbeddedPostgres;
let admin: Sql;
let app: Sql;
let dataDir: string;

beforeAll(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "nexodent-rls-"));
  embedded = new EmbeddedPostgres({ databaseDir: dataDir, port, user: "nexodent_admin", password: testPassword, persistent: false, onLog: () => undefined, onError: () => undefined });
  await embedded.initialise(); await embedded.start();
  admin = postgres(`postgres://nexodent_admin:${testPassword}@localhost:${port}/postgres`, { max: 1 });
  await admin.unsafe(await readFile("db/migrations/0000_core.sql", "utf8"));
  await admin.unsafe(await readFile("db/migrations/0001_tenant_rls.sql", "utf8"));
  await admin.unsafe(`CREATE ROLE nexodent_app LOGIN PASSWORD '${testPassword}' NOSUPERUSER NOBYPASSRLS; GRANT USAGE ON SCHEMA public TO nexodent_app; GRANT SELECT, UPDATE ON organizations, sites, memberships, membership_sites TO nexodent_app; GRANT SELECT ON audit_logs TO nexodent_app;`);
  // 0002 crea la función SECURITY DEFINER de bootstrap y le da EXECUTE a nexodent_app.
  await admin.unsafe(await readFile("db/migrations/0002_auth_bootstrap.sql", "utf8"));
  await admin.unsafe(`INSERT INTO organizations (id, type, slug, name) VALUES ('${orgA}', 'clinic', 'one', 'One'), ('${orgB}', 'clinic', 'two', 'Two');
    INSERT INTO sites (id, organization_id, slug, name) VALUES ('${siteA}', '${orgA}', 'a', 'A'), ('${siteB}', '${orgB}', 'b', 'B');
    INSERT INTO users (id, name, email) VALUES ('${userA}', 'A', 'a@example.test'), ('${userB}', 'B', 'b@example.test');
    INSERT INTO memberships (id, organization_id, user_id, role, status, expires_at) VALUES ('${membershipA}', '${orgA}', '${userA}', 'organization_admin', 'active', NULL), ('${membershipB}', '${orgB}', '${userB}', 'assistant', 'active', NULL);
    INSERT INTO membership_sites (membership_id, organization_id, site_id) VALUES ('${membershipA}', '${orgA}', '${siteA}'), ('${membershipB}', '${orgB}', '${siteB}');
    INSERT INTO audit_logs (organization_id, actor_membership_id, action, entity, reason) VALUES ('${orgA}', '${membershipA}', 'created', 'member', 'A'), ('${orgB}', '${membershipB}', 'created', 'member', 'B');`);
  app = postgres(`postgres://nexodent_app:${testPassword}@localhost:${port}/postgres`, { max: 1 });
}, 60_000);

afterAll(async () => { await app?.end(); await admin?.end(); await embedded?.stop(); await rm(dataDir, { recursive: true, force: true }); });

async function tenantA(): Promise<void> { await app.unsafe(`SELECT set_config('app.organization_id', '${orgA}', false)`); }
async function ids(table: string): Promise<string[]> { return (await app.unsafe<{ id: string }[]>(`SELECT id FROM ${table} ORDER BY id`)).map((row) => row.id); }

describe("forced tenant RLS", () => {
  it("isolates organization, site, membership, membership-site, and audit reads", async () => {
    await tenantA();
    expect(await ids("organizations")).toEqual([orgA]);
    expect(await ids("sites")).toEqual([siteA]);
    expect(await ids("memberships")).toEqual([membershipA]);
    expect((await app.unsafe<{ membership_id: string }[]>("SELECT membership_id FROM membership_sites ORDER BY membership_id")).map((row) => row.membership_id)).toEqual([membershipA]);
    expect((await app.unsafe<{ organization_id: string }[]>("SELECT organization_id FROM audit_logs ORDER BY organization_id")).map((row) => row.organization_id)).toEqual([orgA]);
  });
  it("denies guessed cross-tenant reads and edits without revealing rows", async () => {
    await tenantA();
    expect(await app.unsafe(`UPDATE organizations SET name = 'blocked' WHERE id = '${orgB}' RETURNING id`)).toEqual([]);
    expect(await app.unsafe(`UPDATE sites SET name = 'blocked' WHERE id = '${siteB}' RETURNING id`)).toEqual([]);
    expect(await app.unsafe(`UPDATE memberships SET status = 'suspended' WHERE id = '${membershipB}' RETURNING id`)).toEqual([]);
    expect(await app.unsafe(`UPDATE membership_sites SET created_at = created_at WHERE membership_id = '${membershipB}' RETURNING membership_id`)).toEqual([]);
    expect(await app.unsafe(`SELECT id FROM audit_logs WHERE organization_id = '${orgB}'`)).toEqual([]);
    await expect(app.unsafe(`UPDATE audit_logs SET reason = 'blocked' WHERE organization_id = '${orgB}'`)).rejects.toThrow();
  });
  it("persists authorized membership and site mutations with append-only audit rows", async () => {
    const actor = { membershipId: membershipA, organizationId: orgA, role: "organization_admin" as const, siteIds: [siteA], active: true };
    const store = postgresTenantIdentityStore(admin);
    await changeMembership(actor, { targetMembershipId: membershipA, before: { role: "organization_admin" }, after: { role: "professional" }, reason: "Role correction" }, store);
    await changeSiteAssignment(actor, { targetMembershipId: membershipA, before: { siteIds: [siteA] }, after: {}, siteId: siteA, reason: "Site confirmation" }, store);
    expect(await admin.unsafe<{ role: string }[]>(`SELECT role FROM memberships WHERE id = '${membershipA}'`)).toEqual([{ role: "professional" }]);
    expect(await admin.unsafe<{ count: string }[]>(`SELECT count(*)::text AS count FROM audit_logs WHERE organization_id = '${orgA}' AND action IN ('membership.changed', 'membership.site_changed')`)).toEqual([{ count: "2" }]);
    await admin.unsafe(`UPDATE memberships SET role = 'organization_admin' WHERE id = '${membershipA}'`);
  });
  it("loads active membership claims from persisted tenant tables and rejects inactive membership", async () => {
    // Se resuelve con la conexión de la app (rol NOBYPASSRLS bajo FORCE RLS, sin GUC de tenant):
    // demuestra que el bootstrap de sesión funciona vía app_resolve_active_membership (SECURITY DEFINER).
    const membership = await activeMembershipForUser(userA, app);
    expect(claimsForMembership(membership).organizationId).toBe(orgA);
    await admin.unsafe(`UPDATE memberships SET status = 'suspended' WHERE id = '${membershipA}'`);
    await expect(activeMembershipForUser(userA, app)).rejects.toThrow("Active membership required");
    await admin.unsafe(`UPDATE memberships SET status = 'active' WHERE id = '${membershipA}'`);
  });
});
