# Tasks: NexoDent v1 pilot

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 2,500-3,500 (application, migrations, tests, UI, deploy) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 A-B; PR2 C-D; PR3 E-F; PR4 G-H; PR5 I-J |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

Every task below has `ID/title/action`, edit paths, requirement IDs, dependencies, acceptance evidence, and S/M/L estimate. `S01-S64` are the scenario IDs in the 11 spec files.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| PR1 | Foundation, schema, tenancy, auth and RLS | PR1 | `npm run test:unit -- tests/unit/foundation.test.ts tests/unit/tenant.test.ts && npm run test:integration -- tests/integration/rls-foundation.test.ts tests/integration/rls-tenant.test.ts` | `docker compose up -d db web && curl --max-time 25 -fsS http://localhost:3000/api/health/ready` | Revert `app/`, `db/`, `lib/`, `features/tenant-identity/`, `middleware.ts`, and foundation tests only |
| PR2 | Demo seed, agenda and public booking | PR2 | `npm run test:unit -- tests/unit/seed.test.ts tests/unit/scheduling.test.ts && npm run test:integration -- tests/integration/rls-scheduling-booking.test.ts` | `npm run seed && npm run test:smoke -- tests/smoke/demo.spec.ts tests/smoke/scheduling-booking.spec.ts` | Revert `db/seed.ts`, `db/fixtures/demo.ts`, `features/scheduling/`, `features/public-booking/`, and D-route files |
| PR3 | Clinical record, odontogram, estimates and billing | PR3 | `npm run test:unit -- tests/unit/clinical-odontogram.test.ts tests/unit/finance.test.ts && npm run test:integration -- tests/integration/rls-clinical.test.ts tests/integration/rls-finance.test.ts` | `npm run test:smoke -- tests/smoke/clinical.spec.ts tests/smoke/finance.spec.ts` | Revert `features/clinical-records/`, `features/odontogram/`, `features/estimates/`, `features/manual-billing/`, and E/F routes |
| PR4 | Notifications, insights and CSV migration | PR4 | `npm run test:unit -- tests/unit/ops.test.ts tests/unit/migration.test.ts && npm run test:integration -- tests/integration/rls-ops.test.ts tests/integration/rls-migration.test.ts` | `npm run test:smoke -- tests/smoke/ops.spec.ts tests/smoke/migration.spec.ts` | Revert `workers/`, notification/insight/migration features, schemas and G/H routes |
| PR5 | PWA, security hardening and Coolify release | PR5 | `npm run test:unit -- tests/unit/pwa-locale.test.ts tests/unit/jobs-security.test.ts && npm run test:integration -- tests/integration/rls-pwa.test.ts` | `docker compose up -d && curl --max-time 25 -fsS http://localhost:3000/api/health/ready && npm run test:smoke -- tests/smoke/pwa.spec.ts` | Revert `app/globals.css`, PWA assets, `lib/offline.ts`, `Dockerfile`, compose/deploy docs and J-only tests |

## Phase A — Foundation and deployable shell

- [x] **A1 — Scaffold app**: Create Next.js 16 App Router/React 19/TypeScript project, Tailwind 4, Shadcn, Drizzle, scripts and strict env parsing in `app/`, `components/ui/`, `db/`, `lib/env.ts`, `package.json`; Req: all; Deps: none; Accept: `npm run build` succeeds with missing secrets reported safely; **L**.
- [x] **A2 — Schema/migration base**: Add UUID, timestamps, CLP bigint, extensions and migration runner in `db/schema/index.ts`, `db/schema/core.ts`, `db/migrations/`; Req: TI-001, TI-006, TI-007; Deps: A1; Accept: clean Postgres migrate/rollback and schema snapshot; **L**.
- [x] **A3 — Container/process setup**: Add non-root multi-stage `Dockerfile`, `docker-compose.yml`, worker entrypoint and `health/` handlers (`/`, `/api/health/ready`); Req: CL-002; Deps: A1-A2; Accept: web and worker start independently; readiness fails closed when DB is unavailable; **M**.
- [x] **A4 — Foundation tests**: Add unit tests for env/schema validators, RLS migration integration harness, and route smoke for `/` and `/api/health/ready` in `tests/unit/foundation.test.ts`, `tests/integration/rls-foundation.test.ts`, `tests/smoke/foundation.spec.ts`; Req: TI-001, CL-002; Deps: A1-A3; Accept: tests assert isolation and health status; **M**.

## Phase B — Tenancy, auth, RLS and audit

