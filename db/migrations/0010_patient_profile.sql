-- 0010: perfil completo de paciente + catálogo de convenios (tenant-scoped)
CREATE TABLE convenios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name varchar(120) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE convenios ADD CONSTRAINT convenios_id_organization_unique UNIQUE (id, organization_id);
ALTER TABLE convenios ADD CONSTRAINT convenios_organization_name_key UNIQUE (organization_id, name);

ALTER TABLE convenios ENABLE ROW LEVEL SECURITY;
ALTER TABLE convenios FORCE ROW LEVEL SECURITY;
CREATE POLICY convenios_read_tenant ON convenios FOR SELECT
  USING (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY convenios_write_manage ON convenios FOR ALL
  USING (organization_id = current_setting('app.organization_id', true)::uuid
         AND current_setting('app.role', true) IN ('organization_admin','independent_owner'))
  WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid
         AND current_setting('app.role', true) IN ('organization_admin','independent_owner'));

ALTER TABLE patients ADD COLUMN sex varchar(16);
ALTER TABLE patients ADD COLUMN birth_date date;
ALTER TABLE patients ADD COLUMN phone_secondary varchar(48);
ALTER TABLE patients ADD COLUMN city varchar(120);
ALTER TABLE patients ADD COLUMN address varchar(240);
ALTER TABLE patients ADD COLUMN convenio_id uuid;
ALTER TABLE patients ADD CONSTRAINT patients_sex_valid
  CHECK (sex IS NULL OR sex IN ('female','male','other','unspecified'));
ALTER TABLE patients ADD CONSTRAINT patients_birth_date_not_future
  CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE);
ALTER TABLE patients ADD CONSTRAINT patients_convenio_tenant_fk
  FOREIGN KEY (convenio_id, organization_id) REFERENCES convenios(id, organization_id) ON DELETE RESTRICT;
COMMENT ON COLUMN patients.notes IS 'Observaciones generales de la ficha del paciente.';
