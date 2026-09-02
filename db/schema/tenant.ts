import { index, pgTable, primaryKey, unique, uniqueIndex, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { createdAt, id, jsonData, membershipRole, membershipStatus, organizationId, organizationType, slug, updatedAt } from "./core";

export const organizations = pgTable("organizations", {
  id: id(), type: organizationType("type").notNull(), slug: slug(), name: varchar("name", { length: 160 }).notNull(),
  settings: jsonData("settings"), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [uniqueIndex("organizations_slug_unique").on(table.slug)]);

export const users = pgTable("users", {
  id: id(), name: varchar("name", { length: 160 }).notNull(), email: varchar("email", { length: 320 }).notNull(),
  emailVerified: boolean("email_verified").notNull().default(false), image: varchar("image", { length: 2048 }), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [uniqueIndex("users_email_unique").on(table.email)]);

export const sites = pgTable("sites", {
  id: id(), organizationId: organizationId().references(() => organizations.id, { onDelete: "restrict" }), slug: slug(),
  name: varchar("name", { length: 160 }).notNull(), timezone: varchar("timezone", { length: 64 }).notNull().default("America/Santiago"),
  settings: jsonData("settings"), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [unique("sites_organization_slug_unique").on(table.organizationId, table.slug), unique("sites_id_organization_unique").on(table.id, table.organizationId)]);

export const memberships = pgTable("memberships", {
  id: id(), organizationId: organizationId().references(() => organizations.id, { onDelete: "restrict" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }), role: membershipRole("role").notNull(),
  status: membershipStatus("status").notNull().default("active"), expiresAt: timestamp("expires_at", { withTimezone: true }), createdAt: createdAt(), updatedAt: updatedAt(),
}, (table) => [unique("memberships_organization_user_unique").on(table.organizationId, table.userId), unique("memberships_id_organization_unique").on(table.id, table.organizationId)]);

export const membershipSites = pgTable("membership_sites", {
  membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
  organizationId: organizationId().references(() => organizations.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }), createdAt: createdAt(),
}, (table) => [primaryKey({ columns: [table.membershipId, table.siteId] }), index("membership_sites_scope_idx").on(table.organizationId, table.siteId)]);

export const auditLogs = pgTable("audit_logs", {
  id: id(), organizationId: organizationId().references(() => organizations.id, { onDelete: "restrict" }), siteId: uuid("site_id"),
  actorMembershipId: uuid("actor_membership_id"), action: varchar("action", { length: 120 }).notNull(), entity: varchar("entity", { length: 120 }).notNull(),
  entityId: uuid("entity_id"), before: jsonData("before"), after: jsonData("after"), reason: varchar("reason", { length: 500 }).notNull(),
  createdAt: createdAt(),
}, (table) => [index("audit_logs_organization_created_idx").on(table.organizationId, table.createdAt)]);
