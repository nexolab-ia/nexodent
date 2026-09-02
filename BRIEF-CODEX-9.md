# BRIEF-CODEX-9 — NexoDent · APPLY PR4: Ops (notifications/insights) + CSV migration (fases G+H)

## Misión

Ejecutar **SOLO las tareas G1-G4 y H1-H4** de `openspec/changes/nexodent/tasks.md` (PR4 de 5). Implementar notificaciones/insights operacionales y migración CSV por etapas. Al terminar, **DETENTE OBLIGATORIAMENTE** — NO continúes a fase I/J (PR5). El orquestador verificará y lanzará el siguiente PR.

## Contexto (ya validado — NO reabrir)

- Leer: `openspec/changes/nexodent/tasks.md` (tareas G1-G4, H1-H4 con sus criterios), `openspec/changes/nexodent/specs/` (notifications, operational-insights, csv-migration), `PRODUCT.md`, `DESIGN.md`.
- **Stack**: Next.js 16 (App Router) + React 19 + TS + Postgres + Drizzle + Better Auth + Tailwind 4 + Shadcn. Deploy final en Coolify (dominio `dental.nexolabs.cloud`).
- **PR1-PR3 completos y verificados por el orquestador.** Estado actual: tenancy + RLS forzado + Better Auth claims (0000-0002); agenda + booking público (0003, exclusion constraints, SECURITY DEFINER); clínica + odontograma + estimates/billing (0004-0005, FKs compuestas, triggers inmutables, policies por rol, `app_public_estimate_by_token`); `runAsTenant()` en `lib/tenancy.ts` (patrón OBLIGATORIO: instalar GUCs transaction-local dentro de `sql.begin`); seed demo determinista con `demoOperationalEvidence` tipado (odontogram/estimates/billing/notice sources) en `db/fixtures/demo.ts`. Tests: 26 unit / 12 integration / 8 smoke — DEBEN seguir pasando.
- Este directorio YA tiene archivos. NO borrarlos ni romperlos.

## ⚠️ LECCIONES APRENDIDAS (PR1-PR3 — OBLIGATORIO respetarlas)

