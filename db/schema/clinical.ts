import {
  boolean,
  date,
  foreignKey,
  index,
  pgTable,
  text,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, id, jsonData, organizationId, updatedAt } from "./core";
import { memberships, organizations, sites } from "./tenant";

export const convenios = pgTable(
  "convenios",
  {
    id: id(),
    organizationId: organizationId().references(() => organizations.id, {
      onDelete: "restrict",
    }),
    name: varchar("name", { length: 120 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("convenios_id_organization_unique").on(
      table.id,
      table.organizationId,
    ),
    unique("convenios_organization_name_key").on(
      table.organizationId,
      table.name,
    ),
  ],
);

export const patients = pgTable(
  "patients",
  {
    id: id(),
    organizationId: organizationId().references(() => organizations.id, {
      onDelete: "restrict",
    }),
    firstName: varchar("first_name", { length: 120 }).notNull(),
    lastName: varchar("last_name", { length: 120 }).notNull(),
    rut: varchar("rut", { length: 32 }),
    phone: varchar("phone", { length: 48 }),
    email: varchar("email", { length: 320 }),
    consentGranted: boolean("consent_granted").notNull().default(false),
    consentedAt: createdAt(),
    notes: text("notes"),
    sex: varchar("sex", { length: 16 }),
    birthDate: date("birth_date"),
    phoneSecondary: varchar("phone_secondary", { length: 48 }),
    city: varchar("city", { length: 120 }),
    address: varchar("address", { length: 240 }),
    convenioId: uuid("convenio_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("patients_organization_rut_unique").on(
      table.organizationId,
      table.rut,
    ),
    unique("patients_id_organization_unique").on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      columns: [table.convenioId, table.organizationId],
      foreignColumns: [convenios.id, convenios.organizationId],
      name: "patients_convenio_tenant_fk",
    }),
    index("patients_contact_scope_idx").on(
      table.organizationId,
      table.email,
      table.phone,
    ),
  ],
);

export const clinicalRecords = pgTable(
  "clinical_records",
  {
    id: id(),
    organizationId: organizationId().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    siteId: uuid("site_id").references(() => sites.id, {
      onDelete: "restrict",
    }),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "restrict" }),
    content: text("content").notNull(),
    occurredAt: createdAt(),
    createdAt: createdAt(),
  },
  (table) => [
    unique("clinical_records_id_organization_unique").on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      columns: [table.patientId, table.organizationId],
      foreignColumns: [patients.id, patients.organizationId],
      name: "clinical_records_patient_tenant_fk",
    }),
    foreignKey({
      columns: [table.siteId, table.organizationId],
      foreignColumns: [sites.id, sites.organizationId],
      name: "clinical_records_site_tenant_fk",
    }),
    foreignKey({
      columns: [table.authorMembershipId, table.organizationId],
      foreignColumns: [memberships.id, memberships.organizationId],
      name: "clinical_records_author_tenant_fk",
    }),
    index("clinical_records_patient_history_idx").on(
      table.organizationId,
      table.patientId,
      table.occurredAt,
    ),
  ],
);

export const clinicalDocuments = pgTable(
  "clinical_documents",
  {
    id: id(),
    organizationId: organizationId().references(() => organizations.id, {
      onDelete: "cascade",
    }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    siteId: uuid("site_id").references(() => sites.id, {
      onDelete: "restrict",
    }),
    uploaderMembershipId: uuid("uploader_membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "restrict" }),
    storageKey: varchar("storage_key", { length: 512 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    byteSize: varchar("byte_size", { length: 20 }).notNull(),
    scanStatus: varchar("scan_status", { length: 32 })
      .notNull()
      .default("quarantined"),
    metadata: jsonData("metadata"),
    createdAt: createdAt(),
  },
  (table) => [
    unique("clinical_documents_id_organization_unique").on(
      table.id,
      table.organizationId,
    ),
    unique("clinical_documents_storage_key_unique").on(table.storageKey),
    foreignKey({
      columns: [table.patientId, table.organizationId],
      foreignColumns: [patients.id, patients.organizationId],
      name: "clinical_documents_patient_tenant_fk",
    }),
    foreignKey({
      columns: [table.siteId, table.organizationId],
      foreignColumns: [sites.id, sites.organizationId],
      name: "clinical_documents_site_tenant_fk",
    }),
    foreignKey({
      columns: [table.uploaderMembershipId, table.organizationId],
      foreignColumns: [memberships.id, memberships.organizationId],
      name: "clinical_documents_uploader_tenant_fk",
    }),
    index("clinical_documents_patient_scope_idx").on(
      table.organizationId,
      table.patientId,
    ),
  ],
);
