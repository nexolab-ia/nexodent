# Diseño: MVP piloto de NexoDent

## 1. Arquitectura de aplicación

Monolito modular Next.js 16: `app/` contiene rutas, layouts, Server Components, actions y handlers; `features/<dominio>/` concentra casos de uso, permisos, consultas y validación; `db/schema/`, `db/queries/` y `db/migrations/` contienen Drizzle/RLS; `components/ui/` y `components/layout/` implementan Shadcn y el sistema visual; `lib/` alberga auth, tenancy, storage, correo y formatos; `workers/` ejecuta recordatorios, avisos e importaciones. Los Server Components leen datos; actions/handlers autentican, autorizan y mutan dentro de una transacción RLS. Solo agenda drag-and-drop, odontograma SVG, formularios y controles interactivos son Client Components.

La misma imagen Docker expone `web` y un proceso `worker` separado en Coolify; cron despierta jobs y el worker reclama trabajo con `FOR UPDATE SKIP LOCKED`. No se usan intervalos dentro del servidor web: evitaría ejecuciones duplicadas al escalar. Cada job posee clave idempotente, intentos acotados y estado terminal.

## 2. Esquema Postgres y RLS

Todas las PK son UUID; importes son `bigint` CLP y tiempos `timestamptz`.

| Tabla | Columnas/relaciones clave |
|---|---|
| `organizations` | `type clinic|independent`, `slug`, `name`, `settings`; padre del tenant |
| `sites` | `organization_id`, `slug`, zona, configuración; único por organización |
| `users` / `memberships` | Better Auth user; membresía con `organization_id`, rol, estado; `membership_sites` N:M |
| `audit_logs` | organización, sede opcional, actor, acción, entidad, antes/después, motivo, IP/UA |
| `patients` | organización, RUT normalizado, contacto, consentimientos, retención/hold; no pertenece a sede |
| `boxes`, `working_hours`, `professional_availability` | sede, profesional, intervalos y excepciones |
| `appointments`, `appointment_events` | organización, sede opcional, paciente, profesional, box, intervalo, estado; historial inmutable |
| `clinical_records`, `odontogram_events`, `documents` | paciente, sede opcional, autor; evolución/evento versionado/objeto con MIME, tamaño y scan |
| `fee_schedules` | organización, código, nombre, precio, vigencia |
| `estimates`, `estimate_versions`, `estimate_items`, `estimate_links` | paciente, estado; snapshot inmutable e ítems; hash de token, versión, expiración/revocación |
| `charges`, `payments` | paciente, sede, profesional, monto, evidencia, motivo, estado; correcciones enlazan movimiento previo |
| `notifications`, `notification_attempts` | cita, canal, consentimiento, fecha debida, payload mínimo, estado/intentos |
| `insights`, `insight_decisions` | regla/versión, alcance, evidencia JSON, ventana/frescura, sugerencia, estado, actor/motivo |
| `migration_batches`, `migration_rows` | organización, hash+mapping, etapa, uploader; fila, source key, validación, destino/error |

`btree_gist` habilita dos constraints de exclusión sobre `tstzrange(start_at,end_at)`: por `(organization_id, professional_id)` y por `(site_id, box_id)`, filtradas a estados activos. La reserva usa transacción; el constraint decide la carrera y una clave idempotente evita reenvíos.

RLS se habilita y fuerza en cada tabla de negocio: `organization_id = current_setting('app.organization_id')::uuid`; pacientes se filtran por tenant y registros con sede además exigen `site_id IS NULL OR site_id = ANY(app.site_ids)`, salvo admin. Un wrapper Drizzle abre transacción, ejecuta `SET LOCAL app.*` desde una membresía verificada y luego consulta; la conexión de aplicación no tiene `BYPASSRLS`. FK/unique compuestos incluyen `organization_id` para impedir referencias cruzadas. Rutas públicas usan rol restringido y funciones dedicadas, nunca una sesión privilegiada.

## 3. Autenticación, sesión y permisos

Better Auth gestiona identidad y cookie segura; el callback selecciona una membresía activa e incorpora `membership_id`, `organization_id`, rol y `site_ids`. Middleware solo redirige/protege familias de rutas; cada Server Action/handler llama `authorize(capability, resourceSite)` y vuelve a validar membresía en DB. Admin gestiona tenant/sedes/membresías, operaciones, cobros y auditoría; profesional opera clínica, odontograma, presupuestos y agenda propia en sedes asignadas; asistente solo demografía, agenda y comunicaciones. El independiente combina admin+profesional sin sede explícita. Denegaciones sensibles se auditan sin revelar existencia.

## 4. Odontograma SVG

`features/odontogram/model.ts` define piezas permanentes 1–32, superficies y estados permitidos; el SVG es una proyección, no la fuente clínica. Cada cambio agrega `odontogram_events(patient_id,tooth,surface,state_before,state_after,reason,actor_id,occurred_at,version)` y el estado actual se reduce o materializa transaccionalmente; corregir agrega otro evento. Cada pieza es un control con nombre accesible, foco visible, flechas para navegar, Enter/Espacio para seleccionar, leyenda no dependiente del color e historial ordenado. No diagnostica ni recomienda tratamientos.

