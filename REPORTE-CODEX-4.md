# PR4 completed — Operations and CSV migration

PR4 implements only phases G and H. Phases I and J remain untouched for PR5.

## Outcome

| Task | Status | Evidence |
|---|---|---|
| G1 — Notification jobs | Complete | `notifications` and immutable `notification_attempts`; site/organization-policy notices wired to booking, reschedule, and cancellation commits; consent-aware reminders; minimal payload constraint; timeout/error terminal persistence; provider idempotency key; explicit retry. Covers S26-S28. |
| G2 — WhatsApp boundary | Complete | Editable, URL-encoded `wa.me` preparation and an explicit `unsupported` worker outcome. No WhatsApp API client exists. Covers S29-S30. |
| G3 — Explainable insights | Complete | Versioned deterministic rule, evidence hash, source freshness, unavailable state, approve/discard UI, and idempotent approval that creates the stored `prepare_recall_notice` notification exactly once with an execution audit. Covers S36-S40. |
| G4 — Ops tests/routes | Complete | Unit rules/boundaries, NOBYPASSRLS integration coverage, duplicate-worker and stale-source cases, plus protected `/settings/notifications` and `/reports/insights` smokes. |
| H1 — Staged pipeline | Complete | Raw CSV request-body streaming with incremental UTF-8 decoding and SHA-256; validation before persistence; 20 MB/100000-row limits; canonical mapping identity; row validation and preview. Covers S11-S13. |
| H2 — Import/reconcile worker | Complete | Streaming-compatible parser boundary, Santiago/RUT/CLP normalization, accepted-preview gate, transactional tenant upserts, stable source keys, actionable unmatched rows, and idempotent reimport. Covers S14-S15. |
| H3 — Migration UI | Complete | Spanish upload → mapping → validation → preview → import → reconciliation flow. Import cannot be invoked before the preview is accepted; row errors are visible. |
| H4 — Migration tests/routes | Complete | Chunk-boundary/quoted-newline streaming tests, parser/hash unit tests, app-role RLS integration, duplicate-batch `alreadyApplied` and same-source-key cross-tenant isolation, plus `/migration` and `/api/migration` smokes. |

## Bounded corrective pass

A single corrective pass closed the five fresh validation gaps: stored insight actions now create a recall notification exactly once and have review controls; provider exceptions/timeouts persist terminal attempts with stable idempotency keys; CSV ingestion uses a raw streaming body with incremental parsing/hashing; duplicate imported uploads surface `alreadyApplied`; and configured booking/change policies are wired to internal and public scheduling commits. No phase I/J files or tasks were touched. A final transport-only correction replaced the client FormData request with the shared `csvUploadRequest()` raw-Blob contract; the API reads the same metadata contract through `readCsvUploadMetadata()`, and a behavioral round-trip test proves body identity plus decoded filename, source type, and mapping.

## Acceptance evidence

- **S26-S28:** Missing consent creates a cancelled record without delivery; configured site/organization policies create notices from booking, reschedule, cancellation, and the public SECURITY DEFINER boundary; duplicate runs create one attempt. Provider exceptions/timeouts persist `failed` attempts instead of rolling back, and every provider call receives the stable notification ID as its idempotency key.
- **S29-S30:** `wa.me` output strips non-digits from the recipient and URL-encodes editable text; background delivery returns `unsupported` and `sent: false`.
- **S36-S40:** Evidence includes source IDs, time window, observation time, site, version, and freshness; stale evidence becomes `unavailable`; the report exposes approve/discard controls; approval creates the stored recall notification and audit once; repeated approval is a no-op; clinical requests are excluded and audited.
- **S11-S13:** The UI sends the CSV as a raw streaming request body. The API incrementally decodes, hashes, separates quoted records across chunk boundaries, and enforces file type, size, UTF-8, row count, headers, mappings, and row values before a batch insert. Invalid upload integration evidence confirms zero batches.
- **S14-S15:** Import requires `preview_accepted_at`, uses tenant-scoped stable source keys, returns reconciliation counts, and surfaces `alreadyApplied` through staging, API, and UI without duplicate records.

## Verification

| Command | Result |
|---|---|
| `npx vitest run tests/unit/migration-transport.test.ts tests/smoke/migration.spec.ts` | Exit 0 — 2 files, 3 tests passed; behaviorally proves raw Blob body and shared client/API metadata decoding. |
| `npm run test:unit` | Exit 0 — 9 files, **34 tests passed** (26 prior + 8 PR4). |
| `npm run test:integration` | Exit 0 — 8 files, **17 tests passed** (12 prior + 5 PR4). Embedded PostgreSQL; PR4 actions run through `runAsTenant()` using LOGIN roles with `NOSUPERUSER NOBYPASSRLS`; admin is used only for post-action assertions. |
| `npm run test:smoke` | Exit 0 — 8 files, **12 tests passed** (8 prior + 4 PR4). |
| `npm run lint` | Exit 0 — no lint findings. |
| `npm run build` | Exit 0 — Next.js production build completed; all new routes were emitted. Build logged the existing middleware deprecation and missing non-production Better Auth secret warning by variable name only; no value was printed. |
| `node .agents/skills/impeccable/scripts/detect.mjs --json ...` | `[]` — no detector findings on the new UI targets. |

The smoke suite proves route protection, staged UI structure, copy, and API tenant wrapping. A browser screenshot pass was not performed because an authenticated runtime session was not available; visual behavior beyond build/smoke/detector evidence remains for orchestrator runtime review.

## New structure

```text
app/(app)/migration/
  migration-client.tsx
  page.tsx
app/(app)/reports/insights/
  actions.ts
  page.tsx
app/(app)/settings/notifications/page.tsx
app/api/migration/route.ts
db/migrations/0006_ops_migration.sql
db/schema/
  insights.ts
  migration.ts
  notifications.ts
features/csv-migration/
  normalize.ts
  parser.ts
  pipeline.ts
  reconcile.ts
  transport.ts
features/notifications/
  integration.ts
  jobs.ts
  whatsapp.ts
features/operational-insights/
  actions.ts
  rules.ts
workers/
  insights.ts
  migration.ts
  reminders.ts
tests/integration/
  rls-migration.test.ts
  rls-ops.test.ts
tests/smoke/
  migration.spec.ts
  ops.spec.ts
tests/unit/
  migration.test.ts
  migration-transport.test.ts
  ops.test.ts
```

Also updated: `app/globals.css`, `db/schema/index.ts`, `features/public-booking/service.ts`, `features/scheduling/actions.ts`, and `middleware.ts`.

## Scope and rollback

- `openspec/changes/nexodent/tasks.md` was read but not edited or checked off.
- Migrations `0000` through `0005`, product/design/spec artifacts, and reports 1-3 were not modified.
- No phase I/J implementation was added. There are no PWA, visual-system, deployment-hardening, or security-hardening changes in this work unit.
- Rollback boundary: remove the files listed under “New structure” (including `features/csv-migration/transport.ts` and `tests/unit/migration-transport.test.ts`), remove `0006_ops_migration.sql`, and revert `app/globals.css`, `db/schema/index.ts`, `features/public-booking/service.ts`, `features/scheduling/actions.ts`, and `middleware.ts`. Existing PR1-PR3 behavior is otherwise independent.

## PR5 readiness

PR4 is ready for orchestrator verification. Phase I/J work remains pending and was intentionally not started.
