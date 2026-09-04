# BRIEF-CODEX-30 — Pantalla "Usuarios" de Configuración (lista real de miembros con roles, filtros y demo de invitación)

## Contexto (decisión de Bryan, 2026-09-04, 2 capturas de referencia)

Bryan aprobó implementar la pantalla de **Usuarios** que hoy es un placeholder en inglés en `app/(app)/settings/members/page.tsx` ("Members / Organization membership management is protected."). La spec visual son **2 capturas** (leer/ver ANTES de codear):

- `docs/referencias/usuarios-pantalla.png` — pantalla completa: título, botón "Invitar Usuario", tabs Todos/Activos/Invitaciones, filtro de roles, contador "1 de 1 profesionales utilizados" y card de usuario con horarios y detalle.
- `docs/referencias/usuarios-roles-dropdown.png` — dropdown de roles abierto con sus 4 opciones.

**IMPORTANTE — datos REALES de BD, no mock**: la captura corresponde a la organización real del usuario (1 miembro). NexoDent YA tiene el modelo completo en BD (ver "Estado actual"), así que esta pantalla **lee memberships/users/availability reales** con `runAsTenant` (patrón de `settings/plan/page.tsx` y `settings/organizacion/page.tsx`). Solo la **invitación** es demo (no existe tabla de invitaciones todavía).

## Estado actual (verificado en código)

- Placeholder: `app/(app)/settings/members/page.tsx` (server, sin tenant check). Reemplazar.
- Menú lateral ya enlaza "Usuarios" → `/settings/members` (SETTINGS_SECTIONS, key members).
- **BD (migración 0000_core):**
  - `membership_role` ENUM: `organization_admin`, `professional`, `assistant`, `independent_owner`.
  - `membership_status` ENUM: `active`, `suspended`, `removed` (NO existe "invited" — las invitaciones no tienen tabla).
  - `memberships(id, organization_id, user_id, role, status, expires_at, created_at)` + UNIQUE(organization_id, user_id).
  - `users(id, name, email, ...)`; `membership_sites(membership_id, site_id)`.
  - `professional_availability(professional_membership_id, site_id, weekday mon..sun, starts_at, ends_at)` — horarios por profesional.
- Fixture demo `db/fixtures/demo.ts`: org **Clínica Sonrisa Andes** (demoIds.clinic) con 5 miembros activos — Emilia Torres (`organization_admin`), Martín Lagos/Sofía Abarca/Tomás Pino (`professional`, con availability L-V 09:00-18:00 en Providencia y Ñuñoa), Paula Contreras (`assistant`); org **Dra. Valentina Rojas** (demoIds.independent) con Valentina (`independent_owner`, availability L-V). Sesión demo = Emilia.
- Roles tenancy actuales y RLS FORCE: leer memberships de la propia org vía `runAsTenant` es seguro.
- Patrón de página: server component + `requestTenantContext()` + `runAsTenant(sql, actor, tx => ...)`; CSS en `app/globals.css` con tokens DESIGN.md (dark). Avatar de iniciales ya existe en la topbar (reutilizar estilo).

## Decisiones de arquitectura (del arquitecto)

1. **Lectura real**: `/settings/members` (server) consulta memberships activas de la org con `JOIN users` (nombre, email) y `created_at`, más availability (weekday) y sites. NO hay migración ni cambio de esquema.
2. **Roles BD → labels de UI** (mapa en un helper, ej. `features/members/roles.ts`):
   - `independent_owner` → rol funcional **"Administrador"**, badge **"Owner"**
   - `organization_admin` → rol funcional **"Administrador"**; badge **"Owner"** SOLO para la admin más antigua de la org cuando no hay `independent_owner` (heurística UI para la demo; documentar con comentario "// MOCK-owner: persistir owner real cuando exista backend de suscripción/invitaciones"); el resto → **"Administrador Secundario"** (así aparecen en el filtro)
   - `professional` → **"Profesional Odontología"**
   - `assistant` → **"Asistente Odontología"**
