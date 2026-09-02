# BRIEF-CODEX-7 — NexoDent · APPLY PR2: Demo seed + Agenda + Public booking (fases C+D)

## Misión

Ejecutar **SOLO las tareas C1-C3 y D1-D4** de `openspec/changes/nexodent/tasks.md` (PR2 de 5). Implementar el seed determinista de demostración y el dominio de agenda/booking público. Al terminar, **DETENTE OBLIGATORIAMENTE** — NO continúes a fases E/F (PR3). El orquestador verificará y lanzará el siguiente PR.

## Contexto (ya validado — NO reabrir)

- Leer: `openspec/changes/nexodent/tasks.md` (tareas C1-C3, D1-D4 con sus criterios), `openspec/changes/nexodent/specs/`, `PRODUCT.md`, `DESIGN.md`.
- **Stack**: Next.js 16 (App Router) + React 19 + TS + Postgres + Drizzle + Better Auth + Tailwind 4 + Shadcn. Deploy final en Coolify (dominio `dental.nexolabs.cloud`).
- **PR1 ya está completo y verificado** (fases A+B): scaffold, tenancy (organizations/sites/users/memberships/membership_sites/audit_logs), Better Auth con claims de sesión (membership_id, organization_id, rol, site_ids), matriz de permisos restrictiva, RLS forzado por organization_id con FKs compuestas, función `app_resolve_active_membership(user_id)` SECURITY DEFINER para bootstrap de sesión (migración 0002). Migraciones: `0000_core.sql`, `0001_tenant_rls.sql`, `0002_auth_bootstrap.sql`.
- **Tests existentes que deben seguir pasando**: `tests/unit/foundation.test.ts`, `tests/unit/tenant.test.ts`, `tests/integration/rls-foundation.test.ts`, `tests/integration/rls-tenant.test.ts`, `tests/smoke/foundation.spec.ts`, `tests/smoke/tenant.spec.ts`.
- **Modelo**: organization (clinic|independent) + multi-sede (site_id) + RLS por organization_id + permisos MÍNIMOS RESTRICTIVOS (TI-001..TI-007). Agenda: Chile timezone, boxes, exclusion constraints; booking público con tokens opacos.
- Este directorio YA tiene archivos (PRODUCT.md, DESIGN.md, openspec/, .agents/, .codex/, BRIEF-*.md, REPORTE-CODEX-1.md, app/, db/, lib/, features/, workers/, tests/). NO borrarlos ni romperlos.

## Restricciones de entorno (IMPORTANTE — igual que PR1)

- **NO hay Docker daemon** (`/var/run/docker.sock` inaccesible) → NO usar `docker compose up` en la verificación local.
- **NO hay Postgres instalado, NO hay sudo** → los tests de integración RLS usan **Postgres embebido portable** (npm `embedded-postgres`), que YA FUNCIONÓ en PR1 (5 tests de integración pasaron). Reutilizar el mismo harness de los tests de integración existentes.
- REGLA: nunca bloquear la entrega por falta de Postgres local.

## Tareas (de tasks.md — ejecutar en orden)

### Fase C — Deterministic demo data
- [ ] **C1 — Seed fixtures**: Clínica Sonrisa Andes (Providencia/Ñuñoa, 3 profesionales, asistente, ~20 pacientes) y Dra. Valentina Rojas independiente en `db/seed.ts`, `db/fixtures/demo.ts`; Req: TI-006, TI-007; Accept: dos corridas idempotentes y todos los identificadores/RUT ficticios marcados.
- [ ] **C2 — Evidence-rich seed**: Citas pasadas/futuras, versiones de odontograma, presupuestos, cobros/pagos y datos fuente de avisos en `db/fixtures/demo.ts`; Req: OD-002, EST-002, BILL-002, OI-001; Accept: query de fixture demuestra las tres entradas de reglas operativas y sin conflictos de booking. *(Nota: OD/EST/BILL/OI son fases E/F/G — el seed crea los datos; las features se construyen después. No implementar features de fases posteriores.)*
- [ ] **C3 — Seed tests**: Tests de determinismo, integración RLS del seed, smoke de `/demo` en `tests/unit/seed.test.ts`, `tests/integration/rls-seed.test.ts`, `tests/smoke/demo.spec.ts`; Req: TI-001, TI-006, TI-007; Accept: counts y marcador de datos ficticios aseverados.

