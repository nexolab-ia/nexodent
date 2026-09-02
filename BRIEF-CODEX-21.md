# BRIEF-CODEX-21 — Dashboard "Resumen": landing post-login con KPIs del día, agenda, salud de clínica, planes de tratamiento y evoluciones pendientes

## Contexto (orquestador ya validó el spec con el dueño del producto)

NexoDent no tiene página de inicio tras el login: hoy todo redirige a `/agenda` y el
sidebar (`components/layout/app-shell.tsx`) no tiene entrada de Resumen. El dueño pidió
(un 2026-09-03) que la página que se carga tras hacer login sea un **Dashboard** que
presente, para una fecha navegable (hoy por defecto, ayer, otros días):

1. **Fila de KPIs**: Citas de hoy · Pacientes de hoy · Ingresos del día · Sin confirmar.
2. **Paneles**: Agenda del día (timeline de citas) + Ingresos del día (detalle).
3. **Panel "Salud de clínica"**: métricas/porcentajes de Ocupación, Asistencia,
   Producción, Cobrado y Captación.
4. **Panel "Planes de tratamiento"** y **panel "Evoluciones pendientes"** (con
   contadores Hoy y Total).
5. **Navegación de fecha** (◀ ▶ Hoy selector de día) y **vista** "Toda la clínica"
   (admin) vs "Mis datos" (solo actividad propia del profesional).

El orquestador decidió (validado por Bryan, "ajusta con tu criterio"):
- El dashboard es una ruta NUEVA `/dashboard` (label "Resumen") y pasa a ser la landing
  post-login; `/agenda` sigue existiendo como módulo de agenda.
- Hace falta migración mínima: **asistencia en citas** + **vínculo opcional cita↔paciente**
  (`patient_id`) para que Asistencia y Evoluciones pendientes muestren datos reales.
- "Planes de tratamiento" = presupuestos (`estimates`) por estado con montos (snapshot
  actual, no depende de la fecha navegada). "Evoluciones pendientes" = citas ya pasadas
  (no canceladas, no marcadas como no asistió, con `patient_id`) sin evolución clínica
  posterior registrada; panel fijo en el día real (Hoy y Total acumulado).
- Corrección de seguridad detectada por el orquestador: la policy RLS de clinical_records
  excluye a `organization_admin` (solo professional/independent_owner), lo que rompería
  "Evoluciones pendientes" y el acceso clínico para el admin de clínica. Se corrige en la
  migración (ampliar `app_clinical_allowed` para incluir organization_admin en LECTURA —
  el app-layer `authorize()` sigue bloqueando escrituras clínicas de admin).

## Estado actual del repo (verificado por el orquestador 2026-09-03)

- Rama `main`, working tree limpio. HEAD `8a07602` (feat home: light/dark + landing).
- Migraciones `db/migrations/0000..0008` aplicadas a la dev DB local; próximas = 0009.
- Stack: Next 16.1.1 (App Router, server components; params/searchParams async),
  postgres.js, Better Auth, Tailwind v4 importado pero sistema visual real = CSS con
  variables en `app/globals.css` (tokens `--bg/--surface/--ink/--accent:#22d3ee/--border/
  --radius/--success/--warning/--danger`, modo claro vía `[data-theme="light"]`).
- Enums: `appointment_status = pending|confirmed|cancelled`, `appointment_kind =
  appointment|block`; `membership_role = organization_admin|professional|assistant|
  independent_owner`. Tabla `appointments` NO tiene asistencia ni patient_id
  (`patient_name` varchar denormalizado; `professional_membership_id` NOT NULL).
- `billing_movements` = libro contable único: `kind` charge|payment|credit|correction,
  `status` posted|voided, `amount_clp` **bigint (postgres.js lo devuelve como STRING:
  SIEMPRE `Number(...)` al leer)**. Pagos = kind='payment' status='posted'.
- `patients` (org-wide readable por TODOS los roles; policy tenant simple).
- `estimates` + `estimate_versions` (total por versión en `total_clp`); estados
  draft|sent|approved|rejected|expired. RLS: readable por admin/professional/owner; NO por
  assistant.