3. **Contador "X de Y profesionales utilizados"**: X = memberships `active` con rol pagado (`organization_admin`, `independent_owner`, `professional` — NO assistant); Y = **constante mock** `PLAN_PROFESSIONAL_LIMIT = 1` con comentario `// MOCK — reemplazar por límite del plan real (hoy el plan es mock en useBillingDemo)`. En la org real de Bryan muestra "1 de 1" como la captura; en la org demo mostrará "4 de 1" (realidad del fixture — aceptado, es dato real vs plan mock).
4. **Horarios de trabajo**: si el miembro tiene `professional_availability` → pintar días activos L M X J V S D; si no tiene → mostrar los 7 días apagados con caption "Sin horario configurado" (o directamente ocultar la sección si el rol es assistant; decisión: mostrar la sección SOLO si tiene availability o si es owner/admin con availability; para el resto ocultarla — ver T3).
5. **Invitación = demo cliente**: botón "Invitar Usuario" abre modal (email + rol: Administrador Secundario / Profesional Odontología / Asistente Odontología). Al enviar: agrega una invitación al estado local de la página (aparece en tab Invitaciones con contador), muestra aviso "Invitación demo enviada — el envío real llegará con el backend de invitaciones". NO persiste (al recargar vuelve a 0). Marcador MOCK.
6. NO tocar BD/migraciones/RLS/otros módulos. NO commit ni push (gatekeeper).

## Spec visual (replicar capturas; Tuteo chileno, sin voseo)

### T1 — Shell
- `<h1>Usuarios</h1>` + `<p class="muted">Administra los usuarios y permisos de tu clínica.</p>`.
- Header con acciones a la derecha (arriba): ícono **refresh** (recargar/actualizar lista — puede ser botón que re-consulta o simple), ícono **+** y botón **"Invitar Usuario"** (botón primario, estilo `.button .button-primary` con ícono user-plus; NO icono suelto — el "+" de la captura es parte del grupo visual; implementar botón "Invitar Usuario" con ícono + y el refresh como botón icon-only aria-label "Actualizar").
- **Tabs**: `Todos (N)` / `Activos (N)` / `Invitaciones (N)` — patrón tabs como BillingTabs (subrayado accent en activa). Contadores: Todos = todos los miembros (incluye activos); Activos = status active; Invitaciones = invitaciones demo locales (0 inicial).
- **Fila filtro**: debajo de tabs, dropdown **"Todos los roles"** (button con chevron) + a la derecha texto muted **"{X} de {Y} profesionales utilizados"** (X,Y del punto A3). El dropdown es `<select>` estilizado o menú custom accesible (patrón que ya use la app; si no hay, usar `<select>` con las opciones y estilos propios del tema para velocidad y accesibilidad). Opciones: **Todos los roles · Administrador Secundario · Profesional Odontología · Asistente Odontología** (filtran la lista). "Owner" NO aparece como opción (no es filtrable — es jerarquía; queda bajo "Todos los roles").

### T2 — Lista de cards de miembros
- Una card por miembro (`settings-card`-like, borde `--border`, hover sutil; la captura muestra borde celeste en hover/activa).
- Estructura de card (grid responsive ≥620px: avatar+nombre+tags a la izquierda, horarios+detalle a la derecha o en filas; seguir la captura):
  - **Avatar** circular con la inicial del nombre (fondo accent/translúcido, letra ink) — reutilizar patrón del avatar de la topbar.
  - **Nombre** (bold) + **badge estado** "Activo" (verde, patrón `.badge-active`) si status active.
  - **Badge rol**: "Owner" (accent/azul, estilo badge) SOLO si aplica (A2); para el resto ningún badge de rol (el rol va en la fila Rol) — o badge "Administrador Secundario"/"Profesional Odontología"/"Asistente Odontología" si se prefiere claridad; decisión: badge SOLO "Owner", el resto se lee en la fila "Rol" (fiel a captura donde solo Simón tiene badge Owner).
  - Íconos a la derecha del nombre: **calendario** y **ojo** (SVG línea, botones icon-only con aria-label "Ver agenda" / "Ver detalle"; en esta iteración sin acción real o navegan donde aplique — mínimo: `title`/tooltip y click sin efecto destructivo. Si es profesional, "Ver agenda" puede enlazar a `/agenda`; el ojo sin acción (aria-disabled o notice "Disponible pronto")). Decisión: calendario → si rol pagado con availability, link a `/agenda`; ojo → botón que muestra notice "Disponible pronto" (patrón usado en Plan) para no mentir.
  - **"Horarios de trabajo"**: fila de 7 celdas cuadradas con letras **L M X J V S D**; activas (con availability ese weekday) → fondo accent translúcido + texto ink; inactivas → apagadas (borde, muted). Si el miembro no tiene availability → ocultar la sección completa.
  - **Filas detalle** (label muted + valor): **Rol** → label funcional (A2), **Email** → email real, **Miembro desde** → fecha `created_at` formateada dd/mm/aaaa.
