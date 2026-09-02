import { sql } from "drizzle-orm";
import { boolean, check, index, pgEnum, pgTable, text, time, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, jsonData, organizationId, updatedAt } from "./core";
import { memberships, organizations, sites } from "./tenant";

export const appointmentStatus = pgEnum("appointment_status", ["pending", "confirmed", "cancelled"]);
export const appointmentKind = pgEnum("appointment_kind", ["appointment", "block"]);

export const workingHours = pgTable("working_hours", {
  id: id(), organizationId: organizationId().references(() => organizations.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "cascade" }), weekday: varchar("weekday", { length: 3 }).notNull(),
  startsAt: time("starts_at").notNull(), endsAt: time("ends_at").notNull(), timezone: varchar("timezone", { length: 64 }).notNull().default("America/Santiago"),
  createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [check("working_hours_valid_interval", sql`${table.startsAt} < ${table.endsAt}`), index("working_hours_scope_idx").on(table.organizationId, table.siteId)]);

export const professionalAvailability = pgTable("professional_availability", {
  id: id(), organizationId: organizationId().references(() => organizations.id, { onDelete: "cascade" }),
  professionalMembershipId: uuid("professional_membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "cascade" }), weekday: varchar("weekday", { length: 3 }).notNull(), startsAt: time("starts_at").notNull(), endsAt: time("ends_at").notNull(), timezone: varchar("timezone", { length: 64 }).notNull().default("America/Santiago"), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [check("professional_availability_valid_interval", sql`${table.startsAt} < ${table.endsAt}`), index("professional_availability_scope_idx").on(table.organizationId, table.professionalMembershipId, table.siteId)]);

export const boxes = pgTable("boxes", {
  id: id(), organizationId: organizationId().references(() => organizations.id, { onDelete: "cascade" }), siteId: uuid("site_id").references(() => sites.id, { onDelete: "cascade" }), name: varchar("name", { length: 120 }).notNull(), active: boolean("active").notNull().default(true), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [unique("boxes_scope_name_unique").on(table.organizationId, table.siteId, table.name), index("boxes_scope_idx").on(table.organizationId, table.siteId)]);

export const appointments = pgTable("appointments", {
  id: id(), organizationId: organizationId().references(() => organizations.id, { onDelete: "cascade" }), siteId: uuid("site_id").references(() => sites.id, { onDelete: "restrict" }),
  professionalMembershipId: uuid("professional_membership_id").notNull().references(() => memberships.id, { onDelete: "restrict" }), boxId: uuid("box_id").references(() => boxes.id, { onDelete: "restrict" }),
  kind: appointmentKind("kind").notNull().default("appointment"), status: appointmentStatus("status").notNull().default("pending"), patientName: varchar("patient_name", { length: 160 }).notNull(), patientContact: varchar("patient_contact", { length: 160 }), startsAt: timestamp("starts_at", { withTimezone: true }).notNull(), endsAt: timestamp("ends_at", { withTimezone: true }).notNull(), notes: text("notes"), cancellationReason: varchar("cancellation_reason", { length: 500 }), source: varchar("source", { length: 32 }).notNull().default("internal"), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [check("appointments_valid_interval", sql`${table.startsAt} < ${table.endsAt}`), index("appointments_scope_time_idx").on(table.organizationId, table.siteId, table.startsAt)]);

export const appointmentHistory = pgTable("appointment_history", { id: id(), organizationId: organizationId().references(() => organizations.id, { onDelete: "cascade" }), appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }), actorMembershipId: uuid("actor_membership_id"), action: varchar("action", { length: 32 }).notNull(), before: jsonData("before"), after: jsonData("after"), reason: varchar("reason", { length: 500 }), createdAt: createdAt() }, (table) => [index("appointment_history_scope_idx").on(table.organizationId, table.appointmentId, table.createdAt)]);

export const publicBookingTokens = pgTable("public_booking_tokens", { id: id(), organizationId: organizationId().references(() => organizations.id, { onDelete: "cascade" }), siteId: uuid("site_id").references(() => sites.id, { onDelete: "cascade" }), tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(), active: boolean("active").notNull().default(true), revokedAt: timestamp("revoked_at", { withTimezone: true }), rateLimitPerMinute: varchar("rate_limit_per_minute", { length: 4 }).notNull().default("20"), createdAt: createdAt(), updatedAt: updatedAt() }, (table) => [index("public_booking_tokens_scope_idx").on(table.organizationId, table.siteId)]);
