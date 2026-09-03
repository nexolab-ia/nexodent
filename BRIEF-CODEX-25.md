# BRIEF-CODEX-25 — Configuración Fase 1: shell con menú vertical izquierdo y sección "Mi clínica" (Organización · Plan · Usuarios y permisos)

## Contexto (especificación de Bryan, 2026-09-03 — dicta el módulo por fases)

Fase 1 de Configuración (Bryan irá dictando las fases siguientes):
1. La pantalla de Configuración debe mostrar **a la vez** (layout persistente) un **menú vertical ubicado a la izquierda** y el contenido a la derecha.
2. La **primera opción del menú vertical** se llama **"Mi clínica"** y está **desglosada** en tres sub-opciones:
   - **Organización**
   - **Plan**
   - **Usuarios y permisos**
3. En esta fase el menú solo tiene esa sección; el contenido de cada sub-opción es un scaffold con estado visible "En desarrollo" (las fases siguientes agregan el contenido real, dictado por Bryan). El diseño debe permitir agregar más secciones/ítems al menú en fases futuras (estructura de datos, no HTML suelto).

## Estado actual (verificado)

- `app/(app)/settings/page.tsx`: hub con 4 links (Equipo `/settings/members`, Sedes `/settings/sites`, Notificaciones `/settings/notifications`, Migración `/migration`) usando clases `.settings-page`/`.settings-links` en `app/globals.css`.
- Subpáginas: `settings/members/page.tsx` y `settings/sites/page.tsx` son placeholders de 2 líneas; `settings/notifications/page.tsx` muestra estado de entregas. NO se borran en esta fase (siguen accesibles por URL; una fase futura las reorganiza).
- `/billing` es "Cobros" (cuenta corriente), NO es el Plan: Plan es contenido nuevo de fases futuras.
- La navegación principal (tab Configuración → `/settings`) vive en `components/layout/app-navigation.tsx` (aria-current por pathname).
- `app/(app)/layout.tsx` es el layout protegido que envuelve todo; las páginas de `(app)` no tienen layout intermedio por ruta todavía.
- Sin voseo (regla del proyecto), tokens DESIGN.md (dark, cian accent, radius, Inter; display Space Grotesk en títulos).

## Diseño (decisión del arquitecto)

### Rutas y layout
- NUEVO layout `app/(app)/settings/layout.tsx` (server) que renderiza `SettingsNav` + `{children}` dentro de `.settings-layout`.
- Rutas nuevas (cada una con su `page.tsx` dentro de settings/):
  - `/settings` → **redirect** a `/settings/organizacion` (mantener el archivo `page.tsx` actual como `export default function(){ redirect("/settings/organizacion"); }` o convertir el hub en el layout raíz con redirect — elegir lo menos invasivo: `settings/page.tsx` hace `redirect("/settings/organizacion")`).
  - `/settings/organizacion` → "Organización"
  - `/settings/plan` → "Plan"
  - `/settings/usuarios` → "Usuarios y permisos"
- `/settings/members`, `/settings/sites`, `/settings/notifications` quedan como están (accesibles por URL, sin link en el menú por ahora).

### Menú vertical (estructura de datos para fases futuras)
- NUEVO client component `components/settings/settings-nav.tsx` ("use client", usa `usePathname` para marcar activo) que recibe/importa una constante de navegación:
```ts
// en el mismo archivo o en lib/settings-nav.ts — estructura extensible
export const SETTINGS_SECTIONS = [
  {
    key: "clinic",
    label: "Mi clínica",
    items: [
      { href: "/settings/organizacion", label: "Organización", icon: "building" },
      { href: "/settings/plan", label: "Plan", icon: "card" },
      { href: "/settings/usuarios", label: "Usuarios y permisos", icon: "users" },
    ],
  },
] as const;
```
Fases futuras agregan secciones/ítems a este array (NUNCA html duplicado). Íconos SVG de línea (estilo existente `ActionIcon` de topbar): building/card/users (dibujar paths simples de 24×24, stroke 1.7).
- Render: por cada sección → `<p className="settings-group">label</p>` + lista de `<Link>` con ícono + label; activo = fondo surface-2 + color accent + `aria-current="page"`; altura mínima 44px (target táctil); hover suave.
- Lado derecho: `<div className="settings-content">{children}</div>` con el `<h1>` y contenido de cada página.

