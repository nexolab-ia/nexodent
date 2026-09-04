# BRIEF-CODEX-29 — Pestaña Plan: "Agregar profesionales" con cobro proporcional + pago por transferencia con datos + historial de pagos completo

## Contexto (decisión de Bryan, 2026-09-04, 1 captura de referencia)

Bryan aprobó implementar lo que falta en la pestaña **Plan** de `/settings/plan` (que hoy son placeholders "estará disponible pronto") usando como spec **1 captura de referencia** de la vista "Agregar profesionales":

- `/home/hermes/.hermes/home/proyectos/dental-saas/docs/referencias/plan-agregar-profesionales.png` — **leer/ver esta imagen ANTES de codear**: es la spec visual pixel-level de la nueva vista (sub-tabs "Renovar plan" / "Agregar profesionales", banner azul, stepper, desglose proporcional, banner verde, botón MercadoPago, link transferencia, historial al pie).

Sigue siendo **mock en memoria** (sin pasarela, sin BD): todo el estado vive en `useBillingDemo` y **se resetea al recargar** (comportamiento demo intencional). NO crear migraciones ni tablas. NO tocar nada fuera de `components/billing/` + el bloque CSS `/* Billing */` de `app/globals.css`.

## Estado actual (verificado en el código, commit 9490f84)

- `components/billing/plan-tab.tsx` (121 líneas): tarjeta "Mi plan actual" con stats + botones inline **"Renovar plan"** (scroll a períodos) y **"Agregar profesionales"** (línea 77–79 → muestra el aviso *"Agregar profesionales estará disponible pronto"*). Debajo: grid 2 cols (card "Detalle de tu plan" + card "Período de facturación") y `<details className="billing-history">` con filas [fecha · concepto · monto · método · badge Pagado].
- Botón **"Pagar por transferencia"** (línea 109–110): toggle que muestra *"Pronto podrás pagar por transferencia. Mientras tanto, usa MercadoPago."*
- `use-billing-demo.ts`: `BASE_MONTHLY_PRICE = 17_850`, `CREDIT_PRICE = 3.5`, `INCLUDED_MONTHLY_CREDITS = 200`, `PERIOD_OPTIONS` (constante exportada: Mensual 1×17.850 / Semestral 5× / Anual 10×), `Payment {id,date,concept,amount,method:"MercadoPago"}`, estado: `expiresAt = 2026-10-09` (INITIAL_EXPIRY_DATE), `daysRemaining = 35` **hardcodeado**, `professionals: 1` **hardcodeado dentro del useMemo del account** (no es estado), `simulatePlanPayment(period)` (delay 800ms → agrega Payment "Renovación plan …" y suma meses a expiresAt), `simulateCreditRecharge(amount)`. Helper `formatClp` y `formatDate`.
- `plan-page.tsx`: `<PlanTab account={billing.account} payments={billing.payments} onPay={billing.simulatePlanPayment} />`.
- CSS disponible (tokens DESIGN.md): `--surface #111A2E`, `--surface-2 #1A2740`, `--ink`, `--muted #94A3B8`, `--accent #22D3EE`, `--success #34D399`, `--border`, `--radius 14px`; clases reutilizables: `.settings-card`, `.button .button-primary`, `.badge-active`, `.billing-*`, `.tabular-number`, `.muted`.
- Las constantes del mock NO se usan fuera de `components/billing/` (refactor libre ahí; los tests unitarios/integración que mencionan "billing" son de `billing_movements` de BD y no tocan este mock).

## Precios mock (constantes en use-billing-demo.ts)

- Base: 1 profesional = **$17.850/mes** (existe).
- **NUEVO** `PROFESSIONAL_ADDON_PRICE = 4_650` — CLP/mes por cada profesional adicional (derivado de la captura: 2 profesionales = $22.500/mes → 22.500 − 17.850 = 4.650). Precio mensual del plan = `17.850 + (profesionales − 1) × 4.650`.
- Los períodos de renovación (Mensual/Semestral/Anual) se calculan sobre el **precio mensual vigente** (que sube al agregar profesionales): Mensual = 1×M, Semestral = 5×M (antes 6×M, "Ahorras M"), Anual = 10×M (antes 12×M, "Ahorras 2×M"). Con 1 profesional los valores quedan idénticos a hoy (17.850 / 89.250 / 178.500).
- **Cargo proporcional** al agregar profesionales: `adicional_mensual × (daysRemaining / 30)`, sin redondear el multiplicador. Con 35 días y 1 profesional: `4.650 × 35/30 = 5.425` → **$5.425** (formato CLP sin decimales). El multiplicador SOLO para display se redondea a 2 decimales con formato chileno (coma): `x 1,16`.

