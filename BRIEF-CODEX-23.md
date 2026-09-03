# BRIEF-CODEX-23 — Alta de paciente completa en panel lateral derecho (drawer) con fichas Información personal / Odontológica

## Contexto (especificación de Bryan, 2026-09-03)

El alta rápida de paciente actual (BRIEF-CODEX-22-B, `components/layout/topbar-actions.tsx`) es un `<dialog>` centrado con solo: Nombres, Apellidos, RUT, Teléfono, Email y consentimiento. Bryan pide reemplazarlo por un formulario de alta COMPLETO que cumpla UX/UI de calidad:

1. El formulario de agregar debe mostrarse **en el lado derecho de la pantalla** (panel lateral).
2. Debe incluir **Información personal del paciente**: nombre, apellido, el **RUT**, el **sexo**, la **fecha de nacimiento**, el **email**, un **teléfono principal**, un **teléfono secundario**, la **ciudad** y la **dirección**.
3. En el formulario debe haber un **mini menú** con dos opciones: **"Información personal"** y **"Información odontológica"**.
4. En "Información odontológica": la opción de **convenio** (si existe un convenio) y **observaciones generales** (texto largo).
5. Bryan dudaba entre superior-derecha, superior-izquierda o centro: **decidir el mejor patrón UX/UI** (decisión del arquitecto abajo) — NO usar modal centrado.

## Decisión del arquitecto — patrón UX (fundamentada)

**Panel lateral derecho tipo drawer (slide-over), full-height, con mini menú de fichas adentro. En móvil (<768px) el MISMO componente se convierte en bottom-sheet a ancho completo.**

Por qué (para documentar en el REPORTE):
- Un alta de paciente es una tarea **contextual**: el usuario está en la agenda/lista/dashboard y quiere crear sin perder de vista su pantalla. El drawer derecho mantiene el contexto visible a la izquierda; un modal centrado tapa todo y obliga scroll dentro de un recuadro pequeño con 10+ campos.
- Patrón estándar de SaaS moderno para "crear" con formularios medianos/largos (Linear, Notion, Stripe, Resend): panel derecho deslizable. El proyecto ya usa "panel derecho" como lenguaje (detalle de cita en la agenda, DESIGN.md).
- Arriba-izquierda queda descartado: rompe el flujo de lectura y no es un patrón conocido para creación. Arriba-derecha "colgando" (popover) no escala con 2 fichas y scroll. Centro (modal) es correcto para decisiones/confirmaciones, no para captura larga.
- Móvil: UX-PRINCIPIOS.md P1/anti-patrones exige bottom-sheet (nunca modal centrado). Con un único componente + media query se logra.

## Normativa y lecciones aplicables (OBLIGATORIO respetarlas)

- `DESIGN.md` (tokens CSS, dark 100% en app, acento cian único, radius 14, Space Grotesk display / Inter UI) y `UX-PRINCIPIOS.md` (mobile-first 320/375/768, targets ≥44px, P4 estados texto+color, P9 microcopy tuteo chileno sin voseo, Verificación UX checklist final).
- ⚠️ LECCIONES APRENDIDAS (de fases previas — NO repetir errores):
  1. TODA operación DB corre dentro de `runAsTenant(sql, actor, tx => ...)` con `set_config('app.organization_id'/'app.role', ..., true)` — nunca `sql` directo en server actions sobre tablas FORCE RLS.
  2. Nunca pasar objetos `Date` como parámetros de query dentro de transacciones bajo Next runtime (postgres.js + Turbopack rompe con ERR_INVALID_ARG_TYPE). Pasar `toISOString()`/strings ISO. La columna `birth_date` es `date` → guardar `"YYYY-MM-DD"` string.
  3. Migración + schema TS (`db/schema/clinical.ts`) + `db/schema/snapshot.json` se actualizan EN PARALELO (regla del PR1).
  4. Los GRANTs por tabla los hace `db/provision.ts` con el loop `GRANT ... ON ALL TABLES ... TO rol` DESPUÉS de aplicar migraciones (verificar ese orden al correr migración+provision en local; las policies RLS hacen el scoping real).
  5. Copy en español de Chile con TUTEO. PROHIBIDO voseo ("Registrá", "¿Querés?", "tenés"). Labels y mensajes nuevos en tuteo.
  6. Los tests pasan ≠ runtime sano: verificar SIEMPRE el flujo servido real (dev server + DB local + sesión demo: abrir drawer, cambiar ficha, crear paciente, ver redirect).
  7. Consentimiento del paciente es obligatorio (validatePatient exige consentGranted; no eliminarlo).
  8. No romper firma de `createPatient` (otros llamadores: migración/import CSV) — los campos nuevos son OPCIONALES en `PatientInput`.

