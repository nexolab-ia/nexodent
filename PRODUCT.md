# PRODUCT.md — NexoDent (SaaS dental)

Software de gestión para clínicas dentales — competencia directa de CIMAOS (cimaos.com) y Dentalink. Bryan tiene clientes que usan CIMAOS y quieren cambiarse. Diferenciación: diseño moderno (NO "como ya"), precio transparente, IA proactiva.

## Posicionamiento

- **Nombre**: NexoDent — "El sistema que ordena y hace crecer tu clínica dental"
- **Mercado**: Chile primero (clientes actuales de Bryan), luego LATAM (MX, CO, ES)
- **Modelo**: SaaS por suscripción, precios por profesional (como CIMAOS), transparentes, sin contratos
- **Promesa**: Agenda, ficha clínica, presupuestos, cobros y reportes en un solo lugar — con IA que avisa y sugiere, no solo reporta

## Referencia de precios competencia (CIMAOS, verificado 2026-09)

- 1 profesional: $17.850 CLP/mes (IVA incl.)
- Profesional adicional: $7.500 CLP c/u (IVA incl.)
- Asistentes: ilimitados, sin costo
- Semestral: 5 meses pagando 6 (1 gratis) · Anual: 10 pagando 12 (2 gratis)
- 7 días gratis sin tarjeta · cancelar cuando quieras · soporte WhatsApp humano

NexoDent debe ser **igual de transparente** en precios y ofrecer al menos el mismo esquema (o mejor: incluir más módulos en el plan base).

## Competencia — CIMAOS (features verificadas vía proxy, 2026-09)

**11 módulos**: agenda por box/profesional con drag, reserva online 24/7 con tu marca, ficha clínica con odontograma, presupuestos con link público, cobros con abonos parciales y cuenta corriente por paciente, reportes de recaudación, recordatorios automáticos (correo con reintentos + WhatsApp listo), aranceles precargados (305 prestaciones Colegio de Dentistas Chile), documentos clínicos autocompletados (consentimientos, órdenes), avisos al celular, app móvil iOS/Android.

**IA integrada (en desarrollo en CIMAOS)**: avisos proactivos como "Los martes 15:00-18:00 quedan vacíos — ofrece ese horario a pacientes con control pendiente", "38 pacientes sin control hace 8 meses — envía recordatorio por WhatsApp", "12 tratamientos terminados sin pago registrado — revisa antes del cierre de mes". Cada sugerencia es una propuesta que el usuario aprueba antes de ejecutar.

**Multi-país**: moneda, formato de fecha y documento de identidad por país (RUT, DNI, CC) hasta en impresos.

**Expansión**: odontología disponible; kinesiología, medicina general, psicología, nutrición "en camino".

## Competencia — Dentalink (líder LATAM, verificado 2026-09)

+15.000 clientes, +12M pacientes, +45M citas/año, +20 países. Marca de Healthatom (Santiago). Features: agendamiento online, telemedicina, odontograma/periodontograma, ortodoncia, estética facial, consentimientos con firma digital, videos 3D, pagos online, créditos en línea, cobro en cuotas, control de caja/gastos, pago a odontólogos, chat interno, laboratorios, inventario, reportes Excel (50+), IA (reportes IA, Contact Center CRM/WhatsApp, Contralor IA, Simulador de Sonrisas, notas clínicas por voz). Precios: SOLO por cotización (no transparentes).

**Oportunidad para NexoDent**: Dentalink es pesado/legacy y no muestra precios; CIMAOS es simple y transparente pero su IA está en desarrollo. NexoDent = simpleza de CIMAOS + IA proactiva real + diseño moderno.

## Alcance mínimo viable (propuesta inicial — orquestador)

Núcleo odontológico (equivalente al plan Core de CIMAOS):
1. **Agenda inteligente**: citas por profesional/box, drag & drop, reagendar, horarios, reserva online 24/7 con marca
2. **Ficha clínica**: historial del paciente, odontograma visual por pieza, evoluciones, documentos
3. **Presupuestos**: armar por prestaciones (aranceles precargados), link público, estados (aprobado/rechazado)
4. **Cobros**: abonos parciales, saldo por paciente, cuenta corriente, reporte de recaudación
5. **Reportes con IA**: recaudación, deuda, producción por profesional + avisos proactivos con sugerencias (el diferenciador)
6. **Recordatorios automáticos**: correo + WhatsApp listo, avisos de reservas/cambios
7. **Multi-país**: CLP/MXN/COP/USD, formato fecha y documento por país
8. **Roles**: admin, profesional, asistente (ilimitados), paciente (portal de reserva)
9. **App-responsive**: web mobile-first (PWA), app nativa como fase 2

