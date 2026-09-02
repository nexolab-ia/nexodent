CREATE TABLE notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 appointment_id uuid, channel varchar(16) NOT NULL CHECK(channel IN ('email','whatsapp')), recipient varchar(320) NOT NULL,
 consent_verified boolean NOT NULL DEFAULT false, kind varchar(32) NOT NULL, due_at timestamptz NOT NULL,
 state varchar(16) NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','processing','sent','failed','cancelled')),
 payload jsonb NOT NULL DEFAULT '{}', created_by_membership_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,organization_id), UNIQUE(organization_id,appointment_id,kind,channel,due_at),
 FOREIGN KEY(created_by_membership_id,organization_id) REFERENCES memberships(id,organization_id),
 CHECK ((payload - ARRAY['appointmentId','siteId','event','startsAt']) = '{}'::jsonb)
);
CREATE INDEX notifications_due_idx ON notifications(organization_id,state,due_at);
CREATE TABLE notification_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 notification_id uuid NOT NULL, sequence varchar(8) NOT NULL, outcome varchar(32) NOT NULL, provider_reference varchar(160), error_code varchar(80), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(notification_id,sequence), FOREIGN KEY(notification_id,organization_id) REFERENCES notifications(id,organization_id) ON DELETE CASCADE
);

CREATE TABLE operational_insights (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 site_id uuid REFERENCES sites(id) ON DELETE RESTRICT, rule_key varchar(80) NOT NULL, rule_version varchar(16) NOT NULL,
 evidence_hash varchar(64) NOT NULL, state varchar(24) NOT NULL CHECK(state IN ('ready','unavailable','approved','discarded','executed')),
 fresh boolean NOT NULL, evidence jsonb NOT NULL DEFAULT '{}', action jsonb NOT NULL DEFAULT '{}', decision_reason varchar(500),
 decided_by_membership_id uuid, decided_at timestamptz, executed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,organization_id), UNIQUE(organization_id,rule_key,rule_version,evidence_hash),
 FOREIGN KEY(site_id,organization_id) REFERENCES sites(id,organization_id), FOREIGN KEY(decided_by_membership_id,organization_id) REFERENCES memberships(id,organization_id)
);
CREATE INDEX operational_insights_feed_idx ON operational_insights(organization_id,state,created_at);
CREATE TABLE insight_exclusions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 category varchar(64) NOT NULL, input_hash varchar(64) NOT NULL, rule_version varchar(16) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,category,input_hash,rule_version)
);

CREATE TABLE migration_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 uploader_membership_id uuid NOT NULL, source_type varchar(32) NOT NULL CHECK(source_type IN ('patients','tariffs','appointments')),
 content_hash varchar(64) NOT NULL, mapping_hash varchar(64) NOT NULL, file_name varchar(255) NOT NULL, byte_size bigint NOT NULL CHECK(byte_size>0 AND byte_size<=20971520),
 row_count bigint NOT NULL CHECK(row_count BETWEEN 1 AND 100000), stage varchar(24) NOT NULL CHECK(stage IN ('validated','preview','accepted','imported','reconciled')),
 mapping jsonb NOT NULL DEFAULT '{}', validation jsonb NOT NULL DEFAULT '{}', preview_accepted_at timestamptz, imported_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,organization_id),
 UNIQUE(organization_id,content_hash,mapping_hash), FOREIGN KEY(uploader_membership_id,organization_id) REFERENCES memberships(id,organization_id)
);
CREATE TABLE migration_rows (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 batch_id uuid NOT NULL, row_number bigint NOT NULL, source_key varchar(160), normalized jsonb NOT NULL DEFAULT '{}', errors text[] NOT NULL DEFAULT '{}',
 outcome varchar(24) NOT NULL DEFAULT 'pending' CHECK(outcome IN ('pending','imported','reused','unmatched','rejected')), target_id uuid, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(batch_id,row_number), FOREIGN KEY(batch_id,organization_id) REFERENCES migration_batches(id,organization_id) ON DELETE CASCADE
);
CREATE TABLE migration_source_keys (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 source_type varchar(32) NOT NULL, source_key varchar(160) NOT NULL, target_type varchar(32) NOT NULL, target_id uuid NOT NULL, batch_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,source_type,source_key), FOREIGN KEY(batch_id,organization_id) REFERENCES migration_batches(id,organization_id)
);

DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['notifications','notification_attempts','operational_insights','insight_exclusions','migration_batches','migration_rows','migration_source_keys'] LOOP EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t); EXECUTE format('CREATE POLICY %I ON %I USING (organization_id=current_setting(''app.organization_id'',true)::uuid) WITH CHECK (organization_id=current_setting(''app.organization_id'',true)::uuid)',t||'_tenant_scope',t); END LOOP; END $$;

-- Attempts and decisions are append-only audit facts. Notification state is the controlled mutable delivery aggregate.
CREATE TRIGGER notification_attempts_immutable BEFORE UPDATE OR DELETE ON notification_attempts FOR EACH ROW EXECUTE FUNCTION app_immutable_history();
CREATE TRIGGER insight_exclusions_immutable BEFORE UPDATE OR DELETE ON insight_exclusions FOR EACH ROW EXECUTE FUNCTION app_immutable_history();

CREATE OR REPLACE FUNCTION app_public_schedule_booking_notice(p_appointment_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_org uuid; v_site uuid; v_starts timestamptz; v_recipient text; v_creator uuid; v_notice uuid; v_enabled boolean;
BEGIN
 SELECT ap.organization_id,ap.site_id,ap.starts_at,COALESCE((s.settings->>'bookingNoticesEnabled')::boolean,(o.settings->>'bookingNoticesEnabled')::boolean,false),COALESCE(s.settings->>'notificationEmail',o.settings->>'notificationEmail')
 INTO v_org,v_site,v_starts,v_enabled,v_recipient FROM appointments ap JOIN organizations o ON o.id=ap.organization_id LEFT JOIN sites s ON s.id=ap.site_id AND s.organization_id=ap.organization_id WHERE ap.id=p_appointment_id AND ap.source='public';
 IF NOT FOUND OR NOT v_enabled OR v_recipient IS NULL OR v_recipient !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RETURN NULL; END IF;
 SELECT id INTO v_creator FROM memberships WHERE organization_id=v_org AND role IN ('organization_admin','independent_owner') AND status='active' ORDER BY created_at LIMIT 1;
 IF v_creator IS NULL THEN RETURN NULL; END IF;
 INSERT INTO notifications(organization_id,appointment_id,channel,recipient,consent_verified,kind,due_at,state,payload,created_by_membership_id)
 VALUES(v_org,p_appointment_id,'email',v_recipient,true,'booking',now(),'pending',jsonb_build_object('appointmentId',p_appointment_id,'siteId',v_site,'event','booking','startsAt',v_starts),v_creator) RETURNING id INTO v_notice;
 RETURN v_notice;
END $$;
REVOKE ALL ON FUNCTION app_public_schedule_booking_notice(uuid) FROM PUBLIC;
DO $$ DECLARE r record; BEGIN FOR r IN SELECT rolname FROM pg_roles WHERE rolcanlogin AND rolname<>current_user LOOP EXECUTE format('GRANT EXECUTE ON FUNCTION app_public_schedule_booking_notice(uuid) TO %I',r.rolname); END LOOP; END $$;