## Especificación funcional

### A. `use-billing-demo.ts` (refactor del hook)

1. `professionals` pasa a ser **estado**: `useState(1)`. El `account` expone `professionals` desde ese estado (hoy es literal 1).
2. NUEVO `monthlyPrice` derivado (useMemo): `BASE_MONTHLY_PRICE + (professionals − 1) × PROFESSIONAL_ADDON_PRICE`. Incluirlo en el objeto `account` como `account.monthlyPrice` (CLP, número).
3. NUEVA función `getPeriodOptions(monthlyPrice)` (interna o exportada) que genera las 3 opciones con ese precio (misma copy/badges que PERIOD_OPTIONS actual: Mensual "Paga mes a mes."; Semestral "Paga 5 meses, recibe 6." badges ["Popular","Promoción"]; Anual "Paga 10 meses, recibe 12." badge ["Promoción"]). El hook expone `periods` (useMemo sobre monthlyPrice). Mantener `PERIOD_OPTIONS` exportado como la función/constante base para no romper imports (revisar y ajustar import en plan-tab si pasa a usar `billing.periods`).
4. NUEVA acción `simulateAddProfessional(count: number)`:
   - `addonMonthly = PROFESSIONAL_ADDON_PRICE × count`
   - `factor = daysRemaining / 30` (35/30 exacto, sin redondear)
   - `total = Math.round(addonMonthly × factor)` (5.425 con 35 días y count 1)
   - `await delay(800)` (misma convención)
   - Actualiza: `professionals += count`; `expiresAt` NO cambia (el proporcional cubre hasta el vencimiento vigente 09/10/2026).
   - Agrega a `payments` (mismo array del historial): `{ id: "prof-${Date.now()}", date: new Date(), concept: "Agregar {count} profesional(es) adicional(es)" (singular "Agregar 1 profesional adicional" / plural "Agregar 2 profesionales adicionales"), amount: total, method: "MercadoPago" }`.
   - Devuelve `{ payment, professionals: nuevoTotal, total }` (para banners de éxito).
   - `daysRemaining` sigue hardcodeado en 35 (fiel a la captura y al estado actual; NO recalcular por fecha real).

### B. `plan-tab.tsx` — estructura nueva (spec = captura)

**B1. Sub-navegación interna de la pestaña Plan** (reemplaza a los botones inline de la tarjeta):
- La tarjeta "Mi plan actual" (stats + badge Activo) se mantiene arriba, **sin** los botones "Renovar plan" / "Agregar profesionales" dentro (se quitan de `.plan-inline-actions`).
- Debajo de la tarjeta, una **barra de 2 sub-tabs** estilo pills/segmented (patrón de la captura: botón con ícono + label; el activo con **borde azul accent**): `[↻ Renovar plan] [👤+ Agregar profesionales]` — estado local `planView: "renew" | "add"`, default `"renew"`. Íconos SVG línea: refresh (existe `LineIcon name="refresh"`) y user-plus (existe `LineIcon name="user-plus"`). Accesible: `role="tablist"`/`role="tab"`/`aria-selected`/`aria-controls` como `BillingTabs`.
- Contenido según `planView`:
  - **"renew"** → grid 2 cols actual (Detalle de tu plan + Período de facturación) SIN cambios funcionales, salvo: (a) precios/desglose dinámicos con `account.monthlyPrice` y `professionals`; (b) "Pagar por transferencia" muestra el nuevo panel con datos (B3); (c) los períodos vienen de `billing.periods` (no de la constante global).
  - **"add"** → vista nueva completa (B2).

**B2. Vista "Agregar profesionales" (nueva; reproducir la captura fielmente, en este orden):**

1. **Card** `.settings-card` con header: título **"Agregar profesionales"** + subtítulo muted **"Cobro proporcional hasta el vencimiento"**.
2. **Banner informativo azul** (fondo color-mix accent ~9%, borde accent ~35%, ícono info; puede reutilizar estilo `.billing-info-box` pero full-width): *"Agrega profesionales a tu plan actual. Solo pagas el proporcional por los **{daysRemaining} días** restantes hasta tu vencimiento (**{dd/mm/yyyy}**)."* → con mock: "…por los **35 días** restantes hasta tu vencimiento (**09/10/2026**)."
3. **Stepper "Profesionales a agregar"**:
   - Label de fila: **"Profesionales a agregar"** (strong) + caption muted **"Actualmente tienes {n} profesional(es)"** con **concordancia correcta**: "Actualmente tienes 1 profesional" (singular) / "Actualmente tienes 2 profesionales".
   - Control numérico: botones `−` y `+` (44px mín., cuadrados/circulares, borde `--border`, hover surface-2; número central tabular grande) + valor = profesionales a agregar `addCount` (default **1**, min **1**, max **10**). Botón `−` **deshabilitado visualmente** (opacity/gris + `disabled`) cuando `addCount === 1` (la captura lo muestra habilitado en 1 — es un defecto de UX que debemos corregir: el mínimo a agregar es 1). Botón `+` deshabilitado en 10. `aria-label` en botones ("Disminuir", "Aumentar") y el conjunto con `aria-label="Profesionales a agregar"`. Cambios recalculan todo en vivo (sin delay).
   - Caption bajo el stepper (o al lado): **"Se sumarán al tiempo restante de tu plan."** (copy sugerida; mantener tono).