### Fase D — Scheduling and public booking
- [ ] **D1 — Scheduling domain**: Horarios laborales, disponibilidad, boxes, citas/eventos, validación de timezone Chile y exclusion constraints en `db/schema/scheduling.ts`, `features/scheduling/`; Req: SCH-001..SCH-003; Deps: B1; Accept: S48-S53 representados, cancelación requiere motivo e historial inmutable.
- [ ] **D2 — Internal agenda UI/actions**: Calendario día/semana, drag/drop reprogramación, crear/editar/cancelar en `app/(app)/agenda/`, `features/scheduling/actions.ts`; Req: SCH-001, SCH-003, TI-006, TI-007; Deps: D1; Accept: flujos assigned-site e independiente; validación fuera de horario inline.
- [ ] **D3 — Public booking**: Tokens opacos con scope, ruta `/r/[orgSlug]` con marca, `?site=` opcional, disponibilidad segura, booking atómico, revocación y rate limiting en `app/r/[orgSlug]/`, `app/api/public/booking/route.ts`, `features/public-booking/`; Req: PB-001..PB-003; Deps: D1; Accept: S41-S47 pasan; desconocido/revocado/rate-limited no revelan datos.
- [ ] **D4 — Scheduling tests**: Tests de solapamiento/slots unitarios, integración RLS concurrente y cross-tenant, smokes `/agenda` y `/r/demo-clinic` en `tests/unit/scheduling.test.ts`, `tests/integration/rls-scheduling-booking.test.ts`, `tests/smoke/scheduling-booking.spec.ts`; Req: SCH-001..003, PB-001..003; Deps: D1-D3; Accept: peticiones concurrentes = exactamente un éxito y un conflicto.

## ⛔ REGLAS ANTI-BLOQUEO

1. NUNCA esperes aprobación humana. Tras 2 fallos en una tarea, documenta y sigue.
2. Todo curl con `--max-time 25`.
3. Cada tarea = método principal + fallback + documentación.
4. Reporte final OBLIGATORIO aunque algo falle.
5. Postgres embebido YA FUNCIONA (Opción A confirmada en PR1) — úsalo.

## REGLAS CRÍTICAS

- NO toques fuera de este directorio. NO modifiques PRODUCT.md, DESIGN.md, specs, design.md, tasks.md, ni REPORTE-CODEX-1.md.
- NO borres archivos existentes (openspec/, .agents/, .codex/, app/, db/, lib/, features/, workers/, tests/, migraciones 0000-0002).
- NO modifiques migraciones ya aplicadas (0000-0002): si necesitas cambios de schema, crea `0003_*.sql`.
- NO imprimas ni guardes secretos. Env vars solo NOMBRES en `.env.example`, NUNCA valores.
- Implementa EXACTAMENTE lo de tasks.md C1-C3 y D1-D4 — no agregues features de fases posteriores (E/F/G/H/I/J: clinical records, odontogram UI, estimates, billing, notifications, insights, CSV migration, PWA, security hardening).
- El diseño visual completo (DESIGN.md tokens, PWA) es fase I (PR5) — en este PR solo dejar la base mínima funcional (agenda interna básica + booking público básico con marca mínima).
- El código va en español en textos de UI; identificadores en inglés.
- Los datos demo DEBEN estar marcados como ficticios (RUTs 11.111.111-x etc.).

## Verificación con evidencia (en el reporte)

1. `npm run build` → exit 0
2. `npm run test:unit` → pasa (incluye tests nuevos de seed y scheduling)
3. `npm run test:integration` (Postgres embebido) → pasa (incluye rls-seed y rls-scheduling-booking con concurrencia)
4. `npm run test:smoke` → smoke de demo/scheduling/booking pasan (o documentar si requieren runtime)
5. `npm run lint` → limpio
6. `npm run seed` → idempotente (correr 2 veces, segunda sin errores)
7. Listar estructura nueva (db/fixtures/, features/scheduling/, features/public-booking/, app/(app)/agenda/, app/r/)
8. Confirmar que los tests de PR1 siguen pasando (regresión)

## Reporte final

Actualiza `REPORTE-CODEX-2.md` (crear nuevo) con: tareas completadas, evidencia, seed idempotente confirmado, y estado para el PR3. NO tocar REPORTE-CODEX-1.md.
