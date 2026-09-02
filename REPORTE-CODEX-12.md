# REPORTE-CODEX-12 — Fix raíz del login demo

## Resultado

Se completaron T1, T2 y T3 en orden. El fix incorpora `accounts.issuer` de forma consistente en migración, schema Drizzle, provisionado y prueba smoke. No se desplegó, no se hizo push ni commit, y no se imprimieron valores de secretos.

## T1 — Migración, schema y provision

- `db/migrations/0007_add_accounts_issuer.sql:8-9`
  - Agrega `issuer varchar(255)` de manera idempotente mediante `ADD COLUMN IF NOT EXISTS`.
  - Rellena únicamente cuentas `credential` cuyo issuer sea nulo o vacío con `local:credential`.
- `db/schema/auth.ts:9-10`
  - Declara `issuer: varchar("issuer", { length: 255 })` en `accounts`.
  - La columna queda nullable, sin `.notNull()` ni default.
- `db/provision.ts:85-101`
  - Conserva `verifyPassword` y la actualización idempotente del hash.
  - El INSERT incluye `issuer = 'local:credential'`.
  - El UPSERT también restablece `issuer = 'local:credential'` cuando actualiza la credencial.

### Aplicabilidad y backfill

La migración es compatible con el estado actual descrito: PostgreSQL admite el `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, por lo que puede ejecutarse aunque la columna ya exista. El `UPDATE` posterior es seguro para reejecución y corrige tanto filas demo existentes con `issuer IS NULL` como filas con cadena vacía, sin modificar cuentas de otros proveedores. No fue aplicada a una base desplegada porque este trabajo debía detenerse antes del despliegue.

La comprobación estática de consistencia entre los tres archivos terminó con código `0`.

## T2 — Contrato con Better Auth

- La migración y Drizzle usan exactamente el nombre físico `issuer`.
- El Better Auth v1.7.2 instalado resuelve esa columna como `authTables.account.fields.issuer?.fieldName || "issuer"` en `node_modules/better-auth/dist/db/get-migration.mjs:362`.
- `node_modules/@better-auth/core/dist/db/get-tables.mjs:208` también usa `issuer` como nombre predeterminado.
- `node_modules/@better-auth/core/dist/db/schema/account.mjs:6` declara `issuer` obligatorio en el modelo de cuenta.
- `node_modules/better-auth/dist/api/routes/sign-in.mjs:319-324` crea el issuer local de `credential` y exige simultáneamente `providerId === "credential"`, `account.issuer === credentialIssuer` y `accountId === user.id`; si no encuentra esa cuenta emite `User not found`.
- `lib/auth.ts:37` conserva `usePlural: true`; el archivo no fue modificado.

Esto confirma la causa del fallo: el usuario podía existir, pero la cuenta local no satisfacía el predicado de Better Auth sin `issuer = 'local:credential'`.

## T3 — Pruebas y build

Se amplió `tests/smoke/demo.spec.ts:29-47` para comprobar la migración, el nombre de columna del schema, el issuer del INSERT/UPSERT y la conservación de `verifyPassword`.

| Verificación | Resultado | Evidencia resumida |
| --- | --- | --- |
| `timeout 420 npm run build` | PASS, intento 1 | Compilación exitosa en 29.6 s; TypeScript, generación estática y optimización completadas. |
| `timeout 420 npm run test:smoke` | PASS, intento 1 | 9 archivos, 19 tests aprobados. |
| `timeout 420 npm run test:unit` | FAIL, intentos 1 y 2 | 10 archivos aprobaron y 1 falló; 42 tests aprobaron y 1 falló. `tests/unit/foundation.test.ts:19` intenta leer `docker-compose.yml`, archivo ausente (`ENOENT`). |
| `timeout 420 npm run test:integration` | PASS, intento 1 | 9 archivos, 19 tests aprobados. |

### Observaciones de verificación

- El build muestra advertencias de Better Auth porque el entorno local no aporta un secreto no predeterminado durante la generación estática; no se imprimió ningún valor y el build finalizó correctamente.
- Vitest advierte que `vitest.config.ts` usa sintaxis ESM cargada como CommonJS ante el futuro cambio de `configLoader`; no afecta el resultado actual.
- El único fallo persistente de la suite unitaria es ajeno al cambio de issuer: falta `docker-compose.yml` en el working tree. No se creó ni modificó infraestructura fuera del alcance para ocultarlo.

## Archivos modificados o creados

- `db/migrations/0007_add_accounts_issuer.sql` — nueva migración y backfill.
- `db/schema/auth.ts` — mapeo nullable de `accounts.issuer`.
- `db/provision.ts` — issuer local en INSERT/UPSERT de la credencial demo.
- `tests/smoke/demo.spec.ts` — cobertura estática de consistencia.
- `REPORTE-CODEX-12.md` — este reporte.

## Riesgos pendientes

- La suite unitaria completa no está verde por la ausencia preexistente de `docker-compose.yml`; requiere decidir si el archivo debe restaurarse o si el test debe adaptarse en otro trabajo.
- La validación real contra la base desplegada y el endpoint de login queda para el orquestador después de aplicar la migración y ejecutar el provisionado.

## Límite de rollback

El work unit puede revertirse eliminando `db/migrations/0007_add_accounts_issuer.sql` y deshaciendo únicamente los cambios de issuer en `db/schema/auth.ts`, `db/provision.ts` y `tests/smoke/demo.spec.ts`. No depende de cambios en páginas, tenancy ni configuración de Better Auth.

## Aprendizajes Clave

1. Better Auth v1.7.2 identifica una cuenta local por la combinación de proveedor, issuer sintético y usuario; `provider_id = 'credential'` por sí solo no alcanza.
2. Una columna de cuenta exigida por Better Auth debe mantenerse consistente entre migración, schema Drizzle, backfill y todos los caminos de INSERT/UPSERT.
