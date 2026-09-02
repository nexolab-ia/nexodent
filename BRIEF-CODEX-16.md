# BRIEF-CODEX-16 — Fix: middleware no detecta la cookie de sesión en HTTPS (prefijo `__Secure-`)

## Contexto

NexoDent (Next.js 16 + Better Auth v1.7.2). El login demo YA funciona a nivel de API:
`POST /api/demo/sign-in` devuelve `303` a `/agenda` con la cookie de sesión presente
(verificado por el orquestador). PERO al navegar a `/agenda` con esa cookie, el middleware
igual redirige a `/login`. La sesión en la base existe y es válida.

### Síntoma exacto (verificado por curl real, 2026-09-02)

- `POST /api/demo/sign-in` → `HTTP/2 303`, `location: /agenda`, y set-cookie:
  ```
  set-cookie: __Secure-better-auth.session_token=<token>; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=Lax
  ```
- `GET /agenda` CON esa cookie → `HTTP/2 307` `location: /login` (debería 200).

### Causa raíz (verificada en el código)

`middleware.ts` comprueba la cookie con un nombre HARDCODEADO sin prefijo:

```ts
export function middleware(request: NextRequest) {
  if (protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix)) && !request.cookies.has("better-auth.session_token")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}
```

Pero Better Auth, cuando detecta HTTPS (entorno seguro), emite la cookie con prefijo
`__Secure-` → el nombre real es **`__Secure-better-auth.session_token`**. Por eso
`request.cookies.has("better-auth.session_token")` es `false` SIEMPRE en producción (HTTPS),
y todas las rutas protegidas redirigen a `/login` aunque la sesión sea válida.

### Vía correcta (confirmada en el paquete instalado)

Better Auth expone el helper `getSessionCookie(request, config?)` en
`node_modules/better-auth/dist/cookies/index.mjs` (exportado junto con
`SECURE_COOKIE_PREFIX` / `HOST_COOKIE_PREFIX`). Ese helper resuelve el nombre REAL de la
cookie de sesión según el entorno (incluye `__Secure-`/`__Host-` cuando corresponda).

## Tareas

### T1 — Corregir `middleware.ts`

Usar el helper oficial en vez del nombre hardcodeado:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedPrefixes = ["/settings", "/agenda", "/patients", "/billing", "/estimates", "/migration", "/reports"];
export function middleware(request: NextRequest) {
  const needsAuth = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  if (needsAuth && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/settings/:path*", "/agenda/:path*", "/patients/:path*", "/billing/:path*", "/estimates/:path*", "/migration/:path*", "/reports/:path*"] };
```

Puntos a validar (y adaptar si hace falta según la firma del helper en este paquete):
- La firma real de `getSessionCookie` en este runtime: puede aceptar `(request: Request | Headers, config?)`.
  Si `NextRequest` no encaja, pasa `request` con el cast correcto (`request as unknown as Request`) o usa
  combinaciones de headers. VERIFICA el `.d.mts`/`.mjs` instalado y usa la llamada correcta.
- Usa el import `from "better-auth/cookies"` (subpath que existe en este paquete — se vio
  `node_modules/better-auth/dist/cookies/index.mjs`). Si el subpath no resuelve en bundling de
  Next 16 edge middleware, documenta la alternativa (p. ej. importar de `better-auth` si el helper
  está re-exportado en el index raíz, ej. `better-auth/dist` → `"better-auth"`).
- El middleware Next corre en **edge runtime**: verifica que el helper no use Node-only APIs
  (crypto/buffer). Si hiciera falta, la alternativa robusta es comparar manualmente contra
  `SECURE_COOKIE_PREFIX + "better-auth.session_token"` Y `"better-auth.session_token"`, o usar
  `request.cookies.get("__Secure-better-auth.session_token") ?? request.cookies.get("better-auth.session_token")`.

OBJETIVO del T1: que `/agenda` con una cookie de sesión VÁLIDA (obtenida del flujo demo) responda
con la página real (200/agenda), NO 307 a /login.

### T2 — Build + smoke + unit

- `timeout 420 npm run build` → PASS.
- `timeout 420 npm run test:smoke` → PASS.
- `timeout 420 npm run test:unit` → solo puede fallar `foundation.test.ts` (docker-compose.yml ausente; ajeno, NO tocar).

### T3 — Prueba del flujo (documentada)

Documenta en el reporte el comando manual que el orquestador usará para confirmar en producción
(mismo que ya usé): 
```bash
COOKIE=$(curl -s -D - -o /dev/null -X POST https://dental.nexolabs.cloud/api/demo/sign-in -H "Origin: https://dental.nexolabs.cloud" -H "User-Agent: Mozilla/5.0" | grep -i '^set-cookie:' | sed 's/^[Ss]et-[Cc]ookie: //' | cut -d';' -f1)
curl -s -o /dev/null -w "%{http_code}\n" https://dental.nexolabs.cloud/agenda -H "Cookie: $COOKIE" -H "User-Agent: Mozilla/5.0"
```
debe dar `200` (no `307`).

## Reporte final

Escribir `REPORTE-CODEX-16.md`:
- Código final de `middleware.ts`.
- La firma exacta de `getSessionCookie` que encontraste en este paquete y cómo la usaste.
- Confirmación de build/smoke/unit.
- Nota de qué pasa con el WARN de rate-limiting si lo observas (NO es bloqueante para este fix).

## Reglas

- NO commit, NO push, NO deploy: dejar en working tree para que el orquestador verifique y despliegue.
- NO imprimir secretos. NO tocar `lib/auth.ts`, `db/*`, `app/api/demo/*`, `/login`, `/demo` — ya resueltos.
- Ejecuta TODO sin detenerte a preguntar.