- `clinical_records` (evolución = fila: patient_id, content, occurred_at, author).
- RLS: toda operación ejecuta bajo `runAsTenant(sql, actor, tx => ...)` que setea GUCs
  transaction-local (`lib/tenancy.ts`). Roles: `can()/authorize()` en
  `features/tenant-identity/authorize.ts` (professional NO tiene billing:manage; assistant
  NO tiene billing/estimate/clinical).
- Helpers horarios Chile en `features/scheduling/domain.ts`: `SANTIAGO_TIMEZONE`,
  `localWeekday`, `localTime`, `santiagoOffsetMs`, `santiagoLocalToUtc(day, "HH:MM")`,
  `isWithinHours`. **PROHIBIDO sumar/restar horas fijas** para conversión local↔UTC.
- Patrón de server actions "use server": `app/(app)/<mod>/actions.ts` delgado →
  `requestTenantContext()` → `runAsTenant(sql, actor, () => featureAction(sql, actor, input))`
  → `revalidatePath`. Páginas server leen con `runAsTenant(sql, actor, tx => SELECT ...)`
  con SQL crudo tipado y alias camelCase (ej. `app/(app)/billing/page.tsx`).
- Redirecciones post-login a `/agenda` HOY en: `middleware.ts` (protectedPrefixes +
  matcher), `app/login/page.tsx:11` (`if (session) redirect("/agenda")`),
  `app/login/login-form.tsx:29` (`router.replace("/agenda")`),
  `app/registro/page.tsx:16`, `app/onboarding/actions.ts` (`redirectTo: "/agenda"`),
  `app/onboarding/profile-picker.tsx` ("Ir a mi espacio"), y el flujo demo
  (`app/api/demo/sign-in/route.ts` redirige a /agenda — verificar con grep).
- `app/sw.ts` excluye de caché rutas protegidas; revisar y añadir `/dashboard`.

## ⚠️ LECCIONES APRENDIDAS — OBLIGATORIO respetarlas (gatekeeper NexoDent PR1-PR5)

1. **Toda operación DB corre dentro de `runAsTenant`** (set_config GUC transaction-local).
   `requestTenantContext()` solo obtiene el actor; ejecutar con `sql` directo fuera de
   runAsTenant devuelve 0 filas bajo FORCE RLS en runtime real.
2. **Tests de seguridad con rol app real (NOBYPASSRLS)**, nunca superuser/admin, o no
   prueban nada.
3. **bigint de postgres.js = string** → `Number()` explícito en toda lectura de montos.
4. **Toda migración nueva en paralelo**: `db/migrations/0009_*.sql` + `db/schema/*.ts` +
   `db/schema/snapshot.json` (mirror del patrón de migraciones previas; si la snapshot no
   se tocó en cambios recientes, seguir la convención exacta que use el repo — revisar
   `git show` del commit que agregó 0008) + rollback si aplica.
5. **DST**: cualquier cálculo día-local↔UTC debe usar los helpers de
   `features/scheduling/domain.ts` (Intl), y los tests unitarios de límites de día deben
   cubrir AMBOS regímenes (invierno p. ej. 2026-07-15 y verano p. ej. 2026-01-15) — nunca
   una sola fecha arbitraria.
6. **Español de Chile: TUTEO** ("Entra", "Confirma", "Marca", "¿Quieres?"). PROHIBIDO
   voseo ("Entrá", "Confirmá", "Marcá", "¿Querés?", "tenés", "Conocé").
7. Self-reports no son evidencia: cada tarea cierra con comando ejecutado y salida.
8. Checkboxes/claims de éxito solo tras verificación real con evidencia.

## Diseño de solución (DECIDIDO — respetar exactamente)

### T1 — Migración `db/migrations/0009_dashboard.sql` + schema TS + snapshot

1. `appointments`:
   - `patient_id uuid NULL` + FK compuesta `(patient_id, organization_id) REFERENCES
     patients(id, organization_id)` (patrón `billing_patient_tenant_fk` de
     `db/schema/billing.ts`; en TS usar `foreignKey({...})` como allí). NUNCA referenciar
     solo `patients.id`.
   - `attendance varchar(16)` nullable, CHECK `attendance IN ('attended','missed')`
     (permitir NULL).
   - CHECK `(kind <> 'appointment') OR attendance IS NULL OR attendance IN ('attended',
     'missed')` (no exigir nada, solo valores válidos) y CHECK `(status <> 'cancelled')
     OR attendance IS NULL` (cancelada no puede tener asistencia marcada).
   - Sin backfill (NULL por defecto). Índices: el existente `appointments_scope_time_idx`
     (org, site, starts_at) cubre las queries de dashboard; no agregar más salvo que una
     query del plan lo justifique.
