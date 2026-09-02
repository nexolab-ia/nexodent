import { NextResponse } from "next/server";
import { sql } from "@/db/client";
import { PublicBookingRateLimitError, PublicBookingUnavailableError, reservePublicAppointment, safeAvailability } from "@/features/public-booking/service";
import { SchedulingConflictError, SchedulingValidationError } from "@/features/scheduling/domain";

function clientKey(request: Request): string { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous"; }
function genericError(error: unknown): NextResponse {
  if (error instanceof PublicBookingRateLimitError) return NextResponse.json({ error: "Inténtalo nuevamente en unos minutos." }, { status: 429, headers: { "Retry-After": "60" } });
  if (error instanceof SchedulingConflictError) return NextResponse.json({ error: "Ese horario ya no está disponible." }, { status: 409 });
  if (error instanceof SchedulingValidationError) return NextResponse.json({ error: error.message }, { status: 422 });
  return NextResponse.json({ error: "No encontramos disponibilidad para esta reserva." }, { status: error instanceof PublicBookingUnavailableError ? 404 : 500 });
}
export async function GET(request: Request): Promise<NextResponse> {
  try { const params = new URL(request.url).searchParams; const token = params.get("token") ?? ""; const orgSlug = params.get("org") ?? ""; const siteSlug = params.get("site"); if (!token || !orgSlug) throw new PublicBookingUnavailableError(); return NextResponse.json({ slots: await safeAvailability(sql, token, orgSlug, siteSlug, clientKey(request)) }); } catch (error) { return genericError(error); }
}
export async function POST(request: Request): Promise<NextResponse> {
  try { const payload = await request.json() as Record<string, unknown>; const required = ["token", "orgSlug", "professionalMembershipId", "patientName", "patientContact", "startsAt", "endsAt"]; if (required.some((key) => typeof payload[key] !== "string")) throw new SchedulingValidationError("Revisa los datos de tu reserva."); const booking = await reservePublicAppointment(sql, { token: payload.token as string, orgSlug: payload.orgSlug as string, siteSlug: typeof payload.siteSlug === "string" ? payload.siteSlug : null, professionalMembershipId: payload.professionalMembershipId as string, boxId: typeof payload.boxId === "string" ? payload.boxId : null, patientName: payload.patientName as string, patientContact: payload.patientContact as string, startsAt: payload.startsAt as string, endsAt: payload.endsAt as string, consent: payload.consent === true }, clientKey(request)); return NextResponse.json(booking, { status: 201 }); } catch (error) { return genericError(error); }
}
