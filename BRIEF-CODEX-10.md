# BRIEF-CODEX-10 — NexoDent · APPLY PR5 (FINAL): Chile PWA/visual system + hardening + Coolify release (fases I+J)

## Misión

Ejecutar **SOLO las tareas I1-I4 y J0-J4** de `openspec/changes/nexodent/tasks.md` (PR5 de 5 — FINAL). Implementar sistema visual DESIGN.md + PWA Chile, hardening de workers y configuración de release Coolify. Al terminar, **DETENTE** — es el último PR. El orquestador hará la verificación final independiente.

## Contexto (ya validado — NO reabrir)

- Leer: `openspec/changes/nexodent/tasks.md` (I1-I4, J0-J4 con criterios), specs `chile-pwa/spec.md`, `PRODUCT.md`, `DESIGN.md` (tokens visuales — I1 los implementa).
- **Stack**: Next.js 16 (App Router) + React 19 + TS + Postgres + Drizzle + Better Auth + Tailwind 4 + Shadcn. Deploy final en Coolify (dominio `dental.nexolabs.cloud`).
- **PR1-PR4 completos y verificados por el orquestador.** Migraciones 0000-0006. `runAsTenant()` en `lib/tenancy.ts` es OBLIGATORIO para toda acción que toque tablas con RLS. Tests actuales: 34 unit / 17 integration / 12 smoke — DEBEN seguir pasando.
- **Estilo gráfico**: ver `DESIGN.md`. Prohibido: paleta verde clínica / azul médico. Requerido: dark dashboard, Space Grotesk/Inter/JetBrains Mono, contraste AA.
- **Deploy**: Coolify en `panel.nexolabs.cloud` (el orquestador tiene acceso; este PR SOLO documenta configuración — NO desplegar). Env vars solo NOMBRES en `.env.example` y docs; NUNCA valores.
- Este directorio YA tiene archivos. NO borrarlos ni romperlos.

## ⚠️ LECCIONES APRENDIDAS (PR1-PR4 — OBLIGATORIO respetarlas)

1. **postgres.js devuelve `bigint` como STRING** → `Number(...)` en toda lectura de montos/bytes.
2. **FORCE RLS exige contexto en la MISMA transacción** → `runAsTenant(sql, actor, tx => ...)` con `set_config(..., true)` dentro de `sql.begin`. Resolver el actor NO alcanza.
3. **Tests con conexión app real** (LOGIN NOSUPERUSER NOBYPASSRLS), admin solo para aserciones post-acción.
4. **Rutas/superficies públicas** (sin sesión) → funciones `SECURITY DEFINER` acotadas + REVOKE PUBLIC + GRANT a roles login.
5. **Inmutabilidad** con triggers que RAISAN; permitir solo sincronizaciones controladas.
6. **Pruebas verdes ≠ requisitos completos**: cumplir escenarios S##, no solo compilar. Documentar lo no demostrable.
7. NO marques tasks.md — el orquestador marca SOLO tras verificar. Sé honesto en el reporte.

## Tareas (de tasks.md — ejecutar en orden)

### Fase I — Chile PWA and visual system
- [ ] **I1 — Tokens/layout**: tokens de DESIGN.md, Space Grotesk/Inter/JetBrains Mono, dark dashboard, landing shell, estados focus/error en `app/globals.css`, `app/layout.tsx`, `components/layout/`, `components/brand/`; Req: CL-002, all UI; Deps: A1; Accept: contraste AA y SIN paleta verde clínica/azul médico.
- [ ] **I2 — Responsive/PWA**: manifest, iconos, service worker shell-only cache y offline mutation guard en `public/manifest.webmanifest`, `public/icons/`, `app/sw.ts`, `lib/offline.ts`; Req: CL-002, CL-003; Deps: I1; Accept: S03-S05; datos clínicos/cobros NUNCA desde cache.
- [ ] **I3 — Chile formats**: formatters CLP/RUT/Santiago + validación inline en `lib/locale/cl.ts`, `components/forms/`; Req: CL-001; Deps: A1; Accept: S01-S02 display y rechazo checksum (módulo 11 RUT chileno).
- [ ] **I4 — Visual tests/routes**: tests unit formatters/accesibilidad, integración RLS smoke sobre shell protegido, smokes `/`, `/agenda`, `/patients`, `/offline` en `tests/unit/pwa-locale.test.ts`, `tests/integration/rls-pwa.test.ts`, `tests/smoke/pwa.spec.ts`; Req: CL-001..003; Deps: I1-I3; Accept: auditoría 360px sin overflow horizontal y metadata install válida.

