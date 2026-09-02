# CSV Migration Specification

## Purpose
Import organization-scoped patients, tariffs, and future appointments through a reviewable, idempotent pipeline.

## Requirements

### Requirement MIG-001: Staged import pipeline
The system MUST process an authorized CSV through upload, mapping, validation, preview, import, and reconciliation stages, and MUST keep each batch organization-scoped. Future appointments MUST carry their selected site when the organization has sites.

#### Scenario: Valid CSV
- GIVEN a supported UTF-8 CSV contains mapped patients, tariffs, or future appointments
- WHEN validation and preview are accepted
- THEN import creates the selected organization records and reconciliation reports counts and rejected rows

#### Scenario: Validation errors
- GIVEN required columns are missing or rows contain invalid values
- WHEN validation runs
- THEN preview lists row-level errors and import does not start

### Requirement MIG-002: Restrictive upload and provenance
The system MUST accept only CSV files up to 20 MB or 100000 rows, MUST compute a content hash, and MUST record uploader, mapping, source type, and validation result.

#### Scenario: Unsupported upload
- GIVEN a non-CSV, oversized, or over-row-limit file
- WHEN upload is attempted
- THEN it is rejected before parsing and no batch is created

### Requirement MIG-003: Idempotent import
The system MUST use batch hash plus organization and stable source keys to prevent duplicate records; reimporting an identical accepted batch MUST produce zero duplicates and a reconciliation outcome.

#### Scenario: Reimport
- GIVEN an accepted batch has already been imported
- WHEN the same file and mapping are submitted again
- THEN the system reports it as already applied without duplicating records

#### Scenario: Partial reconciliation
- GIVEN some rows cannot be matched to stable keys
- WHEN import completes
- THEN unmatched rows remain in an exception report for human resolution
