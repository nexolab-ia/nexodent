# Comunidad y reviews — Dolores y expectativas UX de usuarios de software dental

> Research 2026-09-03 — Fuentes: RevUp Dental "Best Dental Practice Management Software (Dentist-Reviewed)" (agrega Capterra/G2/Reddit r/Dentistry/DentalTown + TaskSignal; 10 plataformas: Dentrix, Eaglesoft, Open Dental, Ascend, Denticon, Curve, CareStack, DentiMax, tab32, Oryx), vía proxy residencial DataImpulse (IP US); + estudios académicos (ver tesis-saas-dental.md). PullPush (Reddit) en rate-limit durante la investigación — no usable.

## Top dolores UX citados (con fuente)

1. **Demasiados clics para todo** — Kristen P. (Dentrix): "Too many clicking steps". r/Dentistry sobre Dentrix Ascend: "takes an annoyingly large amount of clicks to do anything". David F. (Denticon): "Almost everything you do requires an extra button to push and takes longer than the other two softwares".
2. **UI vieja / sin evolución** — Duc T. (Eaglesoft): "Eaglesoft today still looks like Eaglesoft back in 2015... you'd think there would have been improvements in the graphical interface". James K. (CIO): "Really developing and fixing Eaglesoft stopped 15 years ago; changes today are mainly cosmetic". Dr. C. sobre Denticon: "Don't be fooled by the archaic GUI interface".
3. **Ledger / cobros difíciles de leer** — r/Dentistry (Open Dental): "Only thing that sucks is the allocated/unallocated/hidden payments in the ledger". CareStack (Capterra): "The ledger and insurance posting is not as user friendly... difficult to understand where balances are coming from" (además: su "transfer adjustment" automático confunde al staff). Curve: "Partial insurance payments can't be entered directly".
4. **Informes inconsistentes/confusos** — Capterra 234 reviews de Ascend: 77% de quienes comentaron reporting lo ven "confusing, inconsistent, or lacking". Dentista sobre Curve: "hated their reporting side... totally gave up".
5. **Curva de aprendizaje y entrenamiento costoso** — Dr. Josh Berd (multi-location): "Dentrix's training model makes scaling nearly impossible. It took too long for staff to get comfortable". Contraste: CareStack onboarding elogiado, pero setup pesado.
6. **Soporte malo/lento (legacy)** — Paul T. (Dentrix, 4 llamadas para un update). Denticon: "no phone number... submit a help ticket and hope for the best". Li Yang L. (CareStack, abril 2026): bugs sin resolver por meses.
7. **Downtime en la nube = clínica paralizada** — r/Dentistry (Curve 2025-26): "Curve is just down and completely inaccessible for hours, sometimes six plus hours"; "Curve is a freaking NIGHTMARE. X-rays never work. The system is slow".
8. **Costo total oculto** (server + soporte + módulos + updates) — Douglas D.: "keeping up with the software — cost, training, maintenance, hardware, upgrades — had become its own primary feature". Reminders/online scheduling/texting como add-on pagado en Dentrix/Open Dental frustran.
9. **Verbosidad/terminología confusa** — CareStack (Capterra): "The verbiage used is somewhat tedious and not always intuitive"; etiqueta "transfer adjustment" que no es ajuste ni transferencia.
10. **Falta de app móvil** — Tabla comparativa: la mayoría (Dentrix, Eaglesoft, Open Dental, Ascend, CareStack, DentiMax) NO tiene mobile app o es "Limited". Los que tienen (Curve, tab32, Oryx) la mencionan como game changer.
11. **Pacientes quieren pagar online** — Andrew D. (Curve): "the patient portal is almost useless, because patients want the ability to pay their bills online".
12. **Integraciones frágiles con imágenes/rayos X** — Abrahim C. (CareStack): "Separated radiograph software... need constant refreshing to obtain images". Eaglesoft propietario: migrar imágenes = "hardest and most expensive part".
13. **Reportes que no cuadran / números distintos** (Dentrix legacy y Ascend): misma crítica en varias plataformas.
14. **Funciones prometidas que no existen** — director de operaciones (G2, CareStack 2026): "features we were told we would have were not available upon transition".

## Top elogios / expectativas (lo que los dentistas celebran)

