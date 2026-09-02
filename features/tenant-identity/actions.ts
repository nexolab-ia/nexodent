import type { Sql } from "postgres";
import { AuthorizationError, can, type AuthorizationInput } from "./authorize";

type AuditEntry = { organizationId: string; actorMembershipId: string; action: string; entity: string; entityId: string; before: Record<string, unknown>; after: Record<string, unknown>; reason: string };
export type MembershipChange = { targetMembershipId: string; before: Record<string, unknown>; after: { role?: "organization_admin" | "professional" | "assistant" | "independent_owner"; status?: "active" | "suspended" | "removed"; expiresAt?: Date | null }; reason: string; siteId?: string };
export type TenantIdentityTransaction = { updateMembership(change: MembershipChange, organizationId: string): Promise<void>; replaceMembershipSite(change: MembershipChange, organizationId: string): Promise<void>; append(entry: AuditEntry): Promise<void> };
export type TenantIdentityStore = { transaction<T>(work: (transaction: TenantIdentityTransaction) => Promise<T>): Promise<T> };

export function postgresTenantIdentityStore(sql: Sql): TenantIdentityStore {
  return { transaction: async <T>(work: (transaction: TenantIdentityTransaction) => Promise<T>): Promise<T> => sql.begin(async (transaction) => work({
    updateMembership: async (change, organizationId) => {
      const result = await transaction`UPDATE memberships SET role = COALESCE(${change.after.role ?? null}, role), status = COALESCE(${change.after.status ?? null}, status), expires_at = CASE WHEN ${Object.prototype.hasOwnProperty.call(change.after, "expiresAt")} THEN ${change.after.expiresAt ?? null} ELSE expires_at END, updated_at = now() WHERE id = ${change.targetMembershipId} AND organization_id = ${organizationId}`;
      if (result.count !== 1) throw new AuthorizationError();
    },
    replaceMembershipSite: async (change, organizationId) => {
      if (!change.siteId) throw new Error("A site is required.");
      const result = await transaction`DELETE FROM membership_sites WHERE membership_id = ${change.targetMembershipId} AND organization_id = ${organizationId}`;
      void result;
      const inserted = await transaction`INSERT INTO membership_sites (membership_id, organization_id, site_id) SELECT ${change.targetMembershipId}, ${organizationId}, ${change.siteId} WHERE EXISTS (SELECT 1 FROM sites WHERE id = ${change.siteId} AND organization_id = ${organizationId}) AND EXISTS (SELECT 1 FROM memberships WHERE id = ${change.targetMembershipId} AND organization_id = ${organizationId})`;
      if (inserted.count !== 1) throw new AuthorizationError();
    },
    append: async (entry) => { await transaction`INSERT INTO audit_logs (organization_id, actor_membership_id, action, entity, entity_id, before, after, reason) VALUES (${entry.organizationId}, ${entry.actorMembershipId}, ${entry.action}, ${entry.entity}, ${entry.entityId}, ${JSON.stringify(entry.before)}::jsonb, ${JSON.stringify(entry.after)}::jsonb, ${entry.reason})`; },
  })) as Promise<T> };
}

async function requireMembershipAdmin(actor: AuthorizationInput, change: MembershipChange, store: TenantIdentityStore): Promise<void> {
  if (can(actor, "membership:manage")) return;
  await store.transaction((transaction) => transaction.append({ organizationId: actor.organizationId, actorMembershipId: actor.membershipId, action: "membership.change_denied", entity: "membership", entityId: change.targetMembershipId, before: {}, after: {}, reason: "Authorization denied" }));
  throw new AuthorizationError();
}

export async function changeMembership(actor: AuthorizationInput, change: MembershipChange, store: TenantIdentityStore): Promise<void> {
  await requireMembershipAdmin(actor, change, store);
  if (!change.reason.trim()) throw new Error("A reason is required for membership changes.");
  await store.transaction(async (transaction) => { await transaction.updateMembership(change, actor.organizationId); await transaction.append({ organizationId: actor.organizationId, actorMembershipId: actor.membershipId, action: "membership.changed", entity: "membership", entityId: change.targetMembershipId, before: change.before, after: change.after, reason: change.reason }); });
}

export async function changeSiteAssignment(actor: AuthorizationInput, change: MembershipChange, store: TenantIdentityStore): Promise<void> {
  await requireMembershipAdmin(actor, change, store);
  if (!change.siteId || !change.reason.trim()) throw new Error("A site and reason are required for site assignments.");
  await store.transaction(async (transaction) => { await transaction.replaceMembershipSite(change, actor.organizationId); await transaction.append({ organizationId: actor.organizationId, actorMembershipId: actor.membershipId, action: "membership.site_changed", entity: "membership_site", entityId: change.targetMembershipId, before: change.before, after: change.after, reason: change.reason }); });
}
