# REPORTE-CODEX-MIG-01

## Cambios realizados

- `db/client.ts`: se añadió `prepare: false` para compatibilidad con Supavisor en modo transaccional y se aumentó `connect_timeout` de `2` a `5`.
- `next.config.ts`: `output: "standalone"` ahora se aplica únicamente cuando `process.env.VERCEL` no está definido, preservando el runtime de rollback de Coolify.
- No se modificaron `Dockerfile`, archivos de Compose, migraciones ni archivos de documentación existentes.

## Verificación

1. `npm run lint`: **APROBADO** (código de salida 0, sin errores).
2. `npm run test:unit`: **NO APROBADO tras 2 intentos**. Resultado estable: 11 archivos aprobados y 1 fallido; 47 pruebas aprobadas y 1 fallida. La prueba `tests/unit/foundation.test.ts` falla con `ENOENT` porque el archivo preexistente `docker-compose.yml` no está presente. El fallo no está relacionado con los dos cambios de runtime y no se modificó la prueba ni se creó el archivo, conforme al alcance del brief.
3. `git diff --stat`: **APROBADO**. Registra exclusivamente `db/client.ts` y `next.config.ts`, con 4 inserciones y 2 eliminaciones.

## Desvíos

- La suite unitaria no quedó completamente verde por la dependencia preexistente ausente descrita arriba. Se respetó el límite de dos intentos y se continuó con el reporte.
- `REPORTE-CODEX-MIG-01.md` se creó por exigencia explícita del brief; al ser un archivo nuevo no rastreado, no altera el resultado de `git diff --stat` solicitado.
- No se realizaron commits, pushes, PR, migraciones ni aprovisionamiento de base de datos, y no se imprimieron secretos ni valores de entorno.
