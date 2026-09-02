# BRIEF-CODEX-11 — NexoDent · Acceso: página de login + entrada a demo (fix crítico)

## Misión

La app está desplegada y healthy (`dental.nexolabs.cloud`), pero **NADIE puede entrar** porque las dos puertas de acceso son placeholders sin terminar. Construir (a) la página `/login` real con formulario functional y (b) la página `/demo` con entrada directa a la demo, y asegurar que el login demo funcione de extremo a extremo. No es un PR de features nuevo: es arreglar la ruta de acceso que el ciclo APPLY dejó sin terminar. **Al terminar DETENTE** — el orquestador verifica y decide si hace falta deploy.

## Contexto (ya verificado — NO reabrir)

- **Stack**: Next.js 16 (App Router) + React 19 + TS + Postgres (FORCE RLS) + Drizzle + Better Auth + Tailwind 4 / Shadcn. Todo el código en español y estilos 2026. Deploy: Coolify (dominio `dental.nexolabs.cloud`, actualmente `running:healthy`).
- **Estado del acceso hoy (verificado por el orquestador)**:
  - Landing `/` tiene dos CTAs: "Empezar 7 días gratis" → `/login`, y "Ver demo" → `/demo`.
  - `app/login/page.tsx` es un placeholder de 1 línea: `return <main><h1>Sign in</h1><p>Authentication is required to access organization settings.</p></main>;` — **sin formulario**.
  - `app/demo/page.tsx` es un placeholder de 1 línea: muestra solo el texto "Demo NexoDent" + descripción ficticia — **sin botón de entrada**.
  - Por eso no se puede realizar ningún login ni entrar a la demo.
- **Auth**: Better Auth en `lib/auth.ts` con `emailAndPassword: enabled`, endpoint `/api/auth/[...all]` (`app/api/auth/[...all]/route.ts`). Al hacer login, el hook `session.create.before` resuelve la membresía vía `app_resolve_active_membership(userId)` (SECURITY DEFINER) — patrón ya validado en PR1, NO tocar. Con una sesión válida, el middleware (`middleware.ts`) da acceso a `/agenda`,`/patients`,`/billing`,`/estimates`,`/migration`,`/reports`,`/settings`.
- **Credencial demo** (verificado: el endpoint `/api/auth/sign-in/email` responde y procesa, pero rechaza esta credencial con `INVALID_EMAIL_OR_PASSWORD`):
  - Email: `emilia.demo@nexodent.invalid` (usuario "Dra. Emilia Torres", organización Clínica Sonrisa Andes, rol `organization_admin`).
  - Password: en `/home/hermes/.hermes/home/.secrets/nexodent_deploy.env` → clave `DEMO_PASSWORD`. (LEER el valor del archivo; NUNCA imprimirlo en el reporte ni logs.)
- **Acceso a backend**: el endpoint HTTPS funciona (probado con curl): `POST https://dental.nexolabs.cloud/api/auth/sign-in/email` con JSON `{"email":...,"password":...}`; ante credencial correcta devuelve 200 con cookie de sesión; ante credencial mala devuelve 401 `{"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}`.

## ⚠️ LECCIONES APRENDIDAS (PR1-PR4 — OBLIGATORIO respetarlas)

1. NO confíes en self-reports: verifica el código REAL y prueba con la conexión/endpoint de menor privilegio.
2. No marques checkboxes en `openspec/.../tasks.md` — el orquestador marca tras verificar.
3. `runAsTenant()` en `lib/tenancy.ts` es OBLIGATORIO para toda action que toque tablas con RLS. Para LOGIN NO se necesita (el bootstrap se resuelve con SECURITY DEFINER).
4. Diseño-final-primero: usa los tokens y componentes del sistema vigente (ver DESIGN.md y globals.css) — NO inventar una estética nueva ni dejar CSS básico.
5. Postgres bigint llega como string desde postgres.js — si lees precios/totales haz `Number(...)` explícito.

## Causa raíz probable del login demo fallido (diagnóstico del orquestador)

En `db/provision.ts` (paso 5) la credencial demo se crea SOLO si no existe:

```
const existing = ...SELECT id FROM accounts WHERE provider_id='credential' AND account_id=${userId};
if (!existing[0]) { insert con hashPassword(demoPassword) } else { "ya existía" }
```

→ **Nunca se actualiza**. Si algún deploy previo provisionó con un `DEMO_PASSWORD` distinto/corrupto (hubo corrupción de envs en Coolify, ya corregida), el hash queda congelado y ya no coincide con el valor actual → `INVALID_EMAIL_OR_PASSWORD`. Este es un candidato fuerte de la causa.

## TAREAS (en orden; cada una con verificación)

