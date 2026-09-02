import type { TenantContext } from "@/lib/tenancy";
import { SANTIAGO_TIMEZONE, santiagoLocalToUtc } from "@/features/scheduling/domain";

export type DayScope = "clinic" | "own";
export type DayDate = { year: number; month: number; day: number };

export function resolveScope(actor: TenantContext, requested?: string): DayScope {
  if (actor.role === "professional") return "own";
  if (actor.role === "assistant") return "clinic";
  return requested === "own" ? "own" : "clinic";
}
export function percent(cur: number, base: number): number | null { return base > 0 ? Math.round(cur / base * 100) : null; }
export function deltaPercent(cur: number, prev: number): number | null { return prev > 0 ? Math.round((cur - prev) / prev * 100) : null; }
export const occupancyPercent = percent;
export function attendancePercent(attended: number, missed: number): number | null { return percent(attended, attended + missed); }

function validDay(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
export function todayInSantiago(now = new Date()): DayDate {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: SANTIAGO_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return { year: Number(parts.find(p => p.type === "year")?.value), month: Number(parts.find(p => p.type === "month")?.value), day: Number(parts.find(p => p.type === "day")?.value) };
}
export function parseDayParam(raw?: string): DayDate {
  if (!raw) return todayInSantiago();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) throw new Error("La fecha no es válida.");
  const value = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  if (!validDay(value.year, value.month, value.day)) throw new Error("La fecha no es válida.");
  return value;
}
export function formatDayParam(day: DayDate): string { return `${day.year}-${String(day.month).padStart(2,"0")}-${String(day.day).padStart(2,"0")}`; }
export function addDaysLocal(day: DayDate, amount: number): DayDate { const d = new Date(Date.UTC(day.year, day.month - 1, day.day + amount)); return { year:d.getUTCFullYear(), month:d.getUTCMonth()+1, day:d.getUTCDate() }; }
export function dayBounds(day: DayDate): {start: Date; end: Date} { return { start:santiagoLocalToUtc(new Date(Date.UTC(day.year,day.month-1,day.day,12)),"00:00"), end:santiagoLocalToUtc(new Date(Date.UTC(addDaysLocal(day,1).year,addDaysLocal(day,1).month-1,addDaysLocal(day,1).day,12)),"00:00") }; }
