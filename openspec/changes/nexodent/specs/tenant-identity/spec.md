# Tenant Identity Specification

## Purpose
Define organization tenancy, clinic/independent models, least-privilege roles, site scope, and auditability.

## Requirements

### Requirement TI-001: Isolated organization tenancy
The system MUST attach every organization, site, member, and business record to one `organization_id` and enforce row-level security policies keyed by `organization_id` for every authenticated operation. An organization has `id`, `type` (`clinic` or `independent`), name, data, and settings; applicable records use `site_id`.

#### Scenario: Member accesses own organization
- GIVEN a member belongs to organization A
- WHEN it requests an A record
- THEN only that record is returned

#### Scenario: Cross-organization access denied
- GIVEN a member is in A and a record is in B
- WHEN it requests, edits, or guesses the identifier
- THEN the organization_id row-level security policy denies access without revealing existence

### Requirement TI-002: Restrictive role matrix
The system MUST enforce this matrix: **organization admin** manages organization, sites, memberships, operations, billing, and audit; **professional** manages assigned patients' clinical records, odontograms, estimates, and own appointments in assigned sites; **assistant** manages demographics, scheduling, and communication but MUST NOT access evolutions, odontograms, or billing movements. Access is organization-limited.

#### Scenario: Assistant restriction
- GIVEN an assistant requests an evolution or billing movement
- WHEN authorization runs
- THEN access is denied and audited

### Requirement TI-003: Membership authentication
The system MUST allow login only for an active member with valid credentials and establish organization, role, and assigned sites in the session.

#### Scenario: Valid login
- GIVEN an active member submits valid credentials
- WHEN authentication succeeds
- THEN the session contains member, organization, role, sites, and expiration

#### Scenario: Inactive member login
- GIVEN a member is suspended or removed
- WHEN it submits valid credentials
- THEN login is denied

### Requirement TI-004: Audited authorization changes
The system MUST require organization-admin authorization for role, site, or membership changes and append an audit event with actor, target, old/new values, time, and reason.

#### Scenario: Role change
- GIVEN an admin changes a professional to assistant
- WHEN saved
- THEN later requests use assistant permissions and the change is audited

### Requirement TI-005: Retention and deletion safeguards
The system MUST support organization-configured retention and legal hold for clinical and audit records. Destructive deletion MUST be disabled by default and require an authorized organization-admin request with reason and no active hold.

#### Scenario: Default deletion safeguard
- GIVEN no approved policy exists or a record has legal hold
- WHEN any member requests deletion
- THEN deletion is denied and preserved

### Requirement TI-006: Multi-site clinic operation
A `clinic` organization MUST support one or more sites, each with its own agenda (boxes/professionals), collection/production numbers, and configuration. Professionals MAY serve multiple sites. Patients belong to the organization, while appointments and charges carry `site_id`. Reports MUST filter by site or consolidate clinic totals; admins see all sites and professionals only their own appointments in assigned sites.

#### Scenario: Site-scoped agenda
- GIVEN clinic sites A and B have separate boxes and schedules
- WHEN a professional assigned only to A requests the agenda
- THEN only A appointments and boxes are returned

#### Scenario: Multi-site activity and reporting
- GIVEN a patient visits sites A and B
- WHEN an admin requests records and a report
- THEN the patient is organization-scoped, events retain site, and totals support site or consolidation

### Requirement TI-007: Independent organization model
An `independent` organization MUST support one member combining organization-admin and clinical-professional permissions with the same v1 functionality and no required explicit site. It MAY expose zero sites or one implicit site; business records remain organization-scoped.

#### Scenario: Independent combined permissions
- GIVEN an independent professional is the sole member
- WHEN it manages scheduling, records, estimates, and billing
- THEN combined permissions allow those v1 operations

#### Scenario: Independent appointment
- GIVEN an independent organization has no explicit site
- WHEN its professional creates or receives an appointment
- THEN it is valid without site selection
