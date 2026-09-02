# BRIEF-CODEX-13 — Fix raíz: sesión falla por IDs alfanuméricos de Better Auth en columna uuid

## Contexto (diagnóstico de causa raíz YA realizado por el orquestador)

NexoDent (Next.js 16 + Postgres + Better Auth v1.7.2 + Drizzle, deploy dockercompose en Coolify).
El acceso demo está bloqueado en el paso de **creación de sesión**. El usuario y la cuenta
existen y el match ya funciona. El botón "Explorar la demo" redirige a `/demo?error=unavailable`.

### Síntoma exacto (log de runtime, contenedor web)

```
ERROR [Better Auth]: Error: Failed query: insert into "sessions"
  ("id","user_id","token","expires_at","ip_address","user_agent","created_at","updated_at")
  values ($1,$2,$3,$4,$5,$6,$7,$8)
params: w4WN1dtXGxsq5VmIsVgoFhiKcwKYPOCT, 10000000-0000-4000-8000-000000000101, ...
[cause]: invalid input syntax for type uuid: "w4WN1dtXGxsq5VmIsVgoFhiKcwKYPOCT"
  code: '22P02', routine: 'string_to_uuid'
```

### Causa raíz (verificada en fuentes instalados)

1. Las tablas de auth que **Better Auth escribe él mismo** (`sessions`, `accounts`,
   `verifications`) definen `id` con el helper `id()` de `db/schema/core.ts`, que es
   `uuid(name).defaultRandom().primaryKey()`.
2. Better Auth **NO genera UUIDs**: su generador por defecto es
   `createRandomStringGenerator("a-z","0-9","A-Z","-_")` (verified en
   `node_modules/better-auth/dist/crypto/random.mjs`), que produce strings alfanuméricos
   de 32 chars (ej. `w4WN1dtXGxsq5VmIsVgoFhiKcwKYPOCT`).
3. Postgres rechaza insertar ese string en una columna `uuid` → `22P02` → la sesión no se
   crea → el sign-in falla → la route handler de demo responde `/demo?error=unavailable`.

### Solución decidida (menor riesgo, NO tocar esquema)

Configurar `advanced.generateId` en `lib/auth.ts` para que Better Auth genere **UUIDs
válidos** compatibles con el esquema actual (que usa `uuid` en todas las tablas, con FKs
en cascada). Así se evita migrar columnas de uuid→texto y se mantiene coherencia con todo
el modelo (organizations, memberships, sites, etc. referencian por uuid).

Vía confirmada que existe en el core adapter:
`node_modules/@better-auth/core/dist/db/adapter/get-id-field.mjs` y `factory.mjs`.

## Tareas

### T1 — Configurar advanced.generateId en lib/auth.ts

En `lib/auth.ts`, dentro de la llamada `betterAuth({...})`, añadir la propiedad
`advanced` para generar UUIDs v4 válidos:

```ts
advanced: {
  generateId: () => crypto.randomUUID(),
  ipAddress: { ipAddressHeaders: ["x-forwarded-for"], trustedProxies: ["::ffff:127.0.0.1"] },
},
```

- `crypto` es global en Node 22 (Next.js runtime), no requiere import.
- La clave `ipAddress` además resuelve el WARN de rate limiting ("could not determine a client
  IP") observado en los logs, usando el header que envía el proxy de Coolify.
- PROHIBIDO cambiar el tipo de columna de ninguna tabla ni migrar uuid→texto.

### T2 — Build + smoke + unit

- `timeout 420 npm run build` → debe terminar PASS.
- `timeout 420 npm run test:smoke` → PASS.
- `timeout 420 npm run test:unit` → solo puede fallar el test preexistente de
  `foundation.test.ts` (docker-compose.yml ausente en el working tree = ajeno al cambio).
  NO inventar fixes para ese test; dejarlo igual.

### T3 — Reporte

Escribir `REPORTE-CODEX-13.md` al final con:
- Qué cambió exactamente en `lib/auth.ts` (diff).
- Resultado de cada verificación (build/smoke/unit).
- Cualquier observación sobre el generador de IDs (p. ej. si `sessions`/`accounts` ya
  tenían alguna fila con id alfanumérico que pudiera chocar — probablemente el provision
  usa uuids hardcodeadas, verificar).
- NO imprimir ni redactar valores de secretos (DEMO_PASSWORD, AUTH_SECRET).

## Reglas

- NO hagas push ni commit: deja todo en el working tree para que el orquestador revíse y despliegue.
- NO modifiques `db/schema/*`, `db/migrations/*`, `db/provision.ts` ni las rutas de auth
  (`app/api/demo/sign-in/route.ts`, `app/login`, `app/demo`) — esto ya está resuelto.
- Respeta tuteo (vos neutro latino NO; usar "Entra/Gestiona" donde aplique — aquí no aplica, es TS).
- Ejecuta TODO sin detenerte a preguntar. Escribe el reporte final sí o sí.