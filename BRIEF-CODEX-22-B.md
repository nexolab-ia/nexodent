# BRIEF-CODEX-22-B — Barra superior con identidad + iconos de acción + menú de perfil

## Contexto (especificación de Bryan, 2026-09-03 — complementa BRIEF-CODEX-22)

BRIEF-CODEX-22 implementa el menú horizontal superior con las secciones
Dashboard · Calendario · Reportes · Configuración. ESTE brief agrega la **barra superior
(topbar)** con la identidad y las acciones globales que Bryan especificó:

- **Lado IZQUIERDO de la barra**: el **nombre de la clínica** si el usuario pertenece a una
  organización, o el **nombre del profesional** si es usuario independiente (tomar la identidad de
  la sesión/membresía activa ya existente en `features/tenant-identity/` — NO inventar otra fuente).
- **Lado DERECHO de la barra**, iconos SVG de línea en este orden:
  1. **Lupa (buscar)** → buscador de paciente: escribe **por nombre o por RUT**, muestra resultados
     en dropdown y al elegir navega a la ficha del paciente. Búsqueda SIEMPRE tenant-scoped y segura
     (RLS). Reutilizar acción/búsqueda existente si la hay; si no, crear server action de búsqueda
     de pacientes (límite ~10 resultados, mínimo 2 caracteres o RUT con dígito verificador).
  2. **Más (＋)** → **agregar paciente nuevo**: abre el alta de paciente (reutilizar acción/flujo de
     alta existente si existe; si NO existe, implementar alta mínima: nombre, RUT, teléfono/email,
     con server action tenant-scoped y validación RUT chileno — reutilizar `lib/locale/cl.ts`).
  3. **Calendario con más** → **agenda / nueva cita**: navega a la agenda y abre el flujo de nueva
     cita (reutilizar el botón/acción "nueva cita" existente del módulo agenda; si el shell ya está
     en /agenda, abrir directamente el modal/flujo de nueva cita).
  4. **Campanita** → **notificaciones/avisos**: abre el centro de avisos existente (avisos IA /
     notificaciones). Inspeccionar dónde está implementado hoy (dashboard avisos, página dedicada o
     panel) y enlazar ahí; si no existe vista dedicada, navegar al dashboard con los avisos visibles.
     Mantener el badge con conteo pendiente si ya existe.
  5. **Perfil (clásico, avatar/círculo)** → **menú desplegable** con:
     - Cabecera con **nombre y correo** del usuario de sesión.
     - Opción **"Mi perfil"** → página de perfil (si existe ruta de perfil úsala; si no, crear una
       vista simple con los datos de sesión + edición mínima de nombre).
     - Opción **"Mi configuración"** → `/settings`.
     - Opción **"Cerrar sesión"** → action de sign-out existente de Better Auth.
     - Cerrar al hacer clic fuera / Esc; `aria-expanded`, teclado accesible.

## Layout (decisión del arquitecto — integrar con lo que ya dejó BRIEF-CODEX-22)

- Una sola barra superior sticky: [identidad clínica/profesional] a la izquierda, después los items
  de navegación (Dashboard · Calendario · Reportes · Configuración del brief 22) y a la derecha los
  iconos (lupa, ＋, calendario+, campana, perfil). Si el resultado del brief 22 ya define dónde van
  los items de navegación, NO romperlo: integrar la topbar de forma que convivan (p. ej. identidad +
  navegación en la misma fila o identidad arriba y navegación debajo según lo que quede menos invasivo).
- En <768px: la topbar conserva identidad (truncada con ellipsis) a la izquierda y los iconos a la
  derecha (targets táctiles ≥44px); las 4 secciones de navegación siguen en la bottom tab bar
  (UX-PRINCIPIOS.md P1). El desplegable de perfil y el dropdown de búsqueda funcionan en móvil.
- Tooltips con label en los iconos (aria-label + `title`); microcopy sin voseo
  ("Buscar paciente", "Nuevo paciente", "Nueva cita", "Notificaciones", "Mi perfil",
  "Mi configuración", "Cerrar sesión").

## Alcance

- TOCAR: shell autenticado (layout/topbar/navegación), componentes de búsqueda/alta paciente si hace
  falta crearlos (server action + UI mínima tenant-scoped), menú perfil y CSS.
- NO tocar: lógica de agenda/odontograma/cobros existente (solo REUTILIZAR acciones), RLS existente,
  migraciones, tests existentes (añadir tests solo para lo nuevo si es razonable y rápido).
- Sin voseo. Estética DESIGN.md (dark, tokens, iconos SVG de línea, focus visible).

## Verificación (dev server http://127.0.0.1:3000, DB local, sesión demo)

1. `timeout 300 npm run lint` → PASS.
2. `timeout 420 npm run build` → PASS.
3. Sesión demo (`emilia.demo@nexodent.invalid`, password en
   `/home/hermes/.hermes/home/.secrets/nexodent_deploy.env` — NO imprimir secretos): GET `/dashboard` →
   200 y el HTML contiene: el nombre de la clínica demo, los iconos/labels de búsqueda, nuevo paciente,
   agenda, notificaciones y perfil; probar que el menú perfil muestra nombre+correo y que "Cerrar
   sesión" apunta al action de sign-out (NO ejecutar el cierre en la verificación automatizada).
4. Buscar por nombre parcial y por RUT del seed (ej. un paciente de la Clínica Sonrisa Andes) →
   resultados y navegación a `/patients/[id]` funcionan (GET 200).
5. Suite rápida: `timeout 180 npx vitest run tests/unit/dashboard.test.ts` → PASS.

Resultado en 10-15 líneas al final. Ejecuta TODO sin detenerte. No imprimas secretos. No hagas commit.
