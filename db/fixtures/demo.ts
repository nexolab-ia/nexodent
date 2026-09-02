import { createHash } from "node:crypto";
import type { Sql } from "postgres";

/** Todos los datos de esta fixture son ficticios y nunca representan pacientes reales. */
export const FICTIONAL_DATA_MARKER = "DATOS FICTICIOS — solo demostración NexoDent";
export const demoIds = {
  clinic: "10000000-0000-4000-8000-000000000001", providencia: "10000000-0000-4000-8000-000000000002", nunoa: "10000000-0000-4000-8000-000000000003", independent: "10000000-0000-4000-8000-000000000004",
  admin: "10000000-0000-4000-8000-000000000010", proOne: "10000000-0000-4000-8000-000000000011", proTwo: "10000000-0000-4000-8000-000000000012", proThree: "10000000-0000-4000-8000-000000000013", assistant: "10000000-0000-4000-8000-000000000014", independentOwner: "10000000-0000-4000-8000-000000000015",
  boxOne: "10000000-0000-4000-8000-000000000020", boxTwo: "10000000-0000-4000-8000-000000000021",
} as const;

export const demoPatients = ["Ana Paz", "Bruno Solís", "Camila Reyes", "Diego Muñoz", "Elena Soto", "Felipe Araya", "Gabriela Vera", "Hugo Ríos", "Isidora Leiva", "Joaquín Díaz", "Karina Paredes", "Lucas Torres", "María Inostroza", "Nicolás Flores", "Olivia Campos", "Pablo Silva", "Rocío Núñez", "Sebastián Rojas", "Tamara Fuentes", "Vicente Lara"].map((name, index) => ({ name, rut: `11.111.11${String(index).padStart(2, "0")}-${index % 10}`, fictional: true }));

// Datos fuente para módulos posteriores: el seed los mantiene como evidencia tipada, sin crear sus features antes de PR3/PR4.
export const demoOperationalEvidence = {
  odontogramVersions: [{ patient: demoPatients[0].name, version: 2, changedAt: "2025-11-04T14:00:00.000Z", fictional: true }],
  estimates: [{ patient: demoPatients[1].name, totalClp: 185000, state: "approved", fictional: true }],
  chargesAndPayments: [{ patient: demoPatients[2].name, chargeClp: 120000, paymentClp: 50000, fictional: true }],
  noticeSources: [{ type: "inactive_patient", patient: demoPatients[3].name, lastVisitAt: "2025-01-10T15:00:00.000Z" }, { type: "open_balance", patient: demoPatients[2].name, balanceClp: 70000 }, { type: "open_slot", weekday: "tue", startsAt: "15:00" }],
} as const;

const tokenHash = (value: string) => createHash("sha256").update(value).digest("hex");
const users = [
  ["10000000-0000-4000-8000-000000000101", "Dra. Emilia Torres", "emilia.demo@nexodent.invalid", demoIds.admin, demoIds.clinic, "organization_admin"],
  ["10000000-0000-4000-8000-000000000102", "Dr. Martín Lagos", "martin.demo@nexodent.invalid", demoIds.proOne, demoIds.clinic, "professional"],
  ["10000000-0000-4000-8000-000000000103", "Dra. Sofía Abarca", "sofia.demo@nexodent.invalid", demoIds.proTwo, demoIds.clinic, "professional"],
  ["10000000-0000-4000-8000-000000000104", "Dr. Tomás Pino", "tomas.demo@nexodent.invalid", demoIds.proThree, demoIds.clinic, "professional"],
  ["10000000-0000-4000-8000-000000000105", "Paula Contreras", "paula.demo@nexodent.invalid", demoIds.assistant, demoIds.clinic, "assistant"],
  ["10000000-0000-4000-8000-000000000106", "Dra. Valentina Rojas", "valentina.demo@nexodent.invalid", demoIds.independentOwner, demoIds.independent, "independent_owner"],
] as const;

