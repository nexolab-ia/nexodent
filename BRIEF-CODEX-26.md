# BRIEF-CODEX-26 — Configuración Fase 2: página "Organización" funcional (información de la clínica + horario de atención)

## Contexto (especificación de Bryan, 2026-09-03)

La página **Organización** (hoy scaffold en `/settings/organizacion`) administra "la información básica y configuración de tu clínica". Contenido en **modo tarjetas**:

### Tarjeta 1 — "Información de la clínica"
- **Imagen/logo de la clínica**: carga de archivo, tamaño máximo **200×200 px** (validar y redimensionar en cliente; preview).
- **Nombre de la clínica**
- **Dirección**
- **Ciudad** (selector con regiones de Chile, MISMO dataset del onboarding `app/onboarding/regions.ts` — patrón ya usado en el drawer de paciente)
- **Email de contacto**
- **Teléfono principal** y **Teléfono secundario** (reutilizar `PhoneField` con bandera +56 del BRIEF-CODEX-24)

### Tarjeta 2 — "Horario de atención"
- Define horario de apertura y cierre de la clínica: **a un lado la hora de apertura, al otro la hora de cierre** (dos inputs `time` lado a lado).

## Estado actual (verificado por el orquestador)

- `organizations`: `name` en columna; los datos de contacto viven en `settings` jsonb con forma EXACTA (creada por `app_create_onboarding`, migración 0008):
  ```json
  { "contact": { "country":"Chile", "city":"…", "address":"…", "primaryPhone":"+56…", "secondaryPhone":"+56…", "contactEmail":"…" } }
  ```
  (en demo el settings solo tiene `{"marker":"DATOS FICTICIOS…"}` → los campos salen vacíos, correcto).
- RLS `organizations_tenant_scope` (0001) permite UPDATE del propio tenant a cualquier miembro; la frontera de escritura REAL es el authorize de app: `authorize(actor,"org:manage")` (solo `organization_admin` e `independent_owner` la tienen en `features/tenant-identity/authorize.ts`). NO hace falta migración nueva: se actualiza con merge de jsonb dentro de `runAsTenant`.
- Audit pattern: `audit_logs` (organization_id, actor_membership_id, action, entity, entity_id, before, after, reason) — insertar igual que tenant-identity (`'organization.updated'`, entity `'organization'`).
- `PhoneField` (components/forms/phone-field.tsx) NO tiene prefilled: hay que extenderlo con prop opcional `initialValue` (E.164 completo, ej. `+56912345678`) que parsea: si empieza con el `dial` del país activo → quita el prefijo y deja el resto como `national`; si no, deja el valor tal cual.
- `COUNTRY_OPTIONS` en `app/onboarding/regions.ts` (data pura, importable en server).
- Página actual: `app/(app)/settings/organizacion/page.tsx` (scaffold con badge). Layout settings ya existe con menú vertical.
- NOTA UX: demo org no tiene `contact` → formulario con campos vacíos + nombre de la org prellenado; el flujo real (org creada por onboarding) muestra los valores guardados.

## Diseño

### Datos nuevos en settings (merge, sin migración)
- `settings.contact` se REEMPLAZA completo al guardar la tarjeta 1 (misma forma que 0008: jsonb_strip_nulls con country/city/address/primaryPhone/secondaryPhone/contactEmail; country se conserva del valor actual si el form no lo edita — el form solo edita city, no country).
- `settings.logo`: data-URL PNG/JPEG/WebP (≤ ~220.000 chars tras redimensionar a ≤200×200).
- `settings.schedule`: `{ "openTime": "HH:MM", "closeTime": "HH:MM" }` (24h).

