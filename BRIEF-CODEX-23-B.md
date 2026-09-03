# BRIEF-CODEX-23-B — Corrección UI alta paciente: Ciudad con selector de regiones del onboarding + drawer más ancho

## Contexto (feedback de Bryan, 2026-09-03, tras ver el BRIEF-CODEX-23 en producción)

1. El campo **Ciudad** del drawer de alta de paciente (hoy input de texto libre) debe usar el MISMO selector geográfico del alta de cuenta/onboarding: **`<select>` con `<optgroup>` por región, todas las regiones de Chile** (dataset ya existente `app/onboarding/regions.ts`, `COUNTRY_OPTIONS` — 16 regiones ~130 ciudades). Valor a BD = nombre visible de la ciudad (decisión ya tomada en onboarding; NO guardar códigos ISO).
2. El **drawer** puede ser **un poco más ancho**: subir de `min(30rem, 100%)` a `min(36rem, 100%)` en desktop (la pantalla se siente apretada con 10+ campos).

## Estado actual (verificado)

- `components/layout/topbar-actions.tsx`: campo Ciudad como `<input name="city" autoComplete="address-level2">` dentro de `<label className="field-full">` en la ficha personal (~línea 371-374).
- `app/onboarding/regions.ts`: exporta `interface CountryOption { code; name; regions: RegionOption[] }`, `interface RegionOption { id; label; cities: string[] }` y `COUNTRY_OPTIONS` (hoy solo Chile). NO es un archivo "use client" ni "use server" — es data pura, importable desde cualquier lado.
- `app/onboarding/profile-picker.tsx`: patrón de referencia `CityField` (~líneas 51-63): `<select name="city" defaultValue="">` con `<option value="" disabled>Selecciona tu ciudad…</option>` y `{regions.map(region => <optgroup key={region.id} label={region.label}>{region.cities.map(city => <option key={city} value={city}>{city}</option>)}</optgroup>)}`.
- `app/globals.css`: `.patient-dialog` desktop `width: min(30rem, 100%)`.

## Tareas (orden)

### T1 — Ciudad con selector de regiones (topbar-actions.tsx)

- Importar el dataset: `import { COUNTRY_OPTIONS } from "@/app/onboarding/regions";`.
- Sustituir el input de Ciudad por un `<select name="city" defaultValue="">` dentro del mismo `<label className="field-full">Ciudad …</label>`:
  - Primera opción: `<option value="" disabled>Selecciona una ciudad…</option>` (placeholder deshabilitado, igual patrón que onboarding).
  - Regiones del país activo derivadas de `COUNTRY_OPTIONS[0]` (NO hardcodear "Chile" ni su array: `const regions = COUNTRY_OPTIONS[0].regions;` — hoy es el único país; cuando se agregue el 2º, el formulario crecerá a país+ciudad como el onboarding).
  - Render: `{regions.map(region => <optgroup key={region.id} label={region.label}>{region.cities.map(city => <option key={city} value={city}>{city}</option>)}</optgroup>)}`.
- El valor enviado (`formData city`) ya es manejado por `createPatientFromTopbar` (texto) → SIN cambios en actions/dominio/BD: se guarda el nombre de la ciudad en `patients.city`.
- La dirección sigue como input de texto (no cambia).

### T2 — Drawer más ancho (app/globals.css)

- Desktop (≥768px): `.patient-dialog { width: min(30rem, 100%); … }` → `width: min(36rem, 100%);`.
- NO tocar el bloque `@media (max-width: 767px)` (bottom-sheet a 100% se mantiene igual).
- Verificar que `.form-row` (2 columnas) y `.field-full` se vean bien a 36rem (no requiere cambios de grid; los campos full-width siguen full-width).

### T3 — Verificación (evidencia en el REPORTE)

1. `timeout 300 npm run lint` → PASS.
2. `timeout 420 npm run build` → PASS (si `.next/lock`: matar next-server zombie + `rm -f .next/lock`).
3. `timeout 300 npm run test:unit` → 47/48 PASS (solo el fallo preexistente de `foundation.test.ts` docker-compose.yml) y `timeout 420 npm run test:integration` → 20/20.
4. Comprobación estática: en el source del drawer deben existir el select `name="city"`, el placeholder deshabilitado y `COUNTRY_OPTIONS[0].regions`; sin input de texto para city.
5. Voseo: `grep -rnoE "Entrá|Conocé|tenés|Querés|Ingresá|Gestioná|Registrá|podés" app/ components/ features/ --include="*.tsx"` → sin coincidencias.
6. Si el entorno runtime/navegador sigue sin estar disponible, documentar (igual que BRIEF-CODEX-23); el gatekeeper verificará en producción tras el deploy.

## Reglas críticas

- NO commit, NO push, NO deploy (lo hace el orquestador tras verificar).
- NO tocar `app/onboarding/regions.ts` (dataset compartido) salvo que falle el import.
- Sin voseo. NO modificar migraciones, actions de server, dominio ni tests ajenos.
- Si algo falla tras 2 intentos, documentar y continuar.

## Reporte

Escribir `REPORTE-CODEX-23-B.md` en la raíz: cambios exactos (diff resumido), evidencia de verificaciones, desvíos.
