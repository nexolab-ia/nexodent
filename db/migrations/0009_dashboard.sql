-- Dashboard appointment-to-patient linkage and attendance state.
ALTER TABLE appointments
  ADD COLUMN patient_id uuid,
  ADD COLUMN attendance varchar(16),
  ADD CONSTRAINT appointments_patient_tenant_fk
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT appointments_attendance_valid
    CHECK ((kind <> 'appointment') OR attendance IS NULL OR attendance IN ('attended', 'missed')),
  ADD CONSTRAINT appointments_cancelled_attendance_empty
    CHECK ((status <> 'cancelled') OR attendance IS NULL);

ALTER TABLE appointment_history
  DROP CONSTRAINT appointment_history_action_check,
  ADD CONSTRAINT appointment_history_action_check
    CHECK (action IN ('created','updated','rescheduled','cancelled','status.confirmed','attendance.marked'));

-- Clinic administrators need read access for pending-evolution reporting. App-layer
-- authorization continues to prevent them from writing clinical records.
CREATE OR REPLACE FUNCTION app_clinical_allowed(p_org uuid, p_site uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT app_site_allowed(p_org, p_site) AND current_setting('app.role', true) IN ('organization_admin','professional','independent_owner')
$$;
