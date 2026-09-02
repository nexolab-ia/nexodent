# BRIEF-CODEX-4 — NexoDent · FASE 4: design (CON PAUSA)

## Misión

Ejecutar **SOLO la fase `design`** del flujo SDD de Gentle-AI para NexoDent (SaaS dental). Producir el diseño técnico detallado que `tasks` convertirá en implementación. Al terminar, **DETENTE OBLIGATORIAMENTE** — NO continúes a tasks/apply/verify.

## Contexto (ya validado — NO reabrir)

- **Fases 1-3 completadas**: exploration.md, proposal.md, 11 specs (37 requisitos, 64 escenarios) en `openspec/changes/nexodent/specs/`. Leer TODOS.
- **Stack aprobado**: Next.js 16 (App Router) + React 19 + TypeScript + Postgres en el Coolify de Bryan + Drizzle ORM + Better Auth + Tailwind 4 + Shadcn UI. Deploy vía Dockerfile en panel.nexolabs.cloud, dominio `dental.nexolabs.cloud`.
- **Modelo de tenant (decisión Bryan)**: `organization` con `type: clinic|independent`; clínicas multi-sede (`site_id`); RLS por `organization_id`; profesionales en varias sedes; independiente = admin+profesional sin sede explícita. TI-001..TI-007.
- **Permisos**: MÍNIMOS RESTRICTIVOS (matriz TI-002).
- **PRODUCT.md** (contenido + competencia) y **DESIGN.md** (dark fintech + cian, Space Grotesk + Inter) son autoritativos.
- Impeccable instalado (`.agents/skills/impeccable/`) — el diseño visual se aplica en apply; en esta fase solo definir la arquitectura técnica que lo soporte (design tokens, layout system).

## Tareas de esta fase

Crear `openspec/changes/nexodent/design.md` (y artefactos que pida el flujo sdd-design) con:

1. **Arquitectura de aplicación**:
   - Monolito modular Next.js App Router: estructura de carpetas (`app/`, `db/`, `workers/`, `lib/`, `components/`, `features/` por dominio).
   - Server Components vs Client Components: qué es servidor (datos, RLS, auth, migración) y qué es cliente (agenda interactiva, odontograma SVG, formularios).
   - Workers (correo/recordatorios, importación CSV): cómo se ejecutan en el stack (cron/interval dentro del contenedor vs proceso separado).
2. **Esquema Postgres (Drizzle)**: tablas con columnas y relaciones clave:
   - organizations, sites, memberships, users (Better Auth), audit_logs
   - patients, appointments (+ conflictos/doble reserva), clinical_records, odontogram_events, documents
   - fee_schedules (aranceles), estimates (+ versions), estimate_links (token revocable), payments/charges (abonos)
   - notifications (correo/WhatsApp preparado), insights (avisos operativos + estado aprobación), migrations_batches (+ rows, idempotencia)
   - RLS: políticas por `organization_id` para cada tabla (describir el patrón Drizzle + Postgres RLS; ejemplos de política por tabla crítica).
3. **Autenticación y sesión**: Better Auth con roles (admin/profesional/asistente) + organization_id + site_ids en sesión; protección por middleware/route; patrón de verificación de permiso por operación (server action / route handler).
4. **Odontograma SVG**: diseño de la representación (dentición permanente 1-32, superficies), modelo de eventos versionados (pieza/superficie/estado/actor/fecha), accesibilidad (aria, keyboard).
5. **Reserva pública**: ruta pública `/r/[orgSlug]` (y `?site=`), solo disponibilidad, token revocable, rate limiting, anti-doble-reserva (constraint único + transacción).
6. **IA operativa (operational-insights)**: diseño de las reglas deterministas (agenda vacía, controles pendientes, tratamientos sin pago) — SQL/queries concretas, formato del aviso (evidencia + sugerencia + botones Aplicar/Descartar), auditoría de decisiones, exclusión clínica explícita.
7. **Migración CSV**: pipeline upload → mapping → validation → preview → import → reconciliation; hash de lote; idempotencia (claves externas); worker.
8. **Datos demo realistas**: diseño de los seeds (clínica demo "Clínica Sonrisa Andes" con 2 sedes, 3 profesionales, 1 asistente, ~20 pacientes, citas, odontogramas, presupuestos, cobros; y un profesional independiente demo "Dra. Valentina Rojas") — datos ficticios pero realistas (nombres chilenos, RUTs ficticios válidos en formato, CLP).
9. **Despliegue en Coolify**: Dockerfile multi-stage (node build → node runtime), nginx o node server, health check `/`, Postgres como servicio en Coolify, env vars (DATABASE_URL, AUTH_SECRET, etc. — NUNCA valores reales, solo nombres).
10. **Design tokens** (puente con DESIGN.md): CSS variables dark fintech + cian para el layout system (sin implementar componentes aún).

## ⛔ REGLAS ANTI-BLOQUEO

1. Si algo falla tras 2 intentos, documenta y continúa.
2. Todo curl con `--max-time 25`.
3. NUNCA esperes aprobación humana DENTRO de la fase — ejecuta design completo.
4. Al terminar, **DETENTE**: escribe el reporte y NO avances a tasks.

## REGLAS CRÍTICAS

- NO toques fuera de este directorio. NO modifiques PRODUCT.md, DESIGN.md ni los specs.
- NO implementes código de la app — solo el diseño técnico (el design.md puede incluir fragmentos de esquema SQL/TS como especificación, no la app).
- El modelo organization/site/RLS es OBLIGATORIO — el diseño debe cumplir TI-001..TI-007.
- Los seeds demo van ESPECIFICADOS aquí (para implementarse en apply), con datos ficticios realistas.
- El stack aprobado NO se reabre.

## Verificación con evidencia

1. `openspec/changes/nexodent/design.md` existe con las 10 secciones.
2. El esquema cubre TODAS las tablas del v1 y refleja organization/site/RLS.
3. El diseño de odontograma, reserva pública, IA operativa y migración CSV es accionable (tasks podrá desglosarlo).
4. Seeds demo especificados con datos realistas.
5. Resumen en el reporte final.

## Reporte final

Actualiza `REPORTE-CODEX-1.md` (sección "FASE 4 — design") con: resumen del diseño, decisiones técnicas clave, y cualquier punto que el orquestador deba validar en la pausa (ej: tamaño del MVP, seeds, workers).