### CSS (app/globals.css)
```css
.settings-layout{display:grid;grid-template-columns:15.5rem minmax(0,1fr);gap:2rem;align-items:start;max-width:72rem}
.settings-nav{position:sticky;top:1rem;display:grid;gap:.25rem}
.settings-group{margin:.25rem 0 .35rem;color:var(--muted);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.6px}
.settings-nav a{display:flex;align-items:center;gap:.6rem;min-height:44px;padding:.55rem .8rem;border-radius:10px;color:var(--muted);text-decoration:none;font-weight:600}
.settings-nav a:hover{background:var(--surface-2);color:var(--ink)}
.settings-nav a[aria-current="page"]{background:var(--surface-2);color:var(--accent)}
.settings-nav svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none}
.settings-content{min-width:0}
.settings-badge{display:inline-flex;align-items:center;gap:.35rem;padding:.15rem .55rem;border:1px solid var(--border);border-radius:999px;background:var(--surface-2);color:var(--muted);font-size:12px;font-weight:600;letter-spacing:.3px}
@media (max-width:767px){
  .settings-layout{grid-template-columns:1fr;gap:1rem}
  .settings-nav{position:static;display:flex;gap:.4rem;overflow-x:auto;padding-block-end:.35rem}
  .settings-group{display:none} /* en móvil los ítems van sueltos en scroll horizontal */
  .settings-nav a{white-space:nowrap}
}
```
Reutilizar `.muted`, `.empty-state`, tokens. (El hub viejo `.settings-page`/`.settings-links` puede quedar sin uso; no borrar el CSS si otras vistas lo usan — verificar.)

### Páginas scaffold (contenido mínimo, estado visible)
Cada página server component:
```tsx
export default function OrganizacionPage() {
  return <div className="settings-content"><header><h1>Organización</h1><span className="settings-badge">En desarrollo</span></header>
    <p className="muted">Datos de tu clínica: nombre, ubicación y contacto. Disponibles en una próxima fase.</p></div>;
}
```
- Organización: título "Organización", badge "En desarrollo", copy "Datos de tu clínica: nombre, ubicación y contacto." (para perfil independiente el copy dirá consulta si es fácil por tipo — NO es requisito en esta fase; puede quedar neutro "tu clínica o consulta").
- Plan: "Plan", badge, copy "Suscripción, cobros y medios de pago de tu espacio."
- Usuarios y permisos: "Usuarios y permisos", badge, copy "Quiénes acceden a la clínica y con qué rol."
(Nota: cuando Bryan dicte el contenido real de cada una, se reemplaza el scaffold.)

## Tareas (en orden)

### T1 — Layout + nav
- Crear `components/settings/settings-nav.tsx` (client) con `SETTINGS_SECTIONS` (estructura arriba) y los íconos SVG.
- Crear `app/(app)/settings/layout.tsx`: `<div className="settings-layout"><nav aria-label="Configuración" className="settings-nav">…</nav><div className="settings-content">{children}</div></div>` (SettingsNav client ya renderiza su `<nav>`; layout solo arma la grilla — decidir la composición más limpia y consistente).
- `app/(app)/settings/page.tsx` → redirect a `/settings/organizacion`.
- CSS nuevo en `app/globals.css` (bloque de arriba, ajustado a la composición elegida).

### T2 — Páginas scaffold
- Crear `settings/organizacion/page.tsx`, `settings/plan/page.tsx`, `settings/usuarios/page.tsx` según spec (h1 + badge + copy muted). NO tocar members/sites/notifications.

### T3 — Verificación
1. `timeout 300 npm run lint` → PASS.
2. `timeout 420 npm run build` → PASS (si `.next/lock`: matar next-server + `rm -f .next/lock`). El build confirma que `/settings` redirige (página estática 307/redirect) y las 3 rutas nuevas compilan.
3. `timeout 300 npm run test:unit` → 47/48 (fallo preexistente conocido) e `timeout 420 npm run test:integration` → 20/20.
4. Comprobación estática: las 3 rutas existen con h1 correctos; el nav usa `SETTINGS_SECTIONS` (grep: no links duplicados hardcodeados fuera de la estructura); `aria-current` en el ítem activo; clases CSS presentes.
5. Voseo grep sin coincidencias en lo nuevo.
6. Sin runtime/navegador → documentar; el gatekeeper verifica en producción tras el deploy (GET /settings/organizacion y /settings con seguimiento del redirect).

## Reglas críticas
- NO commit/push/deploy. NO borrar `members/sites/notifications` ni sus rutas. NO tocar lógica de org/sedes/miembros (fases futuras).
- Sin voseo. Sin emojis. Tokens DESIGN.md. Texto español neutro/tuteo.
- Si algo falla tras 2 intentos, documentar y continuar.

## Reporte
Escribir `REPORTE-CODEX-25.md` en la raíz: cambios, evidencia, desvíos.
