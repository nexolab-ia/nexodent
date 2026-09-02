export type TenantContext = { membershipId: string; organizationId: string; role: "organization_admin" | "professional" | "assistant" | "independent_owner"; siteIds: readonly string[]; active: boolean };
export type TenantTransaction = { execute: (...args: [statement: string, parameters: readonly string[]]) => Promise<unknown> };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function assertUuid(value: string, label: string): void { if (!uuid.test(value)) throw new Error(`Invalid ${label}.`); }

export function validateTenantContext(context: TenantContext): TenantContext {
  assertUuid(context.membershipId, "membership id");
  assertUuid(context.organizationId, "organization id");
  context.siteIds.forEach((siteId) => assertUuid(siteId, "site id"));
  if (!context.active) throw new Error("Inactive memberships cannot establish tenant context.");
  return context;
}

export async function withTenantContext<T>(transaction: TenantTransaction, context: TenantContext, work: () => Promise<T>): Promise<T> {
  const valid = validateTenantContext(context);
  await transaction.execute("SELECT set_config('app.organization_id', $1, true)", [valid.organizationId]);
  await transaction.execute("SELECT set_config('app.membership_id', $1, true)", [valid.membershipId]);
  await transaction.execute("SELECT set_config('app.site_ids', $1, true)", [valid.siteIds.join(",")]);
  await transaction.execute("SELECT set_config('app.role', $1, true)", [valid.role]);
  return work();
}

/** Establishes transaction-local RLS identity for one complete unit of work. */
export async function runAsTenant<T>(sql: Sql, actor: TenantContext, work: (transaction: TransactionSql) => Promise<T>): Promise<T> {
  const valid = validateTenantContext(actor);
  return await sql.begin(async (transaction) => {
    await transaction.unsafe("SELECT set_config('app.organization_id', $1, true), set_config('app.membership_id', $2, true), set_config('app.role', $3, true), set_config('app.site_ids', $4, true)", [valid.organizationId, valid.membershipId, valid.role, valid.siteIds.join(",")]);
    return work(transaction);
  }) as T;
}
import type { Sql, TransactionSql } from "postgres";
