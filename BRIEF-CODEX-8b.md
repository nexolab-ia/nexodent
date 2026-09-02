# BRIEF-CODEX-8b — NexoDent · CORRECCIÓN PR3 (E+F): 6 bloqueos con causa raíz

## Misión

Corregir los **6 bloqueos** que la verificación independiente del orquestador encontró en PR3 (fases E+F: clinical + odontogram + estimates + billing). NO implementar G/H ni nada de fases posteriores. Al terminar, actualiza `REPORTE-CODEX-3.md` (sección "Corrección 8b") y DETENTE. NO marques tareas en tasks.md (el orquestador las marca SOLO tras verificar).

## Contexto (NO reabrir)

PR3 implementó E1-F4 pero **NO quedó validado**. El orquestador verificó y encontró 6 bloqueos reales. Los tests pasan (26 unit / 12 integración / 6 smoke) porque **usan la conexión `admin` (superusuario) o GUCs pre-seteado a mano**, enmascarando fallos que ocurren en runtime real con la conexión de la app bajo FORCE RLS. Tu trabajo: corregir la causa raíz y que los tests lo demuestren con la conexión `app` (rol NOBYPASSRLS), no con admin.

## ⚠️ Diagnóstico del orquestador (verificado empíricamente — NO re-diagnosticar, corregir)

### BLOQUEO 1 — Acciones sin contexto RLS transaccional (CRÍTICO, afecta todo PR3)

**Causa raíz**: las server actions (`app/(app)/estimates/actions.ts`, `app/(app)/patients/[patientId]/actions.ts`, `app/(app)/billing/actions.ts`) resuelven el actor con `requestTenantContext()` pero luego llaman las feature actions con `sql` directo. Las feature actions (`createEstimate`, `reviseEstimate`, `transitionEstimate`, `shareEstimate`, `revokeEstimateLink`, `postManualMovement`, `collectionReport`, `createPatient`, `addEvolution`, `attachClinicalDocument`, `appendOdontogramEvent`) ejecutan INSERT/UPDATE/SELECT **sin instalar el GUC de tenant** (`app.organization_id`, `app.role`, `app.site_ids`) en la transacción. Bajo FORCE RLS (todas las tablas PR3 lo tienen), toda operación devuelve 0 filas o falla en runtime real.

**Fix requerido**: crear en `lib/tenancy.ts` (o archivo nuevo `lib/run-as-tenant.ts`) un helper:
```ts
export async function runAsTenant<T>(sql: Sql, actor: TenantContext, work: (tx: TransactionSql) => Promise<T>): Promise<T> {
  return sql.begin(async (tx) => {
    await tx.unsafe("SELECT set_config('app.organization_id', $1, true), set_config('app.membership_id', $2, true), set_config('app.role', $3, true), set_config('app.site_ids', $4, true)", [actor.organizationId, actor.membershipId, actor.role, actor.siteIds.join(",")]);
    return work(tx);
  });
}
```
Luego **TODAS las feature actions de PR3** deben ejecutar su lógica dentro de `runAsTenant` (o aceptar ya un `TransactionSql` con contexto instalado) y **las server actions** deben envolver la llamada: `await runAsTenant(sql, actor, (tx) => createEstimate(tx, actor, ...))`. NO uses set_config con `false` (session-level): debe ser `true` (transaction-local) dentro de `sql.begin`. Revisa `features/tenant-identity/actions.ts` (PR1, ya tiene el patrón `sql.begin`) y `lib/tenancy.ts` como referencia.

### BLOQUEO 2 — Consulta pública de presupuestos rota bajo RLS (CRÍTICO)

**Causa raíz**: `publicEstimateByToken` en `features/estimates/actions.ts` hace SELECT a `estimate_links/estimate_versions/estimates/estimate_items` que tienen FORCE RLS con policies `app_estimate_allowed()` (exigen rol y GUC). Un paciente con token público NO tiene sesión ni GUC → RLS devuelve 0 filas → **la página `/e/[token]` siempre muestra "no disponible"**. El test lo enmascara llamando con `admin`.

