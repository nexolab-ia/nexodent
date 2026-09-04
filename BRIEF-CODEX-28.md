# BRIEF-CODEX-28 — Página Plan completa (suscripción + créditos IA + uso) con datos de ejemplo

## Contexto (decisión de Bryan, 2026-09-03, 3 capturas de referencia)

Bryan aprobó implementar la página **Plan** (`/settings/plan`, hoy placeholder "En desarrollo") con las **3 pestañas de las capturas**: **Plan** (suscripción), **IA** (créditos) y **Uso** (consumo). **NO hay pasarela de pago todavía** — todo va con **datos de ejemplo** (mock en memoria/estado local del cliente), pero la UI, la lógica de precios/cálculo y los estados quedan **implementados completos y funcionales** para cuando se conecte la pasarela real (MercadoPago/transferencia). El objetivo: que Bryan pueda *recorrer el flujo completo* con datos ficticios.

Capturas de referencia (leer antes de codear):
- `/home/hermes/.hermes/image_cache/img_01c1e535a281.jpg` — pestaña Plan
- `/home/hermes/.hermes/image_cache/img_198f42e01e88.jpg` — pestaña IA
- `/home/hermes/.hermes/image_cache/img_e70432aeb78a.jpg` — pestaña Uso

## Estado actual (verificado)
- `/settings/plan` hoy lo sirve `app/(app)/settings/[seccion]/page.tsx` (placeholder "En desarrollo"). El menú lateral ya tiene el ítem Plan → `/settings/plan` (SETTINGS_SECTIONS, key `plan`, href `/settings/plan`, icon card).
- Patrón de página real existente: `app/(app)/settings/organizacion/page.tsx` (server component con `requestTenantContext()` + `runAsTenant`) + `actions.ts` (server actions). `app/globals.css` con tokens DESIGN.md (`--bg #0B1120`, `--surface #111A2E`, `--surface-2 #1A2740`, `--ink`, `--muted #94A3B8`, `--accent #22D3EE`, `--success #34D399`, `--border`, `--radius 14px`) y clases reutilizables `.settings-card`, `.settings-scaffold`, `.settings-badge`, `.muted`, `.button`, etc.
- NO existe tabla de suscripciones/pagos en BD (verificado: migrations hasta 0010, no hay `subscriptions` ni `payments`). Por eso esta fase es **mock cliente** — no tocar BD ni crear migraciones.
- App: Next 16 App Router, React 19, CSS puro en globals.css (sin Tailwind). Tuteo obligatorio. Dark mode por defecto.

## Diseño — Estructura general

### Arquitectura (decisión de arquitectura para esta fase mock)
- **Página server**: `app/(app)/settings/plan/page.tsx` — resuelve tenant (como organizacion) solo para validar sesión/org y obtener `organizationId`; el **contenido de suscripción es mock**, no viene de BD.
- **Estado mock**: un **hook `useBillingDemo`** en `components/billing/use-billing-demo.ts` que mantiene en **estado local (useState)** el "estado de cuenta" ficticio inicial y expone acciones (renovar, cambiar período, recargar, simular pago). Estado inicial (de las capturas): plan activo hasta **09/10/2026**, **1 profesional**, asistentes ilimitados, **200 créditos IA** disponibles, 0 consumido, sin movimientos, sin pagos. Los **cambios NO persisten** entre recargas (mock puro, sin localStorage — así se nota que es demo y al recargar vuelve el estado inicial). Comentar en el código: "// MOCK — reemplazar por API real de suscripción cuando exista pasarela".
- **Tabs**: cliente, con estado local (pestaña activa) — **no** crear rutas hijas `/settings/plan/ia` etc. Las 3 pestañas viven en UNA página con tabs horizontales (patrón captura: ícono + label + subrayado azul en activa).

### Componentes nuevos (todos en `components/billing/`)
1. `plan-page.tsx` — contenedor cliente: heading + tabs + contenido según tab activa. Props: `organizationName` (para mostrar contexto si aplica).
2. `billing-tabs.tsx` — los 3 tabs (Plan/IA/Uso) con íconos SVG línea.
3. `plan-tab.tsx` — sección suscripción (ver T2).
4. `ia-tab.tsx` — sección créditos IA (ver T3).
5. `uso-tab.tsx` — sección uso (ver T4).
6. `use-billing-demo.ts` — hook de estado mock + constantes de precios.
7. CSS en `app/globals.css` (bloque `/* Billing */`), reutilizando tokens.

