# Reporte CODEX-20 — Auto-registro sin membresía

## Resultado

Se implementó el diseño de CODEX-20 sin ampliar su alcance: Better Auth ahora puede crear y leer la sesión de una persona recién registrada que todavía no tiene membresía, mientras que toda el área autenticada continúa exigiendo una membresía activa. Si una sesión válida intenta abrir `/agenda` u otra ruta del grupo protegido sin organización, el servidor la redirige a `/onboarding`.

## Ruta de revisión

1. Revisa `lib/auth.ts`: separación entre resolución nullable y validación estricta.
2. Revisa `lib/request-context.ts`: la frontera tenant sigue usando la función estricta.
3. Revisa `app/(app)/layout.tsx`: validación centralizada antes de renderizar módulos protegidos.
4. Revisa `tests/integration/rls-tenant.test.ts`: evidencia de los dos comportamientos, nullable y estricto.

## Cambios por archivo

| Archivo | Cambio |
| --- | --- |
| `lib/auth.ts` | Se agregó `activeMembershipForUserOrNull()`. El hook `session.create.before` usa esta variante y no falla cuando la función SQL retorna cero filas. `customSession` retorna `claims: null` cuando no existe una membresía activa. `activeMembershipForUser()` conserva el error `401 Active membership required.` para consumidores estrictos. |
| `lib/request-context.ts` | Conserva la llamada a `activeMembershipForUser()`. Solo intercepta su `APIError` `UNAUTHORIZED` para redirigir a `/onboarding`; otros errores se propagan y no quedan ocultos. |
| `app/(app)/layout.tsx` | El layout del grupo protegido ejecuta `requestTenantContext()` antes de renderizar `AppShell`, por lo que cubre `/agenda` y todos los módulos del mismo grupo en una sola frontera. |
| `tests/integration/rls-tenant.test.ts` | Se agregó la prueba de que una membresía inactiva produce `null` en la variante tolerante y sigue siendo rechazada por la variante estricta. |

No se modificaron `db/*`, `app/demo`, `app/onboarding/page.tsx`, `app/login` ni `app/onboarding/profile-picker.tsx`. No se creó lógica de invitaciones o incorporación a organizaciones existentes.

## Decisiones implementadas

### 1. Claims nullable, no claims ficticios

**Decisión:** `customSession` devuelve `claims: null` cuando no hay membresía activa.

**Motivo:** evita inventar `organizationId`, `membershipId`, rol o sedes. Un objeto con valores vacíos podría confundirse con una identidad tenant válida en consumidores futuros; `null` representa explícitamente “sesión autenticada, tenant aún no asignado”. Las pantallas `/bienvenida` y `/onboarding` solo necesitan `session.user`, por lo que mantienen su comportamiento.

### 2. Una resolución compartida con dos contratos

**Decisión:** `activeMembershipForUserOrNull()` contiene la consulta a `app_resolve_active_membership`; `activeMembershipForUser()` la reutiliza y agrega el rechazo estricto.

**Motivo:** mantiene una única implementación de resolución bajo FORCE RLS y hace visible, por nombre y tipo, qué consumidores aceptan la ausencia de membresía. Cero filas es un estado válido solo durante onboarding; errores reales de base de datos siguen propagándose.

### 3. Mantener el hook de creación de sesión

**Decisión:** el hook `databaseHooks.session.create.before` permanece, pero usa la resolución nullable.

**Motivo:** respeta el punto de extensión existente y conserva la verificación de que el mecanismo de bootstrap puede ejecutarse. La ausencia esperada de membresía ya no aborta el sign-up; fallas reales de infraestructura no se silencian.

### 4. Frontera protegida centralizada en el layout

**Decisión:** validar el tenant en `app/(app)/layout.tsx`, en vez de agregar manejo independiente en cada página o consultar la base de datos desde middleware.

**Motivo:** el middleware actual sigue resolviendo rápidamente el caso “sin cookie → `/login`”. El layout del servidor tiene acceso natural a `requestTenantContext()` y cubre de forma uniforme `/agenda`, pacientes, cobros, presupuestos, migración, reportes y configuración. Esto evita duplicación y no introduce acceso a base de datos en middleware.

