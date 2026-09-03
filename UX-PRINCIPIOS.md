# UX-PRINCIPIOS.md — Principios de producto y front-end para NexoDent

> Documento NORMATIVO para todos los briefs (Codex lee esto + DESIGN.md antes de implementar UI).
> Creado 2026-09-03 a partir de research de mercado: ver `docs/research-ux/competidores-frontend.md`, `docs/research-ux/tesis-saas-dental.md`, `docs/research-ux/comunidad-dolores-ux.md`.
> Regla: toda pantalla nueva DEBE cumplir los principios 1-9; el brief DEBE incluir la sección "Verificación UX" con la checklist del final.

## P1. Mobile-first real (la ventaja competitiva #1)

La competencia LATAM promete móvil pero su core es desktop; los referentes globales con app la venden como "game changer" (emergencias fuera de la clínica). NexoDent se diseña móvil-primero:

- Breakpoints: `360px` (celular), `768px` (tablet vertical — EL dispositivo del box), `1024px` (tablet horizontal/desktop pequeño), `1280px+` (desktop).
- **< 768px: navegación inferior (bottom tab bar)**, 5 tabs máx, siempre visibles: `Hoy` · `Agenda` · `Pacientes` · `Cobros` · `Perfil`. El sidebar de desktop desaparece en móvil (no colapsarlo encima: reemplazarlo por tabs).
- Targets táctiles ≥ 44×44px; espaciado entre targets ≥ 8px. Nunca hover-only (móvil no tiene hover): acción primaria siempre visible en la fila/tarjeta.
- **Agenda en tablet vertical**: filas de tiempo con hit-area amplio; citas = chips arrastrables (drag & drop) con gesto de mantener presionado; tap en chip → detalle como bottom-sheet (no modal centrado); swipe hacia un lado = acción rápida configurable (marcar asistencia / cancelar) con undo.
- Botón global sticky "＋ Nueva cita / Nuevo paciente" accesible en todo momento (1 tap desde cualquier tab).
- Prueba obligatoria en 320px, 375px y tablet vertical antes de dar por cerrado un flujo. La app DEBE operar completa en celular (leer ficha, cobrar, agendar) — no "versión lectura".

## P2. Presupuesto de clics (máx 1-2 clics en tareas diarias)

Dolor #1 del mercado: "too many clicking steps" (Dentrix/Ascend/Denticon). Definir por tarea crítica el nº de clics/taps y auditar en cada entrega:

| Tarea diaria | Presupuesto |
|---|---|
| Ver agenda del día / del box | 1 tap (tab Hoy) |
| Abrir paciente desde agenda | 1 tap |
| Registrar pago/abono | ≤ 2 taps |
| Marcar asistencia (atendió/no vino) | ≤ 2 taps |
| Crear cita (paciente existente) | ≤ 2 taps |
| Buscar paciente global | 1 tap al buscador + escritura |

- Si un flujo exige más, el brief DEBE justificarlo o rediseñarlo.
- Deshacer (undo) en vez de confirmaciones: marcar mal una asistencia se deshace con toast, no con modal "¿está seguro?".

## P3. El dinero se lee como accounting real (estilo EOB)

El segundo dolor más citado: ledgers confusos ("allocated/unallocated payments", "transfer adjustment", balances que no cuadran). Reglas:

- El ledger/estado de cuenta DEBE permitir responder en 1 mirada: ¿cuánto debe este paciente y por qué? (patrón DentiMax: ledger estilo Explanation of Benefits).
- Separar visualmente SIEMPRE: pago del paciente vs pago de aseguradora vs ajuste; cero líneas automáticas con etiquetas inventadas.
- Montos con `tabular-nums`, moneda explícita, saldo trazable hasta la línea que lo origina.
- El informe de recaudación del dashboard y el detalle del ledger usan el MISMO criterio (nunca números distintos — queja transversal de Dentrix/Ascend).

## P4. Estado siempre con color + TEXTO (nunca solo color/icono)

- Estados de cita (confirmada / pendiente / en sala / en tratamiento / cancelada / no vino) = chip con texto + color; el color nunca es el único canal (daltónicos, luz del box).
- Iconos siempre con label o tooltip (iconos ambiguos = error recurrente en estudios SUS).
- Badges de producto vivos: "Nuevo", "Beta", "En desarrollo" (micro-UX de SaaS vivo, patrón CIMAOS/CareStack).

## P5. Vocabulario del dentista 1:1

Usar la terminología real del dominio; prohibido inventar o usar jerga de ingeniero:

- Sí: cita, box / sillón, paciente, prestación, odontograma, evolución, plan de tratamiento / presupuesto, abono, saldo, recaudación, no-show / inasistencia, aseguradora / convenio.
- No: "entities", "items", "transfer adjustment", "task", "records" sueltos sin contexto clínico.
- El odontograma usa la nomenclatura FDI (11-48); los códigos de prestación en `font-mono`.

