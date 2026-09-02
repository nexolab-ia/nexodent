# Notifications Specification

## Purpose
Deliver appointment communications by email and prepare WhatsApp messages without claiming automated WhatsApp delivery.

## Requirements

### Requirement NOT-001: Reminder scheduling
The system MUST schedule organization-scoped email reminders for eligible appointments and MUST record a pending, sent, failed, or cancelled state per delivery attempt.

#### Scenario: Reminder sent
- GIVEN an appointment has a valid consented email and reminder policy
- WHEN the worker reaches its due time
- THEN one email attempt is recorded and its outcome is visible

#### Scenario: Missing consent
- GIVEN a patient lacks email consent or a valid address
- WHEN a reminder becomes due
- THEN no email is sent and the reason is recorded

### Requirement NOT-002: Booking and change notices
The system MUST notify configured recipients about public bookings, reschedules, and cancellations, subject to consent and organization/site settings, and MUST avoid exposing unrelated patients.

#### Scenario: Reschedule notice
- GIVEN a consented appointment is moved at a configured site
- WHEN the change commits
- THEN the configured recipient receives a notice referencing only that appointment

### Requirement NOT-003: Assisted WhatsApp
The system MUST generate a URL-encoded `wa.me` link with an editable message and MUST NOT send WhatsApp messages automatically in v1.

#### Scenario: Prepared message
- GIVEN an authorized user opens a patient reminder action
- WHEN WhatsApp preparation is requested
- THEN a `wa.me` link with recipient and editable text is returned

#### Scenario: Automatic send blocked
- GIVEN a background worker attempts WhatsApp delivery
- WHEN the operation runs
- THEN no message is sent and the unsupported-channel outcome is logged
