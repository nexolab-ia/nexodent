# REPORTE-CODEX-21 — Dashboard Resumen

## Resumen ejecutivo

Se implementaron T1–T7 en orden: migración 0009, dominio puro con cobertura DST, payload tenant-aware, mutaciones auditadas, nueva ruta `/dashboard`, landing post-login y navegación, UI responsive según `DESIGN.md`, seed demo relativo a Santiago y verificación completa. No se hizo commit, push ni deploy y no se imprimieron secretos.

El dashboard ejecuta todas sus lecturas dentro de un único `runAsTenant`; dentro de esa transacción las consultas son secuenciales para no multiplexar sentencias sobre la misma conexión. La vista `clinic` filtra por organización y deja que RLS aplique su frontera; `own` agrega `professional_membership_id`.

## T1 — Migración 0009, schema y snapshot

Archivo: `db/migrations/0009_dashboard.sql`.

SQL exacto relevante:

```sql
ALTER TABLE appointments
  ADD COLUMN patient_id uuid,
  ADD COLUMN attendance varchar(16),
  ADD CONSTRAINT appointments_patient_tenant_fk
    FOREIGN KEY (patient_id, organization_id) REFERENCES patients(id, organization_id) ON DELETE RESTRICT,
  ADD CONSTRAINT appointments_attendance_valid
    CHECK ((kind <> 'appointment') OR attendance IS NULL OR attendance IN ('attended', 'missed')),
  ADD CONSTRAINT appointments_cancelled_attendance_empty
    CHECK ((status <> 'cancelled') OR attendance IS NULL);

ALTER TABLE appointment_history
  DROP CONSTRAINT appointment_history_action_check,
  ADD CONSTRAINT appointment_history_action_check
    CHECK (action IN ('created','updated','rescheduled','cancelled','status.confirmed','attendance.marked'));

CREATE OR REPLACE FUNCTION app_clinical_allowed(p_org uuid, p_site uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT app_site_allowed(p_org, p_site) AND current_setting('app.role', true) IN ('organization_admin','professional','independent_owner')
$$;
```

`db/schema/scheduling.ts` refleja ambas columnas, los dos CHECK, la FK compuesta y exporta `AppointmentAttendance`. `db/schema/snapshot.json` avanzó a versión `0009`, incorporó las tablas conocidas y describe las columnas nuevas.

### Evidencia de aplicación

La DB dev configurada no estuvo disponible:

```text
$ timeout 420 npm run db:migrate
Database configuration is required for migration.
```

Segundo intento razonable: PostgreSQL 18 embebido efímero, migraciones 0000–0009, seed dos veces y consulta de catálogo (sin exponer credenciales):

```json
{
  "migrations": 10,
  "columns": [
    {"column_name":"attendance","data_type":"character varying","is_nullable":"YES"},
    {"column_name":"patient_id","data_type":"uuid","is_nullable":"YES"}
  ],
  "checks": [
    {"conname":"appointments_attendance_valid"},
    {"conname":"appointments_cancelled_attendance_empty"}
  ],
  "adminClinicalRead": true,
  "dashboardAppointments": 9,
  "seedSecondRun": "ok"
}
```

## T2 — Dominio puro

- `features/dashboard/domain.ts`: `DayScope`, `DayDate`, scope por rol, porcentajes/deltas, fecha Santiago, suma local y bounds con DST.
- `tests/unit/dashboard.test.ts`: roles, bordes, fechas inválidas, verano UTC-3 e invierno UTC-4, ocupación y asistencia nulas.

Evidencia:

```text
$ timeout 420 npx vitest run tests/unit/dashboard.test.ts
Test Files  1 passed (1)
Tests       4 passed (4)
```

## T3 — Queries y mutaciones

- `features/dashboard/actions.ts`: payload tipado único con KPIs, agenda, finanzas, salud, presupuestos y evoluciones; todos los bigint se convierten con `Number()`.
- Nombres profesionales: join `appointments → memberships → users`; box/site con LEFT JOIN.
- Sparkline: agrupación calendario `America/Santiago` y siete puntos completados con cero en JS.
- Evoluciones: visible para todo rol salvo assistant para reflejar el permiso RLS de lectura explícito del admin.
- `features/scheduling/actions.ts`: confirmar y marcar asistencia con autorización propia para profesional, site-aware para otros roles e historial before/after.
- `app/(app)/dashboard/actions.ts`: wrappers server delgados, `requestTenantContext`, `runAsTenant` y `revalidatePath`.

## T4–T5 — Ruta, landing, navegación y UI

- `app/(app)/dashboard/page.tsx`: server component, navegación de día, selector, scope, cuatro KPIs, agenda accionable, salud, ingresos, planes y evoluciones.
- `app/globals.css`: sección Dashboard, tokens existentes, grids 4→2→1, layout 2fr/1fr→1, chips, métricas, barras, empty/denied states y controles responsive.
- `components/layout/app-shell.tsx`: “Resumen” primero.
- Redirects cambiados a `/dashboard`: login, registro, onboarding y demo.
- `middleware.ts`: `/dashboard` protegido y en matcher.
- `app/sw.ts`: `/dashboard` excluido de caché.
- `tests/smoke/demo.spec.ts`: expectativas actualizadas al nuevo destino.

