# Análisis de migración: NexoDent → Vercel + Supabase + Clerk

Fecha: 2026-09-02. Estado: ANÁLISIS (no ejecutar aún). Autor: Hermes (arquitecto).

## 0. DECISIÓN (2026-09-03, Bryan) — SUPERSEDED el 2026-09-04

> **SUPERSEDIDO (2026-09-04):** Bryan revirtió esta decisión. NexoDent SÍ migra a **Vercel + Supabase** (sin Clerk; Better Auth se conserva). Plan activo: **`docs/migration-vercel-supabase.md`**. Este documento queda como archivo de la evaluación técnica (contexto y análisis de capas, aún válidos).

1. ~~NO migrar a Vercel/Supabase/Clerk~~ (dejado sin efecto).
2. El destino de producción acordado el 2026-09-03 (servidor dedicado propio exclusivo) queda **suspendido** mientras esté vigente el plan Vercel+Supabase.
3. El deploy actual en Coolify sigue siendo el entorno de prueba/desarrollo y, además, el **rollback** durante la ventana de observación post-cutover.
4. El análisis de capas (§2), la estrategia por fases (§3) y los riesgos (§4) de este documento siguen siendo referencia técnica válida para el plan activo (con la salvedad de §2.3 Clerk → descartado).
5. Este documento es ARCHIVO; no es plan activo.

## 1. Estado actual (verificado en repo + healthcheck)

- **App**: Next.js 16.1.1 standalone + React 19.2.3 + TypeScript. Deploy actual: Docker multi-stage en Coolify (`nexolab-ia/nexodent`, público, main).
- **Dominio**: dental.nexolabs.cloud → health `/api/health/ready` = 200 OK.
- **BD**: PostgreSQL 17 (Coolify, no expuesto). Drizzle ORM + postgres.js. 10 migraciones SQL (0000–0009_dashboard), extensión `pgcrypto` + `btree_gist`, tabla control `_nexodent_schema_migrations`.
- **Modelo de datos/RLS**: multi-tenant custom (organizations/sites/memberships/membership_sites/audit_logs en tablas propias). **FORCE ROW LEVEL SECURITY** (4 migraciones) + GUCs `app.organization_id/membership_id/role/site_ids` vía `set_config` (`runAsTenant`). Funciones `SECURITY DEFINER` (p.ej. `app_resolve_active_membership`) con owner admin (BYPASSRLS). Rol runtime de la app: `nexodent_app` NOSUPERUSER NOBYPASSRLS creado por `db/provision.ts` con `DATABASE_URL_ADMIN`.
- **Auth**: Better Auth (email/password) + drizzle adapter + `customSession` con claims de tenancy. Archivos que tocan Better Auth: `app/api/auth/[...all]/route.ts`, `lib/auth.ts`, `lib/request-context.ts`, `middleware.ts` (+ ~6 archivos que llaman `auth.api.getSession` vía `requestTenantContext`).
- **Storage**: `lib/storage.ts` — adapter LOCAL (filesystem `.quarantine`) con stub de AV "clean-only". Envs `STORAGE_*` definidos pero sin implementación S3 real.
- **Email**: NO implementado (worker devuelve `provider_not_configured`). Envs `EMAIL_*` definidos.
- **Workers/jobs**: 3 workers tsx (`reminders/insights/migration`) que corren como procesos largos vía `workers/entrypoint.mjs` en Docker (imagen `worker`). Polling con `FOR UPDATE SKIP LOCKED` sobre tabla `notifications`/`jobs`. Config por env `WORKER_*`.
- **Seed/demo**: Clínica Sonrisa Andes + 20 pacientes + `emilia.demo@nexodent.invalid` (Better Auth credential), cargado por `db/provision.ts`.
- **Tests**: unit (43), integration (19, Postgres embebido aplicando migraciones + roles NOSUPERUSER), smoke (17).

## 2. Qué implica cada capa del destino

