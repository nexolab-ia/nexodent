import postgres from "postgres";
import { readEnv } from "@/lib/env";

export async function rollback(databaseUrl = readEnv().DATABASE_URL): Promise<void> {
  if (!databaseUrl) throw new Error("Database configuration is required for rollback.");
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    await sql.unsafe("DROP FUNCTION IF EXISTS app_resolve_active_membership(uuid), app_tenant_matches(uuid), app_site_allowed(uuid,uuid), app_clinical_allowed(uuid,uuid), app_estimate_allowed(uuid), app_billing_allowed(uuid,uuid), app_immutable_history() CASCADE; DROP TABLE IF EXISTS verifications, sessions, accounts, audit_logs, membership_sites, memberships, sites, users, organizations CASCADE; DROP TYPE IF EXISTS membership_status, membership_role, organization_type CASCADE;");
  } finally { await sql.end(); }
}

if (process.argv[1]?.endsWith("rollback.ts")) rollback().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Rollback failed."); process.exitCode = 1; });
