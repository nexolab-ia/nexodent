# REPORTE-CODEX-23 — Alta completa de paciente en drawer

## Resumen

Se ejecutaron T1–T6 en orden. El alta rápida fue reemplazada por un drawer derecho de altura completa, con bottom-sheet bajo 768 px, fichas persistentes de información personal y odontológica, catálogo tenant-scoped de convenios y persistencia del perfil ampliado. Se mantuvo la compatibilidad de `createPatient`, el consentimiento obligatorio y todas las operaciones de la acción web dentro de `runAsTenant`.

No se realizó commit, push ni deploy. No se imprimieron secretos.

## Decisión UX

Se aplicó el patrón indicado: drawer derecho en escritorio y bottom-sheet en móvil. Es apropiado porque el alta es contextual y debe conservar visible la agenda/listado; un modal centrado bloquea demasiado contexto y ofrece poco espacio para más de diez campos. Un popover superior no escala con dos fichas y scroll, y una superficie superior izquierda rompe el flujo visual esperado. El componente conserva `<dialog>.showModal()`, por lo que mantiene foco modal y cierre con Escape.

## T1 — Migración y schema

Archivo: `db/migrations/0010_patient_profile.sql`.

```sql
-- 0010: perfil completo de paciente + catálogo de convenios (tenant-scoped)
CREATE TABLE convenios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name varchar(120) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE convenios ADD CONSTRAINT convenios_id_organization_unique UNIQUE (id, organization_id);
ALTER TABLE convenios ADD CONSTRAINT convenios_organization_name_key UNIQUE (organization_id, name);

ALTER TABLE convenios ENABLE ROW LEVEL SECURITY;
ALTER TABLE convenios FORCE ROW LEVEL SECURITY;
CREATE POLICY convenios_read_tenant ON convenios FOR SELECT
  USING (organization_id = current_setting('app.organization_id', true)::uuid);
CREATE POLICY convenios_write_manage ON convenios FOR ALL
  USING (organization_id = current_setting('app.organization_id', true)::uuid
         AND current_setting('app.role', true) IN ('organization_admin','independent_owner'))
  WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid
         AND current_setting('app.role', true) IN ('organization_admin','independent_owner'));

ALTER TABLE patients ADD COLUMN sex varchar(16);
ALTER TABLE patients ADD COLUMN birth_date date;
ALTER TABLE patients ADD COLUMN phone_secondary varchar(48);
ALTER TABLE patients ADD COLUMN city varchar(120);
ALTER TABLE patients ADD COLUMN address varchar(240);
ALTER TABLE patients ADD COLUMN convenio_id uuid;
ALTER TABLE patients ADD CONSTRAINT patients_sex_valid
  CHECK (sex IS NULL OR sex IN ('female','male','other','unspecified'));
ALTER TABLE patients ADD CONSTRAINT patients_birth_date_not_future
  CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE);
ALTER TABLE patients ADD CONSTRAINT patients_convenio_tenant_fk
  FOREIGN KEY (convenio_id, organization_id) REFERENCES convenios(id, organization_id) ON DELETE RESTRICT;
COMMENT ON COLUMN patients.notes IS 'Observaciones generales de la ficha del paciente.';
```

`db/schema/clinical.ts` y `db/schema/snapshot.json` quedaron sincronizados en versión `0010`. El barrel ya exportaba `./clinical`. `db/rollback.ts` elimina `organizations CASCADE`, por lo que también elimina `convenios`; no requirió modificación.

## T2 — Fixture demo

Se agregaron IDs estables para `FONASA` y `Convenio Empresa`. El fixture inserta ambos con `ON CONFLICT (id) DO UPDATE`, y `db/provision.ts` ya ejecutaba la fixture después de migraciones y GRANTs.

## T3 — Dominio y pruebas unitarias

`PatientInput` admite opcionalmente sexo, fecha de nacimiento ISO, segundo teléfono, ciudad, dirección, convenio y observaciones. La validación normaliza espacios y email, valida enum, UUID y fecha no futura según Santiago, sin romper inputs anteriores. Se agregaron casos unitarios de compatibilidad, vacíos opcionales, sexo inválido y fecha inválida/futura.

## T4 — Acciones

`createPatient` persiste todos los campos nuevos, mapea observaciones a `notes` y comprueba dentro de la misma transacción que el convenio pertenezca al tenant y esté activo. `createPatientFromTopbar` extrae todos los campos nuevos y permanece envuelta en `runAsTenant`. `listActiveConvenios` usa `requestTenantContext` + `runAsTenant`.

## T5 — Plomería

El layout protegido obtiene convenios activos en servidor y los pasa por `AppShell` a `TopbarActions` mediante el tipo `ConvenioOption`.

## T6 — UI

El `<dialog>` ahora contiene header, cierre explícito, fichas ARIA, ambas secciones montadas con `hidden`, cuerpo con scroll y footer fijo con consentimiento y acciones. Incluye los campos y copy especificados. El CSS usa los tokens existentes, drawer derecho ≥768 px, bottom-sheet a 375 px, targets de 44 px y animación de 180 ms desactivable mediante preferencias de movimiento reducido.

