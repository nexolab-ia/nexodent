# BRIEF-CODEX-27 — Configuración: menú vertical agrupado completo (referencia) + topbar ajustada (logo, ayuda, avatar iniciales)

## Contexto (decisión de Bryan, 2026-09-03, con captura de referencia)

Bryan aprobó implementar la propuesta SOLO en Configuración y ajustar la topbar:
1. **Dentro de Configuración**: el menú vertical izquierdo debe tener TODOS los grupos e ítems de la captura (con íconos):
   - **MI CLÍNICA**: Organización · Plan · Usuarios · Permisos
   - **AGENDA**: Calendario · Bloqueos · Agenda Online · Notificaciones · Tipos de Sesión · Box
   - **CLÍNICA**: Pacientes · Plantillas · Nomenclatura
   - **FACTURACIÓN**: Convenios · Aranceles · Agrupaciones
   - **SISTEMA**: Ajustes · Exportar · Documentos legales
2. **Topbar horizontal** ajustada a la captura: a la izquierda **logo + nombre de la clínica**; en medio los links principales **Dashboard · Calendario · Reportes · Configuración**; a la derecha los iconos **lupa, alta (＋), notificaciones, AYUDA (?) y avatar de perfil con iniciales** (p. ej. "SM" para Simón Mendoza).
3. Lo que no tiene página todavía se muestra en el menú (visible, clickeable a una página con badge "En desarrollo") — el patrón de producto vivo del proyecto. El menú NO lleva badges; la página destino sí.

## Estado actual (verificado)
- `components/layout/app-shell.tsx`: `<header className="app-header"><div className="topbar">` identidad (tenant-identity) + TopbarActions `</div><AppNavigation variant="desktop"/></header>` → la navegación principal va en OTRA fila debajo de la topbar.
- `components/layout/app-navigation.tsx`: links Dashboard(/dashboard) Calendario(/agenda) Reportes(/reports/insights) Configuración(/settings) con íconos; variantes desktop/mobile (bottom tabs <768).
- `components/layout/topbar-actions.tsx`: iconos lupa(buscador), ＋(nuevo paciente dialog), calendario+(nueva cita), campana(badge), perfil(menú). El perfil hoy es ícono "persona".
- `components/brand/logo.tsx`: logo de la marca (usar como marca; si incluye texto "NexoDent", en la topbar usar solo el símbolo/marca + el nombre de la clínica del tenant al lado).
- `components/settings/settings-nav.tsx`: hoy solo grupo "Mi clínica" con 3 ítems (SETTINGS_SECTIONS) + iconPaths (building/card/users). Clases CSS: .settings-nav/.settings-group/.settings-nav-section/.settings-nav-items (ver globals.css ~línea 1121).
- Páginas settings existentes: `organizacion` (REAL, fase 2), `plan` y `usuarios` (scaffold estáticos), `notifications` (real: estado de entregas), `sites`/`members` (placeholders viejos, accesibles por URL, NO se tocan ni linkean). `app/(app)/settings/layout.tsx` renderiza SettingsNav + children. `/settings` redirige a organizacion.
- Rutas app: /agenda (Calendario), /patients (listado pacientes), /reports/insights (Reportes), /dashboard.

## Diseño

### T1 — SETTINGS_SECTIONS completo + ruteo (components/settings/settings-nav.tsx + páginas)

Estructura de datos (extender la constante; cada ítem: `{ key, href, label, icon }`). Grupos:

- `clinic` "Mi clínica": organizacion→/settings/organizacion (building), plan→/settings/plan (card), usuarios→/settings/usuarios (users), permisos→/settings/permisos (shield).
- `agenda` "Agenda": calendario→/agenda (calendar), bloqueos→/settings/bloqueos (lock), agenda-online→/settings/agenda-online (globe), notificaciones→/settings/notifications (bell), tipos-sesion→/settings/tipos-sesion (clock), box→/settings/box (boxes).
- `clinica` "Clínica": pacientes→/patients (patient), plantillas→/settings/plantillas (fileText), nomenclatura→/settings/nomenclatura (layers).
- `facturacion` "Facturación": convenios→/settings/convenios (tag), aranceles→/settings/aranceles (receipt), agrupaciones→/settings/agrupaciones (folder).
- `sistema` "Sistema": ajustes→/settings/ajustes (gear), exportar→/settings/exportar (download), documentos-legales→/settings/documentos-legales (scale).