**Fix requerido**: imitar el patrón de booking público (migración `0003`): crear **migración `0005_public_estimate.sql`** con una función `SECURITY DEFINER` acotada, p.ej. `app_public_estimate_by_token(p_token_hash varchar)` que devuelva la versión pública vigente (sin expirar, no revocada, join a estimate_versions/estimates/estimate_items) con su total y items, REVOKE de PUBLIC + GRANT a roles con login (DO block igual que 0003). `publicEstimateByToken` debe llamar esa función. La función SOLO revela datos de un token válido no revocado — misma semántica que `app_public_booking_context`.

### BLOQUEO 3 — Conversión incorrecta de precios bigint (CRÍTICO)

**Causa raíz (verificado con sonda en Postgres embebido)**: postgres.js devuelve columnas `bigint` como **string** (`"50000"`), no como number. `resolveTariffLines` en `features/estimates/actions.ts` tipa `priceClp: number` y lo pasa directo a `calculateEstimate`, que valida `Number.isSafeInteger(...)` → **siempre lanza "montos CLP válidos"** → no se puede crear NINGÚN estimate en runtime. `collectionReport` (manual-billing) SÍ hace `Number(row.amountClp)` — ese es el patrón correcto.

**Fix requerido**: en TODA lectura de columna bigint (price_clp, total_clp, unit_price_clp, line_total_clp, discount_clp, amount_clp, byte_size, balance) convertir explícitamente con `Number(...)` al mapear filas. Revisa: `resolveTariffLines`, `publicEstimateByToken` (total + items), `features/manual-billing/actions.ts` (ya ok en collectionReport pero verifica), cualquier otro SELECT de montos en features/ y app/. Los INSERT con números JS están bien (postgres.js los serializa).

### BLOQUEO 4 — Flujo de adjuntos y auditoría incompleto

**Causa raíz**: `lib/storage.ts` define `QuarantineStore` + `uploadAndLinkClinicalDocument` (cuarentena→scan→link con compensación) pero **nadie lo usa**: `attachClinicalDocument` en `features/clinical-records/actions.ts` recibe `storageKey`/`scanStatus:"clean"` ya resueltos, no hay server action de upload que reciba el File, lo ponga en cuarentena, lo escanee y solo linkee si está clean. El flujo real de adjuntos no está conectado a la UI ni auditado de extremo a extremo.

**Fix requerido**: implementar una server action `uploadPatientDocument(patientId, formData)` (en `app/(app)/patients/[patientId]/actions.ts`) que: valide el File (MIME/tamaño), lo escriba en cuarentena (implementación mínima local en `lib/storage.ts` con filesystem bajo `./.quarantine/` o interface inyectable para tests), ejecute el scan (mock "clean" documentado), y solo entonces llame `attachClinicalDocument` (que debe ejecutarse con runAsTenant). Si el link a DB falla, compensar borrando el objeto en cuarentena. Auditoría: mantener `clinical.document_denied` y `clinical.document_linked` en audit_logs dentro de la misma transacción.

### BLOQUEO 5 — Interfaces financieras y pruebas de aplicación incompletas

**Causa raíz**: `app/(app)/estimates/page.tsx` y `app/(app)/billing/page.tsx` son **placeholders de 2 líneas**. F3 pide: aranceles (fee schedules), creación de cotización itemizada, cobros manuales, estado de cuenta, montos CLP con formato chileno y navegación con estado vacío. F4 pide pruebas de aplicación (smokes reales). E3: `app/(app)/patients/[patientId]/page.tsx` y el control odontogram (`components/odontogram/odontogram-control.tsx` de 7 líneas) son mínimos.

