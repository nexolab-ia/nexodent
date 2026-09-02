import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./core";
import { users } from "./tenant";

export const sessions = pgTable("sessions", {
  id: id(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), ipAddress: varchar("ip_address", { length: 128 }), userAgent: text("user_agent"), createdAt: createdAt(), updatedAt: updatedAt(),
});
export const accounts = pgTable("accounts", {
  id: id(), userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), accountId: varchar("account_id", { length: 255 }).notNull(), providerId: varchar("provider_id", { length: 255 }).notNull(), password: text("password"), accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"), accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }), refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }), scope: text("scope"), createdAt: createdAt(), updatedAt: updatedAt(),
});
export const verifications = pgTable("verifications", { id: id(), identifier: varchar("identifier", { length: 320 }).notNull(), value: text("value").notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: createdAt(), updatedAt: updatedAt() });
