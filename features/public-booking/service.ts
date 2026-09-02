import { createHash, randomBytes } from "node:crypto";
import type { Sql } from "postgres";
import type { AppointmentInput } from "@/features/scheduling/actions";
import { SchedulingConflictError, SchedulingValidationError, santiagoLocalToUtc } from "@/features/scheduling/domain";
import type { TenantContext } from "@/lib/tenancy";

type RouteRow = { organizationId: string; organizationName: string; organizationType: "clinic" | "independent"; siteId: string | null; siteName: string | null; tokenHash: string; rateLimitPerMinute: number };
export type PublicBookingRoute = Omit<RouteRow, "tokenHash" | "rateLimitPerMinute">;
export type PublicBookingRequest = { token: string; orgSlug: string; siteSlug?: string | null; professionalMembershipId: string; boxId?: string | null; patientName: string; patientContact: string; startsAt: string; endsAt: string; consent: boolean };
export class PublicBookingUnavailableError extends Error { readonly status = 404; constructor() { super("No encontramos disponibilidad para esta reserva."); } }
export class PublicBookingRateLimitError extends Error { readonly status = 429; constructor() { super("Inténtalo nuevamente en unos minutos."); } }

export function hashPublicToken(token: string): string { return createHash("sha256").update(token).digest("hex"); }
export function createOpaqueToken(): string { return randomBytes(32).toString("base64url"); }
export function validContact(value: string): boolean { return /^(?:\+?56)?\s?9\s?\d{4}\s?\d{4}$|^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value.trim()); }

async function routeRow(sql: Sql, token: string, orgSlug: string, siteSlug?: string | null): Promise<RouteRow | undefined> {
  const rows = await sql<RouteRow[]>`SELECT organization_id AS "organizationId", organization_name AS "organizationName", organization_type AS "organizationType", site_id AS "siteId", site_name AS "siteName", token_hash AS "tokenHash", rate_limit_per_minute AS "rateLimitPerMinute" FROM app_public_booking_context(${hashPublicToken(token)}, ${orgSlug}, ${siteSlug ?? null})`;
  return rows[0];
}

export async function getPublicBookingRoute(sql: Sql, token: string, orgSlug: string, siteSlug?: string | null): Promise<PublicBookingRoute> {
  const row = await routeRow(sql, token, orgSlug, siteSlug); if (!row) throw new PublicBookingUnavailableError();
  const { tokenHash: _tokenHash, rateLimitPerMinute: _rateLimit, ...route } = row; return route;
}

async function countRequest(sql: Sql, tokenHash: string, clientKey: string, limit: number): Promise<void> {
  const rows = await sql<{ allowed: boolean }[]>`SELECT app_public_booking_consume_rate(${tokenHash}, ${clientKey.slice(0, 128)}) AS allowed`;
  if (!rows[0]?.allowed || limit < 1) throw new PublicBookingRateLimitError();
}

export async function safeAvailability(sql: Sql, token: string, orgSlug: string, siteSlug?: string | null, clientKey = "anonymous"): Promise<{ startsAt: string; endsAt: string; professionalMembershipId: string; boxId: string | null }[]> {
  const row = await routeRow(sql, token, orgSlug, siteSlug); if (!row) throw new PublicBookingUnavailableError();
  await countRequest(sql, row.tokenHash, clientKey, row.rateLimitPerMinute);
  const availability = await sql<{ professionalMembershipId: string; weekday: string; startsAt: string; endsAt: string; boxId: string | null }[]>`SELECT professional_membership_id AS "professionalMembershipId", weekday, starts_at::text AS "startsAt", ends_at::text AS "endsAt", box_id AS "boxId" FROM app_public_booking_availability(${row.tokenHash}, ${orgSlug}, ${siteSlug ?? null})`;
  const slots: { startsAt: string; endsAt: string; professionalMembershipId: string; boxId: string | null }[] = [];
  const now = new Date();
  for (let offset = 1; offset <= 14 && slots.length < 20; offset += 1) for (const item of availability) {
    const day = new Date(now.getTime() + offset * 86_400_000);
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "America/Santiago", weekday: "short" }).format(day).toLowerCase().slice(0, 3);
    if (weekday !== item.weekday) continue;
    const startsAt = santiagoLocalToUtc(day, item.startsAt);
    const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
    slots.push({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), professionalMembershipId: item.professionalMembershipId, boxId: item.boxId });
  }
  return slots;
}

export async function reservePublicAppointment(sql: Sql, request: PublicBookingRequest, clientKey = "anonymous"): Promise<{ reference: string }> {
  if (!request.consent || !validContact(request.patientContact)) throw new SchedulingValidationError("Revisa tu consentimiento y datos de contacto.");
  const route = await routeRow(sql, request.token, request.orgSlug, request.siteSlug); if (!route) throw new PublicBookingUnavailableError();
  await countRequest(sql, route.tokenHash, clientKey, route.rateLimitPerMinute);
  const input: AppointmentInput = { organizationId: route.organizationId, siteId: route.siteId, professionalMembershipId: request.professionalMembershipId, boxId: request.boxId, patientName: request.patientName, patientContact: request.patientContact, startsAt: new Date(request.startsAt), endsAt: new Date(request.endsAt), status: "pending", source: "public" };
  try { const rows = await sql<{ id: string }[]>`SELECT app_public_reserve_appointment(${route.tokenHash}, ${request.orgSlug}, ${request.siteSlug ?? null}, ${input.professionalMembershipId}, ${input.boxId ?? null}, ${input.patientName}, ${input.patientContact ?? ""}, ${input.startsAt}, ${input.endsAt}) AS id`; const id = rows[0]?.id; if (!id) throw new PublicBookingUnavailableError();try{await sql`SELECT app_public_schedule_booking_notice(${id})`;}catch(noticeError){if((noticeError as {code?:string}).code!=="42883")throw noticeError;}return { reference: id.slice(0, 8).toUpperCase() }; } catch (error) { if (error instanceof Error && /excl|overlap|conflict/i.test(error.message)) throw new SchedulingConflictError("Ese horario acaba de ser reservado. Elige otro disponible."); throw error; }
}

export async function revokePublicBookingToken(sql: Sql, organizationId: string, tokenHash: string): Promise<void> { await sql`UPDATE public_booking_tokens SET active = false, revoked_at = now(), updated_at = now() WHERE organization_id = ${organizationId} AND token_hash = ${tokenHash}`; }
