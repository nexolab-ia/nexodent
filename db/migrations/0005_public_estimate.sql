-- Narrow public boundary: returns only a currently valid, non-revoked estimate link.
CREATE OR REPLACE FUNCTION app_public_estimate_by_token(p_token_hash varchar)
RETURNS TABLE (total_clp bigint, state estimate_state, items jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.total_clp, v.state,
    COALESCE(jsonb_agg(jsonb_build_object('code',i.code,'description',i.description,'quantity',i.quantity,'lineTotalClp',i.line_total_clp) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]'::jsonb)
  FROM estimate_links l
  JOIN estimate_versions v ON v.id=l.estimate_version_id AND v.organization_id=l.organization_id
  JOIN estimates e ON e.id=v.estimate_id AND e.organization_id=v.organization_id AND e.current_version=v.version
  LEFT JOIN estimate_items i ON i.estimate_version_id=v.id AND i.organization_id=v.organization_id
  WHERE l.token_hash=p_token_hash AND l.revoked_at IS NULL AND (l.expires_at IS NULL OR l.expires_at>now())
  GROUP BY v.id,v.total_clp,v.state LIMIT 1;
$$;
REVOKE ALL ON FUNCTION app_public_estimate_by_token(varchar) FROM PUBLIC;
DO $$ DECLARE r record; BEGIN FOR r IN SELECT rolname FROM pg_roles WHERE rolcanlogin AND rolname <> current_user LOOP EXECUTE format('GRANT EXECUTE ON FUNCTION app_public_estimate_by_token(varchar) TO %I',r.rolname); END LOOP; END $$;

-- Versions remain immutable except for synchronizing the public lifecycle state of the current snapshot.
CREATE OR REPLACE FUNCTION app_estimate_version_state_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (to_jsonb(NEW) - 'state') = (to_jsonb(OLD) - 'state') THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'immutable clinical and financial history';
END;
$$;
DROP TRIGGER estimate_versions_immutable ON estimate_versions;
CREATE TRIGGER estimate_versions_state_only BEFORE UPDATE OR DELETE ON estimate_versions FOR EACH ROW EXECUTE FUNCTION app_estimate_version_state_only();
