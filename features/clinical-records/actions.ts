import type { Sql, TransactionSql } from "postgres";
import { authorize } from "@/features/tenant-identity/authorize";
import type { TenantContext } from "@/lib/tenancy";
import {
  isLikelyDuplicate,
  validateClinicalUpload,
  validatePatient,
  type PatientInput,
} from "./domain";
type ClinicalSql = Sql | TransactionSql;
export async function createPatient(
  sql: ClinicalSql,
  actor: TenantContext,
  input: PatientInput,
  acceptDuplicate = false,
): Promise<string> {
  authorize(actor, "patient:demographics");
  const patient = validatePatient(input);
  const duplicates = await sql<
    { rut: string | null; phone: string | null; email: string | null }[]
  >`SELECT rut,phone,email FROM patients WHERE organization_id=${actor.organizationId}`;
  if (
    !acceptDuplicate &&
    duplicates.some((row) =>
      isLikelyDuplicate(patient, {
        rut: row.rut ?? undefined,
        phone: row.phone ?? undefined,
        email: row.email ?? undefined,
      }),
    )
  )
    throw new Error(
      "Existe un posible paciente duplicado; confirma la creación.",
    );
  if (patient.convenioId) {
    const convenio = await sql<
      { exists: boolean }[]
    >`SELECT true AS exists FROM convenios WHERE id=${patient.convenioId} AND organization_id=${actor.organizationId} AND is_active`;
    if (!convenio[0])
      throw new Error("El convenio seleccionado no existe o no está activo.");
  }
  const rows = await sql<
    { id: string }[]
  >`INSERT INTO patients (organization_id,first_name,last_name,rut,phone,email,consent_granted,consented_at,sex,birth_date,phone_secondary,city,address,notes,convenio_id) VALUES (${actor.organizationId},${patient.firstName},${patient.lastName},${patient.rut ?? null},${patient.phone ?? null},${patient.email ?? null},true,now(),${patient.sex ?? null},${patient.birthDate ?? null},${patient.phoneSecondary ?? null},${patient.city ?? null},${patient.address ?? null},${patient.observations ?? null},${patient.convenioId ?? null}) RETURNING id`;
  return rows[0]!.id;
}
export async function addEvolution(
  sql: ClinicalSql,
  actor: TenantContext,
  patientId: string,
  content: string,
  siteId?: string,
): Promise<void> {
  authorize({ ...actor, resourceSiteId: siteId }, "clinical:manage");
  if (!content.trim())
    throw new Error("La evolución clínica no puede estar vacía.");
  await sql`INSERT INTO clinical_records (organization_id,patient_id,site_id,author_membership_id,content) VALUES (${actor.organizationId},${patientId},${siteId ?? null},${actor.membershipId},${content.trim()})`;
  await sql`INSERT INTO audit_logs (organization_id,site_id,actor_membership_id,action,entity,entity_id,reason) VALUES (${actor.organizationId},${siteId ?? null},${actor.membershipId},'clinical.evolution_created','patient',${patientId},'Clinical evolution created')`;
}
export async function attachClinicalDocument(
  sql: ClinicalSql,
  actor: TenantContext,
  input: {
    patientId: string;
    siteId?: string;
    storageKey: string;
    fileName: string;
    mimeType: string;
    byteSize: number;
    scanStatus: "clean";
  },
): Promise<void> {
  try {
    authorize({ ...actor, resourceSiteId: input.siteId }, "clinical:manage");
  } catch (error) {
    await sql`INSERT INTO audit_logs (organization_id,site_id,actor_membership_id,action,entity,entity_id,reason) VALUES (${actor.organizationId},${input.siteId ?? null},${actor.membershipId},'clinical.document_denied','patient',${input.patientId},'Authorization denied')`;
    throw error;
  }
  const rows = await sql<
    { bytes: string | number }[]
  >`SELECT COALESCE(SUM(byte_size),0) AS bytes FROM clinical_documents WHERE organization_id=${actor.organizationId} AND patient_id=${input.patientId}`;
  validateClinicalUpload(
    {
      fileName: input.fileName,
      mimeType: input.mimeType,
      byteSize: Number(input.byteSize),
    },
    Number(rows[0]?.bytes ?? 0),
  );
  await sql`INSERT INTO clinical_documents (organization_id,patient_id,site_id,uploader_membership_id,storage_key,file_name,mime_type,byte_size,scan_status) VALUES (${actor.organizationId},${input.patientId},${input.siteId ?? null},${actor.membershipId},${input.storageKey},${input.fileName},${input.mimeType},${input.byteSize},${input.scanStatus})`;
  await sql`INSERT INTO audit_logs (organization_id,site_id,actor_membership_id,action,entity,entity_id,reason) VALUES (${actor.organizationId},${input.siteId ?? null},${actor.membershipId},'clinical.document_linked','document',${input.patientId},'Clean scanned document linked')`;
}
