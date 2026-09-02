# BRIEF-CODEX-6 — NexoDent · APPLY PR1: Foundation + Tenancy (fases A+B)

## Misión

Ejecutar **SOLO las tareas A1-A4 y B1-B4** de `openspec/changes/nexodent/tasks.md` (PR1 de 5). Implementar el scaffolding del proyecto y el núcleo tenancy/auth/RLS. Al terminar, **DETENTE OBLIGATORIAMENTE** — NO continúes a fases C/D (PR2). El orquestador verificará y lanzará el siguiente PR.

## Contexto (ya validado — NO reabrir)

- Leer: `openspec/changes/nexodent/tasks.md` (tareas A1-A4, B1-B4 con sus criterios), `design.md`, specs (`openspec/changes/nexodent/specs/`), `PRODUCT.md`, `DESIGN.md`.
- **Stack**: Next.js 16 (App Router) + React 19 + TS + Postgres + Drizzle + Better Auth + Tailwind 4 + Shadcn. Deploy final en Coolify (dominio `dental.nexolabs.cloud`).
- **Modelo**: organization (clinic|independent) + multi-sede (site_id) + RLS por organization_id + permisos MÍNIMOS RESTRICTIVOS (TI-001..TI-007).
- **Este directorio YA tiene archivos** (PRODUCT.md, DESIGN.md, openspec/, .agents/, .codex/, BRIEF-*.md). NO borrarlos. El scaffold de Next.js debe hacerse en la raíz SIN romperlos (create-next-app en dir no vacío falla → scaffold manual o en subdir y mover, cuidando los archivos existentes).

## Restricciones de entorno (IMPORTANTE)

- **NO hay Docker daemon** (`/var/run/docker.sock` inaccesible) → NO usar `docker compose up` en la verificación local.
- **NO hay Postgres instalado, NO hay sudo** (usuario hermes, uid 1000) → los tests de integración RLS necesitan Postgres:
  - **Opción A (preferida)**: usar Postgres embebido portable vía npm (`embedded-postgres` o `pg-embed`) que descarga binarios reales sin root, para correr los tests de integración RLS localmente. Configurar el test harness para levantarlo en setup.
  - **Opción B (fallback)**: si el embebido no funciona tras 2 intentos, DEJAR los tests de integración RLS escritos (con harness listo) y documentar que se ejecutan en el deploy de Coolify (Postgres real como servicio). Los tests UNITARIOS deben correr sin DB.
  - REGLA: nunca bloquear la entrega por falta de Postgres local.

## Tareas (de tasks.md — ejecutar en orden)

### Fase A — Foundation and deployable shell
- [ ] **A1 — Scaffold app**: Next.js 16 App Router/React 19/TS, Tailwind 4, Shadcn, Drizzle, scripts (`dev/build/start/lint/test:unit/test:integration/test:smoke/seed`), strict env parsing en `lib/env.ts`. Accept: `npm run build` OK, secrets faltantes reportadas de forma segura.
- [ ] **A2 — Schema/migration base**: UUID, timestamps, CLP bigint, extensiones (btree_gist), migración runner en `db/schema/index.ts`, `db/schema/core.ts`, `db/migrations/`. Accept: migrate/rollback limpio + snapshot.
- [ ] **A3 — Container/process setup**: Dockerfile multi-stage no-root, docker-compose.yml, entrypoint worker, health handlers `/` y `/api/health/ready`. Accept: web y worker arrancan; readiness fail-closed sin DB.
- [ ] **A4 — Foundation tests**: `tests/unit/foundation.test.ts`, `tests/integration/rls-foundation.test.ts`, `tests/smoke/foundation.spec.ts`. Accept: tests afirman aislamiento y health.

### Fase B — Tenancy, auth, RLS and audit
- [ ] **B1 — Tenant tables/context**: organizations, sites, users, memberships, membership_sites, audit_logs, `withTenantContext()` en `db/schema/tenant.ts`, `lib/tenancy.ts`. Accept: fixtures clinic e independent válidos.
- [ ] **B2 — Auth/session**: Better Auth + session claims (membership_id, organization_id, rol, site_ids) en `lib/auth.ts`, `app/api/auth/[...all]/route.ts`, `middleware.ts`. Accept: S57 login OK, S58 inactivo denegado.
- [ ] **B3 — Least-privilege authorization**: capability matrix + cambios auditados en `features/tenant-identity/authorize.ts`, `features/tenant-identity/actions.ts`. Accept: S56/S59/S60 deniegan/mutan solo lo especificado + audit rows.
- [ ] **B4 — RLS/policy tests**: políticas RLS forzadas + FKs/unique compuestos en `db/migrations/*rls.sql`; tests unit matriz, integración cross-tenant, smoke `/login`, `/settings/members`, `/settings/sites`. Accept: S54,S55,S61-S64 pasan sin leak de existencia.

## ⛔ REGLAS ANTI-BLOQUEO

1. NUNCA esperes aprobación humana. Tras 2 fallos en una tarea, documenta y sigue.
2. Todo curl con `--max-time 25`.
3. Cada tarea = método principal + fallback + documentación.
4. Reporte final OBLIGATORIO aunque algo falle.
5. Si Postgres embebido falla 2x → Opción B (tests escritos, integración en deploy).

## REGLAS CRÍTICAS

- NO toques fuera de este directorio. NO modifiques PRODUCT.md, DESIGN.md, specs, design.md ni tasks.md.
- NO borres archivos existentes (openspec/, .agents/, .codex/).
- NO imprimas ni guardes secretos. Env vars solo NOMBRES en `.env.example` (DATABASE_URL, AUTH_SECRET, etc.), NUNCA valores.
- Implementa EXACTAMENTE lo de tasks.md A1-B4 — no agregues features de fases posteriores.
- El diseño visual completo (DESIGN.md tokens, PWA) es fase I (PR5) — en este PR solo dejar la base mínima funcional (landing/placeholder + login).
- El código va en español en textos de UI; identificadores en inglés.

## Verificación con evidencia (en el reporte)

1. `npm run build` → exit 0
2. `npm run test:unit` → pasa
3. `npm run test:integration` (con Postgres embebido si Opción A) → pasa; si Opción B, documentar
4. `npm run test:smoke` → smoke de foundation/tenant pasan (o documentar si requieren DB)
5. `npm run lint` → limpio
6. Listar estructura creada (app/, db/, features/, lib/, workers/, tests/)
7. Confirmar qué opción de Postgres se usó (A embebido o B diferido)

## Reporte final

Actualiza `REPORTE-CODEX-1.md` (sección "FASE 6 — APPLY PR1 (A+B)") con: tareas completadas, evidencia, opción Postgres usada, y estado para el PR2.
