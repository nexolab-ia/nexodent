# Exploración: NexoDent

> **Decisión recomendada:** construir un MVP funcional multi-tenant con **Next.js + TypeScript + Postgres administrado en Supabase**, no una maqueta local. Limitar v1 a los flujos que permiten migrar una clínica y operar agenda, ficha, presupuesto y cobro; dejar automatización de WhatsApp, pasarela de pagos, multi-país completo y analítica avanzada para v2.

Investigación realizada el **2 de septiembre de 2026**. Los costos y plazos son estimaciones para decidir alcance, no cotizaciones comerciales.

## Estado actual

- El repositorio contiene descubrimiento de producto, identidad visual y configuración OpenSpec; todavía no existe una aplicación, un modelo de datos ni herramientas de prueba.
- `PRODUCT.md` define nueve capacidades iniciales y Chile como primer mercado, pero aún no fija stack ni el límite entre v1 y v2.
- `DESIGN.md` fija la dirección visual para una fase posterior; no condiciona la arquitectura salvo por exigir una interfaz rica, responsive y un odontograma interactivo.
- El encargo no es una demo desechable: Bryan tiene clientes reales que hoy usan CIMAOS y evalúan migrar. Por eso, persistencia, aislamiento entre clínicas, importación y trazabilidad son requisitos de entrada.

## Áreas afectadas

- `BRIEF-CODEX-1.md` — define la pausa obligatoria después de esta exploración y las decisiones que Bryan debe validar.
- `PRODUCT.md` — aporta posicionamiento, competencia, alcance inicial y preguntas técnicas; no se modifica en esta fase.
- `DESIGN.md` — será autoritativo en diseño posterior; no se modifica en esta fase.
- `openspec/config.yaml` — confirma que no hay stack ni capacidad de pruebas configurados todavía.
- `openspec/changes/nexodent/exploration.md` — registra la recomendación y sus supuestos.

## Evidencia competitiva

### CIMAOS

