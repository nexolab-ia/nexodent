import { createHash, randomBytes } from "node:crypto";
export type EstimateState = "draft" | "sent" | "approved" | "rejected" | "expired";
export type EstimateLine = { code: string; description: string; unitPriceClp: number; quantity: number; discountClp?: number };
export class EstimateValidationError extends Error {}
export function calculateEstimate(lines: readonly EstimateLine[]): { totalClp: number; lines: Array<EstimateLine & { lineTotalClp: number }> } {
  if (!lines.length) throw new EstimateValidationError("La cotización debe tener al menos una prestación.");
  const normalized: Array<EstimateLine & { lineTotalClp: number; discountClp: number }> = lines.map((line) => { const discountClp = line.discountClp ?? 0; if (!line.code.trim() || !Number.isSafeInteger(line.unitPriceClp) || !Number.isSafeInteger(line.quantity) || !Number.isSafeInteger(discountClp) || line.unitPriceClp < 0 || line.quantity <= 0 || discountClp < 0 || discountClp > line.unitPriceClp * line.quantity) throw new EstimateValidationError("Cada prestación debe tener montos CLP válidos."); return { ...line, discountClp: discountClp, lineTotalClp: line.unitPriceClp * line.quantity - discountClp }; });
  return { lines: normalized, totalClp: normalized.reduce((total, line) => total + line.lineTotalClp, 0) };
}
export function nextEstimateState(current: EstimateState, next: EstimateState): EstimateState { const allowed: Record<EstimateState, EstimateState[]> = { draft: ["sent"], sent: ["approved", "rejected", "expired"], approved: [], rejected: [], expired: [] }; if (!allowed[current].includes(next)) throw new EstimateValidationError("La transición de estado no está permitida."); return next; }
export function assertEstimateRevisionAllowed(state: EstimateState): void { if (state === "draft") throw new EstimateValidationError("Una cotización en borrador debe editarse, no revisarse."); }
export function assertEstimateShareable(state: EstimateState): void { if (state === "draft") throw new EstimateValidationError("No se puede compartir una cotización en borrador."); }
export function publicEstimateToken(): string { return randomBytes(32).toString("base64url"); }
export function hashEstimateToken(token: string): string { return createHash("sha256").update(token).digest("hex"); }