### Fase J — Final verification and Coolify release
- [ ] **J0 — RED-first process-boundary security tests**: ANTES de J1 (strict_tdd=false, solo registrar el marcador): tests que fallen para claims duplicados por dos workers, retry acotado tras fallo, y CSV/payload malicioso sin datos residuales en `tests/security/process-boundary.red.test.ts`; Req: NOT-001, OI-001, MIG-001; Deps: G,H; Accept: casos RED registrados ANTES del hardening, sin afirmar que corren.
- [ ] **J1 — Worker hardening**: dispatch de workers con comando fijo, `FOR UPDATE SKIP LOCKED`, attempts/idempotencia acotados y tests de payload malicioso en `workers/`, `lib/jobs.ts`, `tests/unit/jobs-security.test.ts`; Req: NOT-001, OI-001, MIG-001; Deps: G,H; Accept: dos workers procesan una vez; fallos reintentan máximo bound configurado.
- [ ] **J2 — Deploy configuration**: documentar servicios Coolify web/worker/Postgres, volumen/backups/restore, health checks, dominio `dental.nexolabs.cloud`, y SOLO nombres de env (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `APP_URL`, `STORAGE_*`, `EMAIL_*`, `WORKER_*`, `RATE_LIMIT_*`) en `Dockerfile`, `docker-compose.yml`, `docs/deploy/coolify.md`; Req: CL-002; Deps: A3,J1; Accept: staging deploy alcanza `/api/health/ready`; SIN valores de secretos commiteados.
- [ ] **J3 — Full regression/RLS**: correr suites unit, integraciones negativas tenant/site y smoke matrix en `tests/`; Req: TI-001..TI-007 y todos los capability requirements; Deps: A-J prior tests; Accept: los 37 requirements y S01-S64 mapean a evidencia verde; comando fallido = máx 2 intentos, luego documentar y seguir.
- [ ] **J4 — Release checklist**: registrar migración rehearsal, evidencia backup/restore, checks security/AA/offline y procedimiento rollback en `docs/release/nexodent-v1.md`; Req: all; Deps: J2-J3; Accept: checklist nombra imagen, migración DB, worker, dominio, health, rollback y resultados observados.

## Reglas

- NO modifiques migraciones 0000-0006. Si necesitas schema, crea `0007_*.sql`.
- NO modifiques PRODUCT.md, DESIGN.md, specs, design.md, tasks.md ni REPORTE-CODEX-{1,2,3,4}.md. Crea `REPORTE-CODEX-5.md`.
- NO imprimas ni guardes secretos. NO despliegues nada real — J2 es documentación de configuración.
- Textos UI en español; identificadores en inglés. RUT chileno: validación módulo 11 con prefijo opcional y puntos.
- Service worker: cache SOLO shell (estático); NUNCA cachear respuestas de datos clínicos/cobros/agenda; offline mutation guard bloquea escrituras sin conexión.
- Postgres embebido para integración. Workers: patrón existente (`workers/*.ts` con entrypoint tsx).
- No implementes nada fuera de I1-I4/J0-J4.

## Verificación con evidencia (en el reporte)

1. `npm run build` → exit 0
2. `npm run test:unit` → pasa (incluye pwa-locale y jobs-security)
3. `npm run test:integration` (Postgres embebido) → pasa (incluye rls-pwa) con conexiones app NOBYPASSRLS vía runAsTenant
4. `npm run test:smoke` → pasa (incluye pwa.spec con `/`, `/agenda`, `/patients`, `/offline`)
5. `npm run lint` → limpio
6. Confirmar regresión completa PR1-PR4 (34 unit / 17 integration / 12 smoke previos siguen pasando)
7. Auditoría 360px: sin overflow horizontal (si no hay runtime de browser, documentar cómo se verificará en deploy)
8. Listar estructura nueva

## Reporte final

Crea `REPORTE-CODEX-5.md` con: tareas completadas, evidencia por tarea (S## cubiertos), tabla de trazabilidad requirements→evidencia si aplica, y estado FINAL para la verificación del orquestador. Sé honesto sobre lo que no quede demostrado localmente (p.ej. PWA en browser real, deploy Coolify).
