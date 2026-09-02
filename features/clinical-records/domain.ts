import { StorageValidationError, validateUpload, type UploadCandidate } from "@/lib/storage";

export type PatientInput = { firstName: string; lastName: string; rut?: string; phone?: string; email?: string; consentGranted: boolean };
export type DuplicateCandidate = Pick<PatientInput, "rut" | "phone" | "email">;
export class ClinicalValidationError extends Error {}

export function validatePatient(input: PatientInput): PatientInput {
  const patient = { ...input, firstName: input.firstName.trim(), lastName: input.lastName.trim(), rut: input.rut?.trim() || undefined, phone: input.phone?.trim() || undefined, email: input.email?.trim().toLowerCase() || undefined };
  if (!patient.firstName || !patient.lastName) throw new ClinicalValidationError("Indica nombres y apellidos del paciente.");
  if (!patient.consentGranted) throw new ClinicalValidationError("Debes registrar el consentimiento del paciente.");
  return patient;
}
export function isLikelyDuplicate(input: DuplicateCandidate, existing: DuplicateCandidate): boolean {
  return Boolean((input.rut && existing.rut && input.rut === existing.rut) || (input.email && existing.email && input.email.toLowerCase() === existing.email.toLowerCase()) || (input.phone && existing.phone && input.phone === existing.phone));
}
export function validateClinicalUpload(candidate: UploadCandidate, currentBytes: number): void { try { validateUpload(candidate, currentBytes); } catch (error) { if (error instanceof StorageValidationError) throw new ClinicalValidationError(error.message); throw error; } }
export function chronological<T extends { occurredAt: Date }>(records: readonly T[]): T[] { return [...records].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime()); }
