export const PERMANENT_TEETH = Array.from({ length: 32 }, (_, index) => index + 1) as readonly number[];
export const SURFACES = ["occlusal", "mesial", "distal", "buccal", "lingual", "whole"] as const;
export const ODONTOGRAM_STATES = ["healthy", "caries", "restoration", "missing", "crown", "root_canal", "implant"] as const;
export type Surface = (typeof SURFACES)[number]; export type OdontogramState = (typeof ODONTOGRAM_STATES)[number];
export type ToothEvent = { tooth: number; surface: Surface; stateAfter: OdontogramState; occurredAt: Date; version: number };
export class OdontogramValidationError extends Error {}
export function validateToothChange(tooth: number, surface: string, state: string, reason: string): asserts surface is Surface & string {
  if (!PERMANENT_TEETH.includes(tooth)) throw new OdontogramValidationError("La pieza debe ser un diente permanente entre 1 y 32.");
  if (!SURFACES.includes(surface as Surface)) throw new OdontogramValidationError("La superficie no es válida.");
  if (!ODONTOGRAM_STATES.includes(state as OdontogramState)) throw new OdontogramValidationError("El estado no es válido.");
  if (!reason.trim()) throw new OdontogramValidationError("Indica el motivo del registro.");
}
export function reduceOdontogram(events: readonly ToothEvent[]): Map<string, OdontogramState> { return events.reduce((state, event) => state.set(`${event.tooth}:${event.surface}`, event.stateAfter), new Map<string, OdontogramState>()); }
export function svgProjection(events: readonly ToothEvent[]): { tooth: number; label: string; state: OdontogramState }[] { const current = reduceOdontogram(events); return PERMANENT_TEETH.map((tooth) => ({ tooth, label: `Pieza ${tooth}`, state: current.get(`${tooth}:whole`) ?? "healthy" })); }