- [x] **B1 — Tenant tables/context**: Implement organizations, sites, users, memberships, membership_sites, audit_logs and `withTenantContext()` in `db/schema/tenant.ts`, `lib/tenancy.ts`; Req: TI-001, TI-006, TI-007; Deps: A2; Accept: clinic and independent fixtures create valid site/no-site records; **L**.
- [x] **B2 — Auth/session**: Configure Better Auth and active-membership session claims in `lib/auth.ts`, `app/api/auth/[...all]/route.ts`, `middleware.ts`; Req: TI-003, TI-007; Deps: B1; Accept: S57 succeeds and S58 denies with expiry/site claims; **M**.
- [x] **B3 — Least-privilege authorization**: Add capability matrix and audited role/site/membership changes in `features/tenant-identity/authorize.ts`, `features/tenant-identity/actions.ts`; Req: TI-002, TI-004, TI-005; Deps: B1-B2; Accept: S56/S59/S60 deny or mutate only as specified and emit audit rows; **L**.
- [x] **B4 — RLS/policy tests**: Add forced RLS policies and composite FKs/uniques in `db/migrations/*rls.sql`; unit matrix tests, cross-tenant RLS integration tests, and route smokes for `/login`, `/settings/members`, `/settings/sites` in `tests/unit/tenant.test.ts`, `tests/integration/rls-tenant.test.ts`, `tests/smoke/tenant.spec.ts`; Req: TI-001..TI-007; Deps: B1-B3; Accept: S54,S55,S61-S64 all pass with no existence leak; **L**.

## Phase C — Deterministic demo data

- [x] **C1 — Seed fixtures**: Create repeatable fictional Clínica Sonrisa Andes (Providencia/Ñuñoa, 3 professionals, assistant, ~20 patients) and Dra. Valentina Rojas independent seed in `db/seed.ts`, `db/fixtures/demo.ts`; Req: TI-006, TI-007; Deps: B1; Accept: two runs are idempotent and all demo identifiers/RUTs are marked fictional; **M**.
- [x] **C2 — Evidence-rich seed**: Seed past/future appointments, odontogram versions, estimates, charges/payments and notice source data in `db/fixtures/demo.ts`; Req: OD-002, EST-002, BILL-002, OI-001; Deps: C1; Accept: fixture query demonstrates all three operational rule inputs and no booking conflicts; **M**.
- [x] **C3 — Seed tests**: Add unit determinism tests, tenant RLS integration seed test, and `/demo` route smoke in `tests/unit/seed.test.ts`, `tests/integration/rls-seed.test.ts`, `tests/smoke/demo.spec.ts`; Req: TI-001, TI-006, TI-007; Deps: C1-C2; Accept: counts and fictional-data marker are asserted; **S**.

## Phase D — Scheduling and public booking

- [x] **D1 — Scheduling domain**: Implement working hours, availability, boxes, appointments/events, Chile timezone validation and exclusion constraints in `db/schema/scheduling.ts`, `features/scheduling/`; Req: SCH-001..SCH-003; Deps: B1; Accept: S48-S53 behavior is represented, cancellation requires reason and history is immutable; **L**.
- [x] **D2 — Internal agenda UI/actions**: Add calendar/day/week, drag/drop reschedule, create/edit/cancel actions in `app/(app)/agenda/`, `features/scheduling/actions.ts`; Req: SCH-001, SCH-003, TI-006, TI-007; Deps: D1; Accept: assigned-site and independent flows work; out-of-hours validation is inline; **L**.
- [x] **D3 — Public booking**: Add scoped opaque tokens, branded route `/r/[orgSlug]`, optional `?site=`, safe availability, atomic booking, revocation and rate limiting in `app/r/[orgSlug]/`, `app/api/public/booking/route.ts`, `features/public-booking/`; Req: PB-001..PB-003; Deps: D1; Accept: S41-S47 pass; unknown/revoked/rate-limited responses disclose no data; **L**.
- [x] **D4 — Scheduling tests**: Add overlap/slot unit tests, concurrent and cross-tenant RLS integration tests, smokes for `/agenda` and `/r/demo-clinic` in `tests/unit/scheduling.test.ts`, `tests/integration/rls-scheduling-booking.test.ts`, `tests/smoke/scheduling-booking.spec.ts`; Req: SCH-001..003, PB-001..003; Deps: D1-D3; Accept: concurrent requests yield exactly one success and one conflict; **L**.

## Phase E — Clinical record and odontogram

