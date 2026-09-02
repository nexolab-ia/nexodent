export const SANTIAGO_TIMEZONE = "America/Santiago";
export const weekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof weekdays)[number];
export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export class SchedulingValidationError extends Error {}
export class SchedulingConflictError extends Error {}

export function assertSantiagoTimezone(timezone: string): void {
  if (timezone !== SANTIAGO_TIMEZONE) throw new SchedulingValidationError("La agenda debe usar la zona horaria de Chile.");
}

export function assertInterval(startsAt: Date, endsAt: Date): void {
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || startsAt >= endsAt) throw new SchedulingValidationError("El horario de término debe ser posterior al de inicio.");
}

export function localWeekday(date: Date): Weekday {
  const value = new Intl.DateTimeFormat("en-US", { timeZone: SANTIAGO_TIMEZONE, weekday: "short" }).format(date).toLowerCase().slice(0, 3);
  if (!weekdays.includes(value as Weekday)) throw new SchedulingValidationError("No se pudo resolver el día de la agenda.");
  return value as Weekday;
}

export function localTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: SANTIAGO_TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

/** Offset real (ms) de America/Santiago respecto a UTC en un instante dado. Chile: UTC-3 verano / UTC-4 invierno. */
export function santiagoOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: SANTIAGO_TIMEZONE, timeZoneName: "longOffset" }).formatToParts(date);
  const zone = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(zone);
  if (!match) return -3 * 3_600_000;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 3_600 + Number(match[3]) * 60) * 1000;
}

/** Convierte una hora local de Santiago (HH:MM) de un día calendario dado a un instante UTC real, respetando DST. */
export function santiagoLocalToUtc(day: Date, time: string): Date {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: SANTIAGO_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(day);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const date = Number(parts.find((part) => part.type === "day")?.value);
  const [hour, minute] = time.split(":").map(Number);
  const naiveUtc = Date.UTC(year, month - 1, date, hour, minute);
  // Muestrear el offset al mediodía UTC del día objetivo evita bordes de transición DST.
  const offsetProbe = new Date(Date.UTC(year, month - 1, date, 12));
  return new Date(naiveUtc - santiagoOffsetMs(offsetProbe));
}

export function isWithinHours(startsAt: Date, endsAt: Date, hours: { weekday: Weekday; startsAt: string; endsAt: string }[]): boolean {
  assertInterval(startsAt, endsAt);
  const weekday = localWeekday(startsAt);
  if (weekday !== localWeekday(new Date(endsAt.getTime() - 1))) return false;
  const start = localTime(startsAt); const end = localTime(endsAt);
  return hours.some((hour) => hour.weekday === weekday && hour.startsAt <= start && hour.endsAt >= end);
}

export function requiresCancellationReason(status: AppointmentStatus, reason?: string | null): boolean {
  return status !== "cancelled" || Boolean(reason?.trim());
}
