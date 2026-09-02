-- 0002_auth_bootstrap.sql
-- Bootstrap de sesión para Better Auth bajo RLS forzado.
--
-- Problema: al crear/leer una sesión, Better Auth necesita resolver la membresía
-- activa del usuario ANTES de conocer el tenant (aún no hay GUC app.organization_id).
-- Con FORCE RLS en `memberships`, esa lectura devuelve 0 filas y el login es imposible.
--
-- Solución: función SECURITY DEFINER acotada que devuelve SOLO la membresía activa
-- del user_id indicado (el mismo dato que el usuario autenticado tiene derecho a ver).
-- El rol de la aplicación recibe EXECUTE; se revoca de PUBLIC para evitar que un rol
-- sin privilegios enumere membresías de otros usuarios pasando user_ids arbitrarios.

CREATE OR REPLACE FUNCTION app_resolve_active_membership(p_user_id uuid)
RETURNS TABLE (
  membership_id uuid,
  organization_id uuid,
  role membership_role,
  expires_at timestamptz,
  site_ids uuid[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.organization_id, m.role, m.expires_at,
         COALESCE(array_agg(ms.site_id) FILTER (WHERE ms.site_id IS NOT NULL), ARRAY[]::uuid[])
  FROM memberships m
  LEFT JOIN membership_sites ms ON ms.membership_id = m.id
  WHERE m.user_id = p_user_id
    AND m.status = 'active'
    AND (m.expires_at IS NULL OR m.expires_at > now())
  GROUP BY m.id
  ORDER BY m.created_at ASC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION app_resolve_active_membership(uuid) FROM PUBLIC;

-- Otorga EXECUTE a cualquier rol con login existente (el rol de la app en producción
-- puede tener cualquier nombre, p.ej. el que genera Coolify). El owner (quien migra,
-- normalmente superuser/BYPASSRLS) ya puede ejecutarla.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT rolname FROM pg_roles WHERE rolcanlogin AND rolname <> current_user LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION app_resolve_active_membership(uuid) TO %I', r.rolname);
  END LOOP;
END $$;
