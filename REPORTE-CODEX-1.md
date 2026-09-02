# REPORTE-CODEX-1 — NexoDent PR1/5: Foundation, tenancy, auth and RLS

## Estado

Completadas **solo** A1-A4 y B1-B4 de `openspec/changes/nexodent/tasks.md`. La verificación independiente del orquestador detectó 3 bloqueos; los 3 fueron corregidos por el orquestador y re-verificados (ver "Correcciones de gatekeeper" y "Evidencia final"). No se crearon commits, ramas ni PRs. La ejecución se detuvo antes de fase C/D y de todo slice posterior.

## Implementación PR1

- Next.js 16 / React 19 / TypeScript, Tailwind, scripts de calidad y parsing seguro de entorno.
- Drizzle/Postgres: organizaciones, sedes, usuarios, membresías, asignación de sedes, auditoría, UUID, timestamps, CLP `bigint`, extensiones y RLS forzado.
- Health readiness fail-closed: requiere configuración completa y conectividad real de base de datos.
- Better Auth con adapter Drizzle: creación de sesión bloqueada si no hay membresía activa; claims de `membership_id`, `organization_id`, rol, sedes y expiración se cargan desde tablas persistidas.
- Autorización mínima: mutaciones de membresía/sede se escriben transaccionalmente y agregan auditoría append-only; borrado destructivo sigue denegado por defecto.
- RLS probado con PostgreSQL embebido para lectura y edición cross-tenant de organización, sedes, membresías, membership-site y auditoría.

## Evidencia

| Comando / harness | Resultado |
|---|---|
| `npx tsc --noEmit` | Aprobado. |
| `npm run lint` | Aprobado. |
| `npm run test:unit` | 11 pruebas aprobadas. |
| `npm run test:integration` | 5 pruebas aprobadas con PostgreSQL embebido. |
| `npm run test:smoke` | 2 pruebas aprobadas. |
| `npm run build` | Aprobado. |
| Runtime local | `/` devuelve 200 y readiness sin configuración devuelve 503. |
| Compose runtime | N/A: el entorno no expone plugin Docker Compose ni daemon. |

## Archivos principales

`app/`, `components/`, `db/`, `lib/`, `features/tenant-identity/`, `workers/`, `tests/`, `Dockerfile`, `docker-compose.yml`, `package.json`, `package-lock.json`, `openspec/changes/nexodent/apply-progress.md`.

## Correcciones de gatekeeper (orquestador, tras verificación independiente)

La verificación independiente encontró 3 bloqueos que la corrida de Codex no había cerrado; los corrigió el orquestador directamente:

1. **Bootstrap de sesión bajo RLS forzado (bloqueo crítico)**: `activeMembershipForUser()` consultaba `memberships` con la conexión de la app. Bajo `FORCE RLS` y sin GUC `app.organization_id` (aún no se conoce el tenant al crear la sesión), la consulta devolvía 0 filas → **nadie podía iniciar sesión jamás**. Los tests lo enmascaraban usando la conexión admin (superusuario). Fix: migración `0002_auth_bootstrap.sql` crea la función `app_resolve_active_membership(user_id)` `SECURITY DEFINER` (devuelve solo la membresía activa del usuario autenticado; EXECUTE otorgado a roles con login, revocado de PUBLIC). `lib/auth.ts` ahora resuelve la membresía vía esa función. El test de integración ahora usa la conexión `app` real (rol `NOBYPASSRLS` bajo FORCE RLS, sin GUC) y pasa.
2. **Rollback incompleto**: `db/rollback.ts` no eliminaba `accounts`, `sessions`, `verifications` ni la función SECURITY DEFINER. Fix: DROP completo con CASCADE.
3. **Snapshot incompleto**: `db/schema/snapshot.json` declaraba solo 6 tablas; faltaban `sessions`, `accounts`, `verifications` (existen en migración 0000 y en `db/schema/auth.ts`). Fix: snapshot con las 9 tablas, versión `0002`.

Además, la migración 0002 otorga EXECUTE a **cualquier rol con login** (no a un nombre fijo), porque en producción el rol de la app puede tener cualquier nombre (p.ej. el que genera Coolify).

## Evidencia final (post-corrección, verificada por el orquestador)

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | Aprobado. |
| `npm run lint` | Aprobado. |
| `npm run test:unit` | 11 pruebas aprobadas. |
| `npm run test:integration` | 5 pruebas aprobadas (incluye bootstrap de sesión con rol app real + RLS cross-tenant). |
| `npm run test:smoke` | 2 pruebas aprobadas. |
| `npm run build` | Aprobado. |
| Rollback | `DROP FUNCTION` + 9 tablas + tipos con CASCADE, coherente con migraciones. |

## Stop obligatorio

**No se implementó ni modificó ninguna tarea de fase C, D o posterior.** El siguiente paso permitido es el lanzamiento del PR2 (fases C+D); no avanzar sin verificación del orquestador.
