# REPORTE-CODEX-13 — IDs UUID para Better Auth

## Resumen

Se configuró Better Auth para generar UUID v4 mediante `crypto.randomUUID()` y para obtener la IP del cliente desde `x-forwarded-for` cuando la solicitud proviene del proxy confiable indicado. No se modificaron esquemas, migraciones, aprovisionamiento ni rutas de autenticación.

## Cambio exacto en `lib/auth.ts`

```diff
diff --git a/lib/auth.ts b/lib/auth.ts
index 1536aca..f4afb85 100644
--- a/lib/auth.ts
+++ b/lib/auth.ts
@@ -38,6 +38,10 @@ export const auth = betterAuth({
   secret: env.AUTH_SECRET,
   baseURL: env.AUTH_URL ?? env.APP_URL,
   emailAndPassword: { enabled: true },
+  advanced: {
+    generateId: () => crypto.randomUUID(),
+    ipAddress: { ipAddressHeaders: ["x-forwarded-for"], trustedProxies: ["::ffff:127.0.0.1"] },
+  },
   databaseHooks: { session: { create: { before: async (session) => { await activeMembershipForUser(session.userId); } } } },
   plugins: [customSession(async ({ user, session }) => ({ user, session, claims: claimsForMembership(await activeMembershipForUser(user.id)) }))],
 });
```

`crypto` se usa como API global del runtime de Node.js; no se añadió un import.

## Verificaciones

| Comando | Resultado | Evidencia |
|---|---|---|
| `timeout 420 npm run build` | **PASS** (código 0) | Next.js compiló correctamente, completó TypeScript, generó 19/19 páginas estáticas y finalizó la optimización. Durante la recolección de páginas imprimió avisos de Better Auth por el secreto predeterminado del entorno de build; no causaron el fallo del comando ni se expuso ningún valor. También apareció la advertencia preexistente de deprecación de `middleware`. |
| `timeout 420 npm run test:smoke` | **PASS** (código 0) | 9 archivos aprobados; 19 pruebas aprobadas; duración 2.19 s. Vite imprimió una advertencia sobre la carga nativa futura de `vitest.config.ts`. |
| `timeout 420 npm run test:unit` | **FALLO PREEXISTENTE PERMITIDO** (código 1) | 10 archivos aprobados y 1 fallido; 42 pruebas aprobadas y 1 fallida. El único fallo fue `tests/unit/foundation.test.ts`: `ENOENT` al intentar abrir `docker-compose.yml`, ausente en el working tree. No se modificó ese test ni se intentó corregir este problema ajeno al cambio. |

## Observaciones sobre IDs existentes

- `db/schema/auth.ts` declara los IDs de `sessions`, `accounts` y `verifications` con el helper `id()`; `db/schema/core.ts` define ese helper como una columna PostgreSQL `uuid` con `defaultRandom()` y clave primaria.
- La fixture demo usa UUIDs hardcodeados con formato válido para usuarios, membresías y demás entidades aprovisionadas.
- `db/provision.ts` crea o actualiza la cuenta de credenciales omitiendo explícitamente `accounts.id`; por lo tanto, PostgreSQL aplica el UUID predeterminado de la columna al crearla. Una cuenta existente que pueda devolver esa consulta también debe contener un UUID válido porque la columna es de tipo `uuid`.
- El aprovisionamiento no inserta filas en `sessions` ni `verifications`. No hay evidencia en las definiciones inspeccionadas de IDs alfanuméricos existentes que puedan chocar con el nuevo generador.
- Esta conclusión se basa en el esquema y el código de aprovisionamiento del repositorio; no se consultó una base de datos de producción ni se imprimieron secretos.

## Alcance y rollback

- Archivos de implementación modificados: `lib/auth.ts`.
- Reporte creado: `REPORTE-CODEX-13.md`.
- Rollback: retirar únicamente el bloque `advanced` añadido a `lib/auth.ts` y eliminar este reporte, sin afectar cambios ajenos.
- No se realizó commit ni push.