1. **Cloud + acceso desde cualquier dispositivo** — Joshua F. (Denticon): "cloud based access, ease of viewing records, schedules, reports, etc. from any device, including my phone". Robert S.: "ability to handle a patient question, view history, or look at an x-ray after hours from home". Dentrix Ascend: remote access = 100% sentimiento positivo (Capterra).
2. **Mobile app que resuelve emergencias** — r/Dentistry (Curve, 9 dentistas/25 staff): "The mobile app just came out and has made covering emergencies a game changer".
3. **"Intuitivo y fácil de aprender"** repetido como el factor #1 de retención: Eaglesoft ("most user friendly and easiest to learn of all the dental software I have tried"), Open Dental ("Easy to use. Very intuitive and robust"), CareStack ("everything can be completed within a few clicks"), DentiMax ("very user friendly").
4. **Todo en uno / un solo login** — Evan F. (CareStack): "consolidate several systems: charting, scheduling, e-filing insurance claims, patient texting and review management, patient forms, analytics, e-prescribing... all-in pricing rather than being nickled-and-dimed".
5. **Texto/recordatorios y comunicación con paciente integrados** — elogio recurrente a CurveGRO y CareStack texting; add-on pagado en Dentrix/Open Dental = dolor.
6. **Ledger claro estilo EOB** — DentiMax ("Unlike other programs, Dentimax is real accounting... easily look down the ledger and see exactly which item the money is owing from") — patrón a copiar.
7. **Soporte que escucha e implementa** — Ryan G. (Curve): "They actually listen to suggestions and implement them"; Open Dental soporte proactivo (te llaman de vuelta). Staff con background dental (DentiMax).
8. **Precio plano por clínica sin penalizar por usuario** (Open Dental/DentiMax) vs per-operatory/per-user (Dentrix/Eaglesoft/CareStack) — el mercado valora transparencia.
9. **UI "sexy" hecha por tech company** — cirujano oral en r/Dentistry sobre CareStack: "most 'sexy' of the dental software... feels like it was intentionally made by a tech company" (y aun así critican su billing).

## Requisitos UX derivados para NexoDent (priorizados)

### P0 (diferenciadores que el mercado clama)
1. **Mobile-first real**: toda la operación usable en celular/tablet; agenda touch en el box; acceso a ficha/rayos/agenda "desde el celular en casa" como claim (vs. la mayoría que NO tiene app).
2. **Flujo de 1-2 clics** en las 5 tareas diarias: crear cita, ver agenda del día, abrir paciente, registrar pago, marcar asistencia. Auditar clics por tarea en cada brief.
3. **Ledger/finanzas claras estilo "accounting real"**: separar visualmente pagos de paciente vs aseguradora, sin líneas automáticas confusas ("transfer adjustment" de CareStack = anti-patrón). Dashboard de cobranza pendiente.
4. **UI moderna y coherente** (nada de "Windows XP"): dark mode incluido; tipografía de datos con tabular-nums; estado visual de la cita (confirmada/en sala/en tratamiento) con color + texto, nunca solo icono.
5. **Recordatorios y comunicación con paciente integrados** (WhatsApp/email/SMS) como parte del plan, NO como add-on: reducción de no-shows es el beneficio #1 que los dentistas compran.
6. **Terminología del dominio 1:1** y microcopy en lenguaje de clínica (nada de "transfer adjustment" inventado).

### P1 (higiene competitiva)
7. **Onboarding rápido + modo demo con datos realistas**: la curva de aprendizaje es el miedo #1 para cambiar de software (Dentrix/Eaglesoft lo cobran caro; NexoDent puede regalarlo).
8. **Reporting consistente**: que el mismo criterio dé el mismo número en dashboard e informes (queja transversal de Dentrix/Ascend); exportaciones (CSV/PDF).
9. **Soporte humano con contexto**: chat interno con historial; evitar el "ticket ciego".
10. **Pagos online de pacientes** (portal del paciente con pago por link/Webpay) — dolor explícito de Curve.
11. **Disponibilidad/estado del sistema visible** y plan de tolerancia a caídas (nube con respaldo local o modo lectura offline para la agenda del día).
12. **Precio por clínica/location claro y visible**, sin penalizar por profesional (modelo Open Dental/DentiMax), con trial sin tarjeta.
13. **Integraciones hacia fuera con API pública** desde el día 1 (Ascend criticado por tardar años en publicar API).
14. **Seguridad y respaldo automático como argumento de venta** (Denticon: "no backups, no ransomware worries").
