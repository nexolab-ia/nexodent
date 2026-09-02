# Apply progress: NexoDent PR3/5

## State

- Mode: Standard (`strict_tdd: false`).
- Delivery: user-authorized chained work-unit slice PR3 (E-F); no branch, commit, or pull request was created.
- Completed cumulatively: A1-D4, E1-E4, F1-F4.
- Stopped before: Phase G and every later phase.

## Completed tasks

- [x] A1-A4 — Application foundation, schema primitives, deploy shell, and foundation tests.
- [x] B1-B4 — Tenant identity, authentication, restrictive authorization, and forced-RLS proof.
- [x] C1-C3 — Deterministic fictional demo evidence and tests.
- [x] D1-D4 — Scheduling/public booking, constraints, UI, and tests.
- [x] E1 — Patient records, consent/duplicate safeguards, MIME/size validation, and scan-quarantine cleanup.
- [x] E2 — Structured permanent-dentition state, SVG projection, append-only odontogram events, and no clinical automation path.
- [x] E3 — Patient record tabs and keyboard-accessible odontogram control.
- [x] E4 — Clinical unit, embedded-Postgres RLS, and route-smoke coverage.
- [x] F1 — CLP tariff/estimate totals, immutable versions/states, and hashed revocable links.
- [x] F2 — Append-only CLP manual billing ledger, balances, audit events, and online-payment boundary.
- [x] F3 — Basic Spanish estimate, billing, and public-estimate route surfaces with empty states.
- [x] F4 — Finance unit, embedded-Postgres RLS, and route-smoke coverage.

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused unit tests | `npm run test:unit -- tests/unit/clinical-odontogram.test.ts tests/unit/finance.test.ts` — passed; 26 tests across the full unit suite invoked by the script. |
| Focused integration tests | `npm run test:integration -- tests/integration/rls-clinical.test.ts tests/integration/rls-finance.test.ts` — passed; embedded PostgreSQL proved clinical and finance cross-tenant denial. |
| Runtime harness | `npm run test:smoke -- tests/smoke/clinical.spec.ts tests/smoke/finance.spec.ts` — passed; route/module shells were structurally exercised. Docker/Postgres service startup is N/A: the mandated embedded-Postgres harness covers DB boundaries and no Docker daemon is available. |
| Full regression | `npm run test:unit` 26 passed; `npm run test:integration` 10 passed; `npm run test:smoke` 6 passed. |
| Quality | `npm run lint` passed; `npx tsc --noEmit` passed; `npm run build` completed with successful compilation and generated `.next/BUILD_ID`. |
| Rollback boundary | Revert only `db/migrations/0004_clinical_finance.sql`, the E/F schemas, feature modules, patient/finance routes, odontogram component, E/F tests, this PR3 report, and the E/F task/progress entries. |

## Gatekeeper corrective pass

- Added composite `(id, organization_id)` foreign keys throughout the PR3 clinical/finance graph in `0004_clinical_finance.sql`, with matching Drizzle relationships where applicable.
- Replaced organization-only RLS for site-bound clinical, odontogram, and billing records with role and assigned-site policies.
- Made odontogram appends transactionally serialized per patient, producing the SVG snapshot from the immutable event history.
- Bound estimate lines to active tenant tariffs, snapshot historical prices, added immutable revisions/transitions, and implemented hashed public token lookup with expiry/revocation.
- Added collection filtering/export and manual payment evidence/upper-bound validation.
- Wired clinical/odontogram/finance forms to server actions that resolve the authenticated tenant before mutating.
- Expanded integration evidence to cover actual role/site scope, cross-tenant writes, immutable rows, public revocation, and collection filtering.

## Deviations / issues

- No remaining deviations from the E/F design are known. The existing Vitest config-loader future warning and Next middleware deprecation warning remain non-blocking.

## Remaining tasks

All Phase G, H, I, J, Trace-1, and Trace-2 checkboxes remain pending and were not implemented or changed by PR3.
