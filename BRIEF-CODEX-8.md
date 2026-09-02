# BRIEF-CODEX-8 — NexoDent · APPLY PR3: Clinical + Odontogram + Estimates/Billing (fases E+F)

## Misión

Ejecutar **SOLO las tareas E1-E4 y F1-F4** de `openspec/changes/nexodent/tasks.md` (PR3 de 5). Implementar registro clínico de pacientes, odontograma y presupuestos/cobros. Al terminar, **DETENTE OBLIGATORIAMENTE** — NO continúes a fases G/H (PR4). El orquestador verificará y lanzará el siguiente PR.

## Contexto (ya validado — NO reabrir)

- Leer: `openspec/changes/nexodent/tasks.md` (tareas E1-E4, F1-F4 con sus criterios), `openspec/changes/nexodent/specs/`, `PRODUCT.md`, `DESIGN.md`.
- **Stack**: Next.js 16 (App Router) + React 19 + TS + Postgres + Drizzle + Better Auth + Tailwind 4 + Shadcn. Deploy final en Coolify (dominio `dental.nexolabs.cloud`).
- **PR1 (A+B) y PR2 (C+D) ya están completos y verificados por el orquestador.** Existen: tenancy + RLS forzado + Better Auth con claims de sesión (migraciones 0000-0002), seed demo determinista (Clínica Sonrisa Andes + Dra. Valentina Rojas), agenda + booking público (migración 0003, exclusion constraints, funciones SECURITY DEFINER para booking, helpers DST `santiagoLocalToUtc` en `features/scheduling/domain.ts`). Tests existentes: 19 unit / 8 integration / 4 smoke — DEBEN seguir pasando.
- **Modelo**: organization (clinic|independent) + multi-sede (site_id) + RLS por organization_id + permisos MÍNIMOS RESTRICTIVOS (TI-001..TI-007). Roles: organization_admin, professional, assistant, independent_owner.
- Este directorio YA tiene archivos (PRODUCT.md, DESIGN.md, openspec/, .agents/, .codex/, BRIEF-*.md, REPORTE-CODEX-{1,2}.md, app/, db/, lib/, features/, workers/, tests/). NO borrarlos ni romperlos.

## Restricciones de entorno (IMPORTANTE — igual que PR1/PR2)

- **NO hay Docker daemon** → NO usar `docker compose up` en la verificación local.
- **NO hay Postgres instalado, NO hay sudo** → los tests de integración RLS usan **Postgres embebido portable** (npm `embedded-postgres`), que YA FUNCIONÓ en PR1/PR2. Reutilizar el mismo harness de los tests de integración existentes (ver `tests/integration/rls-tenant.test.ts`, `rls-scheduling-booking.test.ts`).
- REGLA: nunca bloquear la entrega por falta de Postgres local.

## Tareas (de tasks.md — ejecutar en orden)

### Fase E — Clinical record and odontogram
- [ ] **E1 — Patient records/attachments**: pacientes, evoluciones, documentos, consentimiento/detección de duplicados, almacenamiento en cuarentena y chequeos MIME/tamaño/scan en `db/schema/clinical.ts`, `features/clinical-records/`, `lib/storage.ts`; Req: CR-001..CR-003; Deps: B3; Accept: S06-S10 pasan, incluyendo upload inválido sin escritura parcial.
- [ ] **E2 — Odontogram model**: dientes/superficies/estado con validación, proyección SVG, eventos/historial inmutables en `db/schema/odontogram.ts`, `features/odontogram/model.ts`, `features/odontogram/actions.ts`; Req: OD-001..OD-003; Deps: E1; Accept: S31-S35 pasan y NO existe camino de código de diagnóstico/recomendación.
- [ ] **E3 — Clinical UI**: pestañas de paciente y control SVG accesible en `app/(app)/patients/[patientId]/`, `components/odontogram/`; Req: CR-001..003, OD-001..003; Deps: E1-E2; Accept: comportamiento keyboard/focus/legend funciona a 360px.
- [ ] **E4 — Clinical tests**: reducers/validators unitarios, integración RLS por rol/sede, smokes `/patients/[id]` y `/patients/[id]/odontogram` en `tests/unit/clinical-odontogram.test.ts`, `tests/integration/rls-clinical.test.ts`, `tests/smoke/clinical.spec.ts`; Req: CR-001..003, OD-001..003; Deps: E1-E3; Accept: denegación a assistant y cronología histórica aseveradas.