## Evidencia de verificación

### 1. Lint

```text
$ timeout 300 npm run lint
> eslint app db lib features workers tests middleware.ts
EXIT: 0 — PASS
```

### 2. Build

```text
$ timeout 420 npm run build
✓ Compiled successfully
✓ Generating static pages using 7 workers (25/25)
EXIT: 0 — PASS
```

Better Auth emitió advertencias por el secreto por defecto durante prerender, sin exponer ningún valor y sin afectar el resultado.

### 3. Tests

El repositorio no define `npm test`; se intentó dos veces según la regla anti-bloqueo y ambos intentos terminaron con `Missing script: "test"`. Luego se ejecutaron las suites declaradas:

```text
$ npm run test:unit
11 archivos PASS; 1 archivo FAIL; 47/48 tests PASS.
Fallo preexistente/no relacionado: tests/unit/foundation.test.ts intenta leer docker-compose.yml,
pero el repositorio contiene docker-compose.yaml.
Los casos nuevos de perfil en clinical-odontogram.test.ts pasan.

$ npm run test:integration
9 archivos PASS; 20 tests PASS. EXIT 0.

$ npm run test:smoke
8 archivos PASS; 1 archivo FAIL; 18/19 tests PASS.
Fallo preexistente/no funcional: pwa.spec.ts exige el literal @media(max-width:760px),
que tampoco existe en HEAD (los breakpoints del proyecto son 680/767/1100 px).
```

No se alteraron archivos ajenos al alcance para maquillar esas dos expectativas obsoletas.

### 4. Migraciones 0000–0010 + seed ×2

Se levantó PostgreSQL 18 efímero con `embedded-postgres`, se ejecutó `provision` dos veces y se consultó el catálogo sin imprimir credenciales:

```json
{
  "migrations": 11,
  "columns": ["address", "birth_date", "city", "convenio_id", "phone_secondary", "sex"],
  "conveniosRls": {"rls": true, "force": true},
  "policies": ["convenios_read_tenant", "convenios_write_manage"],
  "fk": "patients_convenio_tenant_fk",
  "seedConveniosAfterTwice": 2
}
```

Primera ejecución: 11 migraciones aplicadas y fixture cargado. Segunda ejecución: sin migraciones pendientes, fixture cargado nuevamente y exactamente 2 convenios; PASS de idempotencia.

### 5. Flujo real y persistencia

No fue posible completar automatización visual servida: intento 1 encontró que no existe ningún archivo `.env`, por lo que falta configuración runtime; intento 2 confirmó que no hay Playwright ni ejecutable Chromium instalado. Conforme a la regla anti-bloqueo, se continuó sin inventar evidencia visual.

Como verificación runtime de la ruta crítica de datos, sobre PostgreSQL efímero y usando el rol `nexodent_app` NOBYPASSRLS, `runAsTenant` y `createPatient`, se creó un paciente con convenio FONASA y se leyó la fila resultante:

```json
{
  "sex": "female",
  "birth_date": "1990-05-04",
  "phone_secondary": "+56911112222",
  "city": "Santiago",
  "address": "Calle Demo 123",
  "convenio_id": "10000000-0000-4000-8000-000000000031",
  "notes": "Observación de verificación"
}
```

La comprobación estática confirma `showModal`, fichas con `hidden`, redirect `/patients/${patientId}` y media query `max-width: 767px`. Queda pendiente una comprobación visual manual desktop/375 px cuando exista configuración runtime y navegador.

### 6. Voseo

```text
$ grep -rnoE "Entrá|Conocé|tenés|Querés|Ingresá|Gestioná|Registrá|podés" app/ components/ features/ --include="*.tsx"
Sin coincidencias. GREP_EXIT: 1 — PASS.
```

### Integridad del diff

```text
$ git diff --check
Sin salida. EXIT 0 — PASS.
```

## Archivos tocados por este brief

- `db/migrations/0010_patient_profile.sql`
- `db/schema/clinical.ts`
- `db/schema/snapshot.json`
- `db/fixtures/demo.ts`
- `features/clinical-records/domain.ts`
- `features/clinical-records/actions.ts`
- `app/(app)/patients/actions.ts`
- `app/(app)/layout.tsx`
- `components/layout/app-shell.tsx`
- `components/layout/topbar-actions.tsx`
- `app/globals.css`
- `tests/unit/clinical-odontogram.test.ts`
- `REPORTE-CODEX-23.md`

## Desvíos

- No se pudo ejecutar el recorrido visual servido por falta simultánea de configuración runtime y navegador automatizable. Se documentó tras dos comprobaciones y se sustituyó únicamente la comprobación de persistencia por ejecución real contra PostgreSQL efímero; no se declara PASS visual.
- `npm test` no existe. Se ejecutaron las tres suites que sí declara `package.json` y se conservaron visibles dos fallos preexistentes/no relacionados.
