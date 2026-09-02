CREATE TYPE estimate_state AS ENUM ('draft', 'sent', 'approved', 'rejected', 'expired');
CREATE TYPE billing_movement_kind AS ENUM ('charge', 'payment', 'credit', 'correction');
CREATE TYPE document_scan_status AS ENUM ('quarantined', 'clean', 'rejected');

CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  first_name varchar(120) NOT NULL, last_name varchar(120) NOT NULL, rut varchar(32), phone varchar(48), email varchar(320),
  consent_granted boolean NOT NULL DEFAULT false, consented_at timestamptz, notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (organization_id, rut)
);
CREATE INDEX patients_contact_scope_idx ON patients(organization_id, email, phone);
CREATE TABLE clinical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT, site_id uuid REFERENCES sites(id) ON DELETE RESTRICT,
  author_membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT, content text NOT NULL CHECK (length(trim(content)) > 0),
  occurred_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clinical_records_patient_history_idx ON clinical_records(organization_id, patient_id, occurred_at);
CREATE TABLE clinical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT, site_id uuid REFERENCES sites(id) ON DELETE RESTRICT,
  uploader_membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT, storage_key varchar(512) NOT NULL UNIQUE,
  file_name varchar(255) NOT NULL, mime_type varchar(100) NOT NULL CHECK (mime_type IN ('application/pdf', 'image/png', 'image/jpeg')),
  byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760), scan_status document_scan_status NOT NULL DEFAULT 'quarantined', metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clinical_documents_patient_scope_idx ON clinical_documents(organization_id, patient_id);
CREATE TABLE odontogram_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT, site_id uuid REFERENCES sites(id) ON DELETE RESTRICT,
  actor_membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT, tooth smallint NOT NULL CHECK (tooth BETWEEN 1 AND 32),
  surface varchar(16) NOT NULL CHECK (surface IN ('occlusal', 'mesial', 'distal', 'buccal', 'lingual', 'whole')),
  state_before varchar(32), state_after varchar(32) NOT NULL CHECK (state_after IN ('healthy', 'caries', 'restoration', 'missing', 'crown', 'root_canal', 'implant')),
  reason varchar(500) NOT NULL CHECK (length(trim(reason)) > 0), version smallint NOT NULL CHECK (version > 0), svg_snapshot jsonb NOT NULL DEFAULT '{}', occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, patient_id, version)
);
CREATE INDEX odontogram_events_history_idx ON odontogram_events(organization_id, patient_id, version);

CREATE TABLE fee_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code varchar(64) NOT NULL, name varchar(200) NOT NULL, price_clp bigint NOT NULL CHECK (price_clp >= 0), active boolean NOT NULL DEFAULT true,
  valid_from timestamptz NOT NULL DEFAULT now(), valid_until timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code), CHECK (valid_until IS NULL OR valid_until > valid_from)
);
CREATE TABLE estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT, author_membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
  current_version smallint NOT NULL DEFAULT 1 CHECK (current_version > 0), state estimate_state NOT NULL DEFAULT 'draft', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX estimates_patient_scope_idx ON estimates(organization_id, patient_id);
CREATE TABLE estimate_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  estimate_id uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE, version smallint NOT NULL CHECK (version > 0), state estimate_state NOT NULL,
  total_clp bigint NOT NULL CHECK (total_clp >= 0), snapshot jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (estimate_id, version)
);
CREATE TABLE estimate_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  estimate_version_id uuid NOT NULL REFERENCES estimate_versions(id) ON DELETE CASCADE, fee_schedule_id uuid REFERENCES fee_schedules(id) ON DELETE RESTRICT,
  code varchar(64) NOT NULL, description varchar(200) NOT NULL, unit_price_clp bigint NOT NULL CHECK (unit_price_clp >= 0), quantity smallint NOT NULL CHECK (quantity > 0),
  discount_clp bigint NOT NULL DEFAULT 0 CHECK (discount_clp >= 0), line_total_clp bigint NOT NULL CHECK (line_total_clp >= 0)
);
CREATE INDEX estimate_items_version_idx ON estimate_items(organization_id, estimate_version_id);
CREATE TABLE estimate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  estimate_version_id uuid NOT NULL REFERENCES estimate_versions(id) ON DELETE CASCADE, token_hash varchar(64) NOT NULL UNIQUE,
  expires_at timestamptz, revoked_at timestamptz, created_by_membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE billing_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT, site_id uuid REFERENCES sites(id) ON DELETE RESTRICT,
  professional_membership_id uuid REFERENCES memberships(id) ON DELETE RESTRICT, actor_membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
  kind billing_movement_kind NOT NULL, amount_clp bigint NOT NULL CHECK (amount_clp > 0), status varchar(16) NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'voided')),
  reason varchar(500) NOT NULL CHECK (length(trim(reason)) > 0), evidence jsonb NOT NULL DEFAULT '{}', corrects_movement_id uuid REFERENCES billing_movements(id) ON DELETE RESTRICT, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX billing_movements_patient_idx ON billing_movements(organization_id, patient_id, created_at);
