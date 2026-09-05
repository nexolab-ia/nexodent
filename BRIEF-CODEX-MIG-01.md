# BRIEF-CODEX-MIG-01 — NexoDental: adaptar runtime para Vercel + Supabase

## Contexto

NexoDental (repo `nexolab-ia/nexodental`) migra de Coolify (Docker) a **Vercel + Supabase**.
La DB Supabase ya está **provisionada y validada** (migraciones 0000–0010, rol `nexodent_app`
NOBYPASSRLS, seed demo, RLS FORCE funcionando). La app se conectará por el **pooler
transaccional de Supavisor (`:6543`)** con la URL `DATABASE_URL` que vendrá en el env de Vercel.

Plan completo de contexto: `docs/migration-vercel-supabase.md` (no hace falta leerlo todo).

## Objetivo (2 cambios mínimos, nada más)

### Tarea 1 — `db/client.ts`: desactivar prepared statements

Archivo: `db/client.ts` (línea ~7):

```ts
export const sql = postgres(env.DATABASE_URL ?? "postgres://localhost:5432/nexodent", { max: 3, connect_timeout: 2 });
```

- Añadir `prepare: false` a las opciones (obligatorio: Supavisor en modo transacción
  `:6543` NO soporta prepared statements del protocolo extendido).
- Subir `connect_timeout` a `5`.
- Resultado esperado: `{ max: 3, prepare: false, connect_timeout: 5 }`.
- **NO** añadir opción `ssl` hardcodeada: el SSL viene por la URL (`?sslmode=require`
  en producción; dev local no lleva ssl). NO cambiar nada más del archivo.

### Tarea 2 — `next.config.ts`: `output: standalone` solo fuera de Vercel

Archivo: `next.config.ts` (actualmente):

```ts
const nextConfig: NextConfig = { output: "standalone" };
export default nextConfig;
```

- En Vercel el `output: "standalone"` es innecesario/contraproducente (Vercel usa su
  propio runtime; la variable `VERCEL` existe en el entorno de build/deploy).
- En Coolify (rollback vigente) el Dockerfile SÍ depende de `standalone` — no se debe romper.
- Cambiar a condicional:

```ts
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};
export default nextConfig;
```

- NO tocar el Dockerfile ni docker-compose.

## Verificación (obligatoria, en orden)

1. `npm run lint` → sin errores nuevos.
2. `npm run test:unit` → verde (suite existente).
3. `git diff --stat` → SOLO 2 archivos modificados (`db/client.ts`, `next.config.ts`).

## ⛔ REGLAS ABSOLUTAS

- NO hagas `git commit` ni `git push` ni crees PR. NO corras `db/migrate` ni `db/provision`
  (la DB ya está provisionada; correrlos contra Supabase duplicaría el rol/seed).
- NO modifiques ningún archivo fuera de `db/client.ts` y `next.config.ts`.
- NO borres ni reformatees los docs untracked de la raíz (`docs/migration-*.md`, etc.).
- NO imprimas secretos ni valores de env. NO uses sandbox/bwrap: si una edición falla,
  usa escritura directa por shell.
- NO te detengas a esperar aprobación: si algo falla tras 2 intentos, documenta en el
  reporte y continúa.

## Reporte

Escribe `REPORTE-CODEX-MIG-01.md` en la raíz del repo con: archivos tocados (diff),
resultado de cada verificación (lint/unit/diff-stat) y cualquier desvío.