## 5. Reserva pública

`/r/[orgSlug]?site=<slug>` resuelve organización/sede publicadas mediante un access-token opaco cuyo hash, alcance, versión, expiración y revocación se persisten. GET devuelve solo marca, servicios y slots calculados; POST valida campos mínimos, consentimiento y rate limit por ruta+cliente, y crea una cita pendiente/confirmada con la misma transacción y constraints de agenda. Un conflicto devuelve alternativas, no datos internos. Slug, token o sede inválidos comparten respuesta no reveladora.

## 6. Avisos operativos

Reglas versionadas ejecutan SQL tenant/sede: **agenda vacía**, `generate_series` de horas/availability menos citas activas y umbral de bloques consecutivos; **controles pendientes**, última cita/evolución anterior al umbral, sin cita futura y con consentimiento; **tratamientos sin pago**, cargos de presupuestos aprobados/completados menos pagos/créditos posteados con saldo positivo. Cada aviso guarda IDs fuente, cálculo, ventana, `evaluated_at`, frescura/incertidumbre y texto de sugerencia. `Aplicar` crea una sola acción operativa idempotente (borrador de contacto o lista filtrada); `Descartar` guarda motivo. Ambas decisiones se auditan. Reglas de diagnóstico, tratamiento o inferencia clínica se excluyen explícitamente y registran `excluded_category`.

## 7. Migración CSV

Flujo: `upload → mapping → validation → preview → import → reconciliation`. El handler valida CSV UTF-8, 20 MB/100000 filas, almacena objeto en cuarentena y calcula SHA-256 de bytes+mapping. El worker parsea en streaming, normaliza RUT/CLP/fechas Santiago y guarda errores por fila; ninguna fila se importa antes de aceptar preview. Una transacción por lote hace upsert mediante `(organization_id,source_type,source_key)` y asigna sede a citas futuras; `(organization_id,batch_hash,mapping_hash)` es único. Repetir retorna cero duplicados; conciliación informa creados, actualizados, rechazados y pendientes humanos.

## 8. Datos demo realistas

Seed determinista y repetible crea **Clínica Sonrisa Andes**, sedes Providencia y Ñuñoa, tres profesionales, una asistente, ~20 pacientes, agenda pasada/futura, odontogramas versionados, presupuestos y abonos parciales; crea además **Dra. Valentina Rojas** como organización independiente admin+profesional sin sede. Nombres, teléfonos y correos se marcan ficticios; RUTs usan checksum/formato válido pero rangos reservados para demo; montos son CLP plausibles. El seed produce conflictos evitados y evidencia para las tres reglas, sin reutilizar personas reales.

## 9. Despliegue, procesos y amenazas

Dockerfile multi-stage (`deps → next build standalone → node runtime` no-root); Coolify ejecuta web Node, worker separado y Postgres con volumen, backups/restauración ensayada. Health checks: `/` para disponibilidad y `/api/health/ready` para DB. Variables, sin valores: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `APP_URL`, `STORAGE_*`, `EMAIL_*`, `WORKER_*`, `RATE_LIMIT_*`.

| Frontera | Aplicabilidad y respuesta | RED planificado |
|---|---|---|
| Rutas tipo documento | N/A: no se clasifican/ejecutan archivos por nombre | Ninguno |
| Selección Git | N/A: sin automatización VCS | Ninguno |
| Estado commit | N/A: sin commits automatizados | Ninguno |
| Estado push | N/A: sin push automatizado | Ninguno |
| Comandos PR | N/A: sin PR automatizado | Ninguno |

El límite de proceso sí aplica: web y worker solo aceptan comandos fijos del contenedor; nunca interpolan CSV, rutas ni tenant en shell. RED: dos workers no duplican jobs; job fallido reintenta acotadamente; payload malicioso permanece como dato y no ejecuta procesos.

## 10. Design tokens y layout

`app/globals.css` expondrá `--bg:#0B1120`, `--surface:#111A2E`, `--surface-2:#1A2740`, `--ink:#F1F5F9`, `--muted:#94A3B8`, `--accent:#22D3EE`, `--accent-strong:#06B6D4`, `--success:#34D399`, `--warning:#FBBF24`, `--danger:#F87171`, `--border:#243249`, `--radius:14px` y `--shadow:0 8px 30px rgba(2,6,23,.5)`. Tailwind mapea estos tokens; Space Grotesk es display, Inter UI y JetBrains Mono IDs/códigos. `components/layout/` define shell dark responsive, sidebar/topbar y densidad de agenda; foco visible, contraste AA, errores inline y 360 px sin overflow son obligatorios. La PWA cachea solo shell estático: auth, datos clínicos y cobros nunca quedan disponibles ni mutables offline.
