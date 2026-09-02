# BRIEF-CODEX-5 — NexoDent · FASE 5: tasks (CON PAUSA)

## Misión

Ejecutar **SOLO la fase `tasks`** del flujo SDD de Gentle-AI para NexoDent. Producir el desglose de tareas accionables que la fase apply ejecutará. Al terminar, **DETENTE OBLIGATORIAMENTE** — NO continúes a apply/verify.

## Contexto (ya validado — NO reabrir)

- **Fases 1-4 completadas**: exploration.md, proposal.md, 11 specs (37 req, 64 escenarios), design.md (10 secciones). Leer TODOS: `openspec/changes/nexodent/`.
- **Stack aprobado**: Next.js 16 (App Router) + React 19 + TypeScript + Postgres en Coolify + Drizzle ORM + Better Auth + Tailwind 4 + Shadcn UI. Deploy Dockerfile → `dental.nexolabs.cloud`.
- **Modelo**: organization (clinic|independent) + multi-sede (site_id) + RLS por organization_id. Permisos MÍNIMOS RESTRICTIVOS.
- **PRODUCT.md** y **DESIGN.md** (dark fintech + cian, Space Grotesk + Inter) son autoritativos.
- Impeccable instalado (`.agents/skills/impeccable/`) — se usará en apply para el diseño visual.

## Tareas de esta fase

Crear `openspec/changes/nexodent/tasks.md` siguiendo el formato de las skills sdd-tasks de `~/.codex/skills/`:

1. **Desglose completo de tareas** para implementar TODO el v1 según design.md y los specs. Cada tarea con:
   - ID, título, descripción accionable
   - Archivos/rutas que tocará
   - Spec(s)/requisito(s) que cumple (referenciar IDs: TI-001.., etc.)
   - Dependencias (qué tarea antes)
   - Criterio de aceptación verificable (comando, test, o comportamiento observable)
   - Estimación relativa (S/M/L) o tiempo
2. **Orden de ejecución por fases de construcción** (sugerir agrupaciones):
   - Fase A: scaffolding (Next.js, Tailwind, Shadcn, Drizzle, Better Auth, Dockerfile, CI local)
   - Fase B: tenancy + auth + RLS (organization/site/membership/audit + matriz permisos)
   - Fase C: datos demo seeds (Clínica Sonrisa Andes + Dra. Valentina Rojas)
   - Fase D: agenda + reserva pública (scheduling, public-booking)
   - Fase E: ficha clínica + odontograma (clinical-records, odontogram)
   - Fase F: presupuestos + cobros (estimates, manual-billing)
   - Fase G: notificaciones + avisos operativos (notifications, operational-insights)
   - Fase H: migración CSV (csv-migration)
   - Fase I: PWA + pulido visual (chile-pwa, DESIGN.md con Impeccable)
   - Fase J: verificación final (tests, smoke, deploy)
3. **Tareas de testeo integradas**: cada grupo incluye sus tests (unit + integración con RLS + al menos smoke de rutas). No dejar los tests para el final.
4. **Tareas de deploy**: Dockerfile, health checks, Postgres en Coolify, env vars (nombres, sin valores), dominio.

## ⛔ REGLAS ANTI-BLOQUEO

1. Si algo falla tras 2 intentos, documenta y continúa.
2. Todo curl con `--max-time 25`.
3. NUNCA esperes aprobación humana DENTRO de la fase — ejecuta tasks completo.
4. Al terminar, **DETENTE**: escribe el reporte y NO avances a apply.

## REGLAS CRÍTICAS

- NO toques fuera de este directorio. NO modifiques PRODUCT.md, DESIGN.md, specs ni design.md.
- NO implementes código de la app — solo el desglose de tareas.
- Las tareas deben ser EJECUTABLES por apply sin ambigüedad (si apply lee tasks.md, debe saber qué construir).
- Cubrir TODOS los requisitos (37) y escenarios (64) — se puede verificar con un checklist de trazabilidad al final.
- El stack aprobado NO se reabre.

## Verificación con evidencia

1. `openspec/changes/nexodent/tasks.md` existe con tareas ID + dependencias + criterios de aceptación.
2. Trazabilidad: cada spec/requisito tiene al menos una tarea (checklist).
3. Las agrupaciones A-J están definidas con orden.
4. Resumen en el reporte final.

## Reporte final

Actualiza `REPORTE-CODEX-1.md` (sección "FASE 5 — tasks") con: total de tareas, agrupaciones, estimación global (tiempo/effort), y cualquier punto que el orquestador deba validar en la pausa (ej: orden de fases, qué incluir en el primer apply).
