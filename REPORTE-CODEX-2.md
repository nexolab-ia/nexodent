# REPORTE-CODEX-2 — NexoDent PR2

## Alcance ejecutado

Se completaron exclusivamente C1-C3 y D1-D4: fixture demo determinista, migración `0003_scheduling_booking.sql`, dominio y acciones de agenda, reserva pública con tokens opacos hasheados, UI mínima de agenda y reserva, y pruebas asociadas.

No se modificaron `PRODUCT.md`, `DESIGN.md`, `openspec/changes/nexodent/{specs,design.md,tasks.md}`, ni `REPORTE-CODEX-1.md`. Las fases E/F y posteriores permanecen sin implementar.

## Implementación

- `db/fixtures/demo.ts` y `db/seed.ts`: Clínica Sonrisa Andes (Providencia/Ñuñoa, tres profesionales, asistente, 20 pacientes ficticios) y Dra. Valentina Rojas independiente. Todo identificador demo se marca como ficticio; no se persisten tokens en claro.
- `db/migrations/0003_scheduling_booking.sql`: horarios, disponibilidad profesional, boxes, citas, historial inmutable, tokens/rate limit de reserva pública, RLS y restricciones de exclusión para profesional y box.
- `features/scheduling/`: validación `America/Santiago`, horario laboral, creación/reagendamiento/cancelación con razón e historial.
- `features/public-booking/`: límites por token/cliente, revocación, disponibilidad no clínica a través de límites `SECURITY DEFINER`, y reserva atómica pendiente.
- `app/(app)/agenda/`, `app/r/[orgSlug]/`, `app/api/public/booking/route.ts`, `app/demo/`: superficies mínimas funcionales en español.

## Evidencia de verificación

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | pasa |
| `npm run test:unit` | 4 archivos, 16 pruebas pasan |
| `npm run test:integration` | Postgres embebido: 4 archivos, 8 pruebas pasan; incluye seed dos veces, RLS y conflicto concurrente 1 éxito/1 rechazo |
| `npm run test:smoke` | 4 archivos, 4 pruebas pasan; incluye `/demo`, `/agenda` y `/r/[orgSlug]` |
| `npm run lint` | pasa |
| `npm run build` | compilación, TypeScript y generación estática completadas; rutas `/agenda`, `/demo`, `/r/[orgSlug]` y API pública presentes |
| `npm run seed` (dos ejecuciones) | ambas retornaron 1 porque falta `DATABASE_URL` local; no se bloqueó el PR según la regla anti-bloqueo. La idempotencia sí quedó demostrada con dos ejecuciones reales de `insertDemoFixture` en Postgres embebido. |

La verificación mantiene las pruebas preexistentes de PR1: las suites unitarias, integración y smoke completas pasan.

## Estructura nueva

- `db/fixtures/demo.ts`
- `db/seed.ts`
- `db/schema/scheduling.ts`
- `db/migrations/0003_scheduling_booking.sql`
- `features/scheduling/`
- `features/public-booking/`
- `app/(app)/agenda/`
- `app/r/[orgSlug]/`
- `app/api/public/booking/route.ts`
- `app/demo/page.tsx`

## Riesgos y estado para PR3

- El comando de seed requiere una base configurada mediante el nombre de entorno `DATABASE_URL`; el entorno local no la tiene. No se expuso ningún valor.
- La advertencia de Vite sobre `configLoader: native` y la advertencia preexistente de Better Auth sobre su secreto por defecto no hicieron fallar los comandos; PR3 debe configurar secretos reales fuera del repositorio.
- PR3 puede comenzar con E1-F4. No se implementaron features clínicas, odontograma UI, presupuestos ni cobros en este PR.

## Corrección de gatekeeper (orquestador, verificación independiente post-PR2)

La verificación independiente del orquestador encontró y corrigió un bug real de zona horaria que los tests no cubrían:

- **Bug DST en slots de booking público**: `features/public-booking/service.ts` construía los slots con `hour + 3` fijo (asumía Chile en UTC-3 de verano). Durante el horario de invierno (UTC-4, ~abril a septiembre) los slots salían 1 hora corridos y la reserva fallaba con "outside availability". Los tests pasaban porque usaban fechas de septiembre 2027 (ya en verano). Fix:
  - `features/scheduling/domain.ts`: nuevos helpers `santiagoOffsetMs()` y `santiagoLocalToUtc()` que resuelven el offset real de `America/Santiago` vía `Intl` (UTC-3 verano / UTC-4 invierno), muestreando al mediodía UTC del día objetivo para evitar bordes de transición.
  - `features/public-booking/service.ts`: los slots ahora se construyen con `santiagoLocalToUtc(day, item.startsAt)`.
  - `tests/unit/scheduling.test.ts`: 3 tests nuevos de conversión DST (invierno 09:00→13:00Z, verano 09:00→12:00Z, y 18:00 en ambas estaciones).

Re-verificación del orquestador tras la corrección: `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run test:unit` (19 passed, incluye 3 DST nuevos) ✅, `npm run test:integration` (8 passed) ✅, `npm run test:smoke` (4 passed) ✅, `npm run build` ✅.
