# BRIEF-CODEX-17 — Onboarding post-registro (UI SOLO: registro + bienvenida + elegir perfil)

## Alcance (DECIDIDO con el cliente, respetar exactamente)

Solo frontend/UX. NO se toca base de datos, RLS, ni lógica de creación de organización.
Los pasos de configuración por perfil y la creación org/membresía quedan para una fase posterior.

### Rutas nuevas
1. `/registro` — Signup (nombre, email, contraseña) → al éxito va a `/bienvenida`.
2. `/bienvenida` — "¡Hola {nombre}, vamos a personalizar tu experiencia!" → CTA a `/onboarding`.
3. `/onboarding` — Elegir perfil (3 tarjetas), con panel de detalle "acorde a tu perfil".

## Referencias de código a seguir (coherencia visual OBLIGATORIA)

- Estilos base: `app/globals.css` tokens root (`--bg:#0b1120; --surface; --surface-2; --accent:#22d3ee; --border; --radius:14px; --shadow`).
- Páginas de auth existentes: `app/login/page.tsx` + `app/login/login-form.tsx` + `app/access.module.css`.
  REUTILIZAR `access.module.css` (clases `.shell`, `.header`, `.card`, `.heading`, `.form`,
  `.primaryButton`, `.backLink`, `.alert`). Añadir clases nuevas SOLO si hace falta, en `access.module.css`.
- Logo: `components/brand/logo.tsx` (usar `<Logo/>` en el header de cada página).
- Formulario cliente: clonar el patrón de `login-form.tsx` (fetch a endpoint de Better Auth,
  `credentials: "same-origin"`, estados error/loading con `aria-busy`).
- Enfoque de sesión en páginas server: `auth.api.getSession({ headers: await headers() })` (igual que login page).

## El sistema de diseño a usar (tokens de la app)

- Modo oscuro, fondo `--bg`, tarjetas `--surface`, bordes `--border`, acento cian `--accent`,
  texto `--ink`, muted `--muted`. Border-radius `--radius`. Sombra `--shadow`.
- TIPOGRAFÍA: títulos `--font-display` (Space Grotesk); cuerpo `--font-ui` (Inter).
- IDIOMA: **español de Chile, tuteo** ("Entra", "Elige", "Puedes"). PROHIBIDO voseo argentino.
- Acento cian `#22d3ee` en botones primarios y resaltes. Estados hover con `--surface-2`.

## T1 — Página de registro: `app/registro/page.tsx` + `app/registro/registro-form.tsx`

**page.tsx** (server): igual estructura que login page.
- `const session = await auth.api.getSession({ headers: await headers() }); if (session) redirect("/onboarding");`
- Shell de auth con `<Logo/>`, link "Volver al inicio" → `/`, `main` con `card`, heading
  "Crea tu cuenta NexoDent", sub "Empieza a ordenar tu clínica o consulta en minutos."

**registro-form.tsx** (client):
- Campos: **Nombre** (`name`, text, autocomplete="name"), **Email** (`email`, type=email,
  autoComplete="email"), **Contraseña** (`password`, type=password, autoComplete="new-password", minLength 8).
- Submit: `fetch("/api/auth/sign-up/email", { method:"POST", headers:{Content-Type:"application/json"},
  credentials:"same-origin", body: JSON.stringify({ name, email, password }) })`.
- Si `!response.ok`: texto genérico según status (409 → "Este email ya está registrado.";
  otros → "No pudimos crear tu cuenta. Intenta nuevamente."). MOSTRAR en `<p className={styles.alert} role="alert">`.
- Si ok: `router.replace("/bienvenida"); router.refresh();`
- Botón primario con loading ("Creando cuenta…" / "Crear cuenta"), `aria-busy`.
- Bajo el form: link "¿Ya tienes cuenta? Entra" → `/login`. Y enlazar la demo.

## T2 — Pantalla de bienvenida: `app/bienvenida/page.tsx`

