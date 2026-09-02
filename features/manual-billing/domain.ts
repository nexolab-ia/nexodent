export type MovementKind = "charge" | "payment" | "credit" | "correction";
export type Movement = { kind: MovementKind; amountClp: number; status?: "posted" | "voided" };
export class BillingValidationError extends Error {}
export const MAX_MANUAL_MOVEMENT_CLP = 100_000_000;
export function validateMovement(input: Pick<Movement, "kind" | "amountClp"> & { reason: string; evidence?: Record<string, unknown> }): void {
  if (!Number.isSafeInteger(input.amountClp) || input.amountClp <= 0 || input.amountClp > MAX_MANUAL_MOVEMENT_CLP) throw new BillingValidationError("El monto debe ser un entero CLP positivo dentro del límite manual.");
  if (!input.reason.trim()) throw new BillingValidationError("Indica el respaldo o motivo del movimiento.");
  if (input.kind === "payment" && (!input.evidence || !Object.keys(input.evidence).length)) throw new BillingValidationError("Un pago manual requiere evidencia o referencia.");
}
export function patientBalance(movements: readonly Movement[]): number { return movements.filter((movement) => (movement.status ?? "posted") === "posted").reduce((balance, movement) => balance + (movement.kind === "charge" ? movement.amountClp : -movement.amountClp), 0); }
export function accountState(balanceClp: number): "paid" | "outstanding" | "credit" { return balanceClp > 0 ? "outstanding" : balanceClp < 0 ? "credit" : "paid"; }
export function collectionTotal(movements: readonly Movement[]): number { return movements.filter((movement) => movement.kind === "payment" && (movement.status ?? "posted") === "posted").reduce((total, movement) => total + movement.amountClp, 0); }
export function onlinePaymentUnavailable(): { message: string; transactionCreated: false } { return { message: "Los pagos en línea no están disponibles en esta versión.", transactionCreated: false }; }
