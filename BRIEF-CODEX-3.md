# BRIEF-CODEX-3 — NexoDent · FASE 3: spec (CON PAUSA)

## Misión

Ejecutar **SOLO la fase `spec`** del flujo SDD de Gentle-AI para NexoDent (SaaS dental). Al terminar, **DETENTE OBLIGATORIAMENTE** — NO continúes a design/tasks/apply/verify. El orquestador revisará contigo la pausa antes de autorizar la siguiente fase.

## Contexto (ya validado — NO reabrir)

- **Fases 1-2 completadas**: `openspec/config.yaml`, `openspec/changes/nexodent/exploration.md`, `openspec/changes/nexodent/proposal.md` + `REPORTE-CODEX-1.md` (leerlos todos).
- **Stack aprobado por Bryan**: Next.js 16 (App Router) + React 19 + TypeScript + Postgres en Coolify de Bryan (NO Supabase Cloud, NO Vercel) + Drizzle ORM + Better Auth + Tailwind 4 + Shadcn UI. Deploy vía Dockerfile en panel.nexolabs.cloud.
- **Decisiones de la pausa (Bryan, 2026-09-01)** — en PRODUCT.md:
  - Clínica demo REALISTA (ficticia, datos realistas), no clínica real aún.
  - Dominio: `dental.nexolabs.cloud`.
  - Permisos: MÍNIMOS RESTRICTIVOS (principio de menor privilegio).
- **PRODUCT.md** (contenido + competencia CIMAOS/Dentalink + investigación mercado) y **DESIGN.md** (dark fintech + cian, Space Grotesk + Inter) son autoritativos.
- Impeccable instalado (`.agents/skills/impeccable/`) — no necesario en esta fase.

## Tareas de esta fase

Crear las especificaciones en `openspec/changes/nexodent/specs/` siguiendo el formato de las skills sdd-spec de `~/.codex/skills/`. Mínimo estas capacidades (de proposal.md), cada una con REQUISITOS verificables y escenarios de aceptación:

1. **tenant-identity** — clínicas, sedes, membresías, roles, auditoría. MATRIZ DE PERMISOS MÍNIMOS RESTRICTIVOS: definir roles (admin clínica, profesional, asistente) con acceso mínimo por defecto; qué puede ver/editar cada rol; sin acceso cruzado entre clínicas (RLS). Escenarios: login, cambio de rol, denegación de acceso.
2. **scheduling** — agenda por profesional/box, sin doble reserva (constraint/transacción), reagendar, horarios. Escenarios: crear/editar/mover/cancelar cita, conflicto de doble reserva rechazado.
3. **public-booking** — reserva pública con marca (ruta /r/:slug o similar), expone solo disponibilidad, token revocable, rate limiting. Escenarios: ver disponibilidad sin login, reservar, doble reserva rechazada.
4. **clinical-records** — ficha clínica, evoluciones, adjuntos (límites de archivo restrictivos), historial. Escenarios: crear/editar ficha, adjuntar archivo, acceso denegado entre clínicas.
5. **odontogram** — odontograma SVG versionado por pieza/superficie, historial de eventos. Escenarios: registrar estado de pieza, ver historial, edición auditada.
6. **estimates** — aranceles, presupuestos versionados, link público con token revocable, estados. Escenarios: crear presupuesto, versionar, compartir link, revocar.
7. **manual-billing** — abonos manuales, saldos, cuenta corriente por paciente, recaudación. Escenarios: registrar pago/abono, calcular saldo, reporte de recaudación.
8. **notifications** — recordatorios por correo (workers), WhatsApp preparado (wa.me), avisos de reservas/cambios. Escenarios: programar recordatorio, envío, mensaje wa.me generado.
9. **operational-insights** — avisos operativos EXPLICABLES (agenda vacía, controles pendientes, tratamientos sin pago) con evidencia, aprobación humana, auditoría, SIN diagnóstico clínico. Escenarios: aviso generado con evidencia, aprobar/descartar, registro en auditoría.
10. **csv-migration** — importación CSV de pacientes, aranceles, citas futuras: upload → mapping → validation → preview → import → reconciliation, idempotente, hash de lote. Escenarios: CSV válido importa, CSV con errores muestra preview sin importar, reimportar no duplica.
11. **chile-pwa** — CLP, RUT, zona horaria Chile, PWA responsive. Escenarios: formato moneda/fecha/RUT correctos, instalable como PWA.

Para cada spec incluir: requisitos (con IDs verificables), escenarios de aceptación (Given/When/Then), criterios de seguridad y límites (qué NO hace — ej: pagos online NO en v1, IA NO clínica).

## ⛔ REGLAS ANTI-BLOQUEO

1. Si algo falla tras 2 intentos, documenta y continúa.
2. Todo curl con `--max-time 25`.
3. NUNCA esperes aprobación humana DENTRO de la fase — ejecuta spec completo.
4. Al terminar, **DETENTE**: escribe el reporte y NO avances a design/tasks/apply/verify.

## REGLAS CRÍTICAS

- NO toques fuera de este directorio. NO modifiques PRODUCT.md ni DESIGN.md.
- NO implementes código de la app en esta fase (solo specs).
- Los permisos van MÍNIMOS RESTRICTIVOS por defecto en todas las specs.
- Datos demo REALISTAS: los seeds (clínica demo con pacientes/citas/odontograma/cobros) se definen en spec como "datos de demostración" pero se IMPLEMENTAN en apply.
- El stack aprobado NO se reabre.

## Verificación con evidencia

1. `openspec/changes/nexodent/specs/` contiene los 11 specs con requisitos + escenarios.
2. Cada spec tiene IDs de requisitos verificables y escenarios Given/When/Then.
3. La matriz de permisos restrictiva está en tenant-identity (y referenciada en las demás).
4. Resumen en el reporte final.

## Reporte final

Actualiza `REPORTE-CODEX-1.md` (sección "FASE 3 — spec") con: resumen de specs creados, número de requisitos/escenarios, y cualquier decisión que el orquestador deba validar en la pausa.
