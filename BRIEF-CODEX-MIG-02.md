# BRIEF-CODEX-MIG-02 — Fix: login/registro no navegan tras submit (carrera router.replace + router.refresh)

## Contexto

NexoDental vive en Vercel (`dental.nexolabs.cloud`). El login demo FALLA en la UI: el usuario
pone credenciales válidas, el POST a `/api/auth/sign-in/email` responde 200 (sesión creada),
pero la página NO navega: queda en `/login` sin mensaje de error. Diagnóstico con evidencia
(2026-09-05): sin errores de consola, sesión válida (navegar manual a `/dashboard` funciona),
y el patrón del código es:

```ts
router.replace("/dashboard");
router.refresh();
```

En Next 16 (app router), `router.refresh()` llamado inmediatamente después de `router.replace()`
**cancela la navegación pendiente** (carrera conocida): refresh re-renderiza la ruta actual
(`/login`) y el replace nunca se completa. El `router.refresh()` post-redirección es innecesario:
al navegar a una server page, Next ya revalida los datos de la ruta destino.

## Objetivo (2 archivos, 1 línea eliminada cada uno)

1. `app/login/login-form.tsx` líneas ~29-30:
   - ELIMINAR la línea `router.refresh();`
   - Conservar `router.replace("/dashboard");`
2. `app/registro/registro-form.tsx` líneas ~37-38:
   - ELIMINAR la línea `router.refresh();`
   - Conservar `router.replace("/bienvenida");`

NO toques nada más. NO reordenes líneas ni cambies imports. No añadas `await`.

## Verificación

1. `npm run lint` → sin errores.
2. `git diff --stat` → SOLO los 2 archivos, 2 líneas eliminadas.
3. (Opcional si alcanza) `npm run build` local.

## ⛔ REGLAS ABSOLUTAS

- NO hagas commit ni push (lo hace el gatekeeper). NO corras migraciones/provision.
- NO modifiques otros archivos (aunque veas el mismo patrón en otro lado — se audita aparte).
- NO imprimas secretos. Si una edición falla por sandbox/bwrap, usa escritura directa por shell.
- No te detengas a esperar aprobación: 2 intentos por tarea, documenta y sigue.

## Reporte

Escribe `REPORTE-CODEX-MIG-02.md` en la raíz con archivos tocados y resultado de verificaciones.
