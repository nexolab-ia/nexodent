# BRIEF-CODEX-15 — Fix: `TypeError: immutable` en route handler de demo sign-in (Next.js 16)

## Contexto / avance del bug raíz

OK — el error `22P02` de UUID está RESUELTO (`advanced.database.generateId: "uuid"`).
Ahora la sesión SÍ se crea en base (los logs ya NO muestran error de insert en `sessions`).
El bloqueo actual es OTRO, en la respuesta de la route handler demo.

### Síntoma exacto (runtime, contenedor web)

Al pulsar "Explorar la demo" (botón que hace POST a `/api/demo/sign-in`), el browser recibe:

```
HTTP/2 500
```
(antes se esperaba `303` a `/agenda`).

Y en los logs del contenedor:

```
⨯ TypeError: immutable
    at R (.next/server/chunks/[root-of-the-server]__33553d92._.js:1:7514)
    at async p (.next/server/chunks/[root-of-the-server]__33553d92._.js:1:10533)
    at async l (.next/server/chunks/[root-of-the-server]__33553d92._.js:1:11574)
    at async Module.O (.next/server/chunks/[root-of-the-server]__33553d92._.js:1:12652)
```

### El código actual de la route (src: `app/api/demo/sign-in/route.ts`)

```ts
import { auth } from "@/lib/auth";
import { readEnv } from "@/lib/env";

export async function POST() {
  const env = readEnv();
  const base = env.APP_URL ?? env.AUTH_URL;
  if (!base || !env.DEMO_PASSWORD) return Response.redirect(new URL("/demo?error=unavailable", base), 303);

  const signInUrl = new URL("/api/auth/sign-in/email", base);
  const authResponse = await auth.handler(new Request(signInUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: base,
      referer: `${base}/demo`,
    },
    body: JSON.stringify({ email: env.DEMO_EMAIL, password: env.DEMO_PASSWORD }),
  }));

  if (!authResponse.ok) return Response.redirect(new URL("/demo?error=unavailable", base), 303);

  const response = Response.redirect(new URL("/agenda", base), 303);
  for (const cookie of authResponse.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
  return response;
}
```

## Causa raíz probable (verificar y confirmar en el código real antes de fijar)

En Next.js 16 App Router, el objeto `Response` devuelto por `Response.redirect()` es **inmutable**
para mutaciones de headers posteriores. El patrón
`const response = Response.redirect(...); response.headers.append("set-cookie", ...); return response;`
lanza `TypeError: immutable` porque el header object de una `Response` creada vía `Response.redirect()`
(o `new Response()`) tiene *guard immutable*, y `.append()` falla.

Alternativas correctas que DEBES evaluar e implementar (elige la más robusta para Next.js 16):

1. **Construir las cookies ANTES de crear la Response**, pasando `headers: new Headers(...)` en el
   constructor del redirect, o usar `new Response(null, { status: 303, headers: { location: ..., "set-cookie": ... } })`
   armando todos los headers en el objeto inicial (no con `.append()` posterior).
2. **Usar `NextResponse.redirect()` de `next/server`** y `nextResponse.cookies.set(...)`, que es la API
   idiomática de Next para setear cookies en un redirect dentro de una route handler:
   ```ts
   import { NextResponse } from "next/server";
   const response = NextResponse.redirect(new URL("/agenda", base));
   for (const cookie of authResponse.headers.getSetCookie()) {
     const [name, ...rest] = cookie.split("=");
     response.cookies.set(name, rest.join("=").split(";")[0], { path: "/" });
   }
   return response;
   ```
   (Parsea el par name=value de cada `set-cookie` y lo aplica con la API nativa de cookies; respeta
   `path`, `httpOnly`, `sameSite`, `secure` según corresponda.)

OBLIGATORIO: lee el código real instalado y la doc/ada del runtime si hace falta, confirma el
comportamiento exacto (`Response.redirect` + `.append` en Next 16), y elige la vía que garantice un
`303` a `/agenda` con la(s) cookie(s) de sesión de Better Auth presentes en el cliente.

## Verificación (obligatoria)

1. `cat app/api/demo/sign-in/route.ts` → mostrar el código final.
2. `timeout 420 npm run build` → PASS.
3. **Prueba HTTP local del flujo** reproducida por ti antes de declarar éxito:
   - No hay runtime local levantado necesariamente; si puedes arrancar `npm run dev`/`start` con las
     env de prueba, haz un `curl -i -X POST /api/demo/sign-in` (con `Origin`/`Referer`) y confirma
     `HTTP/3xx` con `location: .../agenda` Y al menos una cabecera `set-cookie`.
   - Si no puedes arrancar el runtime local, deja documentado CÓMO verificarlo y confía en el análisis
     estático de Next 16.
4. `timeout 420 npm run test:smoke` → PASS.
5. `timeout 420 npm run test:unit` → solo puede fallar `foundation.test.ts` (docker-compose.yml ausente, ajeno).

## Reporte final

Escribir `REPORTE-CODEX-15.md`:
- El código final de la route handler (completo).
- Cuál de las vías elegiste y por qué (evidencia de Next 16).
- Resultados de build/smoke/unit y de la prueba HTTP de flujo (si se pudo).
- Confirmación de no tocar otros archivos (SOLO `app/api/demo/sign-in/route.ts`).

## Reglas

- NO commit, NO push, NO deploy: dejar todo en el working tree para que el orquestador verifique y despliegue.
- No imprimir secretos (DEMO_PASSWORD, AUTH_SECRET).
- No tocar `lib/auth.ts`, `db/*`, páginas `/login`, `/demo` ni `db/provision.ts` — ya resueltos.
- Ejecuta TODO sin detenerte a preguntar.