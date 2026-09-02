-- 0008_onboarding_org.sql
-- Bootstrap transaccional del primer tenant para un usuario autenticado.
-- SECURITY DEFINER permite crear el tenant antes de que exista app.organization_id.

CREATE OR REPLACE FUNCTION app_create_onboarding(
  p_user_id uuid,
  p_org_type organization_type,
  p_org_name varchar(160),
  p_country text,
  p_city text,
  p_address text,
  p_primary_phone text,
  p_secondary_phone text,
  p_contact_email text
)
RETURNS TABLE (
  organization_id uuid,
  site_id uuid,
  membership_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_slug text;
  v_org_slug text;
  v_site_slug text;
  v_suffix integer := 1;
  v_role membership_role;
  v_contact jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  -- Evita que dos envíos simultáneos del mismo usuario superen juntos la
  -- comprobación de membresía activa.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  IF EXISTS (
    SELECT 1
    FROM memberships
    WHERE user_id = p_user_id
      AND status = 'active'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'already onboarded';
  END IF;

  IF p_org_type = 'independent' THEN
    v_role := 'independent_owner';
  ELSIF p_org_type = 'clinic' THEN
    v_role := 'organization_admin';
  ELSE
    RAISE EXCEPTION 'invalid organization type';
  END IF;

  v_base_slug := lower(trim(p_org_name));
  v_base_slug := translate(
    v_base_slug,
    'áàäâãéèëêíìïîóòöôõúùüûñç',
    'aaaaaeeeeiiiiooooouuuunc'
  );
  v_base_slug := regexp_replace(v_base_slug, '[^a-z0-9]+', '-', 'g');
  v_base_slug := trim(both '-' FROM v_base_slug);
  IF v_base_slug = '' THEN
    v_base_slug := 'espacio';
  END IF;
  v_base_slug := left(v_base_slug, 120);

  -- Serializa nombres equivalentes para que dos altas concurrentes no elijan
  -- el mismo slug antes del INSERT protegido por UNIQUE.
  PERFORM pg_advisory_xact_lock(hashtext(v_base_slug));
  v_org_slug := v_base_slug;
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_org_slug) LOOP
    v_suffix := v_suffix + 1;
    v_org_slug := left(v_base_slug, 120 - length('-' || v_suffix::text)) || '-' || v_suffix;
  END LOOP;

  v_contact := jsonb_build_object(
    'contact', jsonb_strip_nulls(jsonb_build_object(
      'country', trim(p_country),
      'city', trim(p_city),
      'address', trim(p_address),
      'primaryPhone', trim(p_primary_phone),
      'secondaryPhone', nullif(trim(p_secondary_phone), ''),
      'contactEmail', lower(trim(p_contact_email))
    ))
  );

  INSERT INTO organizations (type, slug, name, settings)
  VALUES (p_org_type, v_org_slug, trim(p_org_name), v_contact)
  RETURNING id INTO organization_id;

  v_site_slug := left(v_org_slug, 115) || '-sede';
  INSERT INTO sites (organization_id, slug, name, timezone, settings)
  VALUES (organization_id, v_site_slug, trim(p_org_name), 'America/Santiago', '{}'::jsonb)
  RETURNING id INTO site_id;

  INSERT INTO memberships (organization_id, user_id, role, status)
  VALUES (organization_id, p_user_id, v_role, 'active')
  RETURNING id INTO membership_id;

  INSERT INTO membership_sites (membership_id, organization_id, site_id)
  VALUES (membership_id, organization_id, site_id);

  INSERT INTO audit_logs (
    organization_id,
    actor_membership_id,
    action,
    entity,
    entity_id,
    before,
    after,
    reason
  ) VALUES (
    organization_id,
    membership_id,
    'organization.created',
    'organization',
    organization_id,
    '{}'::jsonb,
    v_contact || jsonb_build_object('role', v_role),
    'onboarding'
  );

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION app_create_onboarding(uuid, organization_type, varchar, text, text, text, text, text, text) FROM PUBLIC;

-- Mismo patrón de grants que 0002_auth_bootstrap.sql: el owner migrador ya
-- puede ejecutar la función y cada rol de login recibe solo EXECUTE.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT rolname FROM pg_roles WHERE rolcanlogin AND rolname <> current_user LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION app_create_onboarding(uuid, organization_type, varchar, text, text, text, text, text, text) TO %I', r.rolname);
  END LOOP;
END $$;