export async function insertDemoFixture(sql: Sql): Promise<void> {
  await sql`INSERT INTO organizations (id, type, slug, name, settings) VALUES (${demoIds.clinic}, 'clinic', 'demo-clinic', 'Clínica Sonrisa Andes', ${JSON.stringify({ marker: FICTIONAL_DATA_MARKER })}::jsonb), (${demoIds.independent}, 'independent', 'dra-valentina-rojas', 'Dra. Valentina Rojas', ${JSON.stringify({ marker: FICTIONAL_DATA_MARKER })}::jsonb) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, settings = EXCLUDED.settings, updated_at = now()`;
  await sql`INSERT INTO sites (id, organization_id, slug, name, timezone, settings) VALUES (${demoIds.providencia}, ${demoIds.clinic}, 'providencia', 'Providencia', 'America/Santiago', ${JSON.stringify({ marker: FICTIONAL_DATA_MARKER })}::jsonb), (${demoIds.nunoa}, ${demoIds.clinic}, 'nunoa', 'Ñuñoa', 'America/Santiago', ${JSON.stringify({ marker: FICTIONAL_DATA_MARKER })}::jsonb) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, settings = EXCLUDED.settings, updated_at = now()`;
  for (const [userId, name, email, membershipId, organizationId, role] of users) {
    await sql`INSERT INTO users (id, name, email, email_verified) VALUES (${userId}, ${name}, ${email}, true) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now()`;
    await sql`INSERT INTO memberships (id, organization_id, user_id, role, status) VALUES (${membershipId}, ${organizationId}, ${userId}, ${role}, 'active') ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, status = 'active', updated_at = now()`;
  }
  for (const membershipId of [demoIds.admin, demoIds.proOne, demoIds.proTwo, demoIds.proThree, demoIds.assistant]) for (const siteId of [demoIds.providencia, demoIds.nunoa]) await sql`INSERT INTO membership_sites (membership_id, organization_id, site_id) VALUES (${membershipId}, ${demoIds.clinic}, ${siteId}) ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO boxes (id, organization_id, site_id, name) VALUES (${demoIds.boxOne}, ${demoIds.clinic}, ${demoIds.providencia}, 'Box Cordillera'), (${demoIds.boxTwo}, ${demoIds.clinic}, ${demoIds.nunoa}, 'Box Mapocho') ON CONFLICT (id) DO UPDATE SET active = true, updated_at = now()`;
  for (const siteId of [demoIds.providencia, demoIds.nunoa]) for (const weekday of ["mon", "tue", "wed", "thu", "fri"]) await sql`INSERT INTO working_hours (organization_id, site_id, weekday, starts_at, ends_at) SELECT ${demoIds.clinic}, ${siteId}, ${weekday}, '09:00', '18:00' WHERE NOT EXISTS (SELECT 1 FROM working_hours WHERE organization_id = ${demoIds.clinic} AND site_id = ${siteId} AND weekday = ${weekday})`;
  for (const professionalId of [demoIds.proOne, demoIds.proTwo, demoIds.proThree]) for (const siteId of [demoIds.providencia, demoIds.nunoa]) for (const weekday of ["mon", "tue", "wed", "thu", "fri"]) await sql`INSERT INTO professional_availability (organization_id, professional_membership_id, site_id, weekday, starts_at, ends_at) SELECT ${demoIds.clinic}, ${professionalId}, ${siteId}, ${weekday}, '09:00', '18:00' WHERE NOT EXISTS (SELECT 1 FROM professional_availability WHERE organization_id = ${demoIds.clinic} AND professional_membership_id = ${professionalId} AND site_id = ${siteId} AND weekday = ${weekday})`;
  for (const weekday of ["mon", "tue", "wed", "thu", "fri"]) await sql`INSERT INTO professional_availability (organization_id, professional_membership_id, site_id, weekday, starts_at, ends_at) SELECT ${demoIds.independent}, ${demoIds.independentOwner}, null, ${weekday}, '10:00', '17:00' WHERE NOT EXISTS (SELECT 1 FROM professional_availability WHERE organization_id = ${demoIds.independent} AND professional_membership_id = ${demoIds.independentOwner} AND site_id IS NULL AND weekday = ${weekday})`;
  const appointments = [{ id: "10000000-0000-4000-8000-000000000201", patient: demoPatients[0].name, starts: "2025-08-04T14:00:00.000Z", ends: "2025-08-04T14:30:00.000Z", pro: demoIds.proOne, box: demoIds.boxOne }, { id: "10000000-0000-4000-8000-000000000202", patient: demoPatients[1].name, starts: "2027-09-07T14:00:00.000Z", ends: "2027-09-07T14:30:00.000Z", pro: demoIds.proTwo, box: demoIds.boxOne }];
  for (const appointment of appointments) await sql`INSERT INTO appointments (id, organization_id, site_id, professional_membership_id, box_id, patient_name, patient_contact, starts_at, ends_at, status, source) VALUES (${appointment.id}, ${demoIds.clinic}, ${demoIds.providencia}, ${appointment.pro}, ${appointment.box}, ${appointment.patient}, 'FICTICIO', ${appointment.starts}, ${appointment.ends}, 'confirmed', 'seed') ON CONFLICT (id) DO NOTHING`;
  // No raw booking token is persisted in fixtures or source control; only its deterministic hash is seeded.
  const publicToken = tokenHash(demoIds.clinic);
  await sql`INSERT INTO public_booking_tokens (organization_id, site_id, token_hash, active, rate_limit_per_minute) VALUES (${demoIds.clinic}, ${demoIds.providencia}, ${publicToken}, true, 20) ON CONFLICT (token_hash) DO UPDATE SET active = true, revoked_at = null, updated_at = now()`;
}