1. **postgres.js devuelve columnas `bigint` como STRING** ("50000", no 50000). Toda lectura de columna CLP/monto/byte_size/total debe convertir con `Number(...)` al mapear filas. NUNCA tipes una columna bigint como `number` sin convertir.
2. **FORCE RLS exige contexto en la MISMA transacción**: TODA feature action que escriba/lea tablas con RLS debe ejecutarse dentro de `runAsTenant(sql, actor, tx => ...)` (o recibir el `TransactionSql` ya contextualizado). Resolver el actor con `requestTenantContext()` NO alcanza: sin `set_config(..., true)` dentro de `sql.begin`, las queries devuelven 0 filas en runtime.
3. **Los tests deben demostrar el fix con la conexión app** (rol LOGIN NOSUPERUSER NOBYPASSRLS), NO con admin. Patrón: `app = postgres(...)`, crear rol con grants mínimos, ejecutar la feature action vía `runAsTenant(app, actor, ...)`, y verificar filas con `admin` solo después. Si un test usa solo admin, NO demuestra nada bajo RLS.
4. **Las rutas/superficies públicas** (sin sesión, sin GUC) que deban leer datos tenant protegidos usan funciones `SECURITY DEFINER` acotadas (ver `0003` booking y `0005` estimate) — REVOKE de PUBLIC + GRANT a roles login.
5. **La inmutabilidad de historial** se implementa con triggers que RAISAN en UPDATE/DELETE, permitiendo solo sincronizaciones controladas (ver trigger `app_estimate_version_state_only` en 0005).
6. **Pruebas verdes ≠ requisitos completos**: cada tarea debe cumplir los escenarios de aceptación (S##), no solo compilar. Si un escenario no se puede probar localmente, documentarlo explícitamente.
7. NO marques tasks.md — el orquestador marca SOLO tras verificar. Sé honesto en el reporte: si algo queda incompleto, documéntalo.

## Tareas (de tasks.md — ejecutar en orden)

### Fase G — Notifications and explainable insights
- [ ] **G1 — Notification jobs**: tablas notification/attempt, agendamiento email consent-aware, estados terminales con retry, payloads mínimos en `db/schema/notifications.ts`, `features/notifications/`, `workers/reminders.ts`; Req: NOT-001, NOT-002; Deps: D1,E1; Accept: S26-S28 con UN intento por entrega debida y sin datos no relacionados del paciente.
- [ ] **G2 — WhatsApp boundary**: preparación `wa.me` URL-encoded editable y outcome explícito "unsupported" del worker en `features/notifications/whatsapp.ts`; Req: NOT-003; Deps: G1; Accept: S29-S30; NO existe cliente de envío API.
- [ ] **G3 — Explainable insights**: reglas deterministas versionadas, evidencia/frescura, idempotencia aprobar/descartar y auditoría de exclusión en `db/schema/insights.ts`, `features/operational-insights/`, `workers/insights.ts`; Req: OI-001..OI-003; Deps: C2,F2,G1; Accept: S36-S40 y cada acción se ejecuta UNA sola vez tras aprobación.
- [ ] **G4 — Ops tests/routes**: tests unit reglas/jobs, integración RLS, smokes `/settings/notifications`, `/reports/insights` en `tests/unit/ops.test.ts`, `tests/integration/rls-ops.test.ts`, `tests/smoke/ops.spec.ts`; Req: NOT-001..003, OI-001..003; Deps: G1-G3; Accept: workers duplicados y casos de fuente obsoleta probados como seguros.

### Fase H — CSV migration
- [ ] **H1 — Staged pipeline**: upload en cuarentena, identidad SHA-256+mapping, checks UTF-8/20MB/100000 filas, mapping/validación/preview en `db/schema/migration.ts`, `features/csv-migration/`, `app/api/migration/`; Req: MIG-001, MIG-002; Deps: B3,E1; Accept: S11-S13 y uploads inválidos no crean batch.
- [ ] **H2 — Import/reconcile worker**: parser streaming, normalización Santiago/RUT/CLP, upsert transaccional con claves, reporte de excepciones y reimport idempotente en `workers/migration.ts`, `features/csv-migration/reconcile.ts`; Req: MIG-001..003; Deps: H1,D1,F1; Accept: S14-S15 sin duplicados y filas no emparejadas accionables.
- [ ] **H3 — Migration UI**: pantallas upload→mapping→validación→preview→import→reconciliación en `app/(app)/migration/`; Req: MIG-001..003; Deps: H1-H2; Accept: import no inicia antes de preview aceptado y errores de fila visibles.
- [ ] **H4 — Migration tests/routes**: tests parser/hash unit, integración RLS, smokes `/migration` y `/api/migration` en `tests/unit/migration.test.ts`, `tests/integration/rls-migration.test.ts`, `tests/smoke/migration.spec.ts`; Req: MIG-001..003; Deps: H1-H3; Accept: batch duplicado y source-key cross-tenant pasan.

## Reglas

- NO modifiques migraciones 0000-0005. Cambios de schema → `0006_*.sql` (y siguientes).
- NO modifiques PRODUCT.md, DESIGN.md, specs, design.md, tasks.md ni REPORTE-CODEX-{1,2,3}.md. Crea `REPORTE-CODEX-4.md`.
- NO imprimas ni guardes secretos. Env vars solo NOMBRES en `.env.example`.
- Textos UI en español; identificadores en inglés. CLP/RUT/Santiago: formatters básicos si hacen falta (formatters completos son fase I/PR5).
- Workers (`workers/reminders.ts`, `workers/insights.ts`, `workers/migration.ts`): ejecutables vía tsx, con entrypoint que respete el patrón de `workers/` existente.
- No implementes fase I (PWA/visual system) ni J (security hardening) — son PR5.
- Postgres embebido para integración (ya funciona). El seed demo (`insertDemoFixture`) ya existe: los workers/insights pueden consumir sus datos demo; NO romper su idempotencia.

## Verificación con evidencia (en el reporte)

1. `npm run build` → exit 0
2. `npm run test:unit` → pasa (incluye ops y migration)
3. `npm run test:integration` (Postgres embebido) → pasa (incluye rls-ops y rls-migration) — con conexiones app NOBYPASSRLS vía runAsTenant
4. `npm run test:smoke` → smokes ops/migration pasan (o documentar si requieren runtime)
5. `npm run lint` → limpio
6. Confirmar regresión completa PR1-PR3 (26 unit / 12 integration / 8 smoke previos siguen pasando)
7. Listar estructura nueva

## Reporte final

Crea `REPORTE-CODEX-4.md` con: tareas completadas, evidencia por tarea (escenarios S## cubiertos), y estado para PR5. Sé honesto sobre lo que no quede demostrado.