Server page (usa sesión):
- `const session = await auth.api.getSession({ headers: await headers() }); if (!session) redirect("/login");`
- `const name = session.user?.name?.split(" ")[0] ?? ""` (solo el primer nombre para el saludo).
- Layout: shell de auth (`access.module.css`), centrado, con un toque celebratorio:
  - Header con `<Logo/>` + link volver.
  - Card con heading **`¡Hola, {name}!`** y subtítulo grande y amigable:
    "Vamos a personalizar tu experiencia para que NexoDent se adapte a cómo trabajas."
  - Texto breve muted: "Respondé una pregunta y en menos de un minuto tenés tu espacio listo."
    (revisar tono: usar tuteo → "Responde una pregunta y en menos de un minuto tendrás tu espacio listo.")
  - Botón primario "Elegir mi perfil" → `router` / `<Link href="/onboarding">` → `/onboarding`.
- Emplear `.heading` grande; puede agregarse un pequeño ícono/emoji (👋) decorativo en el card.

## T3 — Elegir perfil: `app/onboarding/page.tsx` + `app/onboarding/profile-picker.tsx`

**page.tsx** (server): protección igual que bienvenida (`!session → /login`).
Layout de auth con card ancho (`width:min(100%,40rem)` vía estilos). Título:
"¿Qué tipo de espacio quieres configurar?" y p muted "Elige la opción que mejor describa cómo trabajas."

**profile-picker.tsx** (client) — 3 tarjetas seleccionables, una a la vez (radio visual):
1. **Soy profesional independiente** — descrip: "Gestiona tu consulta solo: agenda, pacientes,
   presupuestos y cobros en un mismo lugar." (icono: persona → SVG inline o emoji 👨‍⚕️)
2. **Tengo una clínica** — descrip: "Administra tu clínica con tu equipo: sedes, roles y
   operación completa." (icono: edificio 🏥)
3. **Quiero unirme a un espacio existente** — descrip: "Entra a una clínica o consulta que ya
   usa NexoDent con un código de invitación." (icono: comunidad 👥)

Comportamiento:
- Las tarjetas son botones `<button>` con estado `aria-pressed`. Al seleccionar una, se marca
  con borde acento + fondo `--surface-2` + un indicador ✓.
- Debajo, un **panel de detalle "acorde a tu perfil"** que cambia según la selección:
  - Profesional: "Perfecto para empezar solo. En la próxima fase configurarás tu consulta,
    sede y agenda."
  - Clínica: "Perfecto para equipos. En la próxima fase crearás tu clínica e invitarás a tu equipo."
  - Unirse: "En la próxima fase ingresarás el código de invitación de tu espacio."
  - Sin selección: panel con texto muted "Selecciona una opción para ver qué sigue."
- Botón primario "Continuar" al pie: visible siempre pero **deshabilitado hasta que haya
  selección** (`disabled={!selected}`). Como es fase UI-solo, al hacer clic NO crea ni navega
  a un punto muerto: muestra una nota informativa (p. ej. en el panel) "La configuración de tu
  perfil estará disponible pronto." — NO crear organización ni redirigir fuera del flujo UI.
  (El cliente validará la experiencia; la lógica real se conecta en la siguiente fase.)

## Verificación (obligatoria, con evidencia)

1. `timeout 420 npm run build` → PASS.
2. Rutas nuevas responden: con `curl` a `/registro`, `/bienvenida` y `/onboarding` (sin sesión):
   - `/registro` → 200 (página renderiza).
   - `/bienvenida` → 307 a `/login` (protegida, esperado).
   - `/onboarding` → 307 a `/login` (protegida, esperado).
3. `timeout 420 npm run test:smoke` → PASS.
4. `timeout 420 npm run test:unit` → solo puede fallar `foundation.test.ts` (docker-compose.yml
   ausente, ajeno; NO tocar).
5. Inspección visual: sigue tokens de la app (modo oscuro, cian, tarjetas). Mostrar captura o
   estructura HTML de las 3 páginas en el reporte.

## Reporte final

Escribir `REPORTE-CODEX-17.md`:
- Lista de archivos creados/modificados.
- Código clave de cada página/form (resumen).
- Resultados build/curl-tests/smoke/unit con evidencia.
- Confirmación de que NO se tocó BD, migraciones, esquema, middleware ni rutas de auth existentes.
- NOTA: si el build falla por sign-up (no esperado), documentarlo; NO parchear auth.

## Reglas

- NO commit, NO push, NO deploy: dejar en working tree para el orquestador.
- NO imprimir secretos. NO tocar `lib/auth.ts`, `db/*`, `app/login`, `app/demo`, `middleware.ts`
  (ya resueltos y estables).
- Ejecuta TODO sin detenerte a preguntar.
- Español chileno con tuteo.