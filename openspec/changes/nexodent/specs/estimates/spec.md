# Estimates Specification

## Purpose
Manage organization-scoped tariffs and versioned patient estimates with revocable public sharing.

## Requirements

### Requirement EST-001: Tariffs and estimate totals
The system MUST maintain organization-scoped tariffs and calculate an estimate total from selected services, quantities, and discounts with a visible breakdown.

#### Scenario: Create estimate
- GIVEN valid tariff items and an organization patient
- WHEN an authorized member creates an estimate
- THEN the system stores itemized lines, total, author, and initial draft state

#### Scenario: Invalid amount
- GIVEN a negative quantity, price, or unsupported tariff
- WHEN the estimate is saved
- THEN validation fails and no total is committed

### Requirement EST-002: Immutable versioning and states
The system MUST preserve every published estimate version and MUST support draft, sent, approved, rejected, and expired states with timestamped transitions.

#### Scenario: Revise estimate
- GIVEN a sent estimate needs a changed service
- WHEN an authorized member publishes the revision
- THEN a new version is created and the prior version remains readable

### Requirement EST-003: Revocable public link
The system MUST issue a non-guessable, organization-scoped public token for a selected version, MUST allow organization-admin revocation or expiry, and MUST expose no other patient or organization data.

#### Scenario: Share and revoke
- GIVEN an estimate version is sent
- WHEN a recipient opens its link, then an organization admin revokes it
- THEN the version is shown before revocation and unavailable afterward

#### Scenario: Payment boundary
- GIVEN a recipient approves an estimate
- WHEN approval is recorded
- THEN the state changes only; no online payment is initiated in v1