## P6. UI viva y moderna (nada de "Windows XP")

Quejas reales: "looks old", "no evoluciona", "archaic GUI" — la UI es factor de compra. Reglas:

- Jerarquía densa de datos pero con aire: surface cards, radius 14px, sombras suaves (ya en DESIGN.md).
- Estados de carga = skeleton loaders (nunca spinners gigantes ni pantalla en blanco).
- Empty states útiles: primera vez sin citas → mostrar CTA + ejemplo (nunca tabla vacía muda).
- Focus visible SIEMPRE (teclado); animaciones ≤ 200ms; respetar `prefers-reduced-motion`.
- Errores inline con mensaje accionable, no solo borde rojo.

## P7. Dashboard = "el día de hoy" + avisos accionables

- Home del producto (tab `Hoy` en móvil): próxima cita del box, pacientes en sala, recaudación del día, no-shows y 3-5 avisos IA con deep-link de 1 tap ("Ver agenda", "Ver cobros").
- KPIs numéricos con display bold + `tabular-nums` (ver DESIGN.md).
- La IA se muestra funcionando (avisos concretos con acción), nunca como feature abstracta.

## P8. Reportes consistentes y exportables

- Mismo criterio → mismo número en dashboard, informe y exportación (regla anti-Dentrix).
- Export CSV/PDF de toda tabla de datos; fechas en formato local del país de la clínica (DD-MM-AAAA CL/MX/CO) con ISO en API.

## P9. Microcopy de clínica (sin voseo, tuteo neutro)

- CTA y acciones en imperativo tuteo: "Registra", "Agenda", "Cobra" (NUNCA "Registrá", "Agendá", voseo — regla del proyecto).
- Mensajes del sistema en voz de la clínica: "Marcaste la cita como no vino — puedes reagendar o cobrar penalidad".
- Avisos IA con verbo de acción + beneficio: "Los martes 15-18 quedan vacíos → Ofrece ese horario a pacientes en espera".

## Anti-patrones UX (prohibido — todos documentados en research)

- ❌ Flujos de >2 clics sin justificación (P2) — Dentrix/Denticon
- ❌ UI "vieja": tablas densas sin jerarquía, formularios kilométricos, grises planos — Eaglesoft/Denticon/Salud EDR
- ❌ Ledger con líneas automáticas confusas o etiquetas inventadas — CareStack/Open Dental
- ❌ Reportes que no cuadran entre sí — Dentrix/Ascend
- ❌ Icono o color como único canal de estado — Salud EDR
- ❌ Funciones "prometidas" sin estado visible (usar badges: Beta/En desarrollo) — CareStack
- ❌ Ocultar el costo real (add-ons sorpresa); el plan base DEBE incluir recordatorios y pagos online
- ❌ Hover-only, modales centrados en móvil, bottom-sheet en su lugar
- ❌ Modo claro como afterthought: ambos modos AA desde el día 1 (DESIGN.md)

## Verificación UX (sección obligatoria en cada brief de UI)

Checklist que el gatekeeper comprueba antes de aceptar una entrega con UI:

1. ¿Se ve y opera bien en 320px, 375px y tablet vertical 768px?
2. ¿Targets táctiles ≥ 44px y sin hover-only en las acciones primarias?
3. ¿Tarea crítica ≤ 2 clics/taps? (enumerar tarea→clics)
4. ¿Contraste AA en dark y light?
5. ¿Estados con texto+color, iconos con label?
6. ¿Montos con tabular-nums y moneda explícita?
7. ¿Terminología del dentista, sin jerga interna?
8. ¿Empty states con CTA útil en vistas nuevas?
9. ¿Skeleton loaders y errores inline accionables?
10. ¿`prefers-reduced-motion` respetado y animaciones ≤ 200ms?
11. ¿Sin voseo en todo el texto visible?
12. ¿Móvil = funcionalidad completa, no solo lectura?

Prueba SUS ligera (opcional pero recomendada en flujos grandes): 5 usuarios, objetivo ≥ 68, meta 80+.

## Mapa módulo → patrón móvil

- **Agenda**: tablet vertical grid por box; celular = lista del día por profesional + vista semana compacta; drag en tablet, tap+menú en celular.
- **Ficha paciente**: header pegajoso (nombre, saldo, estado) + pestañas grandes touch (Evoluciones · Odontograma · Cobros · Documentos); odontograma con zoom/pan en táctil.
- **Cobros / ledger**: tabla mobile-first: saldo arriba, abonos como timeline; registrar pago = bottom-sheet con monto rápido (montos frecuentes).
- **Presupuestos**: lista con total y estado; compartir link público = 1 tap; editor de prestaciones optimizado para búsqueda (typeahead).
- **Dashboard / Hoy**: tarjetas KPI + avisos con deep-links; pull-to-refresh.
- **Reportes**: KPI + gráficos simples SVG; export CSV/PDF; rangos de fecha con presets (Hoy/7 días/Mes).