Detector Impeccable:

```text
$ node .agents/skills/impeccable/scripts/detect.mjs --json
[]
```

## T6 — Seed demo aditivo

`db/fixtures/demo.ts` agrega datos relativos al día real de Santiago: disponibilidad existente reutilizada, cuatro pacientes deterministas, seis citas de hoy, tres históricas con asistencia, una evolución posterior, cinco pagos, un cargo y dos presupuestos con versión. Todos tienen UUID estable y operaciones idempotentes; el seed detecta schema parcial para conservar compatibilidad con tests de migraciones antiguas.

La ejecución doble en PostgreSQL embebido terminó con `seedSecondRun: "ok"` y 9 citas `seed-dashboard`.

## T7 — Resultados de verificación

### Build — PASS

```text
$ timeout 420 npm run build
✓ Compiled successfully in 23.9s
✓ Generating static pages using 7 workers (23/23)
ƒ /dashboard
```

Better Auth emitió avisos por secret predeterminado durante generación estática; el build terminó exitosamente y no se mostró ningún valor secreto.

### Unit — PASS salvo excepción ajena permitida

```text
$ timeout 420 npm run test:unit
Test Files  1 failed | 11 passed (12)
Tests       1 failed | 46 passed (47)
FAIL tests/unit/foundation.test.ts
ENOENT: no such file or directory, open 'docker-compose.yml'
```

Es exactamente la excepción permitida por el brief: el repo contiene `docker-compose.yaml`, no `docker-compose.yml`. No se modificó infraestructura fuera de alcance. El test nuevo del dashboard pasó 4/4 por separado.

### Smoke — PASS

```text
$ timeout 420 npm run test:smoke
Test Files  9 passed (9)
Tests       19 passed (19)
```

### Integración — PASS

```text
$ timeout 420 npm run test:integration
Test Files  9 passed (9)
Tests       20 passed (20)
```

Incluye `rls-clinical.test.ts`: admin lee `clinical_records` usando rol de aplicación `NOSUPERUSER NOBYPASSRLS`.

### Lint — PASS

```text
$ timeout 420 npm run lint
> eslint app db lib features workers tests middleware.ts
```

### Whitespace — PASS

```text
$ git diff --check
# sin salida
```

### Voseo — PASS (0 coincidencias)

```text
$ grep -RInE 'Entrá|Gestioná|Conocé|Querés|tenés|podés|Intentá|Ingresá|Confirmá|Marcá' 'app/(app)/dashboard' features/dashboard db/migrations/0009_dashboard.sql tests/unit/dashboard.test.ts
# sin salida
```

### Redirects post-auth a agenda — PASS (0 coincidencias)

```text
$ grep -RInE 'redirect\("/agenda"\)|router\.replace\("/agenda"\)|redirectTo: "/agenda"|new URL\("/agenda"' app middleware.ts components
# sin salida
```

Los `/agenda` restantes son legítimos: navegación al módulo, exclusión de caché y prefijo protegido.

### Procesos Next al cierre

```text
$ pgrep -af 'next build|next-server'
# ningún next-server persistente
```

## Cambios por archivo

- `db/migrations/0009_dashboard.sql`: columnas/FK/CHECK, acciones history y RLS clinical-admin.
- `db/schema/scheduling.ts`, `db/schema/snapshot.json`: espejo declarativo 0009.
- `features/dashboard/domain.ts`: fechas y métricas puras.
- `features/dashboard/actions.ts`: agregación completa tenant-aware.
- `features/scheduling/actions.ts`: confirmar/asistencia con auditoría.
- `app/(app)/dashboard/actions.ts`, `page.tsx`: server actions y pantalla.
- `app/globals.css`: primitivas visuales Dashboard.
- `db/fixtures/demo.ts`: seed relativo e idempotente.
- `middleware.ts`, `app/sw.ts`, `components/layout/app-shell.tsx`: protección, caché y nav.
- `app/login/*`, `app/registro/page.tsx`, `app/onboarding/*`, `app/api/demo/sign-in/route.ts`: landing post-auth.
- `tests/unit/dashboard.test.ts`, `tests/integration/rls-clinical.test.ts`, `tests/smoke/demo.spec.ts`: cobertura nueva y expectativas de navegación.

## Decisiones relevantes

1. `DayDate` es un objeto `{year, month, day}` para no confundir calendario local con instante UTC.
2. No se agregó índice: `appointments_scope_time_idx` cubre organización/sitio/tiempo y el brief desaconseja uno adicional sin evidencia.
3. Las consultas son secuenciales dentro de una única transacción tenant para respetar la conexión postgres.js.
4. El admin clínico obtiene solo lectura efectiva por RLS; escrituras siguen bloqueadas por `authorize()`.
5. El seed conserva compatibilidad con suites que levantan solo migraciones tempranas detectando la presencia del schema dashboard.

## Pendientes para el orquestador

- Aplicar migración 0009 en dev persistente cuando exista `DATABASE_URL`, repetir la consulta de catálogo y ejecutar `npm run seed` allí.
- Aplicar migración y seed en producción con el procedimiento operativo aprobado.
- Revisar el working tree y decidir commit/push/deploy. Este agente no hizo ninguna de esas operaciones.
