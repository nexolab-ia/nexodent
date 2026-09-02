# REPORTE-CODEX-14

## Cambio aplicado

Se reemplazó el bloque `advanced` de `lib/auth.ts` por la estructura requerida:

```ts
advanced: {
  database: { generateId: "uuid" },
  ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
},
```

Esto configura la generación nativa de UUID de Better Auth en la ubicación correcta (`advanced.database.generateId`) y conserva `x-forwarded-for` como encabezado de dirección IP sin `trustedProxies`.

## Verificación

### Build

Comando:

```sh
timeout 420 npm run build
```

Resultado: **PASS** (código de salida 0). La compilación y la validación de TypeScript finalizaron correctamente, y se generaron 19 de 19 páginas estáticas.

### Smoke tests

Comando:

```sh
timeout 420 npm run test:smoke
```

Resultado: **PASS** (código de salida 0). Pasaron 9 archivos y 19 pruebas.

### Unit tests

Comando:

```sh
timeout 420 npm run test:unit
```

Resultado: **FAIL esperado y ajeno al cambio** (código de salida 1). Pasaron 10 archivos y 42 pruebas; falló únicamente `tests/unit/foundation.test.ts` porque no existe `docker-compose.yml` (`ENOENT`, línea 19), tal como anticipaba el brief.

## Alcance

No se modificó ningún archivo de implementación fuera de `lib/auth.ts`. En particular, no se cambiaron esquemas, migraciones, tipos de columna, rutas de autenticación ni `db/provision.ts`.

Además de `lib/auth.ts`, se creó únicamente este reporte requerido. `BRIEF-CODEX-14.md` ya estaba sin seguimiento antes de la ejecución. El build actualizó `.next/`, que está ignorado por Git. No se realizó commit, push ni deploy.