Nuevos íconos en iconPaths (SVG línea 24×24, stroke 1.7, dibujo limpio mínimo — Codex dibuja paths simples): shield, calendar, lock, globe, bell, clock, boxes, patient, fileText, layers, tag, receipt, folder, gear, download, scale (además de los existentes building/card/users).

Ítems CON página real: organizacion, calendario(/agenda), notificaciones, pacientes(/patients). El resto → páginas placeholder servidas por UNA ruta dinámica:

**Página placeholder genérica**: `app/(app)/settings/[seccion]/page.tsx` con un manifest `SETTINGS_PLACEHOLDERS: Record<string,{title:string;description:string}>` (en el mismo archivo o lib/settings-nav). Keys: plan, usuarios, permisos, bloqueos, agenda-online, tipos-sesion, box, plantillas, nomenclatura, convenios, aranceles, agrupaciones, ajustes, exportar, documentos-legales. Render (igual que scaffold actual): `<div className="settings-scaffold"><header><h1>{title}</h1><span className="settings-badge">En desarrollo</span></header><p className="muted">{description}</p></div>`. Si la key no está en el manifest → `notFound()`.
Títulos/copy sugeridos (tuteo, describen qué se administrará):
- plan: "Plan" — "Suscripción, cobros y medios de pago de tu espacio."
- usuarios: "Usuarios" — "Quiénes acceden a la clínica."
- permisos: "Permisos" — "Roles y permisos de cada integrante del equipo."
- bloqueos: "Bloqueos" — "Bloqueos de agenda por profesional, box o fecha."
- agenda-online: "Agenda Online" — "Configuración del agendamiento público por enlace."
- tipos-sesion: "Tipos de Sesión" — "Duración y configuración de los tipos de atención."
- box: "Box" — "Sillones y boxes de atención de la clínica."
- plantillas: "Plantillas" — "Plantillas de evoluciones y documentos clínicos."
- nomenclatura: "Nomenclatura" — "Catálogo de prestaciones y nomenclatura clínica."
- convenios: "Convenios" — "Convenios con aseguradoras, FONASA e isapres."
- aranceles: "Aranceles" — "Precios de prestaciones por convenio o particular."
- agrupaciones: "Agrupaciones" — "Agrupaciones de prestaciones para presupuestos."
- ajustes: "Ajustes" — "Preferencias generales del sistema."
- exportar: "Exportar" — "Exportación de datos y respaldos."
- documentos-legales: "Documentos legales" — "Consentimientos, políticas y términos."

Borrar scaffolds estáticos viejos: `app/(app)/settings/plan/page.tsx` y `app/(app)/settings/usuarios/page.tsx` (quedan cubiertos por la ruta dinámica). NO tocar `organizacion`, `notifications`, `sites`, `members`.

