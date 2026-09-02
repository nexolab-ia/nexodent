# REPORTE-CODEX-15 — Corrección del redirect de demo sign-in

## Código final de la route handler

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

  const headers = new Headers({ location: new URL("/agenda", base).toString() });
  for (const cookie of authResponse.headers.getSetCookie()) headers.append("set-cookie", cookie);

  return new Response(null, { status: 303, headers });
}
```

## Solución aplicada

Se eligió construir un objeto `Headers` completo antes de crear la respuesta y devolver un `new Response(null, { status: 303, headers })`.

Este enfoque evita mutar los headers de una respuesta creada mediante `Response.redirect()`. Además, copia literalmente cada valor devuelto por `authResponse.headers.getSetCookie()`, sin analizar ni volver a serializar las cookies. De este modo se conservan todas las cookies emitidas por Better Auth, sus valores completos y sus atributos originales, incluidos `Path`, `HttpOnly`, `SameSite` y `Secure`.

## Evidencia del runtime

- Versiones instaladas: Next.js `16.1.1` y Node.js `22.22.3`.
- La reproducción directa de `Response.redirect(..., 303).headers.append(...)` produjo `TypeError: immutable`.
- Una prueba con `new Response` y un objeto `Headers` preparado previamente conservó dos valores `Set-Cookie` independientes, incluidos valores con `=` y sus atributos completos.
- La implementación instalada de `NextResponse.redirect` también evita mutar un redirect nativo: prepara un nuevo objeto `Headers` y luego construye la respuesta. La solución aplicada mantiene el mismo principio sin volver a interpretar las cookies de Better Auth.

## Resultados de verificación

### Build

- Resultado: **PASS**.
- Código de salida: `0`.
- Next.js generó correctamente `19` páginas.

### Smoke tests

- Resultado: **PASS**.
- Código de salida: `0`.
- Resultado: `9` archivos y `19` pruebas aprobadas.

### Unit tests

- Resultado: código de salida `1`, exclusivamente por el fallo permitido y ajeno a esta corrección.
- `foundation.test.ts` falló con `ENOENT` porque no existe `docker-compose.yml`.
- Resultado global: `1` prueba fallida y `42` aprobadas.
- Los otros `10` archivos de pruebas finalizaron correctamente.

### Prueba HTTP local

Se inició el runtime local en el puerto `3215` y se realizó el intento de flujo HTTP. La respuesta fue `303` hacia `/demo?error=unavailable`, sin cabecera de cookie, porque el entorno existente no contenía `DEMO_PASSWORD` ni un secreto válido.

El flujo exitoso completo —redirect `303` a `/agenda` con al menos una cabecera `Set-Cookie`— no pudo reproducirse sin modificar secretos o variables de entorno. No se alteraron ni expusieron secretos para forzar la prueba.

## Alcance y estado del working tree

- Único archivo fuente de implementación modificado: `app/api/demo/sign-in/route.ts`.
- `BRIEF-CODEX-15.md` era una entrada preexistente no rastreada y no fue modificado.
- Este reporte se creó como el artefacto final solicitado: `REPORTE-CODEX-15.md`.
- No se realizó commit, push ni deploy.