CREATE INDEX billing_movements_collection_idx ON billing_movements(organization_id, site_id, created_at);

CREATE OR REPLACE FUNCTION app_immutable_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'immutable clinical and financial history'; END; $$;
CREATE TRIGGER clinical_records_immutable BEFORE UPDATE OR DELETE ON clinical_records FOR EACH ROW EXECUTE FUNCTION app_immutable_history();
CREATE TRIGGER odontogram_events_immutable BEFORE UPDATE OR DELETE ON odontogram_events FOR EACH ROW EXECUTE FUNCTION app_immutable_history();
CREATE TRIGGER estimate_versions_immutable BEFORE UPDATE OR DELETE ON estimate_versions FOR EACH ROW EXECUTE FUNCTION app_immutable_history();
CREATE TRIGGER estimate_items_immutable BEFORE UPDATE OR DELETE ON estimate_items FOR EACH ROW EXECUTE FUNCTION app_immutable_history();
CREATE TRIGGER billing_movements_immutable BEFORE UPDATE OR DELETE ON billing_movements FOR EACH ROW WHEN (OLD.status = 'posted') EXECUTE FUNCTION app_immutable_history();

ALTER TABLE patients ENABLE ROW LEVEL SECURITY; ALTER TABLE patients FORCE ROW LEVEL SECURITY;
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY; ALTER TABLE clinical_records FORCE ROW LEVEL SECURITY;
ALTER TABLE clinical_documents ENABLE ROW LEVEL SECURITY; ALTER TABLE clinical_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE odontogram_events ENABLE ROW LEVEL SECURITY; ALTER TABLE odontogram_events FORCE ROW LEVEL SECURITY;
ALTER TABLE fee_schedules ENABLE ROW LEVEL SECURITY; ALTER TABLE fee_schedules FORCE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY; ALTER TABLE estimates FORCE ROW LEVEL SECURITY;
ALTER TABLE estimate_versions ENABLE ROW LEVEL SECURITY; ALTER TABLE estimate_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY; ALTER TABLE estimate_items FORCE ROW LEVEL SECURITY;
ALTER TABLE estimate_links ENABLE ROW LEVEL SECURITY; ALTER TABLE estimate_links FORCE ROW LEVEL SECURITY;
ALTER TABLE billing_movements ENABLE ROW LEVEL SECURITY; ALTER TABLE billing_movements FORCE ROW LEVEL SECURITY;
CREATE POLICY patients_tenant_scope ON patients USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY clinical_records_tenant_scope ON clinical_records USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY clinical_documents_tenant_scope ON clinical_documents USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY odontogram_events_tenant_scope ON odontogram_events USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY fee_schedules_tenant_scope ON fee_schedules USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY estimates_tenant_scope ON estimates USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY estimate_versions_tenant_scope ON estimate_versions USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY estimate_items_tenant_scope ON estimate_items USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY estimate_links_tenant_scope ON estimate_links USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY billing_movements_tenant_scope ON billing_movements USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);