**Diferenciadores clave (para "no verse como ya"):**
- IA proactiva con sugerencias accionables desde el día 1 (no "en desarrollo")
- Diseño moderno, limpio, tipo fintech (no legacy clínico)
- Precio transparente + migración asistida desde CIMAOS/Dentalink
- Onboarding rápido: "primera semana = ordena, primer mes = mide, después crece"

## Preguntas para la fase explore (que Codex debe investigar/resolver)

- ¿Qué stack para un SaaS real con auth, multi-tenant, datos por clínica? (Next.js + API + Postgres vs Astro estático demo vs otro)
- ¿Odontograma: implementación visual interactiva (SVG de piezas dentales)?
- ¿Reserva online pública: página embebida con marca del cliente?
- ¿Integración WhatsApp: solo "dejar listo el mensaje" (como CIMAOS) o API real?
- ¿Pagos: solo registro de cobros, o integración con pasarela (Transbank, MercadoPago, Stripe)?
- ¿Migración asistida: importación CSV desde CIMAOS/Dentalink?

## Investigación de mercado adicional (orquestador, 2026-09-01 — Reddit/foros/comparativas)

### Stack validado por el mercado (múltiples fuentes 2026)
- **MakerKit (equipo que shipea SaaS)**: "El stack de producción SaaS 2026 = Next.js 16 + React 19 + Supabase (Postgres) + Drizzle ORM + Better Auth + Stripe + Tailwind 4 + Shadcn UI + Turborepo". Cada elección defendida contra la alternativa.
- **Reddit (r/SaaS, r/nextjs, r/selfhosted)**: Coolify + VPS propio = "experiencia similar a Vercel a fracción del costo" (usuario corre varios proyectos en Hetzner ~$4/mes con Coolify). "Con Coolify puedes selfhostear Next.js en un VPS... también puedes selfhostear Supabase".
- **Auth 2026**: "Auth.js handed off active development to Better Auth" — Better Auth es el ganador self-hosted/own-your-users; Clerk es la opción managed (cara). Para datos clínicos (soberanía), Better Auth.
- **ORM 2026**: Drizzle ganó terreno ("starter kits default a Drizzle", SQL-close, edge support, 10x en benchmarks); Prisma maduro pero pesado.
- **BaaS**: Supabase = estándar Postgres open-source (RLS multi-tenant). Alternativas: Neon (serverless PG), Convex (realtime), Appwrite (self-host), PocketBase (single-binary indie). Para datos clínicos multi-tenant, Postgres + RLS manda.

### Ajuste clave vs recomendación original de Codex
Codex recomendó Vercel + Supabase Pro (US$60-120/mes). **Bryan YA tiene Coolify en su VPS** (panel.nexolabs.cloud) donde hostea otros proyectos → puede self-hostear Next.js + Postgres (o Supabase self-hosted) con costo de operación ≈ $0-10/mes extra. Reddit confirma el patrón. La recomendación final: **mismo stack (Next.js + Postgres + Drizzle + Better Auth), desplegado en el Coolify de Bryan** en vez de Vercel/Supabase Cloud.

## Decisiones de la pausa (Bryan, 2026-09-01)

- **Clínica piloto**: usar datos demo REALISTAS (clínica ficticia con pacientes, citas, odontograma, cobros realistas) — no hay clínica real aún. El pipeline de migración CSV queda listo para cuando haya exportaciones reales.
- **Dominio**: `dental.nexolabs.cloud` (NO nexodent.nexolabs.cloud).
- **Permisos**: mínimos restrictivos por defecto (principio de menor privilegio; la matriz se detalla en spec).
- **Stack aprobado**: Next.js 16 + Postgres en Coolify de Bryan + Drizzle + Better Auth + Tailwind 4 + Shadcn UI. Deploy en panel.nexolabs.cloud vía Dockerfile.

## Notas para el equipo (Codex)

- NO inventar features fuera de esta lista sin marcar la decisión para el orquestador.
- La fase actual es `explore` — investigar y documentar, no implementar.
- Los datos demo deben ser realistas (pacientes, citas, odontograma, cobros) pero ficticios.
