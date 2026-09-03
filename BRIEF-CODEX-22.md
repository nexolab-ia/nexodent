# BRIEF-CODEX-22 — Navegación: menú horizontal superior (Dashboard · Calendario · Reportes · Configuración)

## Contexto (decisión de Bryan, 2026-09-03)

Bryan pidió que NexoDent use un **menú en forma horizontal en la parte superior** con las opciones
**Dashboard · Calendario · Reportes · Configuración**, en lugar del sidebar lateral actual. Irá
explicando más cambios después; este brief es SOLO el cambio de navegación del shell autenticado.

Docs normativos YA actualizados por el arquitecto — LEER antes de tocar código:
- `DESIGN.md` → sección "Dashboard (app, tras login — dark)": menú horizontal superior + bottom tab bar <768px.
- `UX-PRINCIPIOS.md` → P1: navegación y bottom tab bar actualizadas.

## Qué implementar

1. **Shell autenticado** (buscar el layout de `app/(app)/`: típicamente `app/(app)/layout.tsx` y
   `components/layout/`): reemplazar el sidebar lateral por un **menú horizontal sticky en la parte
   superior** con 4 items (ícono SVG de línea + texto):
   - `Dashboard` → `/dashboard`
   - `Calendario` → `/agenda` (la ruta interna sigue siendo agenda; solo cambia la etiqueta visible)
   - `Reportes` → inspeccionar rutas existentes (`/reports/...`); si no existe `/reports` index, enlazar
     a la primera sección de reportes disponible (p. ej. `/reports/insights` o `/reports/collections`)
     y usar label `Reportes`.
   - `Configuración` → `/settings`
   - Item activo = cian (token `--accent`) con píldora o subrayado; `aria-current="page"`; focus visible.
2. **Responsive**: en <768px los mismos 4 items pasan a bottom tab bar fija. Si ya existía una bottom
   tab bar, reemplazar sus items por estos 4; si no existía, implementarla mínima (ícono+label corto).
3. **Acceso a módulos secundarios** (NO son items del menú principal, pero NO pueden quedar huérfanos):
   - En el **Dashboard** añadir (o conservar/ajustar si ya existe) un bloque de **accesos rápidos**:
     Pacientes, Presupuestos, Cobros, Migración de datos → con las rutas existentes.
   - En **Configuración** (`/settings`) asegurar un enlace a Migración de datos (ruta `/migration`) si no existe.
   - Las rutas/páginas actuales NO se borran ni renombran (pacientes, presupuestos, cobros, migración siguen viviendo en sus URLs).
4. **Topbar**: si el shell actual tiene topbar separada (buscador global, campana de avisos, perfil),
   el menú horizontal va debajo, sticky. Si no hay topbar separada, buscador/perfil conviven a la derecha
   del menú en la misma barra. Elegir la opción MENOS invasiva sobre el shell existente.
5. Nada de sidebar lateral en desktop. Mantener estética DESIGN.md (dark, tokens, Space Grotesk en
   wordmark si aplica, Inter en UI). Sin voseo en labels/microcopy.

## Alcance

- TOCAR solo: layout del shell autenticado, componentes de navegación y CSS asociado; dashboard solo para
  el bloque de accesos rápidos; settings solo para el enlace a migración si falta.
- NO tocar: lógica de negocio, server actions, RLS, migraciones, rutas API, odontograma, agenda interna,
  ni tests existentes (no cambian). No borrar páginas existentes.

## Verificación (dev server http://127.0.0.1:3000, DB local, sesión demo)

1. `timeout 300 npm run lint` → PASS.
2. `timeout 420 npm run build` → PASS.
3. Con sesión demo (`emilia.demo@nexodent.invalid`; password en
   `/home/hermes/.hermes/home/.secrets/nexodent_deploy.env` — NO imprimir secretos): GET a
   `/dashboard`, `/agenda`, la ruta de reportes elegida y `/settings` → 200 y el HTML contiene los
   labels del menú (`Dashboard`, `Calendario`, `Reportes`, `Configuración`).
4. Confirmar en el HTML del shell que NO aparece el sidebar lateral antiguo (clase/estructura previa eliminada).
5. `timeout 180 npx vitest run tests/unit/dashboard.test.ts` → PASS (no debe romperse nada del dashboard).

Resultado en 10-15 líneas al final. Ejecuta TODO sin detenerte. No imprimas secretos. No hagas commit.
