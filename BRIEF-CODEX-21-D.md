# BRIEF-CODEX-21-D — Admin de clínica debe ver "Planes de tratamiento" en el dashboard

## Contexto (verificado en producción por el orquestador)

El dashboard muestra el panel "Planes de tratamiento" con el mensaje "Tu rol no tiene
acceso a planes de tratamiento" para el rol `organization_admin`. Es incorrecto:
- La policy RLS `app_estimate_allowed` SÍ incluye a `organization_admin` (migración 0004),
  así que el admin SÍ puede leer `estimates` — el bloqueo viene solo del app-layer.
- En `features/dashboard/actions.ts`, `dashboardSummary` usa
  `estimateAllowed = can(actor, "estimate:manage")`, pero la matriz de capabilities de
  `features/tenant-identity/authorize.ts` NO incluye `estimate:manage` para
  `organization_admin` (solo professional/independent_owner) → el panel se oculta para el
  admin aunque el spec aprobado dice que admin/owner/professional ven Planes y solo el
  assistant no.
- Comparar con `pendingClinical`, que ya se resuelve por rol explícito
  (`actor.role !== "assistant"`) porque admin tampoco tiene `clinical:manage` pero SÍ debe
  ver el panel (mismo caso).

## Fix (un cambio en `features/dashboard/actions.ts`)

En `dashboardSummary`, línea 14: reemplazar
`const estimateAllowed = can(actor, "estimate:manage")`
por el mismo criterio por rol que `pendingClinical`:
`const estimateAllowed = actor.role !== "assistant";`
(El RLS ya excluye a assistant de leer estimates; para el resto de roles la lectura está
permitida. Mantener `financeAllowed = can(actor,"billing:manage")` SIN cambios.)

No cambiar nada más. Sin voseo en comentarios.

## Alcance

- TOCAR solo `features/dashboard/actions.ts`.
- NO tocar tests (no cambian), ni migraciones, ni authorize.ts.

## Verificación (dev server activo en http://127.0.0.1:3000, DB local provisionada)

1. `timeout 180 npx vitest run tests/unit/dashboard.test.ts` → PASS.
2. `timeout 300 npm run lint` → PASS.
3. Con sesión demo (email `emilia.demo@nexodent.invalid`, password en
   `/home/hermes/.hermes/home/.secrets/nexodent_deploy.env` — NO imprimir el valor):
   POST sign-in a http://127.0.0.1:3000/api/auth/sign-in/email con cookie jar, luego GET
   http://127.0.0.1:3000/dashboard → 200 y el HTML contiene "Planes de tratamiento",
   "Enviados" y "Aprobados" (contenido real, NO el mensaje de acceso).
4. `timeout 420 npm run build` → PASS.

Resultado en 10-15 líneas al final del mensaje. Ejecuta TODO sin detenerte. No imprimas
secretos.