4. **Desglose de costos** (card interna o filas tipo `.monthly-breakdown`; 4 filas + total, alineación derecha tabular):
   - "Plan actual ({n} profesional/es)" → **$17.850/mes** cuando n=1; si ya se agregaron antes, "Plan actual (2 profesionales)" → **$22.500/mes** (usar `account.monthlyPrice`).
   - "Nuevo plan ({n+addCount} profesional/es)" → `account.monthlyPrice + addonMonthly`/mes → con mock 1+1: **$22.500/mes**.
   - "Aumento mensual" → `+$4.650/mes` por profesional adicional (con addCount 1: "+$4.650/mes"; con 2: "+$9.300/mes").
   - "Proporcional por {descomposición}" → **"× 1,16"** (display: multiplicador redondeado 2 decimales, coma decimal). Descomposición del tiempo restante: `months = floor(daysRemaining/30)`, `days = daysRemaining % 30` → 35 = "1 mes y 5 días"; si months=0 → "12 días"; si days=0 → "2 meses". Formato: "por 1 mes y 5 días".
   - **"Total a pagar hoy"** → `$5.425` grande, color accent (reutilizar patrón `.billing-total`/`.stat-number`).
5. **Banner verde de confirmación** (fondo success ~10%, borde success ~40%, ícono check): *"Tu plan pasará a **{n+addCount}** profesional(es) hasta el **{dd/mm/yyyy}**."* → "Tu plan pasará a 2 profesionales hasta el 09/10/2026". Concordancia: "a 1 profesional" solo si total fuera 1 (no ocurre con min 1 desde 1 actual, pero implementar plural correcto igual).
6. **Botón principal** (`.button .button-primary` full-width, ícono wallet): **"Pagar {formatClp(total)} con MercadoPago"** → "Pagar $5.425 con MercadoPago". Al hacer clic: estado "Procesando pago…" (disabled, 800ms vía `simulateAddProfessional(addCount)`) → banner de éxito verde (reutilizar `.billing-success-banner`): *"Pago exitoso — agregaste {count} profesional(es) hasta el 09/10/2026."* → `professionals` sube, la vista "renew" refleja el nuevo monthlyPrice/profesionales, el historial suma la fila, el desglose de "add" se resetea a addCount 1 y muestra "Actualmente tienes 2 profesionales". Si el total es 0 (no debería) deshabilitar botón.
7. **"Pagar por transferencia"** → B3 (compartido, mismo comportamiento en ambas vistas).

**B3. Pago por transferencia — panel con datos (reemplaza el aviso "Pronto podrás…")**
- Botón toggle actual (`.billing-transfer-button` con chevron, `aria-expanded`) se mantiene; el contenido expandido pasa a ser un **panel con los datos para transferir** (estilo card interna `.settings-card`/bordes), NO el texto "pronto":
  - Encabezado pequeño: "Datos para transferir" + caption muted "El plan se activa al confirmar la transferencia (1 a 2 días hábiles)."
  - Grid de campos etiquetados (label muted chico + valor): **Banco** → "Banco Estado", **Tipo de cuenta** → "Corriente", **N° de cuenta** → "12345678", **Titular** → "Clínica Sonrisa Andes SpA", **RUT** → "76.543.210-8", **Email de aviso** → "pagos@nexodent.invalid". Monto: "Transfiere exactamente {formatClp(total)}".
  - Nota final muted: "Datos de demostración — se reemplazarán por la cuenta real de tu clínica al conectar la pasarela."
  - En la vista "renew" el monto a transferir es el total del período seleccionado; en la vista "add" es el total proporcional.
- NO crear flujo de "Ya transferí" ni estado "pendiente" (fuera de alcance).

