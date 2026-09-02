# PR5 completed — PWA, visual system, hardening, and release guidance

PR5 implements only I1–I4 and J0–J4. No real deployment was performed, and `tasks.md` remains unchanged for independent orchestration.

## Outcome

| Task | Status | Evidence |
| --- | --- | --- |
| I1 — Tokens/layout | Complete | DESIGN.md tokens, Space Grotesk/Inter/JetBrains Mono roles, dark application shell, public landing, SVG brand, visible focus/error states, responsive logical layout. Static contrast ratios range from 7.34:1 to 17.19:1 for the checked text/surface pairs. |
| I2 — Responsive/PWA | Complete locally | Valid manifest, SVG any/maskable icon, registered service worker, shell-only cache, explicit protected/API exclusions, `/offline`, and offline mutation guard. Real-browser installation/offline behavior remains unproven. Covers S03–S05 at source/unit/smoke level. |
| I3 — Chile formats | Complete | CLP converts postgres.js strings through `Number(...)`; RUT normalization, display, and modulo-11 checksum; Santiago timezone formatting; inline accessible RUT rejection. Covers S01–S02. |
| I4 — Visual tests/routes | Complete locally | Formatter/accessibility unit tests, protected-shell cache/RLS integration checks, and route smokes for `/`, `/agenda`, `/patients`, `/offline`. Static mobile checks cover shrinkable grids and no fixed width above 360 px; a browser viewport audit remains required. |
| J0 — RED marker | Recorded before J1 | `tests/security/process-boundary.red.test.ts` is intentionally outside configured scripts and skipped. It records the three pre-hardening RED contracts and explicitly does **not** claim execution. |
| J1 — Worker hardening | Complete | Fixed allowlisted worker dispatch with `shell:false`, `FOR UPDATE SKIP LOCKED` claim contract, configurable bounded retry decisions, bounded notification retry update, malicious/formula/NUL/oversize payload rejection, and tests. Existing integration proves duplicate reminder worker calls deliver once. |
| J2 — Coolify configuration | Complete as documentation | Separate web/worker targets, PostgreSQL service/volume/health, immutable-image guidance, domain, backup/restore and readiness procedure, environment names only. No Coolify action occurred. |
| J3 — Full regression/RLS | Complete locally | Current unit, embedded-PostgreSQL integration, smoke, lint, and production build pass. The 37 requirements and S01–S64 remain mapped by the task matrix to the complete regression suites; no separate 37/37 or 64/64 trace-ledger script was created because Trace-1/Trace-2 were outside the authorized task scope. |
| J4 — Release checklist | Complete as documentation | Candidate image, migration, worker, domain, health, backup/restore, AA/offline, security, and rollback gates with observed versus pending evidence clearly separated. |

## Verification

| Command | Exact final result |
| --- | --- |
| `npm run test:unit` | Exit 0 — 11 files, **43 tests passed** (34 prior + 9 PR5). Earlier first attempt failed one pre-existing compose-source assertion; the worker command was made explicit and the second attempt passed. |
| `npm run test:integration` | Exit 0 — 9 files, **19 tests passed** (17 prior + 2 PR5). Embedded PostgreSQL; existing action harnesses use LOGIN roles with `NOSUPERUSER NOBYPASSRLS`, tenant operations use transaction-local `runAsTenant`, and admin access is confined to setup/assertions. |
| `npm run test:smoke` | Exit 0 — 9 files, **17 tests passed** (12 prior + 5 PR5). |
| `npm run lint` | Exit 0 — no findings. An earlier first attempt found three errors and one warning; the Link, DOM typings, and font loading were corrected before the passing run. |
| `npm run build` | Exit 0 — Next.js production build completed and emitted 18 routes. It printed only the variable-name/default-secret Better Auth warning and the existing middleware deprecation; no secret value was supplied or printed. |
| static contrast script | `ink/bg 17.19`, `muted/bg 7.34`, `accent/bg 10.42`, `bg/accent 10.42`, `error/bg 13.02` — all checked combinations exceed AA. |
| bounded config secret scan | `secret-value-scan PASS 0` — no inline values detected for the checked secret fields. |
| Impeccable detector | Two expected brief-authorized notices: Inter is mandated for UI and the subtle hero grid is mandated by DESIGN.md. No visual direction was changed to satisfy generic detector taste over the brief. |

The recurring Vite native-loader compatibility warning is non-fatal and pre-existing. No failed verification command was attempted more than twice.

## Requirement and scenario trace

| Requirement / scenarios | Evidence |
| --- | --- |
| CL-001 / S01–S02 | `tests/unit/pwa-locale.test.ts`, `lib/locale/cl.ts`, `components/forms/rut-field.tsx` |
| CL-002 / S03–S04 | Manifest/metadata, shell/layout/routes, `tests/unit/pwa-locale.test.ts`, `tests/smoke/pwa.spec.ts`, build |
| CL-003 / S05 | `app/sw.ts`, `public/sw.js`, `lib/offline.ts`, unit/integration source-boundary tests |
| NOT-001 / S26–S30 | J0 marker, `lib/jobs.ts`, `features/notifications/jobs.ts`, `tests/unit/jobs-security.test.ts`, prior ops suites |
| OI-001 / S36–S40 | J0 marker plus unchanged PR4 unit/integration/smoke evidence |
| MIG-001 / S11–S15 | J0 marker, malicious payload tests, unchanged PR4 migration unit/integration/smoke evidence |
| TI-001–TI-007 / S54–S64 | Full tenant/site negative integration regression: 19/19 passing |
| Remaining 27 requirements / S06–S10, S16–S25, S31–S35, S41–S53 | Full PR1–PR4 unit/integration/smoke regression: 43/43, 19/19, 17/17 |

This is suite-level trace evidence, not a claim that a dedicated traceability-count script ran.

## New structure

```text
app/(app)/layout.tsx
app/(app)/patients/page.tsx
app/offline/page.tsx
app/sw.ts
components/brand/logo.tsx
components/forms/index.ts
components/forms/rut-field.tsx
components/layout/app-shell.tsx
components/layout/site-header.tsx
components/pwa/service-worker-registration.tsx
docs/deploy/coolify.md
docs/release/nexodent-v1.md
lib/jobs.ts
lib/locale/cl.ts
lib/offline.ts
public/icons/icon.svg
public/manifest.webmanifest
public/sw.js
tests/integration/rls-pwa.test.ts
tests/security/process-boundary.red.test.ts
tests/smoke/pwa.spec.ts
tests/unit/jobs-security.test.ts
tests/unit/pwa-locale.test.ts
```

Also updated: `.env.example`, `Dockerfile`, `docker-compose.yml`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `features/notifications/jobs.ts`, and `workers/entrypoint.mjs`.

## Honest gaps and release stop

- No browser/runtime was available to demonstrate installability, offline interception, keyboard behavior, or an actual 360 px screenshot. Only metadata, source contracts, build, static responsive checks, and tests are green.
- No Coolify deployment, staging readiness request, production migration, backup, restore, or rollback occurred. `docs/release/nexodent-v1.md` keeps each one unchecked.
- The embedded integration harness rehearsed migrations 0000–0006 on ephemeral PostgreSQL; it does not replace a staging backup/restore rehearsal.
- The J0 RED file is a historical marker, not a test-execution claim.

**FINAL state:** implementation is ready for independent orchestrator verification. Stop here; do not deploy.