### Server actions (NUEVO archivo `app/(app)/settings/organizacion/actions.ts`, "use server")
1. `updateOrganizationProfile(formData)`:
   - `authorize(actor,"org:manage")`.
   - Lee: `name`, `city`, `address`, `primaryPhone`, `secondaryPhone`, `contactEmail`, `logo` (opcional, hidden solo si el usuario subió logo), `logoClear` (marca "1" si el usuario quitó el logo).
   - Valida: name trim 2..160 (error "Ingresa el nombre de la clínica."); address requerido; city requerido y ≤120; contactEmail con regex `^\S+@\S+\.\S+$`; primaryPhone y secondaryPhone con patrón `/^[\d +-]{6,20}$/` (PhoneField ya entrega +56…); logo si viene: empieza con `data:image/(png|jpeg|webp);base64,` y largo ≤ 220_000 (error "El logo debe ser PNG, JPG o WebP de máximo 200×200 px.").
   - `runAsTenant(sql, actor, tx => {})`: obtiene `settings` actual (para `before`), hace:
     ```sql
     UPDATE organizations SET name=${name},
       settings = COALESCE(settings,'{}'::jsonb)
         || jsonb_build_object('contact', jsonb_strip_nulls(jsonb_build_object(
             'country', COALESCE(settings->'contact'->>'country','Chile'),
             'city', ${city}, 'address', ${address},
             'primaryPhone', ${primaryPhone}, 'secondaryPhone', ${secondaryPhone || null},
             'contactEmail', ${contactEmail.toLowerCase()})))
         || CASE WHEN ${logo} IS NOT NULL THEN jsonb_build_object('logo', ${logo})
                 WHEN ${logoClear} THEN '{}'::jsonb
                 ELSE '{}'::jsonb END
       WHERE id = ${actor.organizationId}
     ```
     ⚠️ La semántica de logo: si `logo` viene → set; si `logoClear==='1'` → `settings = settings - 'logo'` (jsonb delete, no set null); si ninguno → conservar.
   - Audit insert (before: {name, contact previo} acotado, after similar, reason `'settings.organization_profile'`).
   - `redirect('/settings/organizacion?ok=profile')`.
2. `updateOrganizationSchedule(formData)`:
   - authorize org:manage; lee `openTime`, `closeTime`; valida formato `HH:MM` (regex) y `open < close` (string compare válida en HH:MM 24h) → errores "Ingresa la hora de apertura."/"Ingresa la hora de cierre."/"La hora de cierre debe ser posterior a la de apertura.".
   - `settings = COALESCE(settings,'{}') || jsonb_build_object('schedule', jsonb_build_object('openTime',...,'closeTime',...))`; audit; `redirect('/settings/organizacion?ok=schedule')`.

### UI (`app/(app)/settings/organizacion/page.tsx` server)
- Lee org: `SELECT name, settings FROM organizations WHERE id=...` (runAsTenant) y parsea defaults (`contact` pudiendo no existir; `schedule.openTime/closeTime`; `logo`).
- Banner por `searchParams.ok`: `profile` → "Datos de la clínica actualizados."; `schedule` → "Horario de atención actualizado." (estilo `inline-notice` existente; manejar searchParams Promise como en dashboard).
- Render dos `<form>` independientes (cada tarjeta guarda lo suyo):

**Tarjeta 1** (`<section className="settings-card">`, header: h2 "Información de la clínica" + muted "Datos básicos y de contacto."):
- Fila logo + datos:
  - `<OrgLogoPicker name="logo" initial={settings.logo ?? null} />` (NUEVO client component, ver abajo) + helper muted "PNG, JPG o WebP de máximo 200×200 px."
  - Campos (labels exactos): Nombre de la clínica (input name="name" defaultValue org.name required maxLength 160), Dirección (name="address" defaultValue contact.address), Ciudad: `<select name="city">` con `<optgroup>` por región de `COUNTRY_OPTIONS[0].regions` y `defaultValue={contact.city ?? ""}` + opción placeholder "Selecciona la ciudad…" (si el valor actual no está en el dataset, agregarlo como option seleccionada para no perderlo), Email de contacto (type email name="contactEmail"), Teléfono principal (`<PhoneField name="primaryPhone" label="Teléfono principal" initialValue={contact.primaryPhone} required />`), Teléfono secundario (`<PhoneField name="phoneSecondary"…` — usar name `secondaryPhone` para coincidir con clave) — OJO nombres de campo: primaryPhone/secondaryPhone (igual que onboarding).
  - Botón submit `.button-primary` "Guardar cambios".
- Grid interno: 2 columnas en ≥560px (`.card-grid`), logo ocupa fila propia.

**Tarjeta 2** (`<section className="settings-card">`, h2 "Horario de atención" + muted "Horas de apertura y cierre de la clínica."):
- `.form-row` (grid 2 col) con dos `<label>`: "Horario de apertura" `<input type="time" name="openTime" defaultValue>` y "Horario de cierre" `<input type="time" name="closeTime">`.
- Botón `.button-primary` "Guardar horario".

