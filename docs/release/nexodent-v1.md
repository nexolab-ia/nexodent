# NexoDent v1 release checklist

**Current decision:** ready for independent verification, not authorized for production deployment. No real Coolify service, backup, restore, HTTPS install, or rollback was executed in this work unit.

## Observed local evidence

| Check | Observed result |
| --- | --- |
| Production build | `npm run build`: exit 0; 18 routes generated. Better Auth emitted a non-fatal default-secret warning because release secrets were deliberately not supplied. |
| Unit regression | `npm run test:unit`: exit 0 on second attempt, 11 files / 43 tests. First attempt exposed an outdated compose-command expectation and was corrected. |
| Tenant/RLS integration | `npm run test:integration`: exit 0, 9 files / 19 tests using embedded PostgreSQL. Existing harnesses apply migrations 0000–0006 and use application roles declared `NOSUPERUSER NOBYPASSRLS`; tenant work remains inside `runAsTenant`. |
| Route smoke matrix | `npm run test:smoke`: exit 0, 9 files / 17 tests, including `/`, `/agenda`, `/patients`, and `/offline` source-route checks. |
| Lint | `npm run lint`: exit 0 on second attempt with no findings. First attempt found one Next link rule, two DOM-type lint errors, and one font warning; all were corrected. |
| Offline boundary | Automated source/unit checks confirm shell-only cache paths and block offline mutation. No real-browser offline session was run. |
| Visual / AA | Token contrast was checked from committed colors and responsive CSS has a bounded mobile layout. A real 360 px browser audit remains required. |
| Migration rehearsal | Embedded integration suites successfully applied migrations 0000–0006 to ephemeral PostgreSQL. This is not a production rehearsal. |
| Backup / restore | Not performed: no real or staging infrastructure was touched. Must be proven in an isolated Coolify staging database before release. |

## Pre-release gate

- [ ] Pin one immutable image revision for both `web` and `worker` targets.
- [ ] Configure `dental.nexolabs.cloud` with HTTPS and verify the PWA install prompt and icons in a supported browser.
- [ ] Confirm the application `DATABASE_URL` uses a `NOSUPERUSER NOBYPASSRLS` role.
- [ ] Capture an encrypted pre-migration PostgreSQL backup and successfully restore it into an isolated database.
- [ ] Rehearse `npm run db:migrate` against the restored copy and record duration, row counts, and migration identity.
- [ ] Start web and one fixed-command worker service per approved `WORKER_KIND`; verify retry bounds and single-claim behavior under concurrency.
- [ ] Confirm `GET /api/health/ready` returns HTTP 200 without disclosing configuration.
- [ ] Run keyboard, focus, error, contrast-AA, 360 px overflow, and offline checks in a real browser.
- [ ] Run tenant/site negative integration and the complete route smoke matrix against the candidate image.

## Rollback procedure

1. Stop all worker services so no new job or migration work starts.
2. Remove public traffic from the candidate web image.
3. If the migration is incompatible, restore the verified pre-migration backup; do **not** use the destructive development rollback script.
4. Select the preceding immutable web and worker image revision together.
5. Start web first and confirm `/api/health/ready`; then start workers.
6. Run read-only tenant-isolation and route smoke checks before restoring traffic to `dental.nexolabs.cloud`.
7. Record the incident window, image revisions, database restore identifier, and health results without copying secret values.