2. **Fix RLS clínica para admin**: `CREATE OR REPLACE FUNCTION app_clinical_allowed` para
   incluir `organization_admin` además de professional/independent_owner (mismo archivo de
   migración; copiar la definición actual de 0004 y ampliar la lista). Comentar el porqué.
   NO tocar app_billing_allowed ni app_estimate_allowed.
3. Mantener todas las policies RLS existentes intactas (solo la función nombrada).
4. La migración DEBE ser segura de aplicar sobre la dev DB actual (y anotarse como la
   última: `db/migrate.ts` ejecuta los .sql ordenados — verifica cómo se aplican en dev:
   `npm run db:migrate`; si los archivos previos no son idempotentes, la convención es
   aplicarla una sola vez sobre la dev DB; replicar el procedimiento usado en briefs
   previos para dev).
5. Espejar en `db/schema/scheduling.ts`: columna `attendance` + `patientId` con FK
   compuesta, y exportar tipo/const si aplica. Actualizar snapshot si el repo lo mantiene
   (revisar commit de 0008 para saberlo).

### T2 — Dominio puro `features/dashboard/domain.ts` (sin IO, testeable)

Funciones puras + tipos:
- `DayScope = "clinic" | "own"`.
- `resolveScope(actor: TenantContext, requested: string | undefined): DayScope`:
  - roles `organization_admin` e `independent_owner`: respetan `requested` (default
    "clinic"; si piden "own" lo permiten).
  - rol `professional`: SIEMPRE "own" (ignora requested).
  - rol `assistant`: SIEMPRE "clinic".
- `percent(cur: number, base: number): number | null` → redondeo entero; null si base<=0.
- `deltaPercent(cur: number, prev: number): number | null` → redondeo entero ((cur-prev)/
  prev*100) o null si prev<=0.
- `addDaysLocal(day: DayDate, n)` y `dayBounds(day: DayDate): {start: Date; end: Date}` —
  `DayDate` = `{year, month, day}` o string "YYYY-MM-DD" (elige y documenta). Usar
  `santiagoLocalToUtc` para `00:00` y para el día siguiente; JAMÁS offsets fijos.
- `occupancyPercent(scheduledMinutes, capacityMinutes)`; `attendancePercent(attended,
  missed)` → null si attended+missed===0.
- `appointmentScopeFilter`? No: filtros SQL en queries con parámetros (ver T3).
- Validación de `date` recibida: `parseDayParam(raw: string | undefined): DayDate` que
  lanza/`null` si no es `YYYY-MM-DD` válido (rechazar fechas imposibles). Default = hoy en
  America/Santiago.

Tests unit `tests/unit/dashboard.test.ts` (vitest): scope resolution por rol, percent/
deltaPercent casos borde, dayBounds en invierno y verano (2026-07-15 y 2026-01-15;
verificar start=00:00 Santiago → instante UTC correcto con DST; p. ej. en verano
2026-01-15 el start debe ser 03:00Z y en invierno 04:00Z), parse inválidos, occupancy/
attendance null-cases.

### T3 — Queries y mutaciones

**Lecturas** (`features/dashboard/actions.ts`, funciones que reciben
`(sql: Sql, actor: TenantContext, input)` y ejecutan SQL crudo tipado, alias camelCase,
montos con `Number()`; SIN authorize en lecturas — el RLS + filtro por scope en SQL son la
frontera. Reutilizar helpers de `features/scheduling/domain.ts` para los bounds):

`dashboardSummary(sql, actor, day, scope)` → un solo `runAsTenant` desde la página con
varias queries (pueden ir en paralelo dentro de la transacción o secuenciales; decide con
claridad y documenta) que devuelve UN payload tipado:

