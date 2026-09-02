import { APIError } from "better-call";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { customSession } from "better-auth/plugins";
import { db, sql } from "@/db/client";
import * as schema from "@/db/schema";
import { readEnv } from "@/lib/env";
import type { Sql } from "postgres";
import type { TenantContext } from "@/lib/tenancy";

export type SessionClaims = Pick<TenantContext, "membershipId" | "organizationId" | "role" | "siteIds"> & { expiresAt: Date | null };
export type MembershipForSession = TenantContext & { expiresAt: Date | null };
type MembershipRow = { membershipId: string; organizationId: string; role: TenantContext["role"]; expiresAt: Date | null; siteIds: string[] };

export function claimsForMembership(membership: MembershipForSession, now = new Date()): SessionClaims {
  if (!membership.active || (membership.expiresAt !== null && membership.expiresAt <= now)) throw new Error("Active membership required.");
  return { membershipId: membership.membershipId, organizationId: membership.organizationId, role: membership.role, siteIds: membership.siteIds, expiresAt: membership.expiresAt };
}

export async function activeMembershipForUser(userId: string, client: Sql = sql): Promise<MembershipForSession> {
  // Bootstrap de sesión: se ejecuta ANTES de conocer el tenant (sin GUC app.organization_id).
  // Bajo FORCE RLS un SELECT directo devolvería 0 filas y nadie podría iniciar sesión.
  // Por eso se resuelve vía app_resolve_active_membership (SECURITY DEFINER, owner de migración,
  // que en producción es el rol con BYPASSRLS/superusuario), que devuelve solo la membresía
  // activa del usuario autenticado.
  const rows = await client<MembershipRow[]>`
    SELECT membership_id AS "membershipId", organization_id AS "organizationId", role,
      expires_at AS "expiresAt", site_ids AS "siteIds"
    FROM app_resolve_active_membership(${userId})`;
  const membership = rows[0];
  if (!membership) throw new APIError("UNAUTHORIZED", { message: "Active membership required." });
  return { ...membership, active: true };
}

const env = readEnv();
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  secret: env.AUTH_SECRET,
  baseURL: env.AUTH_URL ?? env.APP_URL,
  emailAndPassword: { enabled: true },
  advanced: {
    generateId: () => crypto.randomUUID(),
    ipAddress: { ipAddressHeaders: ["x-forwarded-for"], trustedProxies: ["::ffff:127.0.0.1"] },
  },
  databaseHooks: { session: { create: { before: async (session) => { await activeMembershipForUser(session.userId); } } } },
  plugins: [customSession(async ({ user, session }) => ({ user, session, claims: claimsForMembership(await activeMembershipForUser(user.id)) }))],
});
