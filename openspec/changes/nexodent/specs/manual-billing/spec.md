# Manual Billing Specification

## Purpose
Track manual payments, balances, patient accounts, and collection reporting per organization and site without moving money.

## Requirements

### Requirement BILL-001: Manual movement ledger
The system MUST record organization-scoped charges, payments, credits, and corrections with amount, currency (CLP), patient, applicable site, actor, timestamp, and reason; posted movements MUST NOT be silently deleted.

#### Scenario: Register payment
- GIVEN an organization patient has an outstanding charge
- WHEN an authorized member records a valid manual payment
- THEN a ledger movement is posted and the patient balance is recalculated

#### Scenario: Invalid payment
- GIVEN an amount exceeds configured validation or has missing evidence
- WHEN posting is attempted
- THEN the movement is rejected without changing the balance

### Requirement BILL-002: Account balance
The system MUST calculate each organization patient's balance from posted movements and MUST distinguish paid, outstanding, and credit states.

#### Scenario: Partial payment
- GIVEN charges total CLP 100000 and payment is CLP 40000
- WHEN the account is viewed
- THEN it shows CLP 60000 outstanding and the payment in history

### Requirement BILL-003: Collection reporting and boundary
Authorized users MUST be able to filter collection reports by organization, site, date, and professional; v1 MUST NOT process cards, transfers, or online payments.

#### Scenario: Collection report
- GIVEN posted payments in a date range
- WHEN an authorized user requests the report
- THEN totals reconcile to the ledger filters and exportable rows

#### Scenario: Online payment attempt
- GIVEN a user selects an online payment action
- WHEN the request is submitted
- THEN the system states that online payments are unavailable and creates no transaction