### 2.1 Vercel (hosting)
- Quitar `output: "standalone"` de next.config.ts (Vercel usa su propio runtime) — el Dockerfile deja de usarse.
- **CRÍTICO — workers**: Vercel serverless NO aloja procesos largos `entrypoint.mjs`. Opciones:
  a) Vercel Cron (endpoints `/api/cron/reminders` etc.) + función serverless que ejecute el job con actor de servicio. Límites: plan Hobby ≈ crons limitados (2/día); recordatorios cada N minutos exige Pro (~US$20/mes).
  b) Supabase: `pg_cron` + funciones SQL/Edge Functions para el polling de jobs.
  c) Worker mínimo en un VPS/Coolify residual apuntando a Supabase (puente temporal).
- **CRÍTICO — storage local**: el filesystem `.quarantine` no persiste en Vercel. Implementar adapter S3 real → **Supabase Storage** (S3-compatible) o Cloudflare R2. Pendiente además el escaneo AV real (hoy stub).
- PWA/offline (`app/offline`, service worker shell): verificar comportamiento en Vercel (funciona; requiere HTTPS + rutas correctas).
- Dominio: `dental.nexolabs.cloud` → CNAME a Vercel, o dominio nuevo del producto.

### 2.2 Supabase (Postgres + Storage)
- Las migraciones SQL son Postgres puro: `pgcrypto` y `btree_gist` están disponibles en Supabase. Aplicables vía SQL editor / `supabase db push` (necesita credencial del rol `postgres` o access token).
- **PUNTO DE VALIDACIÓN TEMPRANA — modelo RLS rol-app**: Supabase no es un Postgres "libre" clásico:
  - El rol `postgres` del proyecto es el dueño (puede `CREATE ROLE` vía SQL editor).
  - Verificar si se puede replicar `nexodent_app` LOGIN NOSUPERUSER NOBYPASSRLS + grants, o si hay que conectar la app con el rol `postgres`/`service_role` manteniendo `FORCE RLS` (el dueño con FORCE RLS SÍ respeta las políticas).
  - `SECURITY DEFINER` con owner postgres: comportamiento esperado OK (patrón común en Supabase).
  - **Decisión de diseño**: si Supabase complica el rol-app, alternativa: la app se conecta con `service_role` y la tenancy se resuelve SIEMPRE por `runAsTenant` (GUC) — misma semántica actual, menos "Postgres purista".
- No hay datos de clientes reales hoy (solo seed demo) → la "migración de datos" es migrar esquema + re-seed. Si Bryan ya tiene clínicas reales en Coolify, sería dump/restore + sync de ids.
- Storage: buckets privados + políticas; reemplazar `STORAGE_*` por credenciales Supabase Storage.

### 2.3 Clerk (auth)
- Reemplaza Better Auth por completo:
  - Eliminar: `app/api/auth/[...all]/route.ts`, `lib/auth.ts` (betterAuth+customSession), middleware de Better Auth (`getSessionCookie`), import de `better-call` en request-context.
  - Añadir: `@clerk/nextjs`, `clerkMiddleware()`, `auth()` server-side, webhooks (usuario creado/actualizado → sync con tabla `users` local), manejo de sesión.
- **El modelo de tenancy NO se toca**: organizations/sites/memberships siguen en Postgres. La app resuelve `activeMembershipForUser(clerkUserId→userId local)` igual que hoy. El claim custom de Better Auth se sustituye por búsqueda local server-side (misma función `app_resolve_active_membership`).
- Flujos a rehacer: login, registro + onboarding (crear organización/site/membership gatillado por userId de Clerk), rutas públicas (`/r/[orgSlug]`, `/e/[token]`, public-booking) que NO deben pasar por Clerk, reset/verificación de email (Clerk lo cubre), demo login.
- Costo: Clerk Free ≈ 10k MAU; Pro ~US$20/mes. Considerar que cada usuario/clínica real consume MAU.
- **Trade-off a decisión de Bryan** (informada): el auth actual funciona y está testeado; Clerk aporta social login/MFA/gestión gestionada, pero añade costo por MAU + dependencia externa + reescritura de la capa de sesión. Alternativa de menor riesgo: conservar Better Auth y migrar solo BD+hosting (Supabase+Vercel). Si el objetivo es "salir de Coolify con lo mínimo", esa vía es ~40% del trabajo. **Recomendación: decidir consciente.**

