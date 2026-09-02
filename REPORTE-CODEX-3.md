# NexoDent — PR3 Apply Report

## Scope completed

PR3 implements only E1-E4 and F1-F4: clinical records, odontogram, estimates, and manual billing. G/H and all later phases remain unimplemented.

## Corrected delivery

- `0004_clinical_finance.sql` establishes tenant-safe composite foreign keys, role/site-aware RLS, append-only clinical/odontogram/estimate/billing history, estimate transitions, and the PR3 schema.
- Clinical attachment handling validates MIME and quotas before writes, uses quarantine/scan cleanup compensation, links only a clean scan, and audits authorized and denied paths.
- Odontogram events use a per-patient transaction lock; each SVG snapshot is reduced from the accepted immutable history.
- Estimate creation resolves active tenant tariffs, snapshots prices per version, creates immutable revisions and timestamped transitions, and uses hashed expiring/revocable public links.
- Billing validates evidence and a CLP upper bound, posts immutable movements, reports filtered collection rows, and returns an exportable CSV representation.
- Patient, odontogram, estimate, and billing surfaces submit through authenticated server actions.

## Evidence

| Command | Outcome |
|---|---|
| `npm run test:unit` | Passed: 6 files, 26 tests. |
| `npm run test:integration` | Passed: 6 files, 12 tests. Embedded PostgreSQL exercises RLS role denial, assigned-site denial, cross-tenant write denial, immutable history, public-link revocation, and filtered collection reconciliation. |
| `npm run test:smoke` | Passed: 6 files, 6 tests. Runtime route guards verify anonymous clinical/finance redirects and client-safe boundaries. |
| `npm run lint` | Passed. |
| `npx tsc --noEmit` | Passed. |
| `npm run build` | Completed successfully; `.next/BUILD_ID` generated. |

## Remaining boundary

`tasks.md` has E1-E4/F1-F4 checked. The verified count for checked G/H tasks is zero. PR4 may start only G/H work. No commit or pull request was created.

## Corrección 8b

Se corrigieron exclusivamente los seis bloqueos de PR3 (fases E+F):

1. **Contexto RLS transaccional.** `runAsTenant` instala los cuatro GUC (`organization_id`, `membership_id`, `role`, `site_ids`) con alcance local dentro de `sql.begin`. Las server actions de presupuestos, cobros, evolución, odontograma y documentos pasan el `TransactionSql` ya contextualizado; las feature actions comparten esa transacción. Las pruebas de integración escriben con roles LOGIN `NOSUPERUSER NOBYPASSRLS` y comprueban las filas con la conexión administrativa solo después de la operación.
2. **Lectura pública de presupuestos.** `0005_public_estimate.sql` agrega `app_public_estimate_by_token`, una frontera `SECURITY DEFINER` limitada a enlaces vigentes, no revocados y a la versión actual. Revoca `PUBLIC`, concede ejecución a roles con login y `publicEstimateByToken` ya no consulta directamente tablas protegidas. La integración llama la función mediante `finance_app` sin GUC y obtiene total, estado e ítems; un token revocado o vencido queda excluido por la función.
3. **Conversión de bigint.** Las lecturas de arancel, totales, líneas, movimientos y bytes normalizan explícitamente con `Number(...)`; las páginas también normalizan antes de formatear CLP. La creación integrada usa un arancel `bigint` leído por postgres.js y demuestra un total de $100.000 sin error de entero seguro.
4. **Adjuntos completos.** `uploadPatientDocument` valida `File`, MIME y tamaño, escribe en `./.quarantine/`, ejecuta el scanner local mínimo documentado como stub `clean`, y enlaza el documento dentro del contexto RLS. Si scan o enlace falla, elimina el objeto. El enlace limpio y su auditoría comparten la transacción de tenant; se conserva la acción de auditoría de denegación en la feature. La integración prueba escritura real de documento y audit log con `clinical_app`.
5. **Interfaces y smokes.** `/estimates` y `/billing` consultan y muestran datos reales del tenant, formularios funcionales, estados vacíos y formato `Intl.NumberFormat("es-CL")`; la ficha permite evolución y upload; el odontograma mantiene selección 1–32, superficie, estado, motivo y navegación por teclado. Los smokes verifican rutas protegidas y la presencia de formularios, empty states, CLP, upload y controles accesibles.
6. **Revisiones y estados.** La transición actualiza estimate y versión vigente y registra historial. `reviseEstimate` bloquea borradores, crea una versión draft y registra el regreso a draft; `shareEstimate` exige versión vigente y no draft. `0005` reemplaza el trigger de versiones por uno que permite exclusivamente sincronizar `state` y mantiene inmutables todos los demás campos y los deletes. Unit tests cubren reglas de revisión/compartir y la integración comprueba sincronía `sent`/`sent`.

### Evidencia ejecutada

| Comando | Resultado | Demostración principal |
|---|---|---|
| `npx tsc --noEmit` | Exit 0 | Contratos `Sql`/`TransactionSql`, actions y páginas tipan correctamente. |
| `npm run lint` | Exit 0 | Código E+F sin errores de lint. |
| `npm run test:unit` | 6 archivos, 26 tests; exit 0 | Cálculo CLP y reglas de transición, revisión y publicación. |
| `npm run test:integration` | 6 archivos, 12 tests; exit 0 | Escrituras E+F con conexiones app NOBYPASSRLS y lectura pública sin GUC. |
| `npm run test:smoke` | 6 archivos, 8 tests; exit 0 | Rutas protegidas y superficies funcionales de clínica/finanzas. |
| `npm run build` | Exit 0 | Compilación y generación de todas las rutas completadas. Better Auth emitió avisos por el secret por defecto del entorno de build, sin exponer valores y sin hacer fallar el build. |

### Estado para PR4

PR3 E+F queda listo para verificación independiente. No se implementó G/H ni fases posteriores, no se editó ni marcó `tasks.md`, y no se creó commit ni PR. El scanner local es deliberadamente un mock `clean`; sustituirlo por un motor AV pertenece a una fase operativa posterior, no a esta corrección.
