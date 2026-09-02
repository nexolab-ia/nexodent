export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_PATIENT_DOCUMENT_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

export class StorageValidationError extends Error {}
export type UploadCandidate = { fileName: string; mimeType: string; byteSize: number };
export type QuarantineStore = { putQuarantine: (key: string, bytes: Uint8Array) => Promise<void>; remove: (key: string) => Promise<void>; scan: (key: string) => Promise<"clean" | "infected"> };

export function validateUpload(candidate: UploadCandidate, existingPatientBytes = 0): void {
  if (!ACCEPTED_DOCUMENT_MIME_TYPES.has(candidate.mimeType)) throw new StorageValidationError("El tipo de archivo debe ser PDF, PNG o JPEG.");
  if (!Number.isSafeInteger(candidate.byteSize) || candidate.byteSize <= 0 || candidate.byteSize > MAX_DOCUMENT_BYTES) throw new StorageValidationError("El archivo debe pesar hasta 10 MB.");
  if (existingPatientBytes + candidate.byteSize > MAX_PATIENT_DOCUMENT_BYTES) throw new StorageValidationError("El paciente supera el máximo de 50 MB en documentos.");
}

/** Writes only after validation and removes the quarantine object if scanning or persistence fails. */
export async function quarantineAndScan(store: QuarantineStore, key: string, bytes: Uint8Array, existingPatientBytes: number, candidate: UploadCandidate): Promise<void> {
  validateUpload(candidate, existingPatientBytes);
  let stored = false;
  try { await store.putQuarantine(key, bytes); stored = true; if (await store.scan(key) !== "clean") throw new StorageValidationError("El análisis de seguridad rechazó el archivo."); }
  catch (error) { if (stored) await store.remove(key); throw error; }
}

/** Persist a clean attachment only after quarantine scanning; compensate storage if database linking fails. */
export async function uploadAndLinkClinicalDocument(store: QuarantineStore, key: string, bytes: Uint8Array, existingPatientBytes: number, candidate: UploadCandidate, linkCleanDocument: () => Promise<void>): Promise<void> {
  await quarantineAndScan(store, key, bytes, existingPatientBytes, candidate);
  try { await linkCleanDocument(); } catch (error) { await store.remove(key); throw error; }
}

import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
const QUARANTINE_ROOT = resolve(process.cwd(), ".quarantine");
/** Minimal local adapter. The scanner is an explicit clean-only development stub until an AV service is configured. */
export const localQuarantineStore: QuarantineStore = {
  async putQuarantine(key, bytes) { const path = resolve(QUARANTINE_ROOT, key); if (!path.startsWith(`${QUARANTINE_ROOT}/`)) throw new StorageValidationError("Clave de almacenamiento inválida."); await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes); },
  async remove(key) { const path = resolve(QUARANTINE_ROOT, key); if (path.startsWith(`${QUARANTINE_ROOT}/`)) await rm(path, { force: true }); },
  async scan() { return "clean"; },
};
