# REPORTE-CODEX-17 — Onboarding post-registro

## Resultado

Implementación UI-solo completada para el flujo `/registro` → `/bienvenida` → `/onboarding`. No se creó ni modificó lógica de organización, membresía, base de datos o autorización.

## Archivos creados y modificados

- `app/registro/page.tsx` — página server de registro y redirección de sesiones activas a `/onboarding`.
- `app/registro/registro-form.tsx` — formulario cliente de nombre, email y contraseña contra Better Auth.
- `app/bienvenida/page.tsx` — bienvenida protegida con saludo por primer nombre y CTA al selector de perfil.
- `app/onboarding/page.tsx` — página protegida del selector de perfil.
- `app/onboarding/profile-picker.tsx` — selector cliente de tres perfiles, detalle contextual y estado informativo de próxima fase.
- `app/access.module.css` — estilos adicionales del flujo, basados exclusivamente en los tokens existentes.
- `REPORTE-CODEX-17.md` — este reporte.

`BRIEF-CODEX-17.md` y `ONBOARDING_PROFILES.md` ya estaban como archivos no versionados ajenos a esta implementación y se mantuvieron intactos.

## Implementación clave

### Registro

- La página obtiene la sesión con `auth.api.getSession({ headers: await headers() })` y redirige una sesión activa a `/onboarding`.
- El formulario envía `name`, `email` y `password` a `POST /api/auth/sign-up/email`, con JSON y `credentials: "same-origin"`.
- El error `409` muestra `Este email ya está registrado.`; otros errores HTTP muestran una recuperación genérica y los errores de conexión tienen un mensaje específico.
- El botón expone estado loading con `aria-busy`, y el éxito ejecuta `router.replace("/bienvenida")` más `router.refresh()`.
- Incluye enlaces a `/login` y `/demo`.

### Bienvenida

- La página redirige a `/login` cuando no existe sesión.
- Extrae solo el primer nombre con `session.user?.name?.split(" ")[0] ?? ""`.
- Presenta saludo, mensaje de personalización, texto breve en tuteo chileno, ícono SVG decorativo y enlace primario a `/onboarding`.

### Selector de perfil

- La página redirige a `/login` cuando no existe sesión.
- Presenta tres botones seleccionables con SVG coherentes, `aria-pressed`, indicador visual y selección exclusiva.
- El panel `aria-live` cambia según la selección y muestra el próximo paso correspondiente.
- `Continuar` permanece visible y deshabilitado sin selección. Al activarlo solo informa que la configuración estará disponible pronto; no crea datos ni navega a una ruta incompleta.

## Inspección de estructura HTML/UI

La respuesta real de `/registro` confirmó esta estructura renderizada:

```html
<header>
  <Logo />
  <a href="/">Volver al inicio</a>
</header>
<main>
  <section aria-labelledby="registro-title">
    <h1 id="registro-title">Crea tu cuenta NexoDent</h1>
    <form novalidate>
      <label>Nombre <input name="name" autocomplete="name" /></label>
      <label>Email <input name="email" type="email" autocomplete="email" /></label>
      <label>Contraseña <input name="password" type="password" minlength="8" /></label>
      <button aria-busy="false">Crear cuenta</button>
    </form>
  </section>
</main>
```

Las páginas protegidas se validaron estructuralmente desde sus componentes, ya que una solicitud anónima debe redirigir antes de renderizar su contenido:

```html
<!-- /bienvenida, con sesión -->
<header><Logo /><a href="/">Volver al inicio</a></header>
<main>
  <section aria-labelledby="bienvenida-title">
    <svg aria-hidden="true">…</svg>
    <h1 id="bienvenida-title">¡Hola, {primerNombre}!</h1>
    <p>Vamos a personalizar tu experiencia…</p>
    <a href="/onboarding">Elegir mi perfil</a>
  </section>
</main>

<!-- /onboarding, con sesión -->
<section aria-labelledby="onboarding-title">
  <h1 id="onboarding-title">¿Qué tipo de espacio quieres configurar?</h1>
  <div aria-label="Tipos de espacio">
    <button aria-pressed="false">Soy profesional independiente</button>
    <button aria-pressed="false">Tengo una clínica</button>
    <button aria-pressed="false">Quiero unirme a un espacio existente</button>
  </div>
  <div aria-live="polite">Selecciona una opción para ver qué sigue.</div>
  <button disabled>Continuar</button>
</section>
```

La capa visual reutiliza `--bg`, `--surface`, `--surface-2`, `--accent`, `--ink`, `--muted`, `--border`, `--radius`, `--shadow`, `--font-display` y `--font-ui`. Los estados activo, hover, focus global, disabled, loading, error y vacío están cubiertos. No se agregaron emojis; los íconos son SVG con un lenguaje de trazo uniforme.

## Verificación

### Build

Comando:

```text
timeout 420 npm run build
```

Resultado: **PASS**, exit code `0`.

Evidencia relevante:

```text
✓ Compiled successfully in 25.7s
✓ Generating static pages using 7 workers (22/22)
ƒ /bienvenida
ƒ /onboarding
ƒ /registro
```

Better Auth emitió advertencias por el secreto predeterminado durante la recolección de páginas, pero el build terminó correctamente. No se modificó la configuración de auth, según el alcance.

### Respuestas HTTP sin sesión

Servidor local de producción iniciado solo para verificación con un secreto efímero no persistido.

```text
/registro:    HTTP/1.1 200 OK
/bienvenida:  HTTP/1.1 307 Temporary Redirect
               location: /login
/onboarding:  HTTP/1.1 307 Temporary Redirect
               location: /login
```

Resultado: **PASS** para las tres rutas.

### Smoke tests

Comando:

```text
timeout 420 npm run test:smoke
```

Resultado: **PASS**, exit code `0`.

```text
Test Files  9 passed (9)
Tests       19 passed (19)
Duration    2.78s
```

### Unit tests

Comando:

```text
timeout 420 npm run test:unit
```

Resultado: **PASS con la única excepción externa permitida por el brief**, exit code `1`.

```text
Test Files  1 failed | 10 passed (11)
Tests       1 failed | 42 passed (43)
FAIL tests/unit/foundation.test.ts
Error: ENOENT: no such file or directory, open 'docker-compose.yml'
```

La única falla es `foundation.test.ts` por la ausencia previa de `docker-compose.yml`. No corresponde al flujo UI y no se corrigió.

### Comprobaciones adicionales

```text
timeout 420 npm run lint  → PASS, exit code 0
git diff --check          → PASS, exit code 0
```

El escaneo de las rutas nuevas no encontró voseo argentino.

## Confirmación de alcance

- No se tocó `lib/auth.ts`.
- No se tocó `db/*`, base de datos, migraciones ni esquema.
- No se tocó `middleware.ts`.
- No se tocaron `app/login`, `app/demo` ni rutas de auth existentes.
- No se implementó creación de organización, membresía, RLS ni lógica por perfil.
- No se hizo commit, push ni deploy.

## Límite de reversión

Para retirar únicamente este trabajo, elimina `app/registro/`, `app/bienvenida/`, `app/onboarding/` y `REPORTE-CODEX-17.md`, y revierte solo las clases agregadas al final de `app/access.module.css`. No es necesario modificar ningún otro comportamiento del proyecto.