- Orden: owner/admin primero, luego por `created_at` ASC (más antiguo primero) o por nombre — decisión: owner primero, resto por created_at ASC.

### T3 — Modal "Invitar Usuario" (demo)
- Abre al hacer clic en el botón. Campos: **Email** (input email, required), **Rol** (select: Administrador Secundario / Profesional Odontología / Asistente Odontología — NOTA: no se puede invitar otro Owner).
- Validación email básica. Al enviar: `delay(600)` simulado → cierra modal, agrega a invitaciones locales `{email, rol, fecha}`, tab Invitaciones pasa a `(1)` etc., aviso success "Invitación demo enviada a {email} — el envío real llegará con el backend de invitaciones." (banner como billing-success-banner).
- Accesible: role dialog, Esc cierra, foco inicial en email, aria-modal. Tuteo.
- El tab **Invitaciones** lista las invitaciones locales (email + rol + fecha + badge "Pendiente"); vacío → "Sin invitaciones todavía." con icono.

### CSS (bloque en app/globals.css, p.ej. `/* Members */`)
- Reutilizar `.settings-card`, `.badge-active`, tabs (o crear `.members-tabs` similar a `.billing-tabs`), `.weekday-cell` (cuadrados 28-32px, grid), modal overlay (revisar si la app ya tiene modal/dialog — usar `<dialog>` nativo estilizado o div + overlay con focus trap mínimo si no existe patrón; si existe modal en el proyecto, reutilizar).
- Responsive <620px: cards 1 col, header apila, tabs scrollean. Targets ≥44px. Focus visible. `prefers-reduced-motion`.

## Copy exacta (tuteo, sin voseo, sin emojis)

- Título/subtítulo: "Usuarios" / "Administra los usuarios y permisos de tu clínica."
- Tabs: "Todos (1)" / "Activos (1)" / "Invitaciones (0)" (contadores dinámicos).
- Filtro: "Todos los roles" + opciones "Administrador Secundario", "Profesional Odontología", "Asistente Odontología".
- Contador: "1 de 1 profesionales utilizados".
- Card: "Horarios de trabajo", "Rol", "Email", "Miembro desde". Badges: "Activo", "Owner".
- Modal: "Invitar usuario" (título), "Envía una invitación para sumar a tu clínica." (sub), labels "Email" / "Rol", botón "Enviar invitación", cancelar "Cancelar". Éxito: "Invitación demo enviada a {email} — el envío real llegará con el backend de invitaciones."
- Invitaciones vacías: "Sin invitaciones todavía."
- NUNCA: "Agregá", "Tenés", "Invitá", "Enviá", voseo en general. Sin emojis.

## Reglas de calidad (heredadas)

- Next 16 App Router, React 19, CSS puro. `"use client"` solo donde haya estado (modal, tabs, filtro, invitaciones locales).
- No romper: `npm run lint`, `npm run build`, `npm run test:unit` (fallo preexistente docker-compose aceptado), `npm run test:integration`.
- No tocar BD/migraciones/RLS ni otros módulos. El fixture demo NO se modifica.
- NO commit ni push. Crear `REPORTE-CODEX-30.md` al terminar (mismo formato del 29: alcance, archivos, evidencia lint/build/tests, UX, desviaciones).

## Verificación del gatekeeper (post-entrega)

1. Lint + build + tests (unit con fallo preexistente aceptado, integration).
2. Grep anti-voseo/emojis en archivos tocados → 0.
3. Prueba en producción con sesión demo (Emilia, Clínica Sonrisa Andes): `/settings/members` muestra los 5 miembros reales (Emilia con badge Owner por heurística + Martín/Sofía/Tomás con horarios L-V + Paula sin horarios), filtro por rol funciona, tabs cuentan bien, modal demo agrega invitación, "X de 1 profesionales utilizados" con X=4. También probar con la org independiente si hay sesión (Valentina → "1 de 1" como la captura).
