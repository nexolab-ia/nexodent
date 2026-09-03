# BRIEF-CODEX-24 — Campo de teléfono con bandera del país y prefijo fijo (+56), dinámico para expansión

## Contexto (especificación de Bryan, 2026-09-03)

Bryan vio el drawer de alta de paciente y pide que **TODOS los formularios que piden números telefónicos** usen un campo con:
1. Un **cuadrado/ícono con la bandera del país** (SVG, NO emoji — DESIGN.md prohíbe emojis) + el **prefijo fijo** (ej. `+56` para Chile) integrado al campo.
2. Que sea **dinámico para expansión** (dataset tipo `COUNTRY_OPTIONS` de `app/onboarding/regions.ts`): hoy solo Chile activo, pero agregar un país (MX/CO/ES…) debe ser agregar un bloque de datos.
3. El valor que se guarda debe incluir el prefijo (`+56` + número nacional sin ceros iniciales), para que sirva para WhatsApp/marcación y sea consistente entre formularios.

## Campos telefónicos existentes (auditoría del orquestador)

1. `components/layout/topbar-actions.tsx` (drawer alta paciente, ficha Información personal): `<input type="tel" name="phone">` (Teléfono principal) y `<input type="tel" name="phoneSecondary">` (Teléfono secundario).
2. `app/onboarding/profile-picker.tsx` (SetupForm clínica/particular): `<Field name="primaryPhone" label="Teléfono principal" type="tel">` y `<Field name="secondaryPhone" label="Teléfono secundario" type="tel" optional>` (Field es el helper local del onboarding).
3. NO tocar: `features/public-booking/public-booking-form.tsx` `patientContact` (acepta "Teléfono o correo" — no es campo solo-teléfono), ni el mapeo de importación CSV de migración (datos legacy se conservan tal cual).

## Diseño (decisión del arquitecto)

Componente compartido cliente **`components/forms/phone-field.tsx`** (patrón del `RutField` existente) + dataset **`lib/locale/phone-countries.ts`** (data pura, junto a `lib/locale/cl.ts`).

### Dataset (`lib/locale/phone-countries.ts`)
```ts
export interface PhoneCountry { code: string; name: string; dial: string }
/** Expansión: agregar un bloque por país activo (MX: {code:"mx",name:"México",dial:"+52"}, …) */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "cl", name: "Chile", dial: "+56" },
];
export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];
```
El componente NUNCA hardcodea "+56": siempre deriva de `DEFAULT_PHONE_COUNTRY` / estado del país elegido (mismo principio que `COUNTRY_OPTIONS[0]` en el onboarding).

### Componente `PhoneField` (client)
Props:
```ts
{ name: string; label: string; optional?: boolean; error?: string; autoComplete?: string }
```
Comportamiento:
- **Valor ensamblado en un `<input type="hidden" name={name}>`** (el visible NO lleva name): `full = dial + nacional` donde `nacional` = dígitos escritos sin espacios/guiones y **sin cero inicial** (si el usuario escribe `09 8765 4321` → `+56987654321`; si escribe `9 8765 4321` → igual; vacío → `""`, no guardar solo `+56`).
- **Input visible** `type="tel" inputMode="tel"` SIN `name`, controlado por estado local (solo dígitos/espacios permitidos al teclear), `maxLength` ~14, placeholder `9 8765 4321`. Acepta `required` heredado (si el form lo pide).
- **Chip del país** a la izquierda dentro del campo: bandera SVG + prefijo (`+56`). Con UN país activo (`PHONE_COUNTRIES.length === 1`): chip estático (`<span aria-hidden>`). Con varios países: chip = `<button>` que abre un menú pequeño (lista: bandera + nombre + prefijo) y cambia el país; NO implementar el menú funcional con un solo país, pero dejar la estructura lista (`length > 1 && <select/lista>`).
- **Bandera**: mini componente `PhoneFlag({ code })` con SVG inline (Chile: rectángulo blanco superior + franja roja inferior + cantón azul con estrella blanca; ~20×14, radius 3). País desconocido → cuadrado neutral con el código en texto (para que agregar país = agregar SVG + bloque de datos, documentado en el dataset con comentario).
- A11y: `<label>` raíz con el texto (igual que los demás campos); `aria-invalid` + `aria-describedby` + `<span className="field-error" role="alert">` cuando `error`; el label hace foco al input visible.
- El error/validación EXISTENTE de cada host se mantiene: en el onboarding `handleSubmit` valida el valor ensamblado con `/^[\d +-]{6,20}$/` (el `+56…` cumple — NO cambiar esa validación). En el drawer no hay validación extra de teléfono (opcional).

### CSS (app/globals.css, tokens DESIGN.md)
```css
.phone-control{display:flex;align-items:center;gap:.5rem;width:100%;min-height:2.75rem;border:1px solid var(--border);border-radius:10px;padding:.35rem .7rem .35rem .4rem;background:var(--surface);color:var(--ink)}
.phone-control:focus-within{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent)}
.phone-country{display:inline-flex;align-items:center;gap:.45rem;padding:.3rem .6rem .3rem .35rem;border-radius:8px;background:var(--surface-2);border:1px solid var(--border);font:600 .95rem var(--font-ui);color:var(--ink);white-space:nowrap;letter-spacing:.2px;text-transform:none}
.phone-flag{width:22px;height:16px;border-radius:3px;overflow:hidden;flex:none}
.phone-control input[type="tel"]{flex:1;min-width:0;border:0;background:transparent;padding:.15rem 0;min-height:auto;font-size:15px;font-weight:400;letter-spacing:0;text-transform:none;color:var(--ink)}
.phone-control input[type="tel"]:focus{outline:none}
```
El input `tel` interno DEBE anular el `text-transform:uppercase`/tamaño de los labels globales (el label global está en uppercase 12px; el número escrito va normal 15px).
En el onboarding, si el module CSS local (`styles.profileField`/inputs) pisa algo, agregar el equivalente local mínimo para que `.phone-control` se vea igual que el resto del formGrid (Codex decide el punto de anclaje: clases globales alcanzan porque app/globals.css es global; solo asegurar especificidad).

## Tareas (en orden)

### T1 — Dataset + componente nuevo
- Crear `lib/locale/phone-countries.ts` (dataset arriba, con comentario de expansión).
- Crear `components/forms/phone-field.tsx` ("use client"): PhoneField + PhoneFlag (SVG Chile), según spec.

### T2 — Drawer alta paciente (`components/layout/topbar-actions.tsx`)
- Reemplazar los dos `<input type="tel">` por:
  - `<PhoneField name="phone" label="Teléfono principal" autoComplete="tel" />`
  - `<PhoneField name="phoneSecondary" label="Teléfono secundario" autoComplete="tel" />`
- Mantener el grid `.form-row` (cada PhoneField raíz = `<label>` igual que los otros campos). Sin cambios de server action: `createPatientFromTopbar` ya lee `phone`/`phoneSecondary` (ahora llegan con `+56`).

### T3 — Onboarding SetupForm (`app/onboarding/profile-picker.tsx`)
- Reemplazar los dos `<Field … type="tel">` por PhoneField equivalente, conservando `name="primaryPhone"`/`name="secondaryPhone"` y la UI del module (label/optional/error igual que Field local). `handleSubmit` NO cambia (sigue validando el valor con su patrón; el formData lo aporta el hidden input).

### T4 — Verificación (evidencia en REPORTE)
1. `timeout 300 npm run lint` → PASS.
2. `timeout 420 npm run build` → PASS (si `.next/lock`: matar next-server + `rm -f .next/lock`).
3. `timeout 300 npm run test:unit` (47/48, fallo preexistente foundation docker-compose.yml) y `timeout 420 npm run test:integration` (20/20).
4. Comprobación estática:
   - `grep` en drawer y onboarding: PhoneField usado con names phone/phoneSecondary/primaryPhone/secondaryPhone; NO quedan `<input type="tel"` sueltos (excepto el visible interno del componente).
   - Dataset sin "+56" hardcodeado fuera de `PHONE_COUNTRIES`.
   - Sin emojis de bandera (solo SVG).
5. Voseo: `grep -rnoE "Entrá|Conocé|tenés|Querés|Ingresá|Gestioná|Registrá|podés" app/ components/ features/ lib/ --include="*.tsx"` → sin coincidencias.
6. Si no hay runtime/navegador, documentar; el gatekeeper verifica en producción tras el deploy.

## Reglas críticas
- NO commit, NO push, NO deploy (orquestador).
- NO cambiar server actions, dominio, migraciones ni validaciones de host.
- Sin voseo. Sin emojis (bandera = SVG). Tokens de DESIGN.md.
- Si algo falla tras 2 intentos, documentar y continuar.

## Reporte
Escribir `REPORTE-CODEX-24.md` en la raíz: cambios (diff resumido), evidencia, desvíos.