## Estado actual (verificado por el orquestador)

- `components/layout/topbar-actions.tsx`: botón ＋ (`patientDialog.current?.showModal()`) abre `<dialog className="patient-dialog">` con `<form action={createPatientFromTopbar}>`; campos firstName/lastName/rut/phone/email + consent checkbox. Diálogo nativo (focus trap + Esc gratis). CSS actual en `app/globals.css`: `.patient-dialog{width:min(36rem,...);max-height:calc(100dvh-2rem);...}` y `@media(max-width:767px)` lo vuelve bottom-sheet.
- `app/(app)/patients/actions.ts`: `createPatientFromTopbar(formData)` valida RUT (`isValidRut/normalizeRut` de `lib/locale/cl.ts`), llama `createPatient` y `redirect('/patients/{id}')`.
- `features/clinical-records/actions.ts`: `createPatient(sql, actor, input, acceptDuplicate=false)` — authorize `patient:demographics`; INSERT actual: `(organization_id, first_name, last_name, rut, phone, email, consent_granted, consented_at)`; chequea duplicados por rut/phone/email.
- `features/clinical-records/domain.ts`: `PatientInput = { firstName; lastName; rut?; phone?; email?; consentGranted }` + `validatePatient` + `isLikelyDuplicate`.
- Tabla `patients` (0004): id, organization_id, first_name, last_name, rut varchar(32), phone varchar(48), email varchar(320), consent_granted, consented_at, **notes text (SIN uso actual — se reutiliza para observaciones generales)**, created_at, updated_at. UNIQUE NULLS NOT DISTINCT (organization_id, rut); UNIQUE (id, organization_id).
- NO existe entidad "convenio" en el schema. `patient:demographics` lo tienen organization_admin, professional, assistant, independent_owner (`features/tenant-identity/authorize.ts`).
- Shell: `app/(app)/layout.tsx` (server) → `<AppShell identity>` (`components/layout/app-shell.tsx`, server) → `<TopbarActions userName email pendingNotifications>` (client). Se puede pasar data por props desde el layout (server).
- Convención de IDs demo en `db/fixtures/demo.ts`: UUIDs fijos `10000000-0000-4000-8000-0000000000XX` (clinic=...01; usados hasta ...021). Migraciones 0000-0009; provision las aplica en orden vía tabla control `_nexodent_schema_migrations`.

## Tareas (en orden)

### T1 — Migración `db/migrations/0010_patient_profile.sql` (nueva)

SQL exacto (adaptar comentarios/estilo al de 0009):

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
-- Lectura: cualquier miembro del tenant (el alta de paciente y la ficha leen convenios activos)
CREATE POLICY convenios_read_tenant ON convenios FOR SELECT
  USING (organization_id = current_setting('app.organization_id', true)::uuid);
-- Escritura: solo administradores/dueño (catálogo = configuración de la clínica)
CREATE POLICY convenios_write_manage ON convenios FOR ALL
  USING (organization_id = current_setting('app.organization_id', true)::uuid
         AND current_setting('app.role', true) IN ('organization_admin','independent_owner'))
  WITH CHECK (organization_id = current_setting('app.organization_id', true)::uuid
         AND current_setting('app.role', true) IN ('organization_admin','independent_owner'));