- [x] **E1 — Patient records/attachments**: Implement patients, evolutions, documents, consent/duplicate detection, quarantine storage and MIME/size/scan checks in `db/schema/clinical.ts`, `features/clinical-records/`, `lib/storage.ts`; Req: CR-001..CR-003; Deps: B3; Accept: S06-S10 pass, including no partial invalid upload; **L**.
- [x] **E2 — Odontogram model**: Add teeth/surfaces/state validation, SVG projection, immutable events/history in `db/schema/odontogram.ts`, `features/odontogram/model.ts`, `features/odontogram/actions.ts`; Req: OD-001..OD-003; Deps: E1; Accept: S31-S35 pass and no diagnostic/recommendation code path exists; **L**.
- [x] **E3 — Clinical UI**: Build patient tabs and accessible SVG control in `app/(app)/patients/[patientId]/`, `components/odontogram/`; Req: CR-001..003, OD-001..003; Deps: E1-E2; Accept: keyboard/focus/legend behavior works at 360px; **M**.
- [x] **E4 — Clinical tests**: Add unit reducers/validators, RLS role/site integration tests, and smokes for `/patients/[id]` and `/patients/[id]/odontogram` in `tests/unit/clinical-odontogram.test.ts`, `tests/integration/rls-clinical.test.ts`, `tests/smoke/clinical.spec.ts`; Req: CR-001..003, OD-001..003; Deps: E1-E3; Accept: assistant denial and chronological history are asserted; **L**.

## Phase F — Estimates and manual billing

- [x] **F1 — Tariffs/estimates**: Implement fee schedules, itemized totals, immutable versions/states and hashed revocable public links in `db/schema/estimates.ts`, `features/estimates/`; Req: EST-001..EST-003; Deps: B3,E1; Accept: S16-S20 pass; negative amounts never commit and approval never starts payment; **L**.
- [x] **F2 — Billing ledger**: Implement CLP charges/payments/credits/corrections, balances and filtered collection export in `db/schema/billing.ts`, `features/manual-billing/`; Req: BILL-001..BILL-003; Deps: B3,E1; Accept: S21-S25 pass and posted movements cannot silently delete; **L**.
- [x] **F3 — Finance UI/routes**: Add estimate editor/public view and billing/account/report views in `app/(app)/estimates/`, `app/(app)/billing/`, `app/e/[token]/`; Req: EST-001..003, BILL-001..003; Deps: F1-F2; Accept: revoked link is unavailable and online-payment action clearly creates no transaction; **M**.
- [x] **F4 — Finance tests**: Add total/balance unit tests, RLS role/site integration tests, and smokes for `/estimates`, `/e/[token]`, `/billing`, `/reports/collections` in `tests/unit/finance.test.ts`, `tests/integration/rls-finance.test.ts`, `tests/smoke/finance.spec.ts`; Req: EST-001..003, BILL-001..003; Deps: F1-F3; Accept: reconciliation equals filtered ledger; **L**.

## Phase G — Notifications and operational insights

- [x] **G1 — Notification jobs**: Implement notification/attempt tables, consent-aware email scheduling, retry terminal states and minimal payloads in `db/schema/notifications.ts`, `features/notifications/`, `workers/reminders.ts`; Req: NOT-001, NOT-002; Deps: D1,E1; Accept: S26-S28 pass with one attempt per due delivery and no unrelated patient data; **L**.
- [x] **G2 — WhatsApp boundary**: Add editable URL-encoded `wa.me` preparation and explicit unsupported worker outcome in `features/notifications/whatsapp.ts`; Req: NOT-003; Deps: G1; Accept: S29-S30 pass; no API send client exists; **S**.
- [x] **G3 — Explainable insights**: Implement versioned deterministic rules, evidence/freshness, approval/discard idempotency and exclusion audit in `db/schema/insights.ts`, `features/operational-insights/`, `workers/insights.ts`; Req: OI-001..OI-003; Deps: C2,F2,G1; Accept: S36-S40 pass and each action executes once only after approval; **L**.
- [x] **G4 — Ops tests/routes**: Add unit rule/job tests, RLS integration tests, and smokes for `/settings/notifications`, `/reports/insights` in `tests/unit/ops.test.ts`, `tests/integration/rls-ops.test.ts`, `tests/smoke/ops.spec.ts`; Req: NOT-001..003, OI-001..003; Deps: G1-G3; Accept: duplicate workers and stale-source cases are proven safe; **L**.

