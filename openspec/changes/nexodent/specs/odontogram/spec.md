# Odontogram Specification

## Purpose
Record versioned organization-scoped SVG tooth/surface states with an auditable event history.

## Requirements

### Requirement OD-001: Structured tooth state
The system MUST represent permanent dentition by tooth and supported surface, validate allowed state values, and preserve the visual SVG representation separately from clinical state data for an organization patient.

#### Scenario: Register tooth status
- GIVEN a professional selects a valid tooth and surface for an authorized organization patient
- WHEN a status is saved
- THEN the structured state and corresponding SVG version are stored

#### Scenario: Invalid target
- GIVEN a request names an unsupported tooth or state
- WHEN it is submitted
- THEN the system rejects it without changing the odontogram

### Requirement OD-002: Version history
The system MUST create an immutable version for each accepted change containing actor, time, prior state, new state, and reason; users MUST be able to view prior versions in order.

#### Scenario: View history
- GIVEN three accepted changes exist
- WHEN an authorized user opens history
- THEN all three versions appear chronologically with their actors and reasons

#### Scenario: Audited correction
- GIVEN a professional corrects a previous status
- WHEN the correction is saved
- THEN the prior version remains unchanged and the correction is appended

### Requirement OD-003: Clinical safety boundary
The odontogram MUST NOT generate a diagnosis, treatment recommendation, or automated clinical action; access MUST follow tenant-identity organization and role permissions, including assigned-site scope where applicable.

#### Scenario: No diagnostic automation
- GIVEN a tooth status is recorded
- WHEN the system processes the event
- THEN it stores and displays the status only, with no diagnostic suggestion
