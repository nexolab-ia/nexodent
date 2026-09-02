# BRIEF-CODEX-12 — NexoDent · Fix raíz del login demo (Better Auth issuer)

## Misión

El login demo sigue fallando con "User not found" pese a que las páginas `/login` y `/demo` ya son funcionales. Implementar de forma correcta y completa el fix de la causa raíz (diagnosticada por el orquestador y **confirmada leyendo el código de Better Auth v1.7.2 instalado**), verificar con tests y dejar el código listo para que el orquestador despliegue. **Al terminar DETENTE** — no despliegues, no hagas push al deploy; el orquestador decide el deploy.

## Contexto (YA verificado por el orquestador — NO reabrir ni rediagnosticar)

- **Stack**: Next.js 16 (App Router) + React 19 + TS + Postgres (FORCE RLS) + Drizzle + Better Auth + Tailwind 4. Deploy: Coolify (`dental.nexolabs.cloud`, running:healthy). Todo en español y estilos 2026.
- **Estado actual**: `/login` y `/demo` son funcionales y están desplegados. El redirect de `/api/demo/sign-in` ya apunta al dominio correcto (se arregló usando `APP_URL` en vez de `request.url`). El env de Coolify es correcto. El único fallo restante es la autenticación de la cuenta demo.
- **Síntoma actual**: `POST /api/auth/sign-in/email` con `emilia.demo@nexodent.invalid` + el `DEMO_PASSWORD` real de Coolify devuelve `401 INVALID_EMAIL_OR_PASSWORD`, y el log del web muestra `WARN [Better Auth]: User not found`.

## ⚠️ CAUSA RAÍZ — DIAGNÓSTICO DEL ORQUESTADOR (confirmado, NO re-investigar)

Better Auth v1.7.2 (la versión instalada en `node_modules`) exige que las cuentas locales del proveedor `credential` lleven un campo `issuer` con el valor `'local:credential'`. Evidencia leída del código:

- `node_modules/better-auth/dist/api/routes/sign-in.mjs` (~línea 320): el sign-in por email/password busca la cuenta credential haciendo match de `account.providerId === "credential" && account.issuer === createLocalAccountIssuer("credential") && account.accountId === user.id`. Si no encuentra la cuenta así, loguea **"User not found"** y responde `INVALID_EMAIL_OR_PASSWORD`.
- `node_modules/@better-auth/core/dist/db/schema/account.mjs`: `issuer: z.string()` es **obligatorio**, y `createLocalAccountIssuer(providerId)` devuelve `local:${encodeURIComponent(providerId)}` → para `credential` = `'local:credential'`.

**El bug**: la tabla `accounts` NO tiene columna `issuer` (ni la migración `0000_core.sql` ni el schema de drizzle `db/schema/auth.ts` la definen), y `db/provision.ts` inserta la cuenta demo sin ese campo. Por eso mejor-auth no encuentra la cuenta credential → "User not found" aunque el usuario `emilia` SÍ existe (el provision lo crea y sale con éxito).

## TAREAS (en orden; cada una con verificación)

### T1 — Implementar el fix del `issuer` (migración + schema + provision consistentes)
Si el `git` working tree ya tiene cambios parciales para esto (el orquestador pudo dejar borradores en `db/migrations/0007_*.sql`, `db/schema/auth.ts` y `db/provision.ts`), REVÍSALOS, corrígelos si hace falta y déjalos correctos y completos. Si no existen, créalos. Requisitos exactos:
1. **Nueva migración SQL** `db/migrations/0007_add_accounts_issuer.sql`:
   - `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS issuer varchar(255);`
   - Backfill: `UPDATE accounts SET issuer = 'local:credential' WHERE provider_id = 'credential' AND (issuer IS NULL OR issuer = '');`
   - Sigue el formato de las migraciones existentes (nombre `0007_`, SQL crudo).