-- Perfil ampliado del paciente
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
-- FK compuesta tenant-safe (mismo patrón que patients_id_organization_unique): un id de convenio
-- adivinado de otra organización no puede cruzar la frontera.
ALTER TABLE patients ADD CONSTRAINT patients_convenio_tenant_fk
  FOREIGN KEY (convenio_id, organization_id) REFERENCES convenios(id, organization_id) ON DELETE RESTRICT;

COMMENT ON COLUMN patients.notes IS 'Observaciones generales de la ficha del paciente.';
```

Actualizar EN PARALELO:
- `db/schema/clinical.ts`: exportar `convenios` (pgTable: id, organizationId, name varchar 120, isActive boolean default true, createdAt, updatedAt; unique organization_id+name y unique id+organization_id) y extender `patients` con: `sex varchar(16)`, `birthDate date`, `phoneSecondary varchar(48)`, `city varchar(120)`, `address varchar(240)`, `convenioId uuid` + foreignKey compuesta `patients_convenio_tenant_fk` (convenioId+organizationId → convenios.id+convenios.organizationId) siguiendo el patrón de clinicalRecords (no `.references()` simple si el resto usa FK compuesta). Asegurar export desde el barrel (`db/schema/index.ts`) si corresponde.
- `db/schema/snapshot.json`: versión `0010`, tabla convenios con columnas, columnas nuevas de patients.
- NO hace falta tocar `db/rollback.ts` (es DROP-all de tablas conocidas; verificar que no falle si convenios queda huérfana — si el DROP usa CASCADE sobre organizations está cubierto; añadir convenios al DROP si el script enumera tablas).

Verificación T1: aplicar migraciones 0000-0010 + seed 2 veces (idempotente) en Postgres efímero/local (patrón de REPORTE-CODEX-21 si la DB dev no está configurada). Consultar catálogo: columna `sex`/`birth_date` existen, `convenios` existe con RLS enabled y policies, `patients_convenio_tenant_fk` existe.

### T2 — Seed demo (`db/fixtures/demo.ts` + donde la fixture demo se ejecuta, p. ej. `db/provision.ts`)

- Agregar a `demoIds`: `convenioFonasa: "10000000-0000-4000-8000-000000000031"`, `convenioEmpresa: "10000000-0000-4000-8000-000000000032"`.
- Insertar 2 convenios de la org demo (Clínica Sonrisa Andes): `FONASA` y `Convenio Empresa`, `is_active = true`, con `ON CONFLICT (id) DO UPDATE` (idempotente, mismo patrón del seed de organizations). Marcar como data ficticia si el fixture lo hace por convención.
- La fixture debe correr en provision (demo en producción) — seguir el flujo existente que ya siembra patients/org.

### T3 — Dominio (`features/clinical-records/domain.ts`)

Extender tipos y validación (campos NUEVOS opcionales; no romper llamadores existentes):

```ts
export type PatientSex = "female" | "male" | "other" | "unspecified";
export type PatientInput = {
  firstName: string; lastName: string; rut?: string; phone?: string; email?: string;
  consentGranted: boolean;
  sex?: PatientSex; birthDate?: string; /* "YYYY-MM-DD" */ phoneSecondary?: string;
  city?: string; address?: string; convenioId?: string; observations?: string;
};
```

En `validatePatient`:
- Trim/undefined de todo lo nuevo; `email` minúsculas (existente); `sex` solo valores del enum (si llega otro → ClinicalValidationError "Selecciona una opción de sexo válida."); `birthDate` si viene: regex `^\d{4}-\d{2}-\d{2}$` + no futura (comparar contra hoy en Santiago vía helper existente del proyecto, ej. `todayInSantiago()` de `features/dashboard/domain`, formateada a ISO) → "La fecha de nacimiento no puede ser futura."; `convenioId` si viene: formato uuid.
- Mantener errores en español tuteo y el requisito de consentimiento.

Añadir tests unitarios (`tests/unit/`): validación de sexo inválido, birthDate futura/mal formada, campos opcionales vacíos → undefined, y que un input viejo (sin campos nuevos) sigue pasando.

### T4 — Acciones (`features/clinical-records/actions.ts` + `app/(app)/patients/actions.ts`)

`createPatient` (en `features/clinical-records/actions.ts`):
- Extender el INSERT con: `sex, birth_date, phone_secondary, city, address, notes, convenio_id` (mapear `observations` → columna `notes`; `convenioId` → `convenio_id`).
- Si `input.convenioId` viene: validar ANTES del INSERT dentro de la misma transacción: `SELECT 1 FROM convenios WHERE id=${convenioId} AND organization_id=${actor.organizationId} AND is_active` → si no existe, throw `"El convenio seleccionado no existe o no está activo."` (RLS lo permitiría por rol, pero el chequeo explícito da mejor error y cubre inactivos).
- `consented_at = now()` se mantiene; `notes` va con el texto de observaciones o null.

`createPatientFromTopbar` (en `app/(app)/patients/actions.ts`):
- Leer del formData: `sex`, `birthDate`, `phoneSecondary`, `city`, `address`, `convenioId`, `observations` (strings vacíos → undefined). RUT igual que hoy (validar si viene).
- NO cambiar `searchPatients` ni el resto.

NUEVA server action para listar convenios (misma carpeta):
```ts
export type ConvenioOption = { id: string; name: string };
export async function listActiveConvenios(): Promise<ConvenioOption[]> {
  // requestTenantContext + runAsTenant: SELECT id, name FROM convenios
  // WHERE organization_id = actor.organizationId AND is_active ORDER BY name
}
```

### T5 — Plomería server → cliente

- `app/(app)/layout.tsx`: obtener `const convenios = await listActiveConvenios();` y pasarlo a `<AppShell convenios={convenios}>`.
- `components/layout/app-shell.tsx`: aceptar prop `convenios: ConvenioOption[]` y pasarlo a `<TopbarActions convenios={convenios}>`.
- `components/layout/topbar-actions.tsx`: aceptar prop `convenios: ConvenioOption[]` (tipo importado de `@/app/(app)/patients/actions`).

### T6 — UI: drawer derecho + mini menú de fichas (`topbar-actions.tsx` + CSS)

Mantener `<dialog>` nativo y el botón ＋ actual; cambiar el CONTENIDO y la posición. Estructura DOM del nuevo contenido (form action={createPatientFromTopbar}):

```
<dialog className="patient-dialog">
  <form className="patient-form">
    <header className="drawer-heading">            // flex, border-bottom
      <div><h2 id="new-patient-title">Nuevo paciente</h2>
           <p>Completa la información de la ficha.</p></div>
      <button type="button" className="icon-button" aria-label="Cerrar alta de paciente" onClick={close}>X svg</button>
    </header>
    <div className="drawer-tabs" role="tablist" aria-label="Secciones de la ficha">
      <button role="tab" aria-selected={tab==='personal'} aria-controls="tab-personal" id="tab-personal-btn" ...>
        (svg persona) Información personal</button>
      <button role="tab" aria-selected={tab==='dental'} aria-controls="tab-dental" id="tab-dental-btn" ...>
        (svg diente) Información odontológica</button>
    </div>
    <div className="drawer-body">
      <section id="tab-personal" role="tabpanel" aria-labelledby="tab-personal-btn" hidden={tab!=='personal'}>…</section>
      <section id="tab-dental" role="tabpanel" aria-labelledby="tab-dental-btn" hidden={tab!=='dental'}>…</section>
    </div>
    <footer className="drawer-footer">
      <label className="consent-field"><input type="checkbox" name="consentGranted" required />
        El paciente autoriza el registro de sus datos.</label>
      <div className="drawer-actions">
        <button type="button" className="button" onClick={close}>Cancelar</button>
        <button type="submit" className="button button-primary">Crear paciente</button>
      </div>
    </footer>
  </form>