### T1 — Shell de la página + tabs
- Heading igual al patrón settings: `<h1>Plan</h1>` + `<p class="muted">Administra tu suscripción y métodos de pago.</p>` (copy captura).
- Tabs horizontales bajo el heading: **Plan** (ícono estrella/star), **IA** (ícono sparkle/chispas), **Uso** (ícono gráfico/activity). Tab activa: color `--accent` o texto `--ink` + subrayado 2px accent; inactivas: `--muted`. Estilo pill/tab row con borde inferior `--border`.
- Contenido cambia por tab. Sin animaciones complejas (fade sutil opcional).

## Precios mock (constantes en use-billing-demo.ts)
Del screenshot (CLP, sin IVA mencionado — usar estos valores):
- **Base**: 1 profesional = **$17.850/mes**.
- Períodos:
  - **Mensual**: $17.850/mes. Copy: "Paga mes a mes."
  - **Semestral**: $89.250 por 6 meses (antes $107.100 → "Ahorras $17.850"). Copy: "Paga 5 meses, recibe 6." Badges: "Popular" + "Promoción".
  - **Anual**: $178.500 por 12 meses (antes $214.200 → "Ahorras $35.700"). Copy: "Paga 10 meses, recibe 12." Badge: "Promoción".
- Cálculo: semestral = 5×17.850 (descuento 1 mes); anual = 10×17.850 (descuento 2 meses).
- **Créditos IA**: 200 créditos incluidos/mes (estado inicial). Recarga: tarifa **$3,5 CLP/crédito** (constante `CREDIT_PRICE = 3.5`). Montos sugeridos: $2.000 → 571 créditos (2000/3.5=571.4→floor 571), $5.000 → 1.428 créditos (5000/3.5=1428.57→floor 1428), $10.000 → 2.857 créditos (10000/3.5=2857.14→floor 2857). El input acepta montos libres; cálculo `floor(monto/3.5)` créditos.
- Almacenamiento incluido: **1 GB** documentos (fichas pacientes).

## T2 — Pestaña Plan (captura 1)
Layout de la captura, respetando jerarquía:

1. **Card "Mi plan actual"** (`.settings-card`):
   - Header: título "Mi plan actual" + subtítulo muted "Vence el 09/10/2026" + **badge verde "Activo"** a la derecha (dot verde + texto, estilo pill success, ej. `.badge-active` con `--success`).
   - Grid 3 columnas de métricas:
     - **Profesionales**: número grande "1" + label muted "1 en uso" con barra de progreso azul debajo (1/1 llena o según profesionales usados del mock → con 1 profesional, barra completa o casi; si el mock permite 1 base, mostrar llena).
     - **Días restantes**: número grande "35" (del 03/09 al 09/10 = 36 días → mostrar 35 como captura o calcular `diasRestantes` mock = 35).
     - **Asistentes**: texto "Ilimitados" grande.
   - Debajo: dos botones/links secundarios: **"Renovar plan"** (ícono refresh) y **"Agregar profesionales"** (ícono user-plus). Renovar: al hacer clic selecciona el período vigente/scroll a la card de facturación (o abre selección). Agregar profesionales: botón que muestra aviso "Próximamente" (estado mock — sin acción real; puede ser un `alert`/banner o simplemente botón deshabilitado con tooltip "Disponible pronto"). Decisión: implementar como botón que muestra el mensaje inline "Agregar profesionales estará disponible pronto" en un banner pequeño (no alert nativo).
