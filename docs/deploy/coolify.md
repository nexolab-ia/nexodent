# Run NexoDent on Coolify

This is configuration guidance only. No environment was deployed while preparing it.

## Service map

| Service | Image target | Command | Health / persistence |
| --- | --- | --- | --- |
| Web | `web` | `node server.js` | `GET /api/health/ready` every 30 seconds |
| Worker | `worker` | `node workers/entrypoint.mjs` | Restart on failure; fixed `WORKER_KIND` allowlist |
| PostgreSQL | `postgres:17-alpine` | Image default | `pg_isready`; persistent `postgres_data` volume |

Use `dental.nexolabs.cloud` for the web service and configure HTTPS before testing PWA installation. Do not expose PostgreSQL publicly. The application login must use a `NOSUPERUSER NOBYPASSRLS` role; reserve administrative credentials for migrations and controlled recovery.

## Configuration names

Web: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `APP_URL`. Storage: `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`. Email: `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_API_KEY`. Worker: `WORKER_KIND`, `WORKER_ORGANIZATION_ID`, `WORKER_MEMBERSHIP_ID`, `WORKER_ROLE`, `WORKER_SITE_IDS`, `WORKER_MAX_ATTEMPTS`, and `WORKER_BATCH_ID` for migration jobs. Limits: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`. PostgreSQL container: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

Set values only in Coolify's secret/environment manager. Keep them out of logs, screenshots, shell history, repository files, and build arguments.

## Release path

1. Create the PostgreSQL service and attach a persistent volume.
2. Create a backup schedule with encrypted off-host retention. Perform a restore into an isolated database and record its timestamp and integrity result.
3. Build the web and worker targets from the same immutable image revision.
4. Run `npm run db:migrate` once with controlled migration credentials.
5. Start web, then the selected workers. Configure one worker service per required `WORKER_KIND` and tenant context.
6. Route HTTPS traffic for `dental.nexolabs.cloud` to web port 3000.
7. Confirm `/api/health/ready` returns HTTP 200 without disclosing configuration details.

## Rollback

Stop workers first, route web traffic to the preceding immutable image, and restore the verified pre-migration database backup if the migration is not backward compatible. Never run the destructive development `db:rollback` command against production. Re-run readiness, tenant-negative tests, and a read-only smoke check before restoring traffic.