Filtro base de citas por scope (aplicar a TODA query de appointments):
- scope clinic: `organization_id = actor.organizationId` (+ si `actor.siteIds` no vacío y
  el rol no es admin/owner… NO: para clinic usar solo org; el RLS ya restringe lo que el
  rol puede ver — appointments es org-wide para todos; para assistant que tiene siteIds
  acotados, clinic = org es lo que el RLS permite y lo que muestra la vista de clínica;
  documentar).
- scope own: añadir `professional_membership_id = actor.membershipId`.

Queries del payload (día D = bounds start/end):
1. **KPIs**:
   - `appointments` kind='appointment' status<>'cancelled' starts_at∈[start,end):
     total, sum(status='confirmed'), sum(status='pending'), y conteo "sin confirmar" =
     status='pending'.
   - pacientes del día: `COUNT(DISTINCT lower(trim(patient_name)))`.
   - ingresos: pagos posted del día (`kind='payment' status='posted'`) → totalClp +
     nº pagos; producción: cargos posted del día (`kind='charge' status='posted'`) →
     totalClp; SOLO si el rol puede finanzas (`can(actor, "billing:manage")` con
     `features/tenant-identity/authorize.ts`); si no → null (UI muestra "—").
     scope own añade `professional_membership_id = actor.membershipId`.
   - deltas vs D-1 para producción y cobrado (misma query con ventana anterior).
2. **Agenda del día**: citas kind='appointment' (INCLUIR canceladas para mostrarlas
   tachadas) del día ordenadas por starts_at: id, startsAt, endsAt, patientName,
   patientId, status, attendance, professionalMembershipId, boxName?, siteName? (join
   boxes/sites solo si trivial; si no, omitir box/site), + nombre del profesional (join
   memberships→users para display "Dr./Dra. ..." o nombre simple — revisar cómo
   `app/(app)/settings/members/page.tsx` resuelve nombres y replicar).
3. **Ingresos del día** (panel, solo si can billing:manage; si no, payload null + UI
   denied):
   - total cobrado (pagos posted del día), total producción (cargos posted del día),
   - últimos 5 movimientos del día (charge|payment posted) con paciente
     (join patients firstName/lastName), hora local, monto, kind,
   - sparkline 7 días: pagos posted por día calendario Santiago de los últimos 7 días
     (incl. D): `GROUP BY (created_at AT TIME ZONE 'America/Santiago')::date` y completar
     ceros en JS para los 7 puntos.
4. **Salud de clínica** (mismo scope):
   - ocupación: capacidad = minutos de `professional_availability` del weekday de D en el
     scope (suma de duraciones de intervalos; clinic=org, own=filtro professional); citado
     = minutos de citas no canceladas del día (kind appointment). Si capacidad 0 → null.
   - asistencia: attended/missed del día (citas no canceladas con attendance marcada) →
     pct + contador marcadas/total del día.
   - producción, cobrado (solo finance roles; con delta D vs D-1), captación =
     pacientes con created_at∈[start,end) (org-wide; con delta).
5. **Planes de tratamiento** (snapshot, SIN fecha): por estado (draft/sent/approved/
   rejected/expired): count + suma totalClp de la versión vigente
   (`estimates.current_version = estimate_versions.version`), solo si
   `can(actor,"estimate:manage")` (professional/admin/owner sí; assistant no → null + UI
   denied) — join patients para top 5 recientes por `estimates.updated_at` (estado,
   paciente, total, updatedAt).
6. **Evoluciones pendientes** (fijo: usa el día real de hoy America/Santiago; NO depende
   del día navegado; scope own filtra professional_membership_id): citas pendientes de
   evolución = kind='appointment', status<>'cancelled', patient_id IS NOT NULL,
   attendance IS DISTINCT FROM 'missed', starts_at <= now(), y SIN clinical_record con
   occurred_at >= appointment.starts_at (LEFT JOIN LATERAL ... LIMIT 1). Devolver: count
   hoy (starts_at en día real) y count total histórico; top 5 por starts_at desc (paciente,
   fecha cita, patientId para link a ficha). Solo si el rol puede leer clinical
   (`can(actor,"clinical:manage")` incluye professional y owner y, tras el fix RLS, el
   admin puede leer aunque su capability no sea clinical:manage → condicionar por rol:
   visible para organization_admin/professional/independent_owner; assistant → denied).
   > IMPORTANTE: como admin no tiene capability clinical:manage pero SÍ debe ver el panel,
   usa la condición de rol explícita (`actor.role !== "assistant"`), documenta el porqué.

