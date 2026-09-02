# Scheduling Specification

## Purpose
Manage organization appointments by professional and site box without conflicts.

## Requirements

### Requirement SCH-001: Working-hour scheduling
The system MUST represent organization/site working hours, professional availability, box availability, appointment status, and timezone-aware start/end times. For an `independent` organization, an explicit site MAY be omitted and the organization context supplies the schedule.

#### Scenario: Valid site appointment
- GIVEN a professional and box are available at site A during configured hours
- WHEN an authorized member creates an appointment
- THEN the appointment stores organization, site, patient, professional, box, status, and Chile-local time

#### Scenario: Independent appointment
- GIVEN an independent professional is available and no explicit site exists
- WHEN the professional creates an appointment
- THEN it is stored in organization scope without requiring a site selection

#### Scenario: Outside hours
- GIVEN the requested interval is outside the selected organization/site availability
- WHEN creation is attempted
- THEN the system rejects it and returns a validation error

### Requirement SCH-002: Atomic no-double-booking
The system MUST reject any appointment that overlaps another active appointment for the same professional in the organization or the same box at the site, atomically under concurrent requests.

#### Scenario: Concurrent conflict
- GIVEN two requests target the same professional interval
- WHEN both are submitted concurrently
- THEN exactly one succeeds and the other receives a conflict error

### Requirement SCH-003: Appointment lifecycle
Authorized members MUST be able to edit, move, and cancel appointments; cancellation MUST preserve history and require a reason, while rescheduling MUST recheck conflicts and organization/site hours.

#### Scenario: Reschedule
- GIVEN an existing site appointment and a free destination interval
- WHEN an authorized member moves it
- THEN the new interval is saved and the prior interval is recorded in history

#### Scenario: Cancel
- GIVEN an existing appointment
- WHEN an authorized member cancels it with a reason
- THEN it becomes cancelled, remains auditable, and no longer blocks availability
