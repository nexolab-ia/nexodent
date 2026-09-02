# BRIEF-CODEX-14 — Fix raíz definitivo: IDs de Better Auth en columnas uuid

## Contexto (orquestador ya investigó la causa EXACTA en los fuentes instalados)

Este es un CORRECTOR del BRIEF-CODEX-13. El fix anterior puso la config de generación de
IDs en el nivel equivocado y por eso NO surtió efecto (el runtime sigue insertando ids
alfanuméricos). Leyendo `node_modules/@better-auth/core/src/...` se confirmó la estructura
real de opciones.

### Evidencia del runtime (contenedor web, deploy tras CODEX-13)

```
invalid input syntax for type uuid: "bne1dzVhoOcXwHwJJfn2hsrUUa0NSRxr"  (22P02)
```
Las sesiones siguen insertándose con el id alfanumérico por defecto de Better Auth, no un UUID.

### Causa raíz verificada en source (NO es teoría, es el código instalado)

1. En `node_modules/@better-auth/core/src/types/init-options.ts:458` la opción es
   `generateId?: GenerateIdFn | false | "serial" | "uuid"` **y vive bajo `advanced.database`**,
   NO bajo `advanced` directamente.
2. En `node_modules/@better-auth/core/src/db/adapter/get-id-field.ts:34-35` y :59 se lee
   `options.advanced?.database?.generateId`. Un `generateId` puesto en `advanced.generateId`
   (raíz) simplemente se ignora → se cae al `defaultGenerateId()` (32 chars alfanuméricos).
3. El valor `"uuid"` es soportado de forma nativa: `get-id-field.ts:73-74` → `crypto.randomUUID()`
   (o `gen_random_uuid()` en Postgres). Es la vía MÁS robusta porque no depende de que una
   función JS llegue al adapter y porque la columna ya es `uuid`.

### El estado ACTUAL de lib/auth.ts (lo que CODEX-13 escribió y está MAL)

```ts
advanced: {
  generateId: () => crypto.randomUUID(),   // ← clave equivocada (falta .database)
  ipAddress: { ipAddressHeaders: ["x-forwarded-for"], trustedProxies: ["::ffff:127.0.0.1"] },
},
```

## Tarea ÚNICA — reescribir el bloque `advanced` en src-archivo `lib/auth.ts`

Reemplazar el bloque `advanced` completo por la estructura correcta:

```ts
advanced: {
  database: { generateId: "uuid" },
  ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
},
```

Notas de decisión (ya tomadas por el orquestador, ejecutar tal cual):
- `generateId: "uuid"` en `advanced.database` — el modo nativo. Para Postgres Better Auth
  intercala `gen_random_uuid()`; como las columnas ya son `uuid`, es 100% compatible y la
  vía más segura. NO usar función JS.
- `advanced.ipAddress` con `ipAddressHeaders: ["x-forwarded-for"]` NO necesita
  `trustedProxies` (el proxy de Coolify inyecta `x-forwarded-for`; dejar el array vacío/solo
  el header evita filtrar por IP del osporte). Esto atiende el WARN de rate limiting.
- PROHIBIDO: cambiar esquema, migraciones, tipos de columna, rutas de auth, `db/provision.ts`.
  El fix es SOLO el bloque `advanced` en `lib/auth.ts`.

## Verificación (obligatoria, con evidencia)

1. `cat lib/auth.ts` y mostrar el bloque `advanced` final (debe ser `advanced: { database: { generateId: "uuid" }, ipAddress: {...} }`).
2. `timeout 420 npm run build` → PASS.
3. `timeout 420 npm run test:smoke` → PASS.
4. `timeout 420 npm run test:unit` → solo puede fallar el test preexistente de
   `foundation.test.ts` (falta docker-compose.yml — AJENO a este cambio, NO tocarlo).

## Reporte final

Escribir `REPORTE-CODEX-14.md` con:
- El bloque `advanced` final aplicado (código exacto).
- Resultados de build/smoke/unit con evidencia.
- Confirmación de que NO se modificó ningún archivo fuera de `lib/auth.ts`.

## Reglas

- NO commit, NO push, NO deploy: dejar todo en el working tree para que el orquestador verifique y despliegue.
- Ejecuta TODO sin detenerte a preguntar. NO imprimas secretos (DEMO_PASSWORD, AUTH_SECRET).