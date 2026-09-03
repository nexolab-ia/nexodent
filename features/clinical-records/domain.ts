import { formatDayParam, todayInSantiago } from "@/features/dashboard/domain";
import {
  StorageValidationError,
  validateUpload,
  type UploadCandidate,
} from "@/lib/storage";

export type PatientSex = "female" | "male" | "other" | "unspecified";
export type PatientInput = {
  firstName: string;
  lastName: string;
  rut?: string;
  phone?: string;
  email?: string;
  consentGranted: boolean;
  sex?: PatientSex;
  birthDate?: string;
  phoneSecondary?: string;
  city?: string;
  address?: string;
  convenioId?: string;
  observations?: string;
};
export type DuplicateCandidate = Pick<PatientInput, "rut" | "phone" | "email">;
export class ClinicalValidationError extends Error {}
const PATIENT_SEXES: PatientSex[] = ["female", "male", "other", "unspecified"];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validatePatient(input: PatientInput): PatientInput {
  const patient: PatientInput = {
    ...input,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    rut: input.rut?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim().toLowerCase() || undefined,
    sex: (input.sex?.trim() as PatientSex) || undefined,
    birthDate: input.birthDate?.trim() || undefined,
    phoneSecondary: input.phoneSecondary?.trim() || undefined,
    city: input.city?.trim() || undefined,
    address: input.address?.trim() || undefined,
    convenioId: input.convenioId?.trim() || undefined,
    observations: input.observations?.trim() || undefined,
  };
  if (!patient.firstName || !patient.lastName)
    throw new ClinicalValidationError(
      "Indica nombres y apellidos del paciente.",
    );
  if (!patient.consentGranted)
    throw new ClinicalValidationError(
      "Debes registrar el consentimiento del paciente.",
    );
  if (patient.sex && !PATIENT_SEXES.includes(patient.sex))
    throw new ClinicalValidationError("Selecciona una opción de sexo válida.");
  if (
    patient.birthDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(patient.birthDate) ||
      patient.birthDate > formatDayParam(todayInSantiago()))
  )
    throw new ClinicalValidationError(
      "La fecha de nacimiento no puede ser futura.",
    );
  if (patient.convenioId && !UUID_PATTERN.test(patient.convenioId))
    throw new ClinicalValidationError(
      "El convenio seleccionado no existe o no está activo.",
    );
  return patient;
}
export function isLikelyDuplicate(
  input: DuplicateCandidate,
  existing: DuplicateCandidate,
): boolean {
  return Boolean(
    (input.rut && existing.rut && input.rut === existing.rut) ||
    (input.email &&
      existing.email &&
      input.email.toLowerCase() === existing.email.toLowerCase()) ||
    (input.phone && existing.phone && input.phone === existing.phone),
  );
}
export function validateClinicalUpload(
  candidate: UploadCandidate,
  currentBytes: number,
): void {
  try {
    validateUpload(candidate, currentBytes);
  } catch (error) {
    if (error instanceof StorageValidationError)
      throw new ClinicalValidationError(error.message);
    throw error;
  }
}
export function chronological<T extends { occurredAt: Date }>(
  records: readonly T[],
): T[] {
  return [...records].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );
}
