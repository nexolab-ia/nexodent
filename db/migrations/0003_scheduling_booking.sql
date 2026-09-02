CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE appointment_kind AS ENUM ('appointment', 'block');

CREATE TABLE working_hours (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, site_id uuid REFERENCES sites(id) ON DELETE CASCADE, weekday varchar(3) NOT NULL CHECK (weekday IN ('mon','tue','wed','thu','fri','sat','sun')), starts_at time NOT NULL, ends_at time NOT NULL, timezone varchar(64) NOT NULL DEFAULT 'America/Santiago' CHECK (timezone = 'America/Santiago'), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (starts_at < ends_at));
CREATE TABLE professional_availability (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, professional_membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE CASCADE, site_id uuid REFERENCES sites(id) ON DELETE CASCADE, weekday varchar(3) NOT NULL CHECK (weekday IN ('mon','tue','wed','thu','fri','sat','sun')), starts_at time NOT NULL, ends_at time NOT NULL, timezone varchar(64) NOT NULL DEFAULT 'America/Santiago' CHECK (timezone = 'America/Santiago'), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (starts_at < ends_at));
CREATE TABLE boxes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, site_id uuid REFERENCES sites(id) ON DELETE CASCADE, name varchar(120) NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE NULLS NOT DISTINCT (organization_id, site_id, name));
CREATE TABLE appointments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, site_id uuid REFERENCES sites(id) ON DELETE RESTRICT, professional_membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT, box_id uuid REFERENCES boxes(id) ON DELETE RESTRICT, kind appointment_kind NOT NULL DEFAULT 'appointment', status appointment_status NOT NULL DEFAULT 'pending', patient_name varchar(160) NOT NULL, patient_contact varchar(160), starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, notes text, cancellation_reason varchar(500), source varchar(32) NOT NULL DEFAULT 'internal', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (starts_at < ends_at), CHECK ((status <> 'cancelled') OR cancellation_reason IS NOT NULL));
ALTER TABLE appointments ADD CONSTRAINT appointments_professional_no_overlap EXCLUDE USING gist (organization_id WITH =, professional_membership_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&) WHERE (status <> 'cancelled');
ALTER TABLE appointments ADD CONSTRAINT appointments_box_no_overlap EXCLUDE USING gist (organization_id WITH =, box_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&) WHERE (status <> 'cancelled' AND box_id IS NOT NULL);
CREATE TABLE appointment_history (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE, actor_membership_id uuid, action varchar(32) NOT NULL CHECK (action IN ('created','updated','rescheduled','cancelled')), before jsonb NOT NULL DEFAULT '{}', after jsonb NOT NULL DEFAULT '{}', reason varchar(500), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public_booking_tokens (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, site_id uuid REFERENCES sites(id) ON DELETE CASCADE, token_hash varchar(64) NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true, revoked_at timestamptz, rate_limit_per_minute smallint NOT NULL DEFAULT 20 CHECK (rate_limit_per_minute BETWEEN 1 AND 120), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public_booking_rate_limits (token_hash varchar(64) NOT NULL REFERENCES public_booking_tokens(token_hash) ON DELETE CASCADE, client_key varchar(128) NOT NULL, window_started_at timestamptz NOT NULL, requests smallint NOT NULL DEFAULT 1, PRIMARY KEY(token_hash, client_key, window_started_at));

CREATE INDEX working_hours_scope_idx ON working_hours(organization_id, site_id);
CREATE INDEX professional_availability_scope_idx ON professional_availability(organization_id, professional_membership_id, site_id);
CREATE INDEX boxes_scope_idx ON boxes(organization_id, site_id);
CREATE INDEX appointments_scope_time_idx ON appointments(organization_id, site_id, starts_at);
CREATE INDEX appointment_history_scope_idx ON appointment_history(organization_id, appointment_id, created_at);
CREATE INDEX public_booking_tokens_scope_idx ON public_booking_tokens(organization_id, site_id);

ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY; ALTER TABLE working_hours FORCE ROW LEVEL SECURITY;
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY; ALTER TABLE professional_availability FORCE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY; ALTER TABLE boxes FORCE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY; ALTER TABLE appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE appointment_history ENABLE ROW LEVEL SECURITY; ALTER TABLE appointment_history FORCE ROW LEVEL SECURITY;
ALTER TABLE public_booking_tokens ENABLE ROW LEVEL SECURITY; ALTER TABLE public_booking_tokens FORCE ROW LEVEL SECURITY;
CREATE POLICY working_hours_tenant_scope ON working_hours USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY professional_availability_tenant_scope ON professional_availability USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY boxes_tenant_scope ON boxes USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY appointments_tenant_scope ON appointments USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY appointment_history_tenant_scope ON appointment_history USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY public_booking_tokens_tenant_scope ON public_booking_tokens USING (organization_id = current_setting('app.organization_id', true)::uuid) WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid);

-- Public routes cannot establish a tenant GUC. These narrow SECURITY DEFINER boundaries reveal
-- only a valid route's branding/availability and atomically create its pending appointment.
CREATE OR REPLACE FUNCTION app_public_booking_context(p_token_hash varchar, p_org_slug varchar, p_site_slug varchar DEFAULT NULL)
RETURNS TABLE (organization_id uuid, organization_name varchar, organization_type organization_type, site_id uuid, site_name varchar, token_hash varchar, rate_limit_per_minute smallint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.name, o.type, s.id, s.name, p.token_hash, p.rate_limit_per_minute
  FROM public_booking_tokens p JOIN organizations o ON o.id = p.organization_id LEFT JOIN sites s ON s.id = p.site_id
  WHERE p.token_hash = p_token_hash AND p.active AND p.revoked_at IS NULL AND o.slug = p_org_slug
    AND (p_site_slug IS NULL OR s.slug = p_site_slug) LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION app_public_booking_availability(p_token_hash varchar, p_org_slug varchar, p_site_slug varchar DEFAULT NULL)
RETURNS TABLE (professional_membership_id uuid, weekday varchar, starts_at time, ends_at time, box_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pa.professional_membership_id, pa.weekday, pa.starts_at, pa.ends_at, b.id
  FROM app_public_booking_context(p_token_hash, p_org_slug, p_site_slug) c
  JOIN professional_availability pa ON pa.organization_id = c.organization_id AND pa.site_id IS NOT DISTINCT FROM c.site_id
  LEFT JOIN boxes b ON b.organization_id = pa.organization_id AND b.site_id IS NOT DISTINCT FROM pa.site_id AND b.active
  ORDER BY pa.professional_membership_id LIMIT 8;
$$;
CREATE OR REPLACE FUNCTION app_public_booking_consume_rate(p_token_hash varchar, p_client_key varchar)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_limit smallint; v_requests smallint;
BEGIN
  SELECT rate_limit_per_minute INTO v_limit FROM public_booking_tokens WHERE token_hash = p_token_hash AND active AND revoked_at IS NULL;
  IF v_limit IS NULL THEN RETURN false; END IF;
  INSERT INTO public_booking_rate_limits (token_hash, client_key, window_started_at, requests) VALUES (p_token_hash, left(p_client_key, 128), date_trunc('minute', now()), 1)
  ON CONFLICT (token_hash, client_key, window_started_at) DO UPDATE SET requests = public_booking_rate_limits.requests + 1 RETURNING requests INTO v_requests;
  RETURN v_requests <= v_limit;
END;
$$;
CREATE OR REPLACE FUNCTION app_public_reserve_appointment(p_token_hash varchar, p_org_slug varchar, p_site_slug varchar, p_professional_id uuid, p_box_id uuid, p_patient_name varchar, p_patient_contact varchar, p_starts_at timestamptz, p_ends_at timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c record; appointment_id uuid;
BEGIN
  SELECT * INTO c FROM app_public_booking_context(p_token_hash, p_org_slug, p_site_slug); IF NOT FOUND THEN RAISE EXCEPTION 'public booking unavailable'; END IF;
  IF p_starts_at >= p_ends_at OR length(trim(p_patient_name)) = 0 THEN RAISE EXCEPTION 'invalid booking'; END IF;
  IF NOT EXISTS (SELECT 1 FROM professional_availability pa WHERE pa.organization_id = c.organization_id AND pa.professional_membership_id = p_professional_id AND pa.site_id IS NOT DISTINCT FROM c.site_id AND pa.weekday = lower(to_char(p_starts_at AT TIME ZONE 'America/Santiago', 'Dy')) AND pa.starts_at <= (p_starts_at AT TIME ZONE 'America/Santiago')::time AND pa.ends_at >= (p_ends_at AT TIME ZONE 'America/Santiago')::time) THEN RAISE EXCEPTION 'outside availability'; END IF;
  INSERT INTO appointments (organization_id, site_id, professional_membership_id, box_id, patient_name, patient_contact, starts_at, ends_at, status, source) VALUES (c.organization_id, c.site_id, p_professional_id, p_box_id, trim(p_patient_name), trim(p_patient_contact), p_starts_at, p_ends_at, 'pending', 'public') RETURNING id INTO appointment_id;
  INSERT INTO appointment_history (organization_id, appointment_id, action, after) VALUES (c.organization_id, appointment_id, 'created', jsonb_build_object('source', 'public'));
  RETURN appointment_id;
END;
$$;
REVOKE ALL ON FUNCTION app_public_booking_context(varchar, varchar, varchar) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_public_booking_availability(varchar, varchar, varchar) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_public_booking_consume_rate(varchar, varchar) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_public_reserve_appointment(varchar, varchar, varchar, uuid, uuid, varchar, varchar, timestamptz, timestamptz) FROM PUBLIC;
DO $$ DECLARE r record; BEGIN FOR r IN SELECT rolname FROM pg_roles WHERE rolcanlogin AND rolname <> current_user LOOP EXECUTE format('GRANT EXECUTE ON FUNCTION app_public_booking_context(varchar, varchar, varchar), app_public_booking_availability(varchar, varchar, varchar), app_public_booking_consume_rate(varchar, varchar), app_public_reserve_appointment(varchar, varchar, varchar, uuid, uuid, varchar, varchar, timestamptz, timestamptz) TO %I', r.rolname); END LOOP; END $$;