**Mutaciones** (extender `features/scheduling/actions.ts` con lógica de dominio y
autorización estricta; envolver en server action "use server" nueva
`app/(app)/dashboard/actions.ts`):

- `confirmAppointment(sql, actor, appointmentId)`: status pending→confirmed. Autorización:
  - rol professional: solo si la cita es suya (`professional_membership_id =
    actor.membershipId`) → si no, error "No tienes permisos para modificar esta agenda"
    (SchedulingValidationError).
  - otros roles: `authorize({...actor, resourceSiteId: siteId}, "appointment:schedule")`
    comprobando siteIds (si el rol no es admin/owner y site_id no está en actor.siteIds →
    error).
  - Insertar `appointment_history` (action 'status.confirmed', after {status:"confirmed"},
    actor). No enviar notificaciones nuevas (no ampliar alcance).
- `markAppointmentAttendance(sql, actor, appointmentId, attendance: "attended" | "missed")`:
  misma autorización por rol (professional solo propia). Validar que la cita existe, no
  está cancelada (CHECK del modelo), kind='appointment'. UPDATE attendance + updated_at;
  history action 'attendance.marked' con before/after. Permitir re-marcar (toggle).
  IMPORTANTE: si la cita es futura (starts_at > now) NO bloquear — el staff puede
  pre-marcar; el CHECK del modelo impide valores inválidos.
- Server action wrapper: lee requestTenantContext, corre runAsTenant con la feature action,
  `revalidatePath("/dashboard")`. Los inputs llegan por hidden fields del form
  (appointmentId, date, scope) — ver T5.

Nombres y mensajes en español tuteo.

### T4 — Ruta `/dashboard` + landing post-login + nav

1. `app/(app)/dashboard/page.tsx` (server component async): lee
   `searchParams: Promise<{ date?: string; scope?: string }>`, `requestTenantContext()`,
   resuelve `day` y `scope` con domain (T2), ejecuta `dashboardSummary` bajo `runAsTenant`
   con `sql` de `db/client.ts` (ver cómo lo hacen `app/(app)/billing/page.tsx` /
   `estimates/page.tsx`), y renderiza:
   - Header de página: H1 "Resumen", navegación de fecha: link ◀ (date-1), selector
     nativo `<input type="date">` dentro de un `<form method="get" action="/dashboard">`
     (hidden scope) que al submit navega, link ▶ (date+1), botón "Hoy" (limpia date), y
     leyenda de la fecha elegida (ej. "miércoles 3 de septiembre de 2026").
   - Segmented control de vista SOLO para roles con permiso (org_admin/independent_owner):
     dos links con scope=clinic / scope=own ("Toda la clínica" / "Mis datos"); para
     professional mostrar la vista "Mis datos" activa sin opciones (o deshabilitado); para
     assistant "Toda la clínica" sin opciones. Los links conservan ?date= actual.
   - Filas/paneles según T5.
   - Acciones: forms con `<form action={serverAction}>` + hidden inputs (appointmentId,
     date, scope) para Confirmar / Asistió / No asistió; si el usuario no puede actuar
     sobre una cita (professional y cita ajena) no renderizar botones.
2. **Cambiar landing post-login a `/dashboard`** (grep de TODAS las ocurrencias de
   `"/agenda"` / `'/agenda'` en rutas de navegación POST-auth y decidir una por una):
   - `middleware.ts`: añadir `"/dashboard"` a protectedPrefixes y matcher.
   - `app/login/page.tsx` redirect(session) → "/dashboard".
   - `app/login/login-form.tsx` router.replace → "/dashboard".
   - `app/registro/page.tsx` → "/dashboard" cuando hay membresía.
   - `app/onboarding/actions.ts` redirectTo → "/dashboard" (ambos puntos).
   - `app/onboarding/profile-picker.tsx` "Ir a mi espacio" → "/dashboard".
   - Flujo demo: buscar dónde redirige `/api/demo/sign-in` y el botón demo → "/dashboard".
   - `app/sw.ts`: revisar lista de exclusión de caché y añadir "/dashboard" si aplica.
   - NO cambiar enlaces internos legítimos a /agenda (nav, paneles que linkean a agenda).