-- Tenant-safe composite links prevent a guessed ID from crossing organization boundaries.
ALTER TABLE patients ADD CONSTRAINT patients_id_organization_unique UNIQUE (id, organization_id);
ALTER TABLE clinical_records ADD CONSTRAINT clinical_records_id_organization_unique UNIQUE (id, organization_id), ADD CONSTRAINT clinical_records_patient_tenant_fk FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id), ADD CONSTRAINT clinical_records_site_tenant_fk FOREIGN KEY (site_id, organization_id) REFERENCES sites(id, organization_id), ADD CONSTRAINT clinical_records_author_tenant_fk FOREIGN KEY (author_membership_id, organization_id) REFERENCES memberships(id, organization_id);
ALTER TABLE clinical_documents ADD CONSTRAINT clinical_documents_id_organization_unique UNIQUE (id, organization_id), ADD CONSTRAINT clinical_documents_patient_tenant_fk FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id), ADD CONSTRAINT clinical_documents_site_tenant_fk FOREIGN KEY (site_id, organization_id) REFERENCES sites(id, organization_id), ADD CONSTRAINT clinical_documents_uploader_tenant_fk FOREIGN KEY (uploader_membership_id, organization_id) REFERENCES memberships(id, organization_id);
ALTER TABLE odontogram_events ADD CONSTRAINT odontogram_events_id_organization_unique UNIQUE (id, organization_id), ADD CONSTRAINT odontogram_events_patient_tenant_fk FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id), ADD CONSTRAINT odontogram_events_site_tenant_fk FOREIGN KEY (site_id, organization_id) REFERENCES sites(id, organization_id), ADD CONSTRAINT odontogram_events_actor_tenant_fk FOREIGN KEY (actor_membership_id, organization_id) REFERENCES memberships(id, organization_id);
ALTER TABLE fee_schedules ADD CONSTRAINT fee_schedules_id_organization_unique UNIQUE (id, organization_id);
ALTER TABLE estimates ADD CONSTRAINT estimates_id_organization_unique UNIQUE (id, organization_id), ADD CONSTRAINT estimates_patient_tenant_fk FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id), ADD CONSTRAINT estimates_author_tenant_fk FOREIGN KEY (author_membership_id, organization_id) REFERENCES memberships(id, organization_id);
ALTER TABLE estimate_versions ADD CONSTRAINT estimate_versions_id_organization_unique UNIQUE (id, organization_id), ADD CONSTRAINT estimate_versions_estimate_tenant_fk FOREIGN KEY (estimate_id, organization_id) REFERENCES estimates(id, organization_id);
ALTER TABLE estimate_items ADD CONSTRAINT estimate_items_version_tenant_fk FOREIGN KEY (estimate_version_id, organization_id) REFERENCES estimate_versions(id, organization_id), ADD CONSTRAINT estimate_items_tariff_tenant_fk FOREIGN KEY (fee_schedule_id, organization_id) REFERENCES fee_schedules(id, organization_id);
ALTER TABLE estimate_links ADD CONSTRAINT estimate_links_version_tenant_fk FOREIGN KEY (estimate_version_id, organization_id) REFERENCES estimate_versions(id, organization_id), ADD CONSTRAINT estimate_links_actor_tenant_fk FOREIGN KEY (created_by_membership_id, organization_id) REFERENCES memberships(id, organization_id);
ALTER TABLE billing_movements ADD CONSTRAINT billing_movements_id_organization_unique UNIQUE (id, organization_id), ADD CONSTRAINT billing_patient_tenant_fk FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id), ADD CONSTRAINT billing_site_tenant_fk FOREIGN KEY (site_id, organization_id) REFERENCES sites(id, organization_id), ADD CONSTRAINT billing_professional_tenant_fk FOREIGN KEY (professional_membership_id, organization_id) REFERENCES memberships(id, organization_id), ADD CONSTRAINT billing_actor_tenant_fk FOREIGN KEY (actor_membership_id, organization_id) REFERENCES memberships(id, organization_id), ADD CONSTRAINT billing_correction_tenant_fk FOREIGN KEY (corrects_movement_id, organization_id) REFERENCES billing_movements(id, organization_id);

