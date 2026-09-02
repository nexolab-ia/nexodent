# BRIEF-CODEX-20 — Permitir el auto-registro en onboarding: tolerar "usuario sin membresía" fuera del área autenticada

## Contexto (orquestador diagnosticó la causa raíz exacta y el diseño de solución)

CODEX-19 conectó la creación real de la org. PERO al probar el flujo completo de registro en
producción, el sign-up FALLA. Diagnóstico confirmado por API (2026-09-02):

- `POST /api/auth/sign-up/email` con email nuevo → **`401 {message:"Active membership required."}`**
  (el usuario se crea en la BD, pero Better Auth revierte el flujo porque falla al crear la sesión).
- El registro de un usuario nuevo NO puede completarse → nunca llega al onboarding.

### Causa raíz (verificada en `lib/auth.ts`)

Dos puntos lanzan `activeMembershipForUser(user.id)` que a su vez lanza
`new APIError("UNAUTHORIZED", { message: "Active membership required." })` cuando el usuario
NO tiene una membresía activa:

1. `databaseHooks.session.create.before` — se ejecuta al CREAR cada sesión (incl. sign-up).
   Un usuario recién registrado no tiene org/membresía aún → el hook lanza → sign-up falla
   (Better Auth aborta la creación).
2. El plugin `customSession` (`plugins: [customSession(async ({ user }) => ({ ..., claims: claimsForMembership(await activeMembershipForUser(user.id)) }))]`) — se ejecuta en CADA lectura de sesión. Un usuario sin membresía no puede ni siquiera cargar `/bienvenida` o `/onboarding` porque al leer su sesión, el plugin exige memb. activa.

Diseño previo asumía que "todo usuario que inicia sesión ya pertenece a una clínica" (cierto para
el fixture demo con membresías precargadas, FALSO para el auto-registro).

## Diseño de solución (DECIDIDO — respetar exactamente)

Objetivo: un usuario recién registrado (sin org/membresía) debe poder:
- completar sign-up (crear sesión),
- cargar `/bienvenida` y `/onboarding`,
- llenar el onboarding → eso crea su org/membresía (CODEX-19 ya lo hace),
- y SOLO ENTONCES acceder al área autenticada (`/agenda` y módulos), donde SÍ se exige membresía.

Regla clave: la membresía se exige dentro del área autenticada (vía `requestTenantContext`),
NO en la creación de sesión ni en el onboarding. La seguridad del tenant NO se debilita: un
usuario sin org simplemente no puede cargar datos de ninguna clínica (lo garantizan las policies
RLS FORCE + `requestTenantContext`, que sigue exigiendo memb. activa).

### T1 — `lib/auth.ts`: hacer tolerante el contexto de sesión a "sin membresía"

Cambiar para que las funciones del auth toleren ausencia de membresía y devuelvan `null`
(no-throw) cuando no hay org activa, PERO conserven el comportamiento estricto donde se necesita.

Concretamente:

1. **Nueva helper** `activeMembershipForUserOrNull(userId, client?)`: igual que
   `activeMembershipForUser` pero SI no hay fila devuelve `null` en vez de lanzar.
   (Reutiliza `app_resolve_active_membership`; si devuelve 0 filas → `return null`.)

2. **`databaseHooks.session.create.before`**: enviar el hook para que NO rompa el sign-up.
   Reemplazar `await activeMembershipForUser(session.userId)` por una versión que permita
   "sin membresía aún" (p. ej. llamar `activeMembershipForUserOrNull` y simplemente NO hacer
   nada si es null). Mantener el behaviour de "establecer/validar tenant" solo si hay memb.
   IMPORTANTE: no borrar el hook si cumple otra función; si su único rol era validar/resolver
   la memb. activa en el bootstrap, debe convertirse en no-bloqueante para onboarding.

3. **`customSession`**: los `claims` deben poder ser `null` cuando el usuario no tiene membresía.
   Es decir, el callback del plugin debe devolver claims `null` (o un objeto con `membershipId:
   null, organizationId: null, role: null, ...`) en vez de lanzar, para que `/bienvenida` y
   `/onboarding` (que solo usan `session.user.name`) carguen. Usa `activeMembershipForUserOrNull`.
   Ajusta el TYPE `SessionClaims`/`MembershipForSession` si hace falta para que `claims` sea
   nullable o tenga un valor "vacio" (decide y documenta; mantén compatibilidad con `requestTenantContext`).

### T2 — `lib/request-context.ts`: mantener estricto el área protegida

`requestTenantContext()` DEBE seguir exigiendo membresía: si no hay org → error (o redirigir).
NO debilitar aquí. Esto protege `/agenda` y módulos: un usuario sin org no puede ver datos.
(Verifica que el `customSession` con claims null no rompa `requestTenantContext`, que ya llama
`activeMembershipForUser` por separado y debe seguir siendo estricto.)

### T3 — Flujo: redirigir a usuario sin org hacia onboarding desde /agenda

Para que un usuario recién registrado (con sesión pero sin org) que intente entrar a `/agenda`
sea llevado al onboarding en vez de a un error 404/500:
- Revisar cómo se comporta `/agenda` hoy cuando `requestTenantContext` falla. Si produce un
  error no manejado, añadir manejo en las páginas protegidas O usar el middleware (ya existe
  `middleware.ts` con `getSessionCookie`) para redirigir a `/onboarding` si hay sesión activa
  pero el usuario no tiene org. Diseña la opción más simple y robusta, documenta la elección.
- NO romper el middleware actual de protección (usuario SIN sesión → /login sigue igual).

### Objetivo final verificable
- Sign-up de un usuario NUEVO devuelve 2xx y crea sesión (no 401 "Active membership required").
- El usuario puede cargar `/bienvenida` y `/onboarding`.
- Tras completar el onboarding (`createOnboarding`), la org/membresía se crea y puede ir a `/agenda`.
- Un usuario sin org que toque `/agenda` es llevado al onboarding (no a un error/500).

## T4 — Verificación (obligatoria, con evidencia)

1. `timeout 420 npm run build` → PASS.
2. `timeout 420 npm run test:smoke` → PASS (si hay test de auth/session, deben seguir pasando).
3. `timeout 420 npm run test:unit` → solo puede fallar `foundation.test.ts` (docker-compose.yml ausente, ajeno; NO tocar).
4. Revisión estática: `activeMembershipForUser` sigue usándose en `requestTenantContext` (área
   protegida STRICTA); `customSession` tolera null; `session.create.before` no bloquea sign-up.

## Reporte final

Escribir `REPORTE-CODEX-20.md`:
- Dif del `lib/auth.ts` y `lib/request-context.ts` (y cualquier archivo tocado).
- Cómo quedó `customSession` (claims null o valores vacíos) y el hook de creación de sesión.
- Qué se hizo para redirigir a /onboarding desde /agenda (elección documentada).
- Resultados build/smoke/unit.
- Breve nota de seguridad: por qué no se debilita el tenant RLS.

## Reglas

- NO commit, NO push, NO deploy: dejar en working tree para el orquestador (verifica y despliega).
- NO imprimir secretos. NO tocar `db/*` (esta fase NO necesita migración), ni `app/demo`,
  ni `app/onboarding/page.tsx`, ni `app/login`. Puedes tocar `app/onboarding/profile-picker.tsx`
  SOLO si conecta con requestTenantContext (no esperado).
- NO crear tabla de invitaciones ni lógica de "join".
- Ejecuta TODO sin detenerte. Español chileno con tuteo.