### 5. Redirección acotada al rechazo por membresía

**Decisión:** `requestTenantContext()` redirige solo cuando `activeMembershipForUser()` lanza un `APIError` con estado `UNAUTHORIZED`.

**Motivo:** una sesión sin organización debe continuar en onboarding, pero errores de conexión, SQL o programación deben seguir visibles; convertirlos todos en redirecciones ocultaría incidentes operacionales.

## Propiedades de seguridad

- `requestTenantContext()` sigue invocando `activeMembershipForUser()` y, por lo tanto, sigue exigiendo una membresía activa antes de entregar `TenantContext`.
- El layout protegido valida esa frontera antes de renderizar cualquier módulo del grupo `(app)`.
- `claims: null` no concede organización, membresía, rol ni sedes.
- Las consultas tenant continúan ejecutándose mediante `runAsTenant` y las policies FORCE RLS existentes; este cambio no modificó esquemas, migraciones, policies ni GUC tenant.
- Un usuario con sesión pero sin organización puede acceder al onboarding, pero no obtiene contexto para leer o modificar datos de una clínica.

## Evidencia de verificación

| Comando | Resultado |
| --- | --- |
| `npx tsc --noEmit` | **PASS**, código de salida 0. |
| `timeout 420 npx vitest run tests/integration/rls-tenant.test.ts` | **PASS**: 1 archivo, 4 pruebas aprobadas. Confirma resolución nullable y rechazo estricto bajo el bootstrap SECURITY DEFINER/FORCE RLS. |
| `timeout 420 npm run build` | **PASS**: compilación, TypeScript, generación de 22 páginas y optimización completadas. Next.js informó la advertencia preexistente de deprecación de `middleware`; Better Auth también advirtió durante la recolección estática que el entorno de build usa el secreto por defecto. No se imprimió ningún secreto. |
| `timeout 420 npm run test:smoke` | **PASS**: 9 archivos, 19 pruebas aprobadas. |
| `timeout 420 npm run test:unit` | **FALLO PERMITIDO POR EL BRIEF**: 10 archivos aprobaron y 1 falló; 42/43 pruebas aprobaron. El único fallo fue `tests/unit/foundation.test.ts`, `ENOENT` al abrir `docker-compose.yml`. El repositorio contiene `docker-compose.yaml`; no se modificó por instrucción explícita. |
| `timeout 420 npm run lint` | **PASS**, código de salida 0. |
| `git diff --check` | **PASS**, sin errores de whitespace. |
| Revisión estática con `rg` | **PASS**: `customSession` y el hook usan `activeMembershipForUserOrNull`; `requestTenantContext` sigue usando `activeMembershipForUser`; el layout protegido llama `requestTenantContext`. |
| `git diff --name-only -- db app/demo app/onboarding/page.tsx app/login` | **PASS**: sin salida; ninguna ruta prohibida fue modificada. |

### Límite de verificación local

No se ejecutó un POST HTTP real de sign-up porque el entorno de esta sesión no expone el conjunto completo de variables runtime (`DATABASE_URL`, `AUTH_SECRET`, `APP_URL`). No se inventaron credenciales ni se imprimieron valores. La evidencia ejecutada cubre el comportamiento de resolución contra PostgreSQL embebido, la compilación de Better Auth y todas las suites exigidas por el brief. La validación HTTP 2xx final debe ejecutarse en el entorno integrado por el orquestador.

## Rollback

El rollback es un único work unit y no requiere migración:

1. Revertir `lib/auth.ts`, `lib/request-context.ts`, `app/(app)/layout.tsx` y `tests/integration/rls-tenant.test.ts` a su estado anterior.
2. Eliminar `REPORTE-CODEX-20.md`.
3. Repetir build y suites.

Ese rollback restaura el comportamiento anterior, incluido el bloqueo del sign-up sin membresía. No afecta datos ni requiere ejecutar `db/rollback.ts`.

## Estado de entrega

Los cambios quedan exclusivamente en el working tree. No se creó commit, no se hizo push y no se desplegó.
