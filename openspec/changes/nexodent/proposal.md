# Propuesta: MVP piloto de NexoDent

## Resumen ejecutivo

NexoDent será un SaaS dental chileno que integra agenda, ficha, presupuestos y cobros. Se diferenciará por avisos operativos explicables, diseño moderno, precio transparente y migración asistida desde CIMAOS/Dentalink.

## Intento

Permitir que una clínica piloto migre datos reales y opere una semana completa sin volver a su sistema anterior para los flujos incluidos.

## Alcance

### Incluido en v1

- Clínicas, sedes, membresías, roles y auditoría.
- Agenda por profesional/box sin doble reserva y reserva pública con marca.
- Ficha, evoluciones, adjuntos y odontograma SVG versionado.
- Aranceles, presupuestos versionados, abonos manuales, saldos y recaudación.
- Correo, WhatsApp preparado y avisos operativos aprobables.
- Importación CSV de pacientes, aranceles y citas futuras; PWA responsive; CLP, RUT y zona chilena.

### Fuera de alcance

- Pagos online, WhatsApp automático, IA clínica/generativa, multi-país operativo, app nativa, periodontograma, ortodoncia e inventario.

## Capacidades

### Capacidades nuevas

- `tenant-identity`, `scheduling`, `public-booking`, `clinical-records`, `odontogram`, `estimates`, `manual-billing`, `notifications`, `operational-insights`, `csv-migration`, `chile-pwa`: comportamiento verificable del alcance v1.

### Capacidades modificadas

Ninguna; `openspec/specs/` no contiene especificaciones vigentes.

## Solución propuesta

Monolito modular con Next.js 16 App Router, React 19 y TypeScript; Postgres autohospedado en Coolify con `clinic_id`, RLS y restricciones compuestas; Drizzle ORM y Better Auth. Tailwind 4 y Shadcn UI implementarán `DESIGN.md`. Un Dockerfile desplegará en `panel.nexolabs.cloud`; workers procesarán correo e importaciones.

## Decisiones de producto

Chile primero; cobros sin mover dinero; WhatsApp asistido; reglas operativas, nunca diagnóstico, con aprobación y auditoría; migración validada e idempotente; presupuesto enlazable mediante token revocable.

## Decisiones no resueltas

- Confirmar clínica piloto, muestras anonimizadas y subdominio.
- Especificar matriz de permisos, retención legal, cancelación de reservas y límites de archivos; recomendar mínimos restrictivos revisables.

## Áreas afectadas

| Área | Impacto |
|---|---|
| `app/`, `db/`, `workers/` | Nuevas |
| Coolify/Postgres | Nuevos servicios |

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Fuga entre clínicas | RLS, claves compuestas y pruebas negativas |
| Datos clínicos/legales | Revisión chilena, cifrado, auditoría y backups ensayados |
| Migración incorrecta | Preview, idempotencia y conciliación aceptada |
| IA malinterpretada | Evidencia, aprobación humana y exclusión clínica |

## Plan de reversión

Detener el piloto, restaurar backup probado y exportar datos conciliados; conservar el sistema anterior hasta la aceptación.

## Dependencias

- VPS/Coolify, Postgres, correo transaccional y exportaciones autorizadas del piloto.

## Criterios de éxito

- [ ] Una clínica migra datos reales conciliados y completa una semana con agenda, ficha, odontograma, presupuestos y cobros en producción.
- [ ] No hay dobles reservas ni accesos cruzados; restauración y auditoría se verifican antes del piloto.
- [ ] Los avisos muestran evidencia y nunca actúan sin aprobación.
