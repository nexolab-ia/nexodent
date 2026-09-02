# Operational Insights Specification

## Purpose
Provide explainable, human-approved operational notices from organization and optional site data without clinical automation.

## Requirements

### Requirement OI-001: Evidence-backed notices
The system MUST generate deterministic notices only from organization-scoped operational data, MUST show the triggering evidence, time window, and freshness, and MUST label uncertainty or stale data. Notices MAY be evaluated per site or across the organization.

#### Scenario: Empty site agenda notice
- GIVEN configured future slots are empty at site A during a measured window
- WHEN the notice job evaluates the organization
- THEN it presents the site slots, calculation window, and source records as evidence

#### Scenario: Stale source data
- GIVEN required source data is stale or unavailable
- WHEN evaluation runs
- THEN no unsupported conclusion is shown and the notice is marked unavailable

### Requirement OI-002: Human approval gate
The system MUST require an authorized human to approve or discard each notice before any supported operational action, MUST prevent duplicate execution, and MUST record the decision.

#### Scenario: Approve notice
- GIVEN a professional or organization admin reviews a notice with evidence
- WHEN the user approves it
- THEN the single associated operational action is executed once and the decision is auditable

#### Scenario: Discard notice
- GIVEN a user rejects a notice
- WHEN discard is confirmed
- THEN no action executes and the discard reason is stored

### Requirement OI-003: Clinical safety boundary
Operational insights MUST NOT diagnose, recommend treatment, infer clinical conditions, or act without approval; patient data shown MUST follow tenant-identity organization and assigned-site permissions.

#### Scenario: Clinical request excluded
- GIVEN an input would require diagnosing or proposing treatment
- WHEN the insight evaluator runs
- THEN it returns no clinical insight and records the excluded category