2. **Dos columnas** (grid ≥880px; 1 col en móvil):
   - **Izq — Card "Detalle de tu plan"**:
     - Título + subtítulo muted "Composición del precio mensual."
     - Fila "Profesionales" con "1" y caption "Renueva tu plan con los mismos profesionales."
     - Label pequeño uppercase "DESGLOSE MENSUAL" + fila "1 profesional (base) … $17.850" y "Subtotal mensual … $17.850" (precio alineado derecha).
     - **Info box** azul (fondo surface-2 o color-mix accent 10%, borde accent 30%): "Los asistentes de odontología son gratuitos e ilimitados. Solo pagas por profesionales (odontólogos y administradores)." + segunda línea: "¿Necesitas más profesionales? Usa la pestaña Agregar profesionales para sumar profesionales al tiempo restante de tu plan." (ícono info).
   - **Der — Card "Período de facturación"**:
     - Título + subtítulo muted "Elige cada cuánto pagar y obtén descuento."
     - **3 opciones radio-custom** (cards seleccionables, no radios nativos feos): Mensual / Semestral / Anual. Cada una: radio visual (círculo, relleno accent si activa), label del período, subtítulo copy, precio actual grande, y para Semestral/Anual: precio anterior tachado + "Ahorras $X" en verde + badges "Popular" (semestral) y "Promoción" (semestral y anual). Opción por defecto: **Mensual** (seleccionada, borde accent). Click en card la selecciona.
     - Al seleccionar período, el subtítulo de vencimiento y el total cambian (mock): mostrar "Total a pagar" con el monto del período + línea muted "Al aprobar el pago, tu plan quedará vigente hasta el {fecha}" — calcular fecha mock: vigente hoy + duración del período (mensual +1 mes → 09/11/2026 aprox; semestral +6m; anual +12m). Para fidelidad con captura: estado inicial vigente hasta 09/10/2026; al elegir Mensual y "pagar", nueva vigencia 09/11/2026 (sumar meses con JS Date, no fijo).
     - **Botón principal full-width** (accent, texto oscuro o blanco según contraste — en la app el CTA usa accent con texto `--bg`): "Pagar con MercadoPago" (ícono MercadoPago no disponible → ícono wallet/chevron o sin logo; usar ícono genérico de pago).
     - **Botón secundario/select** debajo: "Pagar por transferencia" con chevron → al hacer clic muestra un pequeño panel/select con opciones mock (ej. "Transferencia bancaria — te contactaremos con los datos" o un desplegable simple). Decisión: al hacer clic en "Pagar por transferencia" mostrar debajo un panel pequeño informativo mock: "Pronto podrás pagar por transferencia. Mientras tanto, usa MercadoPago." (o si prefieres un `<select>` con opción única). Implementar de forma simple y limpia.
     - **Simulación de pago**: al hacer clic en "Pagar con MercadoPago", mostrar estado de carga breve (spinner en botón ~800ms) y luego **éxito**: el plan pasa a "Activo" con nueva fecha de vencimiento según período elegido, aparece un movimiento en Historial de pagos (mock) y un banner de éxito "Pago exitoso — tu plan quedó renovado hasta el {fecha}." (verde). Sin pasarela real: solo simulación visual con setTimeout.
3. **Historial de pagos** (sección colapsable al final, patrón `<details>` o estado toggle): título "Historial de pagos" + subtítulo muted "Pagos realizados de tu suscripción." Al expandir: lista vacía inicial con mensaje muted "Sin pagos todavía." — y al simular un pago, aparece una fila mock (fecha, concepto "Renovación plan {período}", monto, método "MercadoPago", estado "Pagado" badge verde). Estado inicial del mock **puede incluir 0 pagos** (captura muestra historial colapsado).

## T3 — Pestaña IA (captura 2)
1. **Card izquierda "Tu saldo"**:
   - Título "Tu saldo" (ícono rayo/zap) + subtítulo muted "Disponible · consumo de Septiembre 2026".
   - Filas saldo: **Créditos disponibles: 200** (número grande destacado); **Consumido este mes: 0**; **Dictados: 0** (ícono mic); **Mejoras: 0** (ícono magic wand / sparkle).
2. **Card derecha "Recargar créditos"**:
   - Título + subtítulo muted "Mientras más pagas, mejor el precio por crédito."
   - **Monto a pagar (CLP)**: input numérico con formato CLP (miles con punto, ej. "$ 5.000"), con **3 chips de montos sugeridos**: $2.000 · $5.000 · $10.000 (botones; activo = accent). Valor por defecto 5.000.
   - Caja "RECIBES": número grande de créditos calculado `floor(monto/3.5)` con formato miles (5.000 → 1.428 créditos) + label "créditos" + línea "Tarifa $3,5 / crédito".
   - Botón full-width accent: "Pagar $5.000 CLP · 1.428 créditos" (texto dinámico con monto y créditos). Al hacer clic: simular carga ~800ms → éxito: los créditos se **suman al saldo** (ej. 200 → 1.628) y aparece banner "Recarga exitosa" + movimiento en Historial de movimientos.
   - Bajo el botón, texto muted pequeño: "Pago seguro vía MercadoPago. Tu saldo se actualiza al confirmar el pago."
3. **Historial de movimientos** (colapsable): "Historial de movimientos" + subtítulo "Últimas recargas y consumos." Estado inicial: "Sin movimientos todavía." (centrado, muted). Al recargar, agregar fila mock (fecha, "Recarga de créditos", "+1.428 créditos", método MercadoPago).