CIMAOS publica **11 módulos conectados** para odontología: agenda, ficha, presupuestos, cobros, reportes/dashboard, agenda online, equipo, configuración, comunicación, documentos clínicos y avisos. Su agenda permite reagendar por arrastre y operar por profesional o box; la reserva pública usa una URL con marca de la clínica. Fuente oficial: [CIMAOS — Odontología](https://www.cimaos.com/odontologia), [Agenda](https://www.cimaos.com/agenda) y [Agenda online](https://www.cimaos.com/agenda-online).

Su precio público parte en **$17.850 CLP mensuales IVA incluido para un profesional**, suma $7.500 CLP por profesional adicional, incluye asistentes ilimitados y ofrece descuentos semestral/anual. Fuente oficial: [CIMAOS — Precios](https://www.cimaos.com/precios).

El matiz competitivo importante es que su WhatsApp no es automático: deja el mensaje preparado y una persona confirma el envío. La página también presenta seis agentes de IA como “próximamente”. Fuente oficial: [CIMAOS — Funcionalidades](https://www.cimaos.com/funcionalidades).

### Dentalink

Dentalink declara **más de 15.000 clínicas, más de 12 millones de pacientes únicos, más de 45 millones de citas al año y presencia en más de 20 países**. Fuente oficial: [Dentalink — Sobre nosotros](https://www.softwaredentalink.com/es/sobre-nosotros).

Su cobertura es considerablemente más amplia: odontograma y periodontograma, ortodoncia, firma y consentimientos, pagos y créditos, caja/gastos, remuneraciones, laboratorios, inventario, más de 50 reportes y un conjunto de funciones de IA (análisis de RX, reportes, contact center, resumen clínico, contralor, simulador de sonrisa y notas por voz). La venta conduce a una cotización personalizada en vez de publicar un precio directo. Fuente oficial: [Dentalink — Funcionalidades](https://www.softwaredentalink.com/funcionalidades).

### Oportunidad defendible para NexoDent

NexoDent no debería competir en cantidad de funciones con Dentalink durante v1. La entrada defendible es:

1. **Migración y puesta en marcha medibles:** una clínica puede importar pacientes, agenda y aranceles, validar errores y comenzar a operar sin doble digitación.
2. **Núcleo conectado, simple y rápido:** agenda → ficha → presupuesto → abono → saldo, con menos superficie que Dentalink.
3. **Transparencia comercial:** precio público y salida/exportación clara de datos.
4. **IA operativa, no clínica:** sugerencias auditables sobre huecos de agenda, controles pendientes y cobros, siempre con aprobación humana. No diagnosticar ni recomendar tratamientos en v1.
5. **Diseño moderno como acelerador, no sustituto del producto:** la apariencia facilita adopción, pero aislamiento, integridad y trazabilidad ganan la migración.

## Enfoques evaluados

| Enfoque | Ventajas | Desventajas | Esfuerzo estimado |
|---|---|---|---|
| **1. Next.js full-stack + Postgres administrado** | Un solo lenguaje; React es adecuado para agenda y SVG interactivo; SSR para páginas públicas; Route Handlers para webhooks/API; ecosistema amplio. Next.js se presenta oficialmente como framework full-stack. | Sus capacidades backend son un BFF, no sustituyen por sí solas una arquitectura de dominio; hay que imponer límites, autorización por operación, trabajos asíncronos y pruebas de aislamiento. | **14–18 semanas** con 2 desarrolladores full-time + diseño/QA parcial; **24–32 semanas** para una persona. |
| **2. Astro estático + estado local** | Demo visual rápida, hosting casi gratuito, excelente para landing y prototipos. | No demuestra auth, aislamiento, concurrencia, migración ni persistencia real. Astro prerenderiza por defecto; al agregar SSR y backend deja de ser la “demo estática” que reduce esfuerzo. | **3–5 semanas** para una maqueta convincente, pero luego exige rehacer gran parte del núcleo para producción. |
| **3. Laravel + React/Inertia + Postgres** | Monolito maduro, auth, autorización, colas, validación y transacciones cohesionadas; el starter oficial incluye React/TypeScript e Inertia. Buen candidato si el equipo domina PHP. | Dos ecosistemas de ejecución, despliegue/operación más tradicional y menor alineación si el equipo trabaja principalmente en TypeScript; no elimina el trabajo de multi-tenancy. | **16–21 semanas** con equipo competente en Laravel; puede superar Next.js si el equipo aprende PHP durante el proyecto. |

Referencias técnicas: [Next.js — documentación](https://nextjs.org/docs), [Next.js — Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend), [Astro — renderizado bajo demanda](https://docs.astro.build/en/guides/on-demand-rendering/), [Laravel — frontend con Inertia](https://laravel.com/framework/docs/12.x/frontend) y [Laravel — starter kits](https://laravel.com/starter-kits).

## Recomendación de stack

### Arquitectura propuesta

- **Aplicación:** Next.js App Router + TypeScript, desplegada inicialmente en Vercel.
- **Datos, autenticación y archivos:** Supabase Pro (Postgres, Auth y Storage).
- **Tenancy:** base compartida con `clinic_id` obligatorio en toda tabla perteneciente a una clínica, membresías explícitas y Row Level Security (RLS) por operación. Supabase recomienda combinar Auth y RLS, revocar privilegios innecesarios y probar políticas allow/deny; no basta con agregar una política genérica. Fuente oficial: [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
- **Límites de aplicación:** módulos por dominio dentro de un monolito modular (`identity`, `clinics`, `patients`, `scheduling`, `clinical`, `estimates`, `billing`, `notifications`, `insights`, `imports`). Server Actions solo para comandos internos autenticados; Route Handlers para reserva pública, webhooks e integraciones. Cada operación vuelve a verificar autenticación, membresía y rol; la documentación de Next.js advierte que las Server Functions son alcanzables por POST directo. Fuente: [Next.js — mutación de datos](https://nextjs.org/docs/app/getting-started/mutating-data).
- **Trabajos asíncronos:** cola administrada o worker separado para correos, importaciones y generación de sugerencias; no ejecutar lotes largos dentro de una función web.
- **Observabilidad:** errores, auditoría de accesos/cambios sensibles, métricas de reserva e importación; copias diarias y restauración ensayada antes del piloto.
- **Pruebas mínimas antes del piloto:** unitarias de dominio, integración de base/RLS, contratos de importación CSV y E2E de cinco recorridos críticos.

### Costos operativos tempranos

| Concepto | Estimación mensual inicial | Nota |
|---|---:|---|
| Supabase Pro | **US$25** | Incluye un proyecto Micro, 8 GB de disco, 100.000 MAU y copias diarias con 7 días de retención según el precio publicado. [Fuente oficial](https://supabase.com/pricing). |
| Vercel Pro | **desde US$20 por asiento desarrollador** | Más consumo que exceda el crédito incluido; separar alertas y tope de gasto. [Fuente oficial](https://vercel.com/docs/plans/pro-plan). |
| Correo transaccional, monitoreo y dominio | **US$15–60** | Depende del proveedor y volumen; estimación de planificación, no cotización. |
| **Total base esperado** | **US$60–120/mes** | Antes de WhatsApp API, SMS, IA generativa, almacenamiento pesado o ambientes adicionales. |

La alternativa Laravel es válida si se confirma que el equipo tiene experiencia fuerte en PHP/Laravel; no hay evidencia de esa ventaja hoy. Astro sí puede alojar la landing, pero introducir dos aplicaciones desde el inicio no compensa su costo operativo: Next.js puede servir landing y app en el mismo despliegue.

## Alcance recomendado

### v1 — piloto vendible en Chile

1. **Identidad y clínica:** alta asistida, una o varias sedes simples, usuarios, roles `admin`, `professional`, `assistant`, membresía y auditoría.
2. **Agenda:** profesionales, boxes, horarios, vista día/semana, crear/reagendar/cancelar, estados y prevención de doble reserva.
3. **Reserva pública con marca:** URL por clínica, selección de servicio/profesional/horario, confirmación y política de cancelación; enlace compartible y embebible mediante botón o `iframe` solo si el sitio anfitrión lo requiere.
4. **Paciente y ficha clínica:** datos demográficos, contacto, antecedentes, evoluciones y adjuntos básicos.
5. **Odontograma SVG:** dentición permanente, estados y tratamientos por pieza/superficie, historial de cambios y vínculo con evoluciones/presupuestos. Periodontograma y ortodoncia quedan fuera.
6. **Aranceles y presupuestos:** catálogo editable/importable, ítems por prestación/pieza, descuentos, estados y enlace público de solo lectura con token revocable.
7. **Cobros:** registro manual de abonos, métodos de pago, saldo por presupuesto/paciente, comprobante y reporte de recaudación; sin mover dinero.
8. **Recordatorios:** correo automático y acción “abrir WhatsApp” con mensaje preparado; registro de resultado manual.
9. **Migración asistida CSV:** pacientes, aranceles y citas futuras mediante plantilla, validación previa, vista de errores, importación idempotente y reporte de conciliación.
10. **Avisos proactivos iniciales:** reglas deterministas para huecos de agenda, controles pendientes y deuda/tratamientos sin cobro; evidencia visible y aprobación humana antes de actuar.
11. **Chile primero:** CLP, zona horaria, RUT y formatos chilenos, dejando campos de país/moneda parametrizados sin prometer operación regulatoria multinacional.
12. **PWA responsive:** experiencia web móvil instalable; sin app nativa.

Este recorte conserva los nueve módulos conceptuales de `PRODUCT.md`, pero reduce “multi-país”, “IA” y “documentos” a una base verificable. El objetivo de aceptación es que una clínica piloto complete una semana operativa sin volver al sistema anterior para estos flujos.

### v2 — después de evidencia del piloto

- WhatsApp Business Platform automática con plantillas, consentimiento, opt-out, entrega y costo por mensaje.
- Pago online (primero Webpay Plus en Chile) y conciliación por webhook; luego Mercado Pago/Stripe según país.
- Multi-país real: reglas de identificación, impuestos, moneda, zona horaria, localización y documentos por mercado.
- Documentos clínicos avanzados, firma/consentimientos, periodontograma, ortodoncia.
- Caja/gastos, inventario, laboratorios y remuneración profesional.
- Analítica avanzada y modelos generativos solo tras contar con datos, evaluación, privacidad y controles; nunca recomendaciones clínicas automáticas.
- Migradores específicos por exportación de CIMAOS/Dentalink, una vez obtenidas muestras reales y autorización.
- Aplicación nativa solo si telemetría demuestra una necesidad que la PWA no cubre.

## Decisiones técnicas clave

### Odontograma

Usar **SVG propio y accesible** con un componente por pieza/superficie. Separar dibujo de estado clínico: el SVG emite acciones del dominio y la base guarda eventos/versiones, no colores ni coordenadas. Mantener diagnósticos, tratamientos planificados y realizados como conceptos distintos; registrar autor y fecha. Esto permite auditoría, impresión y evolución futura sin acoplar datos a una librería gráfica.

### Reserva pública

Ofrecer una ruta del tipo `/r/{clinicSlug}` con marca, enlace compartible y opción de `iframe`. Debe exponer solo disponibilidad calculada, nunca la agenda ni identidad de otros pacientes. Reservar un slot mediante transacción/constraint para impedir doble reserva y aplicar rate limiting, CAPTCHA adaptativo, consentimiento de tratamiento de datos y tokens revocables.

### WhatsApp

**v1: mensaje preparado** (`wa.me`) porque entrega valor inmediato sin verificación de negocio, plantillas, webhooks ni costo variable. Registrar quién lo abrió y permitir marcar el resultado, sin afirmar que fue entregado. **v2: Cloud API oficial**, con consentimiento, plantillas aprobadas, opt-out y presupuesto por mensaje; no usar automatizaciones no oficiales. CIMAOS confirma públicamente el mismo patrón manual en su versión actual: [funcionalidades](https://www.cimaos.com/funcionalidades).

### Pagos

**v1: libro de cobros, no pasarela.** Registrar abonos y devoluciones como movimientos inmutables/correctivos; no almacenar datos de tarjeta. **v2: Webpay Plus** para Chile, detrás de un adaptador de pagos e idempotencia por webhook. Transbank ofrece ambiente de integración y SDK/API antes de producción: [documentación oficial](https://transbankdevelopers.com/documentacion/como_empezar). El checkout no debe bloquear el modelo para agregar Mercado Pago o Stripe después.

### Migración asistida

Aceptar CSV mediante un pipeline `upload → mapping → validation → preview → import → reconciliation`. Guardar lote, hash del archivo, filas válidas/erróneas y claves externas; repetir el mismo lote no debe duplicar datos. Empezar con plantillas propias y muestras anonimizadas reales. No prometer importación completa de historia clínica ni adjuntos hasta conocer los formatos de exportación de cada competidor.

### IA proactiva

En v1, implementar reglas explicables y programadas, no un chatbot general: cada aviso incluye criterio, período, pacientes/citas afectados, beneficio esperado y acción propuesta. La acción requiere aprobación y genera auditoría. Los datos clínicos no se envían a un proveedor de IA sin base legal, contrato, minimización y evaluación específica.

## Modelo de datos preliminar

| Entidad | Responsabilidad y relaciones principales |
|---|---|
| `clinic` | Tenant, país, moneda, zona horaria, marca y configuración. |
| `location`, `box` | Sedes y recursos físicos de agenda; pertenecen a una clínica. |
| `user` | Identidad global autenticada; no contiene el rol de una clínica. |
| `clinic_membership` | Une usuario y clínica con rol/estado; permite pertenecer a varias clínicas sin mezclar permisos. |
| `professional` | Perfil clínico, especialidades, color y agenda; puede vincularse a un usuario. |
| `patient` | Identidad/contacto por clínica, documento normalizado, consentimiento y claves de migración. |
| `appointment` | Clínica, paciente, profesional, box, servicio, rango horario, estado, canal y versión para concurrencia. |
| `clinical_record`, `clinical_entry` | Ficha y evoluciones versionadas con autor, fecha y adjuntos; correcciones auditables. |
| `tooth_event` | Pieza/superficie, condición o procedimiento, estado clínico, autor, fecha y vínculo a evolución/presupuesto. |
| `procedure_catalog` | Prestaciones/aranceles versionados por clínica, duración y precio vigentes. |
| `estimate`, `estimate_item` | Presupuesto, versión, estado, vigencia, totales e ítems vinculados a prestación/pieza. |
| `payment` | Movimiento de cobro/devolución, método, monto, fecha, presupuesto/paciente y referencia externa futura. |
| `reminder` | Canal, plantilla, programación, estado, intento y evidencia de entrega o gestión manual. |
| `insight` | Regla, evidencia, período, estado, propuesta, aprobación/rechazo y ejecutor. |
| `import_batch`, `import_row` | Archivo, mapping, errores, claves externas, conciliación e idempotencia. |
| `audit_event` | Actor, clínica, acción, recurso, instante y metadatos mínimos no sensibles. |
| `public_token` | Enlaces revocables y con expiración para reserva/presupuesto, sin exponer identificadores internos. |

Reglas transversales: UUID; `clinic_id` explícito e indexado en toda tabla tenant; claves/constraints compuestas que impidan enlazar filas entre clínicas; tiempos en UTC y presentación según zona; importes como enteros en unidad mínima; borrado lógico solo donde corresponda; historia clínica y movimientos financieros mediante nuevas versiones/ajustes, no edición destructiva.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación inicial |
|---|---|---|
| Fuga entre tenants por consulta o política incorrecta | Crítico | RLS por operación, grants mínimos, claves compuestas, pruebas negativas entre clínicas y revisión de cada tabla/vista. |
| Tratar datos clínicos sensibles sin base/controles suficientes | Crítico | Revisión legal chilena antes del piloto, consentimiento y finalidad explícitos, minimización, cifrado, retención, exportación/borrado y contratos con proveedores. La ley chilena regula específicamente datos sensibles de salud: [BCN — Ley 19.628](https://www.bcn.cl/leychile/navegar?idNorma=141599&idParte=10528065). |
| Migración incompleta o silenciosamente incorrecta | Alto | Muestras anonimizadas, preview, idempotencia, conciliación y aceptación firmada por la clínica. |
| Doble reserva por concurrencia | Alto | Constraint/transacción en base, idempotency key y prueba de carreras. |
| Alcance de nueve módulos impide llegar al piloto | Alto | Medir v1 por cinco recorridos completos; aplazar profundidad de módulos secundarios. |
| “IA desde día 1” crea expectativas clínicas o costos variables | Alto | Reglas explicables operativas, aprobación humana, sin decisiones clínicas; presupuesto y evals antes de LLM. |
| Bloqueo de proveedor o costos crecientes | Medio | Postgres estándar, exportación, adaptadores de correo/pagos/IA, alertas de consumo y plan de restauración. |
| Supabase Pro básico no satisface por sí solo todos los requisitos de cumplimiento | Alto | Due diligence de región, DPA, retención, backups/restauración, acceso y plan superior/otro hosting si el análisis legal lo exige. El precio Team y capacidades de cumplimiento son distintos al plan Pro: [Supabase — precios](https://supabase.com/pricing). |

## Supuestos que deben validarse

1. Bryan prioriza un piloto funcional sobre una demo visual desechable.
2. Habrá al menos una clínica piloto que entregue exportaciones anonimizadas de CIMAOS o Dentalink y participe en pruebas.
3. v1 operará solo en Chile y no emitirá documentos tributarios ni procesará tarjetas.
4. Los avisos de IA de v1 serán operativos y deterministas; no harán diagnóstico ni recomendación clínica.
5. El equipo puede trabajar productivamente en TypeScript/React; si su fortaleza comprobada es Laravel, la decisión de stack debe reabrirse.
6. Antes de almacenar datos reales se realizará revisión legal, de seguridad y contractual; esta exploración no sustituye asesoría jurídica.

## Preguntas para la pausa con Bryan

1. ¿Aprueba priorizar **MVP funcional en Next.js + Supabase/Postgres** sobre maqueta Astro?
2. ¿Acepta que v1 sea **Chile primero**, dejando multi-país operativo para v2 aunque el modelo nazca parametrizado?
3. ¿Acepta **WhatsApp con mensaje preparado** y **cobro registrado sin pasarela** en v1?
4. ¿Acepta definir “IA desde día 1” como tres avisos operativos explicables, sin IA clínica ni automatización sin aprobación?
5. ¿Qué clínica piloto y qué exportaciones reales estarán disponibles para validar migración y recorridos?
6. ¿Existe experiencia fuerte del equipo en PHP/Laravel que pueda cambiar la recomendación de stack?

## Recomendación

Adoptar el enfoque 1 como **monolito modular Next.js + Supabase/Postgres**, con aislamiento multi-tenant probado en base de datos y límites claros para no convertir Next.js en un backend improvisado. Es el mejor equilibrio entre interfaz rica, velocidad de entrega y camino a producción para clientes reales. Astro queda reservado, si hiciera falta, para prototipos aislados; Laravel queda como alternativa condicionada a experiencia real del equipo.

No aprobar todavía los nueve módulos con profundidad equivalente. Aprobar los recorridos completos de v1 y usar el piloto para decidir qué profundidad entra en v2.

## Listo para propuesta

**No todavía.** El brief exige una pausa después de `explore`. El orquestador debe presentar a Bryan las seis preguntas anteriores y ofrecer la fase `sdd-research` para profundizar la evidencia seleccionada. Solo después de confirmar stack, límites v1/v2, WhatsApp/pagos, definición de IA y clínica piloto debería iniciarse `sdd-propose`.