</dialog>
```

⚠️ **No desmontar las secciones al cambiar de ficha**: usar `hidden` (mantener ambos `<section>` montados) para que los datos escritos NO se pierdan al alternar. Estado local `const [tab, setTab] = useState<"personal"|"dental">("personal")`.

**Pestaña Información personal** (labels exactos, tuteo; usar clases existentes `label`, `.form-row`, inputs globales):

1. Fila (`.form-row`): `Nombres` (input name=firstName required, autocomplete given-name) | `Apellidos` (name=lastName required, autocomplete family-name)
2. Fila: `RUT` (REUTILIZAR `components/forms/rut-field.tsx` con name="rut" — valida y formatea en cliente; o input con placeholder 12.345.678-5 + validación server igual que hoy) | `Sexo` (select name=sex): opción vacía "Selecciona una opción" (value=""), `Femenino` female, `Masculino` male, `Otro` other, `Prefiere no indicar` unspecified
3. Fila: `Fecha de nacimiento` (input type=date name=birthDate, max = hoy) | `Correo electrónico` (input type=email name=email autocomplete email)
4. Fila: `Teléfono principal` (type=tel name=phone autocomplete tel) | `Teléfono secundario` (type=tel name=phoneSecondary)
5. `Ciudad` (name=city, clase `.field-full`: grid-column 1/-1, autocomplete address-level2)
6. `Dirección` (name=address, clase `.field-full`, autocomplete street-address)

**Pestaña Información odontológica**:
- `Convenio` (select name=convenioId): primera opción `Sin convenio` (value="") y luego `{convenios.map(c => <option value={c.id}>{c.name}</option>)}` (prop del server). Debajo helper `.muted` small: "Selecciona el convenio si el paciente pertenece a uno (FONASA, isapre, empresa)." Si `convenios` está vacío mostrar solo "Sin convenio" y el helper igual (no romper el form).
- `Observaciones generales` (textarea name=observations rows=6 maxLength=2000, clase `.field-full`): placeholder "Alergias, antecedentes y cualquier observación de la ficha."

**CSS nuevo en `app/globals.css`** (reemplazar el bloque `.patient-dialog` actual; mantener tokens de DESIGN.md; animaciones ≤200ms + `@media (prefers-reduced-motion: no-preference)`):

```css
/* Desktop ≥768px: drawer derecho full-height */
.patient-dialog {
  position: fixed; inset-block: 0; inset-inline: auto 0; /* anclado a la derecha */
  width: min(30rem, 100%); max-width: none; max-height: 100dvh; height: 100dvh;
  margin: 0; padding: 0; border: 0; border-inline-start: 1px solid var(--border);
  border-radius: 0; background: var(--surface); color: var(--ink); box-shadow: var(--shadow);
}
.patient-dialog::backdrop { background: rgba(2,6,23,.72); }
@keyframes drawer-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
@media (prefers-reduced-motion: no-preference) {
  .patient-dialog[open] { animation: drawer-slide-in .18s ease-out; }
}
/* <768px: bottom-sheet (el media query existente se ajusta) */
@media (max-width: 767px) {
  .patient-dialog { inset: auto 0 0 0; width: 100%; height: min(88dvh, 100dvh);
    border-radius: var(--radius) var(--radius) 0 0; border-inline-start: 0; }
}
```

`.patient-form`: flex column 100% height, gap 0; `.drawer-heading` como `.dialog-heading` existente + padding 1.1rem 1.25rem + border-bottom 1px var(--border); `.drawer-heading h2` con font display (Space Grotesk) tamaño 1.15rem. `.drawer-tabs`: contenedor segmented pill (reusar look de `.segmented`: padding .25rem, bg surface-2, border, radius 12px, margin 1rem 1.25rem 0) con 2 botones flex:1; botón activo: bg surface, color accent, font-weight 600; botón inactivo: color muted; min-height 44px (target táctil); iconos SVG de línea 16-18px + texto. `.drawer-body`: flex 1, overflow-y auto, padding 1.25rem, display grid gap 1rem, align-content start. `.field-full { grid-column: 1 / -1; }` `.drawer-footer`: border-top 1px var(--border), padding 1rem 1.25rem, display grid gap .9rem; `.drawer-actions { display:flex; gap:.75rem; }` con `.button` (Cancelar) y `.button-primary` (Crear paciente) flex:1 y min-height 44px. `.consent-field` (existe) reubicada en footer.

A11y: tablist con arrow keys opcionales; al menos click + `aria-selected`/`hidden`; dialog mantiene showModal (focus trap + Esc gratis); X cierra; clic en backdrop cierra (existe). Errores server: el form usa server action — mantener comportamiento actual (si la acción lanza, Next muestra el error; NO rediseñar manejo de errores en este brief).

**No tocar**: lógica de agenda/odontograma/cobros, RLS existente de otras tablas, `/patients` listado, ficha `[patientId]` (mostrar estos campos en la ficha es OTRO brief futuro), middleware, DESIGN.md/UX-PRINCIPIOS.md. No migrar pacientes existentes (columnas null OK).

## Copy (texto visible — tuteo chileno, PROHIBIDO voseo)

"Completa la información de la ficha." · "Información personal" · "Información odontológica" · "Selecciona una opción" · "Fecha de nacimiento" · "Teléfono principal" · "Teléfono secundario" · "Ciudad" · "Dirección" · "Sin convenio" · "Selecciona el convenio si el paciente pertenece a uno (FONASA, isapre, empresa)." · "Observaciones generales" · "Alergias, antecedentes y cualquier observación de la ficha." · "Cancelar" · "Crear paciente" · "El paciente autoriza el registro de sus datos." · errores: "Selecciona una opción de sexo válida.", "La fecha de nacimiento no puede ser futura.", "El convenio seleccionado no existe o no está activo."

## Verificación técnica (en orden, con evidencia en el REPORTE)

1. `timeout 300 npm run lint` → PASS.
2. `timeout 420 npm run build` → PASS (si `.next/lock` falla: matar next-server zombie + `rm -f .next/lock`).
3. Tests: `npm test` (unit/integration/security/smoke según el repo) → PASS. Al menos unit nuevos de T3 verdes.
4. Migraciones 0000-0010 + seed ×2 idempotente (Postgres efímero/local — patrón REPORTE-CODEX-21 si no hay DB dev): catálogo con columnas nuevas + convenios + policies + FK.
5. Flujo servido real (dev server http://127.0.0.1:3000 + DB local + sesión demo — mismo entorno de BRIEF-CODEX-22-B): login demo → botón ＋ → drawer se abre desde la derecha → alternar fichas SIN perder datos → completar con FONASA y observación → Crear paciente → redirect a /patients/{id} → verificar en DB que la fila tiene sex/birth_date/phone_secondary/city/address/convenio_id/notes. Verificar en 375px (bottom-sheet) que opera.
6. `grep -rnoE "Entrá|Conocé|tenés|Querés|Ingresá|Gestioná|Registrá|podés" app/ components/ features/ --include="*.tsx"` → sin voseo en lo nuevo.

## Reglas críticas

- NO hacer commit, NO push, NO deploy. NO imprimir secretos (envs solo por path).
- NO tocar RLS de tablas existentes ni código ajeno al alcance.
- Mantener firma de `createPatient` compatible hacia atrás.
- Si algo falla tras 2 intentos, documentar en el REPORTE y seguir con la siguiente tarea.

## Reporte

Escribir `REPORTE-CODEX-23.md` en la raíz del repo con: resumen, SQL final de migración, evidencia de cada verificación (salidas truncadas), archivos tocados, y cualquier desvío del spec con justificación.