## T4 — Pestaña Uso (captura 3)
1. **Card "Almacenamiento de documentos"** (sección General):
   - Título + subtítulo muted "Espacio usado por los documentos subidos a las fichas de tus pacientes."
   - Barra de progreso: "0 KB de 1 GB usados" (izq) y "0 documentos" (der); barra vacía (0%).
2. **Card "Uso esta semana"** (sección IA):
   - Título + subtítulo muted "Créditos consumidos por día."
   - **Mini chart de barras** (SVG o divs, sin librería): 7 barras verticales por día de la semana actual (L M X J V S D con fechas debajo, ej. 31 ago → 6 sep como captura). Todas en 0 (altura mínima visible, color surface-2 con track). Barras con tooltip/value encima "0". Días de la semana en español: L M X J V S D (captura usa L M X J V S D y fechas "31 ago"…"6 sep"). Generar dinámicamente la semana actual (lunes a domingo) con formato día corto.
3. **Card "Detalle del consumo del mes"**:
   - Título + subtítulo "Por funcionalidad y profesional · Septiembre 2026" (mes actual en español, capitalizar).
   - Sub-secciones: **POR FUNCIONALIDAD**: "Sin consumo todavía este mes." · **POR PROFESIONAL**: "Sin consumo por profesional este mes." (estados vacíos muted).

## Estilos (CSS en globals.css, bloque `/* Billing */`)
- Reutilizar `.settings-card`, `.muted`, `.settings-scaffold`, `.button`/`.button-primary` si existen; revisar clases `.button` en globals (usar las existentes para consistencia: organizacion usa `.button`). Si no hay `.button-primary`, definir estilos acorde a tokens (accent bg, `--bg` text, radius, hover accent-strong).
- Nuevas clases (nombres en inglés consistente con el codebase, ej. `.billing-grid`, `.period-option`, `.radio-dot`, `.badge-active`, `.stat-number`, `.usage-bar`, `.week-chart`…). Respetar mobile-first (UX-PRINCIPIOS): columnas → 1 col <880px; tabs scroll horizontal si falta espacio; botones full-width en móvil.
- Números grandes: font display (Space Grotesk) 700, ~1.6-1.8rem para stats. Precio total destacado ~1.5rem accent.
- Badge "Activo": pill con `color-mix(in srgb, var(--success) 15%, var(--surface))` bg y `--success` texto + dot 6px.
- CTA pago: accent sólido. Botón "Pagar por transferencia": ghost/secondary con borde.
- Contrastes AA según DESIGN.md.

## Verificación (gatekeeper y Codex)
1. `timeout 300 npm run lint` → PASS.
2. `timeout 420 npm run build` → PASS (27+ páginas; `/settings/plan` debe listarse como página propia estática — verificar que no colisiona con `[seccion]`; Next resuelve la ruta estática primero).
3. `timeout 300 npm run test:unit` (47/48 preexistente) y `timeout 420 npm run test:integration` (20/20).
4. Estática: grep sin voseo ("Entrá/Conocé/¿Querés?"), sin emojis; precios correctos (17.850/89.250/178.500/2000→571/5000→1428/10000→2857); pestañas presentes; clases CSS definidas.
5. Runtime manual opcional: `npm run dev` o build+start y GET /settings/plan (Codex puede dejar documentado cómo verificó). Si Codex no puede loguearse, documentar y gatekeeper verifica en producción tras deploy.

## Reglas críticas
- NO commit/push/deploy. NO tocar BD ni crear migraciones (fase mock). NO tocar otras páginas settings (organizacion/notifications) ni `[seccion]` (solo agregar la ruta estática plan que la sombrea — Next prioriza estática; verificar build).
- NO instalar librerías de gráficos (SVG/divs manual). NO agregar dependencias nuevas.
- Sin voseo, sin emojis (solo SVG). Tokens DESIGN.md + UX-PRINCIPIOS.md.
- Copy exacto de capturas donde aplica (títulos/subtítulos/badges/precios).
- Comentar claramente los puntos MOCK con `// MOCK — reemplazar por API real cuando exista pasarela`.
- Si algo falla tras 2 intentos, documentar y continuar.

## Reporte
`REPORTE-CODEX-28.md` en la raíz: diff resumido, evidencia (lint/build/tests), desvíos, y qué queda pendiente para la pasarela real (lista de puntos de integración).
