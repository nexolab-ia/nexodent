# BRIEF-CODEX-18-B — Completar onboarding UI (agregar CSS faltante + verificar + reportar)

## Contexto

CODEX-18 terminó su ejecución por agotamiento de tiempo (timeout) SIN terminar todo. El estado
real del working tree (verificado por el orquestador):

- `app/onboarding/profile-picker.tsx` — **YA ESTÁ COMPLETO y correcto** (SetupForm con
  validación para individual/clínica, JoinSteps con los 3 pasos, Panel de detalle, Continuar,
  si el build compila). NO lo reescribas.
- `app/onboarding/page.tsx` — completo.
- `app/access.module.css` — **FALTAN las clases CSS nuevas** que `profile-picker.tsx` referencia.
  El build PASÓ (CSS modules con clase no definida solo la omiten, no fallan), pero las pantallas
  de perfil renderizan SIN ESTILO.

TU trabajo en ESTE brief es únicamente:
1. Añadir a `app/access.module.css` las clases que faltan.
2. Verificar build/smoke/unit.
3. Escribir `REPORTE-CODEX-18.md` (el brief anterior no llegó a crearlo).

## T1 — Clases CSS que faltan (referenciadas por profile-picker.tsx y hoy ausentes en access.module.css)

Revisa el `profile-picker.tsx` actual para confirmar, pero estás clases son las que hay que definir
(estilo coherente con tokens: `--surface`, `--surface-2`, `--border`, `--radius:14px`, `--accent:#22d3ee`,
`--bg`, `--muted`, `--ink`, `--danger`, shadow suave). Modo oscuro, tarjetas, acento cian.

Clases a añadir (nombres EXACTOS usados en el componente):
- `.profileScreen{...}` — contenedor de la sub-pantalla (form/pasos).
- `.inlineBack{...}` — botón "← Volver" (link-like, con margen inferior).
- `.profileForm{...}` — el form (display grid, gap 1.15rem).
- `.formGrid{...}` — grid de campos (2 columnas en desktop, 1 en móvil; gap).
- `.profileField{...}` — cada campo del form (grid, gap .35rem). Inputs heredan de globals (`input` ya estilizados).
- `.fieldError{...}` — texto de error de campo (color `#fecaca`, font-size .85rem, margen).
- `.consentField{...}` — fieldset de consentimiento (borde suave, radius, padding, margen superior).
- `.secondaryButton{...}` — botón secundario (sin fondo acento; fondo `--surface`, borde `--border`).
- `.successPanel{...}` — panel de confirmación (`role="status"`, margen, padding, radius, borde success).
- `.stepsList{...}` — lista numerada de pasos (sin estilo de lista, grid, gap).
- `.stepNumber{...}` — número 01/02/03 (mono/fuente display, color `--accent` o muted).
- `.stepIcon{...}` — contenedor del icono del paso.
- Mobile: un `@media (max-width:36rem)` para reducciones razonables de `.formGrid`/`.profileForm`.

Si `profile-picker.tsx` refiere alguna clase que NO esté en esta lista o en el archivo, añádela
también (saca la lista real con `grep -o "styles\.[a-zA-Z]*"`). Defina TODAS las referencias para
que no quede ninguna "undefined" de CSS module.

## T2 — Verificación (obligatoria, con evidencia)

1. `timeout 420 npm run build` → PASS.
2. Confirmar que NO quedan referencias de estilo faltantes: para cada `styles.X` usado en
   `app/onboarding/*.tsx`, la clase `.X` existe en `app/access.module.css`.
3. `timeout 420 npm run test:smoke` → PASS.
4. `timeout 420 npm run test:unit` → solo puede fallar `foundation.test.ts` (docker-compose.yml
   ausente; ajeno, NO tocar).

## Reporte final

Crear `REPORTE-CODEX-18.md`:
- Estado del working tree al llegar (resumen de lo que ya estaba completo de CODEX-18).
- Clases CSS añadidas (lista) y confirmación de que todas las `styles.X` están cubiertas.
- Resultados build/smoke/unit.
- Confirmación de NO tocar BD, RLS, auth, `lib/auth.ts`, `db/*`, middleware, login, demo,
  ni la lógica de `profile-picker.tsx`.

## Reglas

- NO commit, NO push, NO deploy (lo hace el orquestador).
- NO imprimir secretos. NO reescribir `profile-picker.tsx` ni `page.tsx` salvo que necesites
  ajustar un *class name* mínimo por un typo real (justifícalo en el reporte).
- Ejecuta TODO sin detenerte. Español chileno con tuteo.