### T1 — Página `/login` real (formulario funcional)
Construir `app/login/page.tsx` completa:
- Header con wordmark NexoDent (`Logo` de `@/components/brand/logo`) + link "Volver al inicio".
- Tarjeta centrada (estilo dashboard dark según `DESIGN.md`/`globals.css`: fondo `#0b1120`, surface `#111a2e`, acento `#22d3ee`, display Space Grotesk, radius 14px).
- Campos: email + password (con labels, `required`, autoComplete). Checkbox opcional "Mantener sesión" (se puede omitir si complica).
- Botón primario "Entrar" que haga sign-in de Better Auth (POST a `/api/auth/sign-in/email` — verifica el mejor patrón en el repo: si ya existe un `lib/auth-client.ts` o componente, úsalo; si no, haz un fetch directo al endpoint desde un client component y guarda la cookie como lo haga Better Auth / `set-cookie`).
- Manejo de errores en pantalla (mensaje "Email o contraseña incorrectos" en `[role="alert"]`, borde rojo `--danger`).
- Estado de carga en el botón mientras pide.
- Redirección a `/agenda` tras login exitoso. Si ya hay sesión activa, redirigir directo a `/agenda`.
- Eliminar el placeholder actual (el `<h1>Sign in</h1>` al menos; mantén la ruta `/login`).
- **Verificación**: levantar la app en dev ({login dev: `LEER package.json` scripts; probablemente `npm run dev`) y probar que (a) `/login` renderiza el formulario, (b) con credencial incorrecta muestra el error, (c) en dev no se puede validar el éxito real si la credencial sigue mala — en ese caso pasar a T3 y verificar el flujo completo en el deploy.

### T2 — Página `/demo` con entrada real
Construir `app/demo/page.tsx` como **landing de demo** que permita entrar:
- Mantener/mejorar el aviso de "DATOS FICTICIOS — solo demostración". Tarjeta con identidad Clínica Sonrisa Andes (Providencia y Ñuñoa, 20 pacientes).
- Botón principal **"Explorar la demo"** que inicia sesión con la cuenta demo y redirige a `/agenda`.
- Cómo hacerlo: lo más robusto es una **server action / route handler en el server** que lea el password demo de la variable de entorno `DEMO_PASSWORD` (ver `lib/env.ts` para el patrón de lectura) y haga el sign-in de Better Auth server-side, guardando la cookie de sesión y redirigiendo. **NUNCA** exponer la contraseña en el cliente ni en JS del bundle. Si la var `DEMO_PASSWORD` no está en `lib/env.ts` o `.env.example`, agrégala (solo NOMBRE en `.env.example`, nunca valor).
- Fallback de UX: si el server action devuelve error de credencial, mostrar mensaje claro ("La demo no está disponible" con instrucción de contactar soporte) en lugar de redirigir a un 500.
- **Verificación**: tras T3, probar en el deploy que el botón entra a `/agenda`.

### T3 — Arreglar credencial demo para que el login funcione END-TO-END
Diagnóstico: el endpoint responde pero la credencial actual es rechazada. Hacer que la credencial demo **siempre** coincida con `DEMO_PASSWORD`:
- En `db/provision.ts` paso 5, cambiar de "insert si no existe" a **UPSERT**: si la credencial existe pero la contraseña no coincide con el hash de `DEMO_PASSWORD`, ACTUALIZAR el `password` (hash nuevo). Mantener idempotente (si ya coincide, no tocar). Esto garantiza que un re-provision deja la demo funcionando con el `DEMO_PASSWORD` vigente.
- Verificar si conviene también forzar que `DEMO_EMAIL` coincida con el fixture (ya es `emilia.demo@nexodent.invalid` por defecto; no cambiar).
- **NO desplegar tú mismo** (el deploy es del orquestador) — pero dejar documentado EXACTAMENTE qué hace falta para refrescar el seed: (a) si el contenedor `provision` del stack ya corrió y la credencial quedó mala, el orquestador re-ejecutará el provision con el nuevo código; deja el cambio listo en el repo.

### T4 — Verificación final (imprescindible)
- `npm run build` limpio (o `tsc --noEmit` al menos) — sin errores TS.
- Correr la suite existente: `LEER package.json` para el script de tests y ejecútalo — los tests que existían deben seguir pasando (nuevo: prueba de que `/login` y el upsert de credencial tengan cobertura mínima si encaja en el patrón de tests del repo; si no, al menos no romper lo existente).
- Escribir el reporte.

## REGLAS ABSOLUTAS
- **NO modifiques** migraciones existentes ni schema salvo el cambio de upsert en `provision.ts` indicado. No toques `lib/tenancy.ts`, `lib/auth.ts` (salvo que T1 requiera añadir `lib/auth-client.ts` nuevo sin romper el server).
- NO cambiar el diseño del dashboard ni de la landing (excepto los puntos indicados en `/login` y `/demo`).
- NO imprimir secretos (ni `DEMO_PASSWORD`, ni `AUTH_SECRET`, ni valores de env) en stdout, logs, ni reporte.
- Este directorio YA tiene archivos: NO borres nada fuera de `app/login/page.tsx` y `app/demo/page.tsx`.
- ⛔ REGLA ANTI-BLOQUEO: NUNCA te detengas a esperar aprobación humana. Si algo falla tras 2 intentos, documenta la causa y continúa con la siguiente tarea. Cada `curl` con `--max-time 25`. Todo comando de build/test con timeout razonable (npm run build puede tardar — usa timeout 300). El reporte final es OBLIGATORIO aunque algo falle.
- NO marques checkboxes en openspec/tasks.md.
- Este es un fix de acceso, no un PR de features: mantén el cambio mínimo y quirúrgico.

## REPORTE
Escribir `REPORTE-CODEX-11.md` en la raíz del repo con: qué se cambió en cada tarea (archivos + líneas clave), el resultado de cada verificación (build, tests, y la prueba del login en dev/deploy con HTTP codes), la causa raíz confirmada del fallo de credencial si pudiste validarla, y los pasos exactos que faltan para refrescar el seed demo (para que el orquestador los ejecute).