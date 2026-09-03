# BRIEF-CODEX-26-B — Organización: layout ancho tipo referencia + tarjeta de imagen alineada

## Contexto (feedback de Bryan, 2026-09-03, con captura de referencia)

Bryan muestra una captura del objetivo: la página **Organización** debe verse **ancha** (no angosta/centrada con mucho margen) con esta estructura:
- **Layout de Configuración ancho**: el contenido debe aprovechar el ancho de la pantalla (hoy `.settings-layout` tiene `max-width:72rem` que deja mucho margen en monitores grandes y encoge la columna de contenido).
- **Tarjeta "Información de la clínica"** con subtítulo "Imagen, datos básicos y de contacto." y este orden:
  1. **Fila superior**: a la izquierda el **placeholder cuadrado del logo** (ícono de cámara + texto "Sin imagen" cuando no hay logo); a la derecha el bloque de texto **"Imagen de la clínica"** con helper **"Logo o imagen representativa (200×200 px máximo)"** y el botón **"Cambiar imagen"**.
  2. Debajo, **dos columnas** de campos (como en la captura):
     - Columna izquierda: **Nombre de la clínica**, **Ciudad**, **Teléfono principal**
     - Columna derecha: **Dirección**, **Email de contacto**, **Teléfono secundario**
- **Tarjeta "Horario de atención"** con subtítulo **"Define el horario de apertura y cierre de la clínica."** y dos columnas: **Hora de apertura** | **Hora de cierre**.

## Cambios

### T1 — Ancho del layout de Configuración (`app/globals.css`)
- `.settings-layout`: subir `max-width` (p. ej. `110rem` o eliminarlo) y asegurar `grid-template-columns: 15.5rem minmax(0,1fr)` con el contenido `min-width:0` para que las tarjetas se expandan. Mantener el menú lateral fijo a la izquierda. No tocar el comportamiento móvil (`@media max-width:767px`).

### T2 — Página Organización (`app/(app)/settings/organizacion/page.tsx`) — estructura de la tarjeta 1
- Subtítulo tarjeta 1 → "Imagen, datos básicos y de contacto."
- Fila superior `.organization-logo-row`:
  - `OrgLogoPicker` (izquierda, cuadrado ~96px).
  - A la derecha un bloque con: `<strong>Imagen de la clínica</strong>`, `<p className="muted">Logo o imagen representativa (200×200 px máximo)</p>` y el botón del picker.
- Luego `.organization-fields` grid de DOS columnas (izquierda: name, city, primaryPhone; derecha: address, contactEmail, secondaryPhone) — el orden vertical en cada columna como en la captura (nombre arriba-izq, dirección arriba-der, ciudad bajo nombre, email bajo dirección, tel principal bajo ciudad, tel secundario bajo email). Ajustar el orden del JSX para lograr ese recorrido visual por columnas (no fila por fila) si el grid lo permite (usar dos contenedores `.organization-col` o `grid-template-columns` con flujo natural ajustado — elegir la opción más limpia; el orden exacto de columnas es el de la captura).
- Subtítulo tarjeta 2 → "Define el horario de apertura y cierre de la clínica."

### T3 — OrgLogoPicker (`components/settings/org-logo-picker.tsx`) ajustes de copia/UX
- Placeholder vacío: ícono de cámara + texto **"Sin imagen"** (hoy ícono de foto).
- Botón label: **"Cambiar imagen"** (reemplaza "Subir logo"). Mantener "Quitar" cuando hay imagen (con separación visual).
- El componente debe poder recibir el helper por fuera (la página lo pone) y seguir exponiendo el input file oculto + hidden `name`/`logoClear` igual que hoy.

### T4 — CSS nuevo (app/globals.css)
```css
.organization-logo-row{display:flex;align-items:center;gap:1.25rem}
.organization-logo-row .logo-picker{display:flex;align-items:center;gap:1.25rem;width:100%}
.logo-preview{width:96px;height:96px;border-radius:14px}
.logo-caption{display:grid;gap:.25rem;align-content:center}
.logo-caption strong{color:var(--ink);font-weight:600}
.logo-actions{margin-block-start:.6rem}
.organization-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem 1.25rem}
.organization-col{display:grid;gap:1rem;align-content:start}
@media (max-width:680px){.organization-fields{grid-template-columns:1fr}.organization-logo-row{flex-direction:column;align-items:flex-start}}
```
Ajustar a la composición real elegida (puede variar: `.organization-col` ×2 o grid directo); mantener tokens de DESIGN.md y las clases existentes de campos/forms.

## Verificación
1. Lint focalizado a `app/(app)/settings/organizacion/` + `components/settings/` y `timeout 300 npm run lint` → PASS.
2. `timeout 420 npm run build` → PASS (si `.next/lock`: matar next-server + `rm -f .next/lock`).
3. Estática: la página contiene los nuevos subtítulos/copy ("Imagen, datos básicos y de contacto.", "Define el horario de apertura y cierre de la clínica.", "Imagen de la clínica", "Logo o imagen representativa (200×200 px máximo)", "Cambiar imagen", "Sin imagen"); sin voseo.
4. Sin runtime → documentar; gatekeeper verifica en producción.

## Reglas críticas
- NO commit/push/deploy. NO tocar lógica de actions (updateOrganizationProfile/Schedule quedan iguales — names de campos NO cambian: name/city/address/contactEmail/primaryPhone/secondaryPhone/logo/logoClear/openTime/closeTime).
- Sin voseo, sin emojis. Si algo falla tras 2 intentos, documentar y continuar.

## Reporte
`REPORTE-CODEX-26-B.md` con diff resumido + evidencia.