### Fase F — Tariffs, estimates and billing
- [ ] **F1 — Tariffs/estimates**: aranceles, totales itemizados, versiones/estados inmutables y links públicos hasheados revocables en `db/schema/estimates.ts`, `features/estimates/`; Req: EST-001..EST-003; Deps: B3,E1; Accept: S16-S20 pasan; montos negativos nunca commitean y aprobación nunca inicia pago.
- [ ] **F2 — Manual billing**: cobros/pagos CLP con saldo, retenciones y asientos de auditoría inmutables en `db/schema/billing.ts`, `features/manual-billing/`; Req: BILL-001..BILL-003; Deps: F1; Accept: S21-S25 pasan con integridad contable de saldo.
- [ ] **F3 — Finance UI**: aranceles, cotización itemizada, cobros y estado de cuenta en `app/(app)/estimates/`, `app/(app)/billing/`; Req: EST-001..003, BILL-001..003; Deps: F1-F2; Accept: montos en CLP con formato chileno y navegación con estado vacío.
- [ ] **F4 — Finance tests**: unitarios de arancel/estimación/cobro, integración RLS y smoke de finanzas en `tests/unit/finance.test.ts`, `tests/integration/rls-finance.test.ts`, `tests/smoke/finance.spec.ts`; Req: EST-001..003, BILL-001..003; Deps: F1-F3; Accept: cambios de precio históricos y denegación cross-tenant aseverados.

## ⛔ REGLAS ANTI-BLOQUEO

1. NUNCA esperes aprobación humana. Tras 2 fallos en una tarea, documenta y sigue.
2. Todo curl con `--max-time 25`.
3. Cada tarea = método principal + fallback + documentación.
4. Reporte final OBLIGATORIO aunque algo falle.
5. Postgres embebido YA FUNCIONA — úsalo para integración RLS.

## REGLAS CRÍTICAS

- NO toques fuera de este directorio. NO modifiques PRODUCT.md, DESIGN.md, specs, design.md, tasks.md, ni REPORTE-CODEX-{1,2}.md.
- NO borres archivos existentes (openspec/, .agents/, .codex/, app/, db/, lib/, features/, workers/, tests/, migraciones 0000-0003).
- NO modifiques migraciones ya aplicadas (0000-0003): si necesitas cambios de schema, crea `0004_*.sql`.
- NO imprimas ni guardes secretos. Env vars solo NOMBRES en `.env.example`, NUNCA valores.
- Implementa EXACTAMENTE lo de tasks.md E1-E4 y F1-F4 — no agregues features de fases posteriores (G/H/I/J: notifications, insights, CSV migration, PWA, security hardening).
- El diseño visual completo (DESIGN.md tokens, PWA) es fase I (PR5) — en este PR solo dejar la base mínima funcional (UI clínica básica en español con layout ya existente).
- El código va en español en textos de UI; identificadores en inglés.
- Montos SIEMPRE como CLP `bigint` (entero, sin decimales) — ver `db/schema/core.ts` helper `clp()`.
- El odontograma NO debe tener diagnóstico automático ni recomendaciones (OD-001..003 lo prohíben): es registro clínico, no IA.
- Sube SOLO lo necesario; los archivos demo (`db/fixtures/demo.ts`) ya existen y tienen marcador ficticio — extiéndelos si hace falta evidencia (C2 ya dejó `demoOperationalEvidence` tipado para odontogram/estimates/billing: úsalo como guía).
- Si una tarea requiere tablas que dependen de datos demo, recuerda: el seed corre con `insertDemoFixture(sql)` — mantenlo idempotente.

## Verificación con evidencia (en el reporte)

1. `npm run build` → exit 0
2. `npm run test:unit` → pasa (incluye clinical-odontogram y finance)
3. `npm run test:integration` (Postgres embebido) → pasa (incluye rls-clinical y rls-finance)
4. `npm run test:smoke` → smoke clínico/finanzas pasan (o documentar si requieren runtime)
5. `npm run lint` → limpio
6. Confirmar que los tests de PR1+PR2 siguen pasando (regresión completa)
7. Listar estructura nueva (features/clinical-records/, features/odontogram/, features/estimates/, features/manual-billing/, components/odontogram/, db/schema/clinical.ts, db/schema/odontogram.ts, db/schema/estimates.ts, db/schema/billing.ts)

## Reporte final

Crea `REPORTE-CODEX-3.md` con: tareas completadas, evidencia, y estado para el PR4. NO tocar REPORTE-CODEX-1.md ni REPORTE-CODEX-2.md.