2. **Schema drizzle** `db/schema/auth.ts`: añadir `issuer: varchar("issuer", { length: 255 })` a la tabla `accounts` (nullable, sin `.notNull()`, para no romper filas OAuth futuras ni exigir default).
3. **Provision** `db/provision.ts` paso 5: el INSERT/UPSERT de la cuenta demo debe incluir `issuer = 'local:credential'` tanto en el INSERT como en el `ON CONFLICT ... DO UPDATE SET`. Mantener el resto (verifyPassword + UPSERT del password) intacto.
4. **Verificar consistencia**: la migración debe poder aplicarse sobre la DB actual (backfill funcionará sobre las filas demo existentes). NO modificar migraciones anteriores, rollback ni snapshot salvo que el fix lo exija (rollback ya borra la tabla completa, así que no requiere cambio).

### T2 — Verificación de que mejor-auth creará/leerá la columna correctamente
- Confirma que el schema de drizzle y la migración usan el MISMO nombre de columna (`issuer`) que mejor-auth espera (`authTables.account.fields.issuer.fieldName || "issuer"`). No lo re-nombres.
- Confirma que `usePlural: true` sigue activo y correcto en `lib/auth.ts` (NO tocar la config de auth salvo que sea estrictamente necesario).

### T3 — Pruebas
- `tsc`/`npm run build` limpio (build puede tardar; usa `timeout 420`).
- Correr la suite: `npm run test:smoke`, `npm run test:unit`, `npm run test:integration` — los existentes deben seguir pasando. NO marques checkboxes en openspec/tasks.md.
- Si el patrón de tests del repo lo permite, actualiza `tests/smoke/demo.spec.ts` para verificar que la migración 0007 y el provision incluyen el `issuer` (afirmaciones sobre el contenido de los archivos, sin tocar la DB).

## ⚠️ LECCIONES APRENDIDAS (PR1-PR4 + BRIEF-CODEX-11 — OBLIGATORIO respetarlas)
1. NO confíes en self-reports: verifica el código real y prueba con la conexión/endpoint de menor privilegio.
2. No marques checkboxes en `openspec/.../tasks.md` — el orquestador marca tras verificar.
3. `runAsTenant()` en `lib/tenancy.ts` es OBLIGATORIO para toda action que toque tablas con RLS. Para LOGIN/bootstrap NO se necesita (la resolución de membresía ya usa `app_resolve_active_membership`, SECURITY DEFINER).
4. Diseño-final-primero: usa los tokens y componentes del sistema (`DESIGN.md`, `globals.css`). NO inventar estética nueva ni dejar CSS básico.
5. **Consistencia migración ↔ schema ↔ provision**: toda columna nueva de una tabla mejor-auth debe existir en la migración, el schema drizzle y los INSERTs que la escriban. El patrón de este fix sale de que la columna `issuer` estaba ausente en los 3 sitios.

## REGLAS ABSOLUTAS
- NO toques `lib/auth.ts` ni `lib/tenancy.ts` salvo lo indicado. NO modifiques migraciones anteriores a 0007. NO cambies el diseño de páginas.
- NO imprimas secretos (solo NOMBRES de env, nunca valores) en stdout, logs ni reporte.
- Este directorio YA tiene archivos: NO borres nada fuera de lo del fix.
- NO despliegues ni hagas push; deja el cambio listo y el commit si quieres (o sin commit — el orquestador decide).
- ⛔ REGLA ANTI-BLOQUEO: NUNCA te detengas a esperar aprobación humana. Si algo falla tras 2 intentos, documenta la causa y continúa. Cada `curl`/build con timeout. El reporte final es OBLIGATORIO aunque algo falle.
- NO marques checkboxes.

## REPORTE
Escribir `REPORTE-CODEX-12.md` en la raíz del repo con: los archivos modificados/creados y las líneas clave, el resultado de cada verificación (build + tests + confirmación de que la migración es aplicable y el backfill es correcto), y cualquier hallazgo adicional sobre por qué el sign-in fallaba si lo confirmas al inspeccionar el código también.