Activación del ítem: `pathname === href` (para /settings/*); /agenda y /patients se activan en sus rutas. El nav se usa SOLO en el layout de settings (no es sidebar global).

### T2 — SettingsNav: grupos desplegables (details) y orden
- Mantener estructura data-driven; cada grupo `<details className="settings-group-box" open>` con `<summary className="settings-group">` (label con chevron; CSS lo muestra en mayúsculas pequeñas como hoy) y `.settings-nav-items` adentro.
- Desktop: todos abiertos. Móvil ≤767: el menú deja de ser scroll horizontal infinito: pasa a acordeón vertical (los `<details>` permiten cerrar grupos) — actualizar el `@media (max-width:767px)` de `.settings-nav` (quitar scroll-x de items; dejar columna). Layout móvil: nav acordeón arriba y contenido abajo.
- `aria-current="page"` igual.

### T3 — Topbar horizontal (app-shell + topbar-actions + CSS)
- **AppShell**: integrar la navegación desktop DENTRO de la fila `.topbar`: estructura
  ```
  <div className="topbar">
    <a className="topbar-brand" href="/dashboard">
      <Logo mark only / símbolo />  (si Logo trae texto NexoDent, aislar el símbolo)
      <span className="tenant-identity">{identity.displayName}</span>
    </a>
    <AppNavigation variant="desktop" />   (ahora dentro de la fila, centrado)
    <TopbarActions … />                    (a la derecha)
  </div>
  ```
  El header ya no necesita la fila separada de nav (desktop). Mantener `<AppNavigation variant="mobile"/>` (bottom tabs <768) al pie.
- **CSS topbar (≥1100px)**: `.topbar{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:1rem}` con brand a la izquierda, nav centrado (justify-self:center) y acciones a la derecha. En `≤1099px` (pero >767): mantener la disposición actual de dos filas (brand+acciones arriba, nav debajo) para no apretar — implementar con un wrapper y media queries; en `≤767px` todo igual que hoy (bottom tabs, topbar con identidad truncada + acciones).
- **TopbarActions**:
  1. Sustituir el ícono de perfil por **avatar de iniciales**: círculo con las iniciales del usuario (`userName`: primera letra del primer nombre + primera letra del apellido si hay 2+ palabras; si es una sola palabra, primeras 2 letras en mayúscula; ej. "Simón Mendoza" → "SM", "Dra. Emilia Torres" → "ET"). Mantener el menú desplegable actual (Mi perfil/Mi configuración/Cerrar sesión) y el cierre por fuera/Esc.
  2. Agregar **Ayuda**: icon-button (ícono "?") aria-label "Ayuda" title "Ayuda" → abre un popover pequeño (patrón action-popover) con texto muted "El centro de ayuda llegará pronto." y se cierra con clic afuera/Esc (reutilizar el patrón closeMenus existente). Sin enlace externo.
  3. Mantener orden de la captura: lupa, ＋(alta), notificaciones, ayuda, avatar perfil. (El botón actual "calendar-plus" (nueva cita) puede quedarse antes de notificaciones si no estorba — decisión: mantenerlo por utilidad, va entre ＋ y campana. Si rompe el parecido visual con la captura, es aceptable; la captura muestra un solo botón de alta.)
- Mantener todo el comportamiento existente de búsqueda/diálogo paciente/notificaciones/perfil (NO rediseñar popovers).

### T4 — Verificación
1. Lint focalizado + `timeout 300 npm run lint` → PASS.
2. `timeout 420 npm run build` → PASS (si `.next/lock`: matar next-server + `rm -f .next/lock`). Verificar en el build que la ruta dinámica `[seccion]` no colisiona con páginas estáticas (organizacion/notifications/sites/members) y que plan/usuarios viejos borrados no quedan referenciados.
3. `timeout 300 npm run test:unit` (47/48 preexistente) e `timeout 420 npm run test:integration` (20/20).
4. Estática: grep de los 5 grupos + ítems en settings-nav; hrefs correctos; sin voseo; sin emojis.
5. Sin runtime → documentar; gatekeeper verifica en producción (GET /settings/organizacion: menú con grupos; GET /settings/permisos y /settings/convenios → 200 badge En desarrollo; topbar con avatar iniciales y ayuda).

## Reglas críticas
- NO commit/push/deploy. NO tocar páginas reales (organizacion/notifications/dashboard/patients/agenda) ni sus actions. El borrado es SOLO de scaffolds estáticos plan/usuarios viejos.
- No cambiar rutas existentes (Dashboard/Calendario/Reportes/Configuración), ni el flujo móvil actual (<768 bottom tabs).
- Sin voseo, sin emojis (avatar = texto; íconos SVG). Tokens DESIGN.md.
- Si algo falla tras 2 intentos, documentar y continuar.

## Reporte
`REPORTE-CODEX-27.md` en la raíz: diff resumido, evidencia, desvíos.
