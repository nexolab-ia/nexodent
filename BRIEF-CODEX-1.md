# BRIEF-CODEX-1 — NexoDent · FASE 1: init + explore (CON PAUSA)

## Misión

Ejecutar **SOLO las fases `sdd init` y `explore`** del flujo SDD de Gentle-AI para el proyecto NexoDent (SaaS dental). Al terminar explore, **DETENTE OBLIGATORIAMENTE** — NO continúes a propose/spec/design/tasks/apply/verify. El orquestador revisará contigo la pausa antes de autorizar la siguiente fase.

## Contexto

- Proyecto: `dental-saas` en este directorio. Competencia: CIMAOS (cimaos.com) y Dentalink (líder LATAM).
- `PRODUCT.md` — visión, competencia verificada (features de CIMAOS y Dentalink con precios), alcance MVP propuesto, y preguntas abiertas para resolver en explore.
- `DESIGN.md` — identidad visual (dark fintech + cian, Space Grotesk + Inter). Autoritativo para la fase design (posterior).
- Impeccable instalado (`.agents/skills/impeccable/`). NO es necesario ejecutarlo en esta fase (solo si evalúas algo visual).
- Stack destino aún NO decidido — es parte de lo que explore debe resolver (ver PRODUCT.md).

## Tareas de esta fase

1. **`sdd init`** → crear `openspec/config.yaml` + registry (como en proyectos previos: schema spec-driven, strict_tdd según corresponda).
2. **`sdd new` / `explore`** → crear `openspec/changes/nexodent/exploration.md` que responda CON INVESTIGACIÓN REAL:
   - **Análisis competitivo**: qué hace CIMAOS (11 módulos, IA proactiva en desarrollo, precios transparentes $17.850 CLP/prof) y Dentalink (líder, +50 features, IA avanzada, precios solo por cotización). Diferenciación de NexoDent.
   - **Decisión de stack** (pregunta crítica del PRODUCT.md): recomendar y justificar el stack para un SaaS real multi-tenant con auth, datos por clínica, odontograma interactivo, reserva online pública. Evaluar: (a) Next.js full-stack + Postgres, (b) Astro estático demo con estado local (como proyectos previos del orquestador), (c) otra opción. Considerar que Bryan quiere mostrarlo a clientes reales que ya pagan por CIMAOS y quieren cambiarse → un MVP funcional con datos reales pesa más que una maqueta. PERO también considerar costo de desarrollo y tiempo.
   - **Alcance del MVP**: validar/ajustar el alcance propuesto en PRODUCT.md (los 9 módulos del núcleo) — recomendar qué entra en v1 y qué queda para v2.
   - **Decisiones técnicas clave** (responder las preguntas del PRODUCT.md): odontograma SVG interactivo, reserva online embebida, WhatsApp (solo "dejar listo el mensaje" vs API), pasarela de pagos (registro de cobros vs Transbank/MercadoPago/Stripe), migración asistida CSV.
   - **Modelo de datos preliminar**: entidades (clínica/tenant, profesional, paciente, cita, odontograma, presupuesto, cobro, prestación/arancel, usuario/rol, recordatorio).
   - **Riesgos y supuestos**.
3. Escribir el resultado en `openspec/changes/nexodent/exploration.md` (y cualquier otro artefacto que el flujo pida).

## ⛔ REGLAS ANTI-BLOQUEO

1. Si algo falla tras 2 intentos, documenta y continúa con la siguiente tarea.
2. Todo curl con `--max-time 25` (si necesitas consultar la web de competencia, puedes hacerlo — están verificados accesibles).
3. NUNCA esperes aprobación humana DENTRO de la fase — ejecuta init + explore completos.
4. Al terminar las tareas de esta fase, **DETENTE**: escribe el reporte y NO avances a propose.

## REGLAS CRÍTICAS

- NO toques fuera de este directorio.
- NO modifiques PRODUCT.md ni DESIGN.md sin marcarlo como propuesta para el orquestador.
- NO implementes código de la app en esta fase (solo artefactos openspec + investigación).
- El reporte debe permitir a Bryan decidir el stack en la pausa.

## Verificación con evidencia

1. `openspec/config.yaml` existe y es válido.
2. `openspec/changes/nexodent/exploration.md` existe con: análisis competitivo, decisión de stack recomendada (con justificación y costos estimados), alcance MVP v1/v2, decisiones técnicas, modelo de datos, riesgos.
3. Resumen en el reporte final.

## Reporte final

Escribe `REPORTE-CODEX-1.md` en la raíz con: qué se investigó, la decisión de stack recomendada (con pros/contras y estimación de esfuerzo), alcance MVP recomendado, y las preguntas que el orquestador debe validar con Bryan en la pausa.