### NUEVO client `components/settings/org-logo-picker.tsx`
- Props: `name`, `initial?: string | null`.
- UI: preview cuadrado 88×88 (imagen si hay logo; si no, placeholder con borde punteado + ícono de imagen); botón "Subir logo" (label asociado a input file hidden `accept="image/png,image/jpeg,image/webp"`); botón "Quitar" (solo si hay logo o inicial).
- Al elegir archivo: `FileReader` → `new Image()` → si ancho/alto >200 redimensionar con canvas a ≤200×200 (mantener aspecto, `image/png`, calidad 0.9) → set preview y un `<input type="hidden" name={name} value={dataUrl}>`. Si el archivo no es imagen o falla la decodificación → error inline `.field-error` "No pudimos leer la imagen. Prueba con PNG o JPG de máximo 200×200 px." (regla: canvas puede fallar por CORS solo con dataURL local → no hay problema).
- "Quitar": limpia preview + state y agrega hidden `name="logoClear" value="1"` (y elimina el hidden del logo si existía).

### CSS (`app/globals.css`, tokens DESIGN.md)
```css
.settings-card{display:grid;gap:1.1rem;padding:1.25rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface)}
.settings-card>header h2{margin:0;font:700 1.05rem var(--font-display)}
.settings-card>header p{margin:.3rem 0 0}
.card-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem}
@media (min-width:560px){.card-grid{grid-template-columns:9rem minmax(0,1fr)}.card-grid .logo-cell{grid-row:span 2}}
.logo-preview{display:grid;place-items:center;width:88px;height:88px;border-radius:14px;overflow:hidden;background:var(--surface-2);border:1px dashed var(--border)}
.logo-preview img{width:100%;height:100%;object-fit:contain}
.logo-actions{display:flex;gap:.5rem;margin-block-start:.6rem}
.logo-actions .button{min-height:2.5rem;padding:.45rem .75rem;font-size:13px}
.notice-banner{margin-block-end:1rem}  /* si hace falta para el inline-notice */
```
Ajustar a la composición real (Codex decide detalles finos, manteniendo el espíritu de tarjetas + aire de DESIGN.md).

## Tareas
### T1 — Extender `PhoneField` con `initialValue`
- Prop opcional `initialValue?: string`. En el estado inicial de `national`: si `initialValue` empieza con `country.dial` → `initialValue.slice(country.dial.length)` (limpiando espacios); si no → `initialValue` (legacy sin prefijo, no duplicar dial). Sin cambios de comportamiento cuando no se pasa.

### T2 — Server actions `settings/organizacion/actions.ts` (spec arriba)

### T3 — Page Organización + OrgLogoPicker + CSS

### T4 — Verificación
1. `timeout 300 npm run lint` → PASS (incluye lint directo a `components/settings/*.tsx` si el lint principal no cubre components — Key Learning del brief 25).
2. `timeout 420 npm run build` → PASS (si `.next/lock`: matar next-server + `rm -f .next/lock`).
3. `timeout 300 npm run test:unit` (47/48, fallo preexistente) e `timeout 420 npm run test:integration` (20/20). Si agregas unit tests de parseo de PhoneField initialValue o validación de schedule, mejor (tests/unit).
4. Estática: grep de labels/copy en la página; `defaultValue`s correctos; sin `En desarrollo` en organizacion; sin voseo (`Entrá|Conocé|tenés|Querés|Ingresá|Gestioná|Registrá|podés` → sin coincidencias).
5. Runtime: si hay DB efímera disponible (patrón REPORTE-CODEX-21/23), probar el UPDATE + audit con rol app NOBYPASSRLS (crear org de prueba con contact y schedule, actualizar, verificar merge y que `logo` se borra con logoClear). Si no, documentar.

## Reglas críticas
- NO commit/push/deploy. NO migración nueva (no hace falta). NO tocar RLS ni otras páginas. NO cambiar el comportamiento de PhoneField en otros formularios (initialValue es aditivo y opcional).
- Sin voseo. Sin emojis. Copy en tuteo chileno (labels exactos de arriba).
- Si algo falla tras 2 intentos, documentar y continuar.

## Reporte
Escribir `REPORTE-CODEX-26.md` en la raíz con diff resumido, evidencia y desvíos.
