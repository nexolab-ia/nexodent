# Public Booking Specification

## Purpose
Offer branded, unauthenticated booking by organization and optional site while exposing only safe availability.

## Requirements

### Requirement PB-001: Branded public route
The system MUST expose an organization-configured public route such as `/r/{organization-slug}` with an optional site slug, showing organization branding and bookable slots without requiring login. A clinic site route MUST display only that site's availability; an independent organization MAY use the organization route without a site slug.

#### Scenario: Visitor views site availability
- GIVEN a published clinic organization slug and site slug
- WHEN an unauthenticated visitor opens the route
- THEN only that site's branding, service choices, and available slots are shown; patient or internal data is not exposed

#### Scenario: Independent route
- GIVEN a published independent organization without an explicit site
- WHEN a visitor opens its organization route
- THEN organization-level availability is shown without requiring a site slug

#### Scenario: Unknown or disabled route
- GIVEN an organization or site slug is unknown or public booking is disabled
- WHEN a visitor opens it
- THEN the system returns a non-disclosing not-found/disabled response

### Requirement PB-002: Safe reservation
The system MUST collect only the minimum booking fields, validate consent and contact format, and create a pending/confirmed appointment tied to the organization and selected site when present through the same atomic conflict check as internal scheduling.

#### Scenario: Successful site booking
- GIVEN a visitor selects an available site slot and valid contact details
- WHEN the visitor confirms
- THEN one organization appointment is created with that site and a confirmation reference is returned

#### Scenario: Slot taken during checkout
- GIVEN another request claims the selected organization/site slot first
- WHEN the visitor confirms
- THEN the booking is rejected and alternative availability is shown

### Requirement PB-003: Revocation and abuse limits
The system MUST support revoking public-booking access for an organization or site and MUST rate-limit repeated requests by route and client; revocation MUST invalidate outstanding public booking tokens for that scope.

#### Scenario: Revoked access
- GIVEN an organization admin revokes its organization or site public token
- WHEN an old link is used
- THEN no availability or booking is served for that scope

#### Scenario: Rate limit
- GIVEN a client exceeds the configured request threshold
- WHEN another availability request arrives
- THEN the system returns a retry-later response without disclosing data