3. `components/layout/app-shell.tsx`: añadir PRIMERO el link `["/dashboard", "Resumen"]`;
   mantener el resto. Opcional: marcar link activo con aria-current (no obligatorio).
4. Mobile: el shell actual es básico; asegurar que la página sea responsive por CSS.

### T5 — UI (diseño DECIDIDO, calidad: aplicar tokens de DESIGN.md, NO rediseñar luego)

Sistema: app 100% dark por defecto con variables CSS (modo claro heredado automáticamente
por las variables `[data-theme="light"]`). Nada de colores hardcodeados fuera de las
variables. Íconos SVG inline de línea fina (sin emojis), fuente display Space Grotesk en
títulos/números grandes, Inter en cuerpo (ver DESIGN.md y lo que ya usa globals.css).

Primitivas nuevas en `app/globals.css` (sección comentada "Dashboard"):
- `.kpi-grid` grid 4 columnas (1fr) gap 16px; responsive: 2 col ≤1100px, 1 col ≤680px.
- `.stat-card` (fondo var(--surface), borde var(--border), radius var(--radius), padding
  18px): `.stat-label` (uppercase 12px letter-spacing .6px muted), `.stat-value`
  (Space Grotesk 28-30px 700, ink), `.stat-sub` (13px muted). Valor con acento de color
  solo en la cifra principal cuando aplique (ingresos).
- `.chip` + variantes de estado: `.chip-pending` (warning tenue), `.chip-confirmed`
  (accent tenue), `.chip-cancelled` (danger/muted), `.chip-attended` (success tenue),
  `.chip-missed` (danger tenue) — fondos con alpha sobre var(--surface-2) y texto con el
  color de la variable; definir con `color-mix` o rgba derivado de las variables (elegir
  lo que ya use el repo; si no hay precedente, usar `color-mix(in srgb, var(--warning)
  18%, transparent)` + texto var(--warning)).
- `.dash-grid` (grid `minmax(0,2fr) minmax(0,1fr)` gap 16; responsive 1 col ≤1100px),
  `.panel` (misma base que .module: surface/radius/border/shadow), `.panel-head`
  (título 16px 600 Space Grotesk + link "Ver todo" muted → módulo real),
  `.panel-body`.
- Agenda del día: filas `.agenda-row` (grid: hora mono/13px, contenido, chips, acciones)
  con separador var(--border); hora local HH:MM con helpers; canceladas tachadas y muted.
- Salud de clínica: `.salud-grid` (5 columnas → wrap 2-3 en responsive) de
  `.salud-item`: label, valor grande (%, $ o nº), barra `.metric-bar` (track
  var(--surface-2), fill accent/success/warning según umbral: >=70 success, >=40 warning,
  <40 danger) — la barra SOLO para las métricas porcentuales (ocupación/asistencia) o
  relativa (delta); para $ y nº mostrar delta como texto "▲ 12% vs ayer" (flecha SVG o
  texto, sin emoji).