CREATE TABLE estimate_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  estimate_id uuid NOT NULL, actor_membership_id uuid NOT NULL, from_state estimate_state NOT NULL, to_state estimate_state NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (estimate_id, organization_id) REFERENCES estimates(id, organization_id),
  FOREIGN KEY (actor_membership_id, organization_id) REFERENCES memberships(id, organization_id)
);
CREATE INDEX estimate_transitions_history_idx ON estimate_transitions(organization_id, estimate_id, occurred_at);
ALTER TABLE estimate_transitions ENABLE ROW LEVEL SECURITY; ALTER TABLE estimate_transitions FORCE ROW LEVEL SECURITY;
CREATE TRIGGER estimate_transitions_immutable BEFORE UPDATE OR DELETE ON estimate_transitions FOR EACH ROW EXECUTE FUNCTION app_immutable_history();

CREATE OR REPLACE FUNCTION app_tenant_matches(p_org uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT p_org = current_setting('app.organization_id', true)::uuid $$;
CREATE OR REPLACE FUNCTION app_site_allowed(p_org uuid, p_site uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT app_tenant_matches(p_org) AND (p_site IS NULL OR current_setting('app.role', true) IN ('organization_admin','independent_owner') OR p_site = ANY(string_to_array(NULLIF(current_setting('app.site_ids', true), ''), ',')::uuid[]))
$$;
CREATE OR REPLACE FUNCTION app_clinical_allowed(p_org uuid, p_site uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT app_site_allowed(p_org, p_site) AND current_setting('app.role', true) IN ('professional','independent_owner')
$$;
CREATE OR REPLACE FUNCTION app_estimate_allowed(p_org uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT app_tenant_matches(p_org) AND current_setting('app.role', true) IN ('organization_admin','professional','independent_owner')
$$;
CREATE OR REPLACE FUNCTION app_billing_allowed(p_org uuid, p_site uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT app_site_allowed(p_org, p_site) AND current_setting('app.role', true) IN ('organization_admin','independent_owner')
$$;

DROP POLICY clinical_records_tenant_scope ON clinical_records; DROP POLICY clinical_documents_tenant_scope ON clinical_documents; DROP POLICY odontogram_events_tenant_scope ON odontogram_events; DROP POLICY fee_schedules_tenant_scope ON fee_schedules; DROP POLICY estimates_tenant_scope ON estimates; DROP POLICY estimate_versions_tenant_scope ON estimate_versions; DROP POLICY estimate_items_tenant_scope ON estimate_items; DROP POLICY estimate_links_tenant_scope ON estimate_links; DROP POLICY billing_movements_tenant_scope ON billing_movements;
CREATE POLICY clinical_records_role_site_scope ON clinical_records USING (app_clinical_allowed(organization_id, site_id)) WITH CHECK (app_clinical_allowed(organization_id, site_id));
CREATE POLICY clinical_documents_role_site_scope ON clinical_documents USING (app_clinical_allowed(organization_id, site_id)) WITH CHECK (app_clinical_allowed(organization_id, site_id));
CREATE POLICY odontogram_role_site_scope ON odontogram_events USING (app_clinical_allowed(organization_id, site_id)) WITH CHECK (app_clinical_allowed(organization_id, site_id));
CREATE POLICY tariffs_role_scope ON fee_schedules USING (app_estimate_allowed(organization_id)) WITH CHECK (app_estimate_allowed(organization_id));
CREATE POLICY estimates_role_scope ON estimates USING (app_estimate_allowed(organization_id)) WITH CHECK (app_estimate_allowed(organization_id));
CREATE POLICY estimate_versions_role_scope ON estimate_versions USING (app_estimate_allowed(organization_id)) WITH CHECK (app_estimate_allowed(organization_id));
CREATE POLICY estimate_items_role_scope ON estimate_items USING (app_estimate_allowed(organization_id)) WITH CHECK (app_estimate_allowed(organization_id));
CREATE POLICY estimate_links_role_scope ON estimate_links USING (app_estimate_allowed(organization_id)) WITH CHECK (app_estimate_allowed(organization_id));
CREATE POLICY estimate_transitions_role_scope ON estimate_transitions USING (app_estimate_allowed(organization_id)) WITH CHECK (app_estimate_allowed(organization_id));
CREATE POLICY billing_role_site_scope ON billing_movements USING (app_billing_allowed(organization_id, site_id)) WITH CHECK (app_billing_allowed(organization_id, site_id));
