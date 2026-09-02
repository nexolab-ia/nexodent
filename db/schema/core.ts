import { bigint, jsonb, pgEnum, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const organizationType = pgEnum("organization_type", ["clinic", "independent"]);
export const membershipRole = pgEnum("membership_role", ["organization_admin", "professional", "assistant", "independent_owner"]);
export const membershipStatus = pgEnum("membership_status", ["active", "suspended", "removed"]);

export const id = (name = "id") => uuid(name).defaultRandom().primaryKey();
export const organizationId = () => uuid("organization_id").notNull();
export const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
export const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();
export const clp = (name: string) => bigint(name, { mode: "number" }).notNull();
export const jsonData = (name: string) => jsonb(name).$type<Record<string, unknown>>().notNull().default({});
export const slug = () => varchar("slug", { length: 120 }).notNull();