## Phase H — CSV migration

- [x] **H1 — Staged pipeline**: Implement upload quarantine, SHA-256+mapping identity, UTF-8/20MB/100000-row checks, mapping/validation/preview in `db/schema/migration.ts`, `features/csv-migration/`, `app/api/migration/`; Req: MIG-001, MIG-002; Deps: B3,E1; Accept: S11-S13 pass and invalid uploads create no batch; **L**.
- [x] **H2 — Import/reconcile worker**: Add streaming parser, Santiago/RUT/CLP normalization, transactional upsert keys, exception report and idempotent reimport in `workers/migration.ts`, `features/csv-migration/reconcile.ts`; Req: MIG-001..003; Deps: H1,D1,F1; Accept: S14-S15 produce zero duplicates and actionable unmatched rows; **L**.
- [x] **H3 — Migration UI**: Add upload→mapping→validation→preview→import→reconciliation screens in `app/(app)/migration/`; Req: MIG-001..003; Deps: H1-H2; Accept: import cannot start before accepted preview and row errors are visible; **M**.
- [x] **H4 — Migration tests/routes**: Add parser/hash unit tests, RLS integration tests, and smokes for `/migration` and `/api/migration` in `tests/unit/migration.test.ts`, `tests/integration/rls-migration.test.ts`, `tests/smoke/migration.spec.ts`; Req: MIG-001..003; Deps: H1-H3; Accept: duplicate batch and cross-tenant source-key tests pass; **M**.

## Phase I — Chile PWA and visual system

- [x] **I1 — Tokens/layout**: Implement DESIGN.md tokens, Space Grotesk/Inter/JetBrains Mono, dark dashboard, landing shell, focus/error states in `app/globals.css`, `app/layout.tsx`, `components/layout/`, `components/brand/`; Req: CL-002, all UI; Deps: A1; Accept: contrast AA and no prohibited clinical-green/medical-blue palette; **M**.
- [x] **I2 — Responsive/PWA**: Add manifest, icons, service worker shell-only cache and offline mutation guard in `public/manifest.webmanifest`, `public/icons/`, `app/sw.ts`, `lib/offline.ts`; Req: CL-002, CL-003; Deps: I1; Accept: S03-S05 pass; clinical/billing data never serves from cache; **M**.
- [x] **I3 — Chile formats**: Add CLP/RUT/Santiago formatters and inline validation in `lib/locale/cl.ts`, `components/forms/`; Req: CL-001; Deps: A1; Accept: S01-S02 pass for display and checksum rejection; **S**.
- [x] **I4 — Visual tests/routes**: Add formatter/accessibility unit tests, RLS integration smoke against protected shell, and route smokes for `/`, `/agenda`, `/patients`, `/offline` in `tests/unit/pwa-locale.test.ts`, `tests/integration/rls-pwa.test.ts`, `tests/smoke/pwa.spec.ts`; Req: CL-001..003; Deps: I1-I3; Accept: 360px audit has no horizontal overflow and install metadata is valid; **M**.

## Phase J — Final verification and Coolify release

- [x] **J0 — RED-first process-boundary security tests**: **Pre-implementation security-test order marker (strict_tdd=false): run before J1**; add failing tests for duplicate claims by two workers, bounded retry after failure, and malicious CSV/payload remaining data in `tests/security/process-boundary.red.test.ts`; Req: NOT-001, OI-001, MIG-001; Deps: G,H; Accept: RED cases are committed/recorded before production hardening, with no claim that they have run; **M**.
- [x] **J1 — Worker hardening**: Add fixed-command worker dispatch, `FOR UPDATE SKIP LOCKED`, bounded attempts/idempotency and malicious-payload tests in `workers/`, `lib/jobs.ts`, `tests/unit/jobs-security.test.ts`; Req: NOT-001, OI-001, MIG-001; Deps: G,H; Accept: two workers process once; failures retry at most configured bound; **M**.
- [x] **J2 — Deploy configuration**: Document Coolify web/worker/Postgres services, volume/backups/restore, health checks, domain `dental.nexolabs.cloud`, and env names only (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `APP_URL`, `STORAGE_*`, `EMAIL_*`, `WORKER_*`, `RATE_LIMIT_*`) in `Dockerfile`, `docker-compose.yml`, `docs/deploy/coolify.md`; Req: CL-002; Deps: A3,J1; Accept: staging deploy reaches `/api/health/ready`; no secret values committed; **M**.
- [x] **J3 — Full regression/RLS**: Run unit suite, all tenant/site negative integration suites and route smoke matrix in `tests/`; Req: TI-001..TI-007 and all capability requirements; Deps: A-J prior tests; Accept: all 37 requirements and S01-S64 map to green evidence; failed command gets two attempts max, then is documented and work continues; **L**.
- [x] **J4 — Release checklist**: Record migration rehearsal, backup restore evidence, security/AA/offline checks and rollback procedure in `docs/release/nexodent-v1.md`; Req: all; Deps: J2-J3; Accept: checklist names image, DB migration, worker, domain, health, rollback and observed results; **M**.

