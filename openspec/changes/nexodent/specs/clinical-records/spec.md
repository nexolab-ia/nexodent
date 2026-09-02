# Clinical Records Specification

## Purpose
Maintain organization-scoped patient identity, clinical evolutions, restricted attachments, and history.

## Requirements

### Requirement CR-001: Patient record
The system MUST maintain one organization-scoped patient record with identity/contact data, consent state, and chronological evolution history; patients MUST NOT be owned by a site. Duplicate identity warnings MUST be shown before creating a likely duplicate.

#### Scenario: Create and edit patient
- GIVEN an authorized professional has a new patient at an assigned site
- WHEN the professional saves valid demographics and an evolution
- THEN the patient and dated evolution are stored in organization scope

#### Scenario: Likely duplicate
- GIVEN matching RUT or contact data exists in the organization
- WHEN a new record is submitted
- THEN the system warns and requires an explicit authorized decision before creating another record

### Requirement CR-002: Restrictive attachments
The system MUST accept only PDF, PNG, or JPEG attachments no larger than 10 MB each and 50 MB per patient, MUST reject other types or excess quota, and MUST show upload status. An attachment MAY retain the site of the clinical activity where applicable.

#### Scenario: Valid attachment
- GIVEN a professional uploads a 4 MB PDF to an authorized organization patient
- WHEN validation and security scanning succeed
- THEN the file is linked to the record with uploader, applicable site, and timestamp

#### Scenario: Invalid attachment
- GIVEN an upload exceeds size or uses an unsupported type
- WHEN it is submitted
- THEN it is rejected and no partial file remains

### Requirement CR-003: Clinical authorization and audit
The system MUST restrict evolutions and attachments to permitted organization members, MUST enforce assigned-site scope for site-bound operations, MUST deny cross-organization access, and MUST audit create, edit, download, and deletion events.

#### Scenario: Unauthorized role
- GIVEN an assistant requests an evolution download
- WHEN authorization runs
- THEN access is denied and the attempt is audited