### 2.4 Email (requisito transversal)
- Clerk envía sus propios correos transaccionales de auth.
- Recordatorios de citas de las clínicas (tabla notifications) necesitan un provider: Resend (nativo en Vercel, free 3k/mes), SendGrid, etc. Implementar el `deliver` real (hoy stub).

## 3. Estrategia recomendada: migración por fases con shadow + cutover

NO big-bang. Coolify sigue vivo como rollback hasta validar.

- **Fase 0 — Decisiones y cuentas** (requiere a Bryan): cuentas Vercel/Supabase/Clerk + tokens; decisión workers (cron vs pg_cron vs worker residual); provider email; dominio; confirmar si hay datos reales o solo demo; presupuesto (free vs Pro).
- **Fase 1 — Supabase DB (paralelo, sin tocar Coolify)**: crear proyecto; aplicar migraciones 0000–0009; adaptar `provision.ts` al modelo Supabase (rol app o service_role+runAsTenant); correr `test:integration` de tenancy/RLS contra Supabase (validación temprana del punto 2.2). Re-seed demo.
- **Fase 2 — Clerk**: integrar auth, middleware, webhooks user-sync, flujos login/registro/onboarding, rutas públicas. Correr unit+integration+smoke.
- **Fase 3 — Storage + Email**: adapter Supabase Storage (reemplaza localQuarantineStore); conectar provider email y worker reminders.
- **Fase 4 — Workers destino**: según decisión de Fase 0 (Vercel Cron / pg_cron / worker residual).
- **Fase 5 — Deploy Vercel**: import repo, envs (DATABASE_URL Supabase, CLERK_*, STORAGE_*, EMAIL_*, AUTH_URL/APP_URL), dominio, HTTPS/PWA. Health + smoke + prueba PWA.
- **Fase 6 — Cutover**: DNS dental.nexolabs.cloud → Vercel; ventana de observación (1 semana) con Coolify como rollback; descomisión.

## 4. Riesgos principales
1. RLS rol-app vs Supabase (validar en Fase 1 — es el mayor riesgo técnico).
2. Clerk cambia el contrato de sesión: tocar middleware + requestTenantContext + 6+ llamadas + flujos de auth y rutas públicas.
3. Workers no corren en serverless: plan claro o los recordatorios mueren.
4. Storage local → remoto: obligatorio antes del cutover (si hay documentos de pacientes).
5. Costos recurrentes nuevos (Vercel/Supabase/Clerk/email) vs Coolify ya pagado en el VPS.
6. Email nunca implementado: los recordatorios de citas (feature de venta clave) requieren provider real.

## 5. Requisitos para efectuarla (checklist para Bryan)
1. Cuentas y tokens: Vercel (import repo nexolab-ia/nexodent), Supabase (URL + service_role o access token), Clerk (CLERK_SECRET_KEY + publishable key). ¿Ya existen? Si no, crearlas.
2. Decisión auth: ¿Clerk sí o mejor conservar Better Auth (menor riesgo/costo)? (ver 2.3)
3. Decisión workers: Vercel Cron / Supabase pg_cron / worker residual en VPS.
4. Provider email (Resend recomendado).
5. Storage destino confirmado (Supabase Storage OK).
6. Dominio de producción (¿mantener dental.nexolabs.cloud vía CNAME, o dominio propio del producto?).
7. Confirmar si existe data real de clínicas/usuarios en Coolify (hoy parece solo seed demo).
8. Presupuesto mensual aceptable (free tiers vs planes Pro: Vercel US$20, Supabase US$25, Clerk US$20).

## 6. Reglas de ejecución
- Hermes = arquitecto/orquestador: escribe briefs (BRIEF-CODEX-MIG-*) y supervisa; Codex implementa.
- NO tocar código de auth/RLS sin brief aprobado. NO desplegar sin decir comandos. NO imprimir secretos.
- Guardar credenciales nuevas en ~/.hermes/home/.secrets/ (nunca en el repo ni /opt/data).