**B4. Historial de pagos (`.billing-history`) — se mantiene al pie, visible en ambas vistas**
- Ya existe y funciona (fila por pago: fecha · concepto · monto · método · badge "Pagado"). Enriquecer solo si es trivial: asegurar que los nuevos pagos de "Agregar N profesional(es) adicional(es)" aparezcan con su concepto y monto correctos (viene gratis de `payments`). No cambiar el diseño base.

### C. CSS (bloque `/* Billing */` en app/globals.css)

- Sub-tabs pills: nueva clase (ej. `.plan-subtabs`) — botones inline-flex con borde 1px `--border`, radio 999px o 10px, gap, 44px mín; activo: borde `--accent` + texto `--ink`/`--accent` + fondo color-mix accent 6%; inactivo: texto `--muted`, hover surface-2. Consistente con pills de la app (`.segmented`).
- Stepper: `.stepper` (inline-flex, borde, radio 10px, overflow hidden) + `.stepper-btn` (44px, borde 0, fondo transparente, color ink; `:disabled` opacity .35 + cursor not-allowed) + `.stepper-value` (tabular, padding 0 1rem, min-width).
- Banner azul: `.billing-callout` (o reutilizar) — flex gap, padding .85rem 1rem, border radius 10px, fondo color-mix accent 9% → usar también para verde con variante `.is-success` (fondo success 10%). Texto .85rem.
- Panel transferencia: `.transfer-panel` — grid de campos 2 col ≥620px (1 col móvil), cada campo label `.billing-overline`-like + valor strong; borde superior para separarlo del botón toggle.
- Desglose "add": reutilizar `.monthly-breakdown`, `.billing-overline`, `.billing-total`; el total "Total a pagar hoy" puede llevar clase propia con el tamaño accent de `.billing-total > strong`.
- Todo responsive: 1 columna < 620px; stepper sin overflow; targets ≥44px; `:focus-visible` visible; `prefers-reduced-motion` (ya cubierto por regla global del bloque Billing).

## Copy exacta (tuteo chileno — OBLIGATORIO, sin voseo)

- "Agregar profesionales" / "Cobro proporcional hasta el vencimiento"
- "Agrega profesionales a tu plan actual. Solo pagas el proporcional por los 35 días restantes hasta tu vencimiento (09/10/2026)."
- "Profesionales a agregar" / "Actualmente tienes 1 profesional" / "Actualmente tienes 2 profesionales"
- "Plan actual (1 profesional)" / "Nuevo plan (2 profesionales)" / "Aumento mensual" / "Proporcional por 1 mes y 5 días" / "Total a pagar hoy"
- "Tu plan pasará a 2 profesionales hasta el 09/10/2026."
- "Pagar $5.425 con MercadoPago" / "Procesando pago…"
- "Pago exitoso — agregaste 1 profesional adicional hasta el 09/10/2026."
- Transferencia: "Pagar por transferencia", "Datos para transferir", "El plan se activa al confirmar la transferencia (1 a 2 días hábiles).", "Transfiere exactamente $5.425", "Datos de demostración — se reemplazarán por la cuenta real de tu clínica al conectar la pasarela."
- SIN voseo (nunca "Agregá", "Tenés", "Pagás", "Querés"). SIN emojis. SIN anglicismos innecesarios.

## Reglas de calidad (heredadas del proyecto)

- Next 16 App Router, React 19, CSS puro (sin Tailwind). Componentes cliente ("use client" donde haya estado).
- No romper: `npm run lint`, `npm run build` (producción), `npm run test:unit` (el fallo conocido de docker-compose.yml en foundation.test.ts es pre-existente y NO se toca), `npm run test:integration`.
- No tocar BD, migraciones, RLS, ni otros módulos (scheduling, pacientes, etc.).
- NO hacer commit ni push (lo hace el gatekeeper). Reportar en REPORTE-CODEX-29.md (crear archivo nuevo al terminar, mismo formato del 28: alcance entregado, archivos cambiados, evidencia de verificación lint/build/tests, UX checks, desviaciones).
- Comentario de marcador mock en el hook (existe: "// MOCK — reemplazar por API real…") — mantenerlo actualizado para las acciones nuevas.

## Verificación del gatekeeper (después de tu entrega)

1. `npm run lint`, `npm run build`, tests (unit con fallo pre-existente aceptado, integration).
2. Grep anti-voseo en los archivos tocados: `Agregá|Tenés|Pagás|Querés|Podés|Sumá` → 0 resultados. Grep de emojis → 0.
3. Revisión visual en producción (login demo) de: sub-tabs, vista add con cálculo 1 profesional → $5.425 (35 días, x1,16, 1 mes y 5 días), pago simulado que sube a 2 profesionales y registra fila en historial, panel de transferencia con datos, vista renew reflejando 2 profesionales = $22.500/mes y períodos recalculados.