**Fix requerido**: implementar UI funcional mínima pero REAL en español usando el layout existente y las server actions ya creadas:
- `/estimates`: listar cotizaciones del tenant + formulario para crear cotización (paciente + línea de arancel) vía `createEstimateDraft`; CLP con `Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })` (patrón ya usado en `app/e/[token]/page.tsx`).
- `/billing`: listar movimientos + formulario de pago manual vía `registerManualPayment` + estado de cuenta con total.
- `app/(app)/patients/[patientId]/`: pestañas básicas (ficha + evolución + odontograma) y formulario de evolución vía `createClinicalEvolution`.
- Odontogram: control accesible funcional (selección de diente 1-32, superficie, estado, razón) que llame `recordOdontogramChange`; keyboard/focus básico.
- Añadir smokes que rendericen las rutas con sesión simulada o al menos verifiquen que las páginas existen y responden (sigue el patrón de `tests/smoke/clinical.spec.ts` y `finance.spec.ts` existentes).
- Las páginas deben manejar estado vacío (mensaje claro) y montos CLP.

### BLOQUEO 6 — Inconsistencias en revisiones y estados públicos de presupuestos

**Causa raíz**: (a) `reviseEstimate` crea una versión nueva con `state='draft'` y hace UPDATE de `estimates.state='draft'` **sin registrar la transición en `estimate_transitions`** y sin validar que el estado actual permita revisión (un estimate 'approved' o 'sent' no debería poder revisarse sin regla clara, o debe registrarse la transición draft). (b) `transitionEstimate` actualiza `estimates.state` pero **NO actualiza `estimate_versions.state`** de la versión vigente → la versión 1 queda en 'draft' aunque el estimate esté 'sent'/'approved', y `publicEstimateByToken`/UI muestran estado viejo. (c) `shareEstimate` no valida que la versión sea la vigente ni que el estado permita compartir (no compartir drafts).

**Fix requerido**: 
- `transitionEstimate`: dentro de la misma transacción, además de UPDATE a `estimates`, hacer UPDATE a `estimate_versions SET state = target WHERE estimate_id = ... AND version = estimates.current_version` (o modelar estado en versión). 
- `reviseEstimate`: validar el estado actual (solo 'sent'/'approved'/'rejected'/'expired' → vuelve a draft con nueva versión; o define regla en domain.ts `nextEstimateState`); registrar `estimate_transitions` cuando corresponda; la versión nueva es 'draft' y el estimate pasa a draft.
- `shareEstimate`: rechazar si la versión no es la vigente o el estado es 'draft' (validación en domain.ts + en la action).
- Añadir tests unitarios de estas reglas en `tests/unit/finance.test.ts`.

## Reglas

- NO modifiques migraciones 0000-0003. La 0004 existe (no tocar salvo fix mínimo justificado y documentado). Cambios de schema → `0005_public_estimate.sql` (y si necesitas más, `0006_*.sql`).
- NO modifiques PRODUCT.md, DESIGN.md, specs, design.md, tasks.md ni REPORTE-CODEX-{1,2}.md. Actualiza SOLO `REPORTE-CODEX-3.md`.
- NO imprimas ni guardes secretos.
- Textos UI en español; identificadores en inglés. CLP = bigint entero.
- Postgres embebido para integración (ya funciona).

## Verificación obligatoria (los tests DEBEN usar la conexión app, no admin)

1. `npx tsc --noEmit`, `npm run lint` → limpio.
2. `npm run test:unit` → pasa (agrega tests de reglas de estado, bigint number, y los que hagan falta).
3. `npm run test:integration` → pasa; **los tests de acciones (createEstimate, postManualMovement, addEvolution, appendOdontogramEvent, attachClinicalDocument) deben ejecutarse con la conexión app (rol NOBYPASSRLS) vía runAsTenant y verificar escritura real**; `publicEstimateByToken` debe probarse con la conexión app (rol limitado, sin GUC) y devolver la estimación → demuestra fix RLS público.
4. `npm run test:smoke` → pasa con las páginas nuevas.
5. `npm run build` → exit 0.
6. Lista en el reporte: qué archivos tocaste por bloqueo y cómo cada test demuestra el fix (no solo "pasa").

## Reporte

Actualiza `REPORTE-CODEX-3.md` con sección "Corrección 8b": bloqueos corregidos, evidencia por bloqueo, y estado para PR4. Sé honesto: si algo no queda corregido, documéntalo explícitamente.
