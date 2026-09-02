# REPORTE-CODEX-11 — Acceso y demo

Fecha: 2026-09-02

## Resultado

T1–T4 fueron ejecutadas en orden. El código queda listo para desplegar y reprovisionar, sin realizar deploy ni mutar la base remota.

## T1 — `/login` funcional

- `app/login/page.tsx:1-31`: reemplaza el placeholder por una página server-rendered con `Logo`, enlace de regreso, tarjeta de acceso y redirección de sesiones activas a `/agenda`.
- `app/login/login-form.tsx:1-54`: formulario cliente email/password con campos requeridos y `autocomplete`, POST al endpoint oficial de Better Auth, estado de carga, mensajes accesibles con `role="alert"` y redirección a `/agenda`.
- `app/access.module.css:1-13`: estilos compartidos alineados con los tokens vigentes (`--bg`, `--surface`, `--accent`, `--danger`, `--radius`, tipografía global) y adaptación móvil.

Evidencia local en dev:

- `GET http://localhost:3000/login` → HTTP `200`.
- HTML renderizado: heading, campo email y campo password presentes.
- `POST /api/auth/sign-in/email` con credencial deliberadamente inválida → HTTP `500` porque el entorno local no tenía PostgreSQL escuchando en `127.0.0.1:5432`. La UI trata toda respuesta no exitosa y muestra el error recuperable; el contrato específico HTTP `401` no pudo comprobarse localmente sin DB.

## T2 — Entrada directa a `/demo`

- `app/demo/page.tsx:1-40`: landing real con aviso de datos ficticios, Clínica Sonrisa Andes, sedes, total de pacientes y botón `Explorar la demo`.
- `app/api/demo/sign-in/route.ts:1-19`: endpoint exclusivamente servidor que lee `DEMO_PASSWORD`, delega el login a Better Auth, copia la cookie de sesión y redirige a `/agenda`. La contraseña no aparece en props, HTML ni bundle cliente.
- Ante variable ausente o rechazo de Better Auth redirige a `/demo?error=unavailable`; la página presenta un mensaje claro de indisponibilidad y soporte.
- `lib/env.ts:8-10` y `.env.example:5-6`: declaran `DEMO_EMAIL` y `DEMO_PASSWORD`; el archivo de ejemplo contiene solo nombres, nunca valores.

Evidencia local en dev:

- `GET http://localhost:3000/demo` → HTTP `200`.
- HTML renderizado: control `Explorar la demo` y aviso `DATOS FICTICIOS` presentes.
- `POST /api/demo/sign-in` → HTTP `303` hacia `/demo?error=unavailable`, comportamiento esperado con la DB local inaccesible.

La entrada exitosa a `/agenda` en producción requiere primero desplegar este código y ejecutar T3 sobre la base activa; no se desplegó por instrucción explícita.

## T3 — Sincronización idempotente de la credencial demo

- `db/provision.ts:4,78-100`: el provision ahora lee el hash existente y lo verifica con `verifyPassword`.
- Si coincide con `DEMO_PASSWORD`, no escribe nada y registra que está vigente.
- Si falta o no coincide, calcula un hash nuevo y ejecuta `INSERT ... ON CONFLICT (provider_id, account_id) DO UPDATE SET password = EXCLUDED.password, updated_at = now()`.
- `DEMO_EMAIL` conserva el fixture por defecto `emilia.demo@nexodent.invalid`.

Diagnóstico:

- El endpoint productivo fue probado con la credencial demo actual, sin imprimirla: HTTP `401`.
- No había URL de base de datos disponible en el archivo de secretos de despliegue para comparar directamente el hash almacenado. Por eso el desajuste de hash es consistente con la evidencia y con el flujo anterior de “insertar solo si falta”, pero no se declara confirmado mediante lectura directa de la fila.
- La causa de código sí quedó eliminada: el provision anterior congelaba cualquier hash obsoleto; ahora converge al secreto vigente sin reescribir cuando ya coincide.

### Paso exacto pendiente para el orquestador

1. Desplegar/reconstruir la imagen con estos cambios y asegurar que `DEMO_PASSWORD`, `DEMO_EMAIL`, `DATABASE_URL_ADMIN` y `APP_DB_ROLE_PASSWORD` estén disponibles para el servicio `provision`.
2. Reejecutar una vez el servicio con la nueva imagen: `docker compose run --rm provision` (el servicio definido en `docker-compose.yaml` ejecuta `node_modules/.bin/tsx db/provision.ts`). En Coolify, la operación equivalente es reprovisionar/recrear ese servicio después de desplegar el código nuevo.
3. Confirmar en logs sanitizados `Provision: credencial demo sincronizada...` o `Provision: credencial demo vigente.`.
4. Probar `POST https://dental.nexolabs.cloud/api/auth/sign-in/email` con la credencial demo: debe devolver HTTP `200` y cookie de sesión.
5. Abrir `/demo`, pulsar `Explorar la demo` y confirmar redirección autenticada a `/agenda`.

## T4 — Verificación final

| Verificación | Resultado |
|---|---|
| `timeout 300 npm run build` | PASS, exit `0`; compilación y TypeScript correctos. Better Auth avisó que faltaba un secreto de runtime durante prerender, sin fallar el build. |
| `timeout 300 npm run test:integration` | PASS, 9 archivos / 19 tests. |
| `timeout 300 npm run test:smoke` (intento 1) | FAIL, 1 test heredado esperaba el texto del placeholder `Sign in`. |
| Corrección quirúrgica | Se actualizó `tests/smoke/tenant.spec.ts` para comprobar el componente funcional `<LoginForm />`. |
| `timeout 300 npm run test:smoke` (intento 2) | PASS, 9 archivos / 19 tests. |
| `timeout 300 npm run test:unit` | FAIL, 10 archivos pasaron y 1 falló (42/43 tests): `tests/unit/foundation.test.ts` intenta leer `docker-compose.yml`, pero el repositorio contiene `docker-compose.yaml`. Es preexistente y ajeno a este fix; no se renombró ni amplió alcance. |
| `timeout 300 npm run lint` | PASS, exit `0`. |
| Login demo productivo antes de deploy/reprovision | HTTP `401`, esperado mientras producción conserva el código/hash anterior. |

Cobertura agregada/actualizada en `tests/smoke/demo.spec.ts:4-34` para el formulario, secreto server-only, redirección demo y UPSERT idempotente; `tests/smoke/tenant.spec.ts:6` dejó de afirmar el placeholder eliminado.

## Restricciones respetadas

- No se imprimieron valores de secretos.
- No se hizo deploy, commit ni mutación remota.
- No se modificaron migraciones, schema, `lib/auth.ts`, `lib/tenancy.ts` ni `openspec/tasks.md`.
- Se conservaron los archivos preexistentes no relacionados.
