# Chile PWA Specification

## Purpose
Provide Chile-first formatting and an installable responsive web experience for every organization model.

## Requirements

### Requirement CL-001: Chile localization
The system MUST format monetary values as CLP with no fractional units, dates/times in `America/Santiago`, and Chilean RUT with validation and standard display formatting.

#### Scenario: Display formats
- GIVEN a charge of 125000 and a valid appointment timestamp
- WHEN a user views them in the Chile locale
- THEN the UI shows CLP formatting and the correct Santiago date/time

#### Scenario: Invalid RUT
- GIVEN a malformed or checksum-invalid RUT
- WHEN it is entered or imported
- THEN validation rejects it with an inline error

### Requirement CL-002: Responsive PWA
The system MUST provide responsive layouts for phone, tablet, and desktop, expose a valid web app manifest and service worker, and be installable in a supported browser.

#### Scenario: Installability
- GIVEN a supported browser loads the public application over HTTPS
- WHEN the user chooses install
- THEN the browser offers installation with NexoDent name, icon, and configured theme

#### Scenario: Small viewport
- GIVEN a 360px-wide viewport
- WHEN a user opens agenda or patient views
- THEN primary content remains usable without horizontal overflow

### Requirement CL-003: Safe offline boundary
The PWA MAY cache static shell assets, but MUST NOT cache or allow offline mutation of clinical, billing, or authentication data for any organization.

#### Scenario: Offline clinical access
- GIVEN the device loses connectivity
- WHEN a user opens a clinical or billing route
- THEN sensitive data is not served from an offline cache and mutations are blocked