- Estados vacíos/denegados: `.state-note` centrado muted con icono SVG pequeño y copy
  tuteo ("No hay citas para este día", "Aún no hay pagos registrados", "Tu rol no tiene
  acceso a finanzas — solicítalo al administrador", etc.).
- Inputs date y segmented: estilos consistentes con tokens (fondo surface-2, borde border,
  focus ring accent).

Layout exacto de la página (en orden):
1. Header: H1 "Resumen" + fecha (navegación) a la derecha; debajo (o misma fila en
   desktop) segmented "Toda la clínica | Mis datos" + nota de qué vista muestra
   ("Datos de toda la clínica" vs "Solo tu actividad").
2. `.kpi-grid` con 4 `.stat-card`: **Citas de hoy** (sub: "X confirmadas · Y por
   confirmar"), **Pacientes de hoy** (sub "personas con cita"), **Ingresos del día**
   (sub "N pagos registrados"; si sin acceso finanzas → valor "—" + sub "Solo
   administración"), **Sin confirmar** (sub "pendientes de confirmar hoy"; número en
   warning si >0).
3. `.dash-grid`:
   - Columna principal (2fr):
     a. Panel **"Agenda del día"** (día navegado): lista de citas ordenadas (hora local,
        paciente con link a ficha si patientId, chips estado, chip asistencia si marcada,
        profesional si scope=clinic, acciones Confirmar/Asistido/No-asistió según permiso,
        o "Cancelada" tachada). Si día navegado ≠ hoy, acciones de asistencia igual
        disponibles (marcar retroactivo), Confirmar también.
     b. Panel **"Salud de clínica"**: `.salud-grid` con 5 items: Ocupación (% + barra; sub
        "X h citadas de Y h disponibles" o "Configura tu disponibilidad" si null),
        Asistencia (% + barra; sub "X de Y citas marcadas" o "Sin citas marcadas"),
        Producción ($ del día + delta vs ayer), Cobrado ($ del día + delta vs ayer),
        Captación (nº pacientes nuevos + delta vs ayer). Producción/Cobrado con la misma
        regla de acceso finanzas (—).
   - Columna lateral (1fr):
     c. Panel **"Ingresos del día"** (día navegado; solo si acceso finanzas, si no
        `.state-note`): total cobrado grande, mini-gráfico de barras SVG 7 días (barras
        por día, accent; tooltip opcional con <title>), últimos movimientos (hora,
        paciente, +/- monto con formato CLP, kind label Cargo/Pago).
     d. Panel **"Planes de tratamiento"** (snapshot): mini-tabla por estado: Enviados (N —
        $), Aprobados (N — $), Borradores (N), Rechazados/Expirados (N); top 3 recientes
        con link a /estimates y "Ver todos" → /estimates. Si rol assistant → state-note.
     e. Panel **"Evoluciones pendientes"**: dos contadores destacados "Hoy: N" y
        "Total: M" (mono o Space Grotesk grande), lista top 3 citas pendientes con fecha/
        paciente link a `/patients/{patientId}` (ficha), nota "Evolución = nota clínica
        tras la atención". Si rol assistant → state-note.
4. Footer de página discreto: nada extra.

Formato CLP con `Intl.NumberFormat("es-CL", {style:"currency", currency:"CLP",
maximumFractionDigits:0})` (hay helper en lib/locale/cl.ts pero las páginas instancian el
suyo; replicar patrón local en el módulo dashboard).

Accesibilidad: labels en inputs date, aria-current en el segmented activo, botones con
texto visible, focus visible (heredado). Sin emojis. Sin voseo (regla 6).

### T6 — Seed demo aditivo (para que el dashboard muestre datos reales en demo)

Extender `db/seed.ts` (o archivo de seed que ya exista; mantener idempotente y ejecutable
varias veces — revisar convención actual) para la org/clínica demo existente, generando
datos RELATIVOS al día real America/Santiago (para que la demo siempre tenga "hoy"):

- Asegurar `professional_availability` de lunes a viernes (si no existe) para al menos 2
  profesionales demo (jornada 9:00-18:00 con bloques).
- ~6 citas de HOY: mezcla confirmed/pending/cancelled, nombres realistas, al menos 2 con
  patient_id de pacientes demo existentes (crear pacientes si faltan), otras con
  patient_name solo.
- 3-4 citas de días anteriores (ayer/antier): 2 con attendance 'attended' y 1 'missed';
  para 1 atendida NO crear evolución (deja una pendiente en Total) y para otra SÍ crear
  clinical_record posterior (no queda pendiente) — pacientes con patient_id.
- 2-3 pagos posted HOY + 2 de ayer y 1 cargo (charge) hoy (producción), ligados a
  pacientes demo con `evidence` de referencia (para el panel Ingresos y KPIs).
- 2-3 estimates: 1 sent y 1 approved (con estimate_versions total) para el panel Planes.
- 1-2 pacientes creados HOY (created_at hoy) para captación.
Todo bajo la org demo y sin romper fixtures que los tests usen (los tests crean sus propias
orgs — verificar que seed no altere expectativas de tests existentes; si algún test depende
del seed demo, ajustar SOLO lo necesario y documentar).

### T7 — Verificación obligatoria (con evidencia en REPORTE)

1. `timeout 420 npm run build` → PASS (antes: matar next-server zombie si existe y
   `rm -f .next/lock`; `pgrep -af "next build|next-server"`).
2. `timeout 420 npm run test:unit` → PASS incluyendo nuevo `dashboard.test.ts` (solo puede
   fallar `foundation.test.ts` por docker-compose.yml ausente — ajeno, NO tocar).
3. `timeout 420 npm run test:smoke` → PASS.
4. `timeout 420 npm run test:integration` → PASS (o el subconjunto que ya corra en esta
   máquina con la dev DB; replicar procedimiento de briefs previos) + nuevo test de la
   policy clinical para admin (rol app real).
5. `timeout 420 npm run lint` → PASS.
6. `git diff --check` → PASS.
7. Aplicar la migración a la dev DB y verificar columnas/CHECK con una query de evidencia
   (p. ej. `\d appointments` vía tsx/psql en la dev DB).
8. Revisión estática: grep voseo (`Entrá|Gestioná|Conocé|Querés|tenés|podés|Intentá|
   Ingresá|Confirmá|Marcá`) en archivos nuevos → 0.
9. Ruta servida en dev (si levantar dev server es viable y no rompe el build lock):
   opcional; si lo haces, no dejes next-server corriendo al terminar.
10. Confirmar con grep que ningún redirect post-auth quedó en "/agenda" salvo enlaces
    internos legítimos.

## Alcance explícito

- SÍ: ruta /dashboard + panel UI + migración 0009 + queries + mutaciones de
  confirmar/asistencia + redirects post-login + nav "Resumen" + seed aditivo + tests
  (unit dashboard, integración RLS clinical-admin, ajustes menores si algún test existente
  depende de la policy cambiada — justificando en el reporte).
- NO: rediseñar la agenda (/agenda), ni drag&drop, ni cancelación de citas desde el
  dashboard, ni notificaciones nuevas, ni pagos en línea, ni vincular pacientes en el
  booking público, ni tocar `db/migrations/0000-0008`, ni `openspec/*`, ni
  `DESIGN.md`/`PRODUCT.md`, ni `tasks.md`, ni `apply-progress.md`, ni módulos no listados.
- NO commit, NO push, NO deploy: dejar todo en el working tree para el orquestador
  (verifica, commitea y despliega). NO marcar checkboxes de tasks.md (no existe para este
  brief).

## Reglas críticas

- Trabaja SOLO en el working tree de este repo. NO toques otros proyectos ni infra.
- NO imprimas secretos (envs, tokens, DATABASE_URL). Usa paths/archivos para referencias.
- NO borres código existente fuera del alcance; cambios en archivos ajenos solo si un test
  lo exige y con justificación.
- Migración + schema TS + snapshot en paralelo (lección 4).
- runAsTenant SIEMPRE para operaciones DB (lección 1); Number() en bigint (lección 3).
- Fechas con helpers de scheduling/domain, nunca offsets fijos; tests DST doble régimen.
- Textos UI: español de Chile con tuteo; PROHIBIDO voseo (lección 6).
- ⛔ ANTI-BLOQUEO: NUNCA te detengas a esperar aprobación humana. Si algo falla tras 2
  intentos razonables, documenta el fallo con su salida y continúa con la siguiente tarea.
  Todo comando de red con --max-time. El reporte final es OBLIGATORIO aunque algo falle.

## Reporte final

Escribir `REPORTE-CODEX-21.md` en la raíz del repo con:
- Resumen ejecutivo.
- Migración 0009 aplicada: SQL exacto de las columnas/CHECK/función RLS + evidencia de
  aplicación en dev DB + cómo quedó schema TS y snapshot.
- Cambios por archivo (dif breve de cada uno).
- Decisiones de implementación relevantes (p. ej. cómo resolviste los nombres de
  profesionales, formato DayDate, indexación).
- Resultados de verificación T7 con comandos y salidas.
- Detección de voseo: comando y salida.
- Pendientes para el orquestador (migración prod + seed prod + commit/push + deploy).
