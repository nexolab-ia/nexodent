# BRIEF-CODEX-2 — NexoDent · FASE 2: propose (CON PAUSA)

## Misión

Ejecutar **SOLO la fase `propose`** del flujo SDD de Gentle-AI para NexoDent (SaaS dental). Al terminar, **DETENTE OBLIGATORIAMENTE** — NO continúes a spec/design/tasks/apply/verify. El orquestador revisará contigo la pausa antes de autorizar la siguiente fase.

## Contexto (ya validado por Bryan — NO reabrir)

- **Fase 1 completada**: `openspec/config.yaml` + `openspec/changes/nexodent/exploration.md` + `REPORTE-CODEX-1.md` (leerlos).
- **STACK APROBADO por Bryan (2026-09-01)**: Next.js 16 (App Router) + React 19 + TypeScript + **Postgres en el Coolify de Bryan** (NO Supabase Cloud, NO Vercel) + **Drizzle ORM** + **Better Auth** + Tailwind 4 + Shadcn UI. Desplegado en `panel.nexolabs.cloud` (Coolify), dominio será `nexodent.nexolabs.cloud` (u otro subdominio que confirme el orquestador).
- **PRODUCT.md** — incluye la investigación de mercado del orquestador (Reddit/foros 2026): el stack elegido es EL estándar SaaS 2026; self-hosting en Coolify baja el costo operativo de US$60-120/mes a ~US$0-10/mes.
- **DESIGN.md** — identidad dark fintech + cian (Space Grotesk + Inter). Autoritativo.
- Impeccable instalado (`.agents/skills/impeccable/`) — se usará en la fase apply/design, no ahora.

## Tareas de esta fase

1. Crear `openspec/changes/nexodent/proposal.md` con:
   - **Resumen ejecutivo**: qué es NexoDent, para quién, diferenciación (IA proactiva real + diseño moderno + precio transparente + migración desde CIMAOS/Dentalink).
   - **Solución propuesta**: arquitectura de alto nivel del stack aprobado (Next.js App Router monolito modular, Postgres multi-tenant con `clinic_id` + RLS, Drizzle, Better Auth, Tailwind/Shadcn, despliegue en Coolify vía Dockerfile).
   - **Decisiones de producto**: el alcance v1 aprobado (de exploration.md): clínica/tenants, agenda con anti-doble-reserva, reserva pública, ficha clínica + odontograma SVG, presupuestos versionados, cobros manuales, recordatorios correo + WhatsApp preparado, IA = avisos operativos explicables con aprobación humana, migración CSV asistida, PWA responsive, Chile primero.
   - **Decisiones NO resueltas** (si las hay): listar las que queden para la fase spec, con recomendación.
   - **Criterios de éxito del MVP**: qué define que el piloto funcione (ej: clínica piloto opera agenda + cobros + odontograma en producción, migra datos reales).
   - **Riesgos y mitigaciones** (multi-tenancy, datos clínicos/legales, migración, IA sin diagnóstico médico).
2. Escribir el resultado en `openspec/changes/nexodent/proposal.md` siguiendo el formato de las skills sdd-propose de `~/.codex/skills/`.

## ⛔ REGLAS ANTI-BLOQUEO

1. Si algo falla tras 2 intentos, documenta y continúa.
2. Todo curl con `--max-time 25`.
3. NUNCA esperes aprobación humana DENTRO de la fase — ejecuta propose completo.
4. Al terminar, **DETENTE**: escribe el reporte y NO avances a spec.

## REGLAS CRÍTICAS

- NO toques fuera de este directorio.
- NO modifiques PRODUCT.md ni DESIGN.md.
- NO implementes código de la app en esta fase.
- El stack aprobado NO se reabre (solo anotar si hay un riesgo técnico grave descubierto, marcándolo para el orquestador).
- La propuesta debe ser accionable: la fase spec la convertirá en requisitos verificables.

## Verificación con evidencia

1. `openspec/changes/nexodent/proposal.md` existe con las secciones requeridas.
2. La propuesta refleja el stack aprobado y el alcance v1 de exploration.md.
3. Resumen en el reporte final.

## Reporte final

Actualiza `REPORTE-CODEX-1.md` (sección "FASE 2 — propose") con: resumen de la propuesta, decisiones clave, y las preguntas/decisiones que el orquestador debe validar con Bryan en la pausa.