## Requirement and scenario traceability

| Requirement | Concrete task IDs |
|---|---|
| TI-001 | A2, B1, B4 |
| TI-002 | B3, B4 |
| TI-003 | B2, B4 |
| TI-004 | B3, B4 |
| TI-005 | B3, B4 |
| TI-006 | A2, B1, B4, C1, D2, C3 |
| TI-007 | A2, B1, B2, B4, C1, D2, C3 |
| SCH-001 | D1, D2, D4 |
| SCH-002 | D1, D4 |
| SCH-003 | D1, D2, D4 |
| PB-001 | D3, D4 |
| PB-002 | D3, D4 |
| PB-003 | D3, D4 |
| CR-001 | E1, E3, E4 |
| CR-002 | E1, E4 |
| CR-003 | B3, E1, E4 |
| OD-001 | E2, E3, E4 |
| OD-002 | E2, E4 |
| OD-003 | E2, E4 |
| EST-001 | F1, F3, F4 |
| EST-002 | F1, F3, F4 |
| EST-003 | F1, F3, F4 |
| BILL-001 | F2, F3, F4 |
| BILL-002 | F2, F3, F4 |
| BILL-003 | F2, F3, F4 |
| NOT-001 | G1, G4, J0, J1 |
| NOT-002 | G1, G4 |
| NOT-003 | G2, G4 |
| OI-001 | G3, G4, J0, J1 |
| OI-002 | G3, G4 |
| OI-003 | G3, G4 |
| MIG-001 | H1, H2, H3, H4, J0, J1 |
| MIG-002 | H1, H3, H4 |
| MIG-003 | H2, H3, H4 |
| CL-001 | I3, I4 |
| CL-002 | A3, A4, I1, I2, I4, J2 |
| CL-003 | I2, I4 |

| Scenarios | Concrete implementation/test task IDs |
|---|---|
| S01-S05 (chile-pwa) | I2, I3, I4 |
| S06-S10 (clinical-records) | E1, E3, E4 |
| S11-S15 (csv-migration) | H1, H2, H3, H4 |
| S16-S20 (estimates) | F1, F3, F4 |
| S21-S25 (manual-billing) | F2, F3, F4 |
| S26-S30 (notifications) | G1, G2, G4, J0, J1 |
| S31-S35 (odontogram) | E2, E3, E4 |
| S36-S40 (operational-insights) | G3, G4, J0, J1 |
| S41-S47 (public-booking) | D3, D4 |
| S48-S53 (scheduling) | D1, D2, D4 |
| S54-S64 (tenant-identity) | B1, B2, B3, B4, C1, C3, D2 |

- [ ] **Trace-1 — Requirement ledger**: Maintain `docs/requirements-traceability.md` (created by apply) with TI-001..TI-007, SCH-001..003, PB-001..003, CR-001..003, OD-001..003, EST-001..003, BILL-001..003, NOT-001..003, OI-001..003, MIG-001..003, CL-001..003 mapped to task IDs; Req: all 37; Deps: A-J; Accept: script reports 37/37 IDs and zero unmapped; **M**.
- [ ] **Trace-2 — Scenario ledger**: Extend `docs/requirements-traceability.md` with S01-S64 mapped to unit/integration/smoke evidence; Req: all 64; Deps: Trace-1; Accept: script reports 64/64 scenarios and zero unmapped; **M**.

## Work-unit evidence and order

PR1 (A-B) establishes schema/auth/RLS; PR2 (C-D) adds seeded operation and booking; PR3 (E-F) adds clinical/finance; PR4 (G-H) adds workers/insights/migration; PR5 (I-J) ships UX/PWA and release proof. Each unit includes its tests and can be rolled back by its listed paths without reverting earlier units. Focused commands are the unit test path plus its integration and smoke path; runtime harness is the named route smoke. If `curl` is used for health checks, every invocation MUST include `--max-time 25`.
