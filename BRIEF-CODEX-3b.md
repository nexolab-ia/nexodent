# BRIEF-CODEX-3b — NexoDent · CORRECCIÓN de spec: tenant genérico (organización) + multi-sede

## Misión

Corregir los specs existentes para soportar **2 modelos de tenant** y **multi-sede**, decisión de Bryan en la pausa. NO crear specs nuevos; ajustar los existentes. Al terminar, **DETENTE** — no avances a design.

## Cambios requeridos (decisión de Bryan, 2026-09-01)

### 1. Tenant genérico: `organization` (reemplaza el concepto rígido de "clínica")

El tenant pasa de "clinic" a **organization** con un `type`:
- **`clinic`** — clínica/consultorio con N sedes, múltiples profesionales, asistentes, roles completos
- **`independent`** — profesional independiente (1 miembro, sin sedes, rol admin+profesional combinado, misma funcionalidad)

Impacto en modelo de datos (describirlo en el spec, NO implementar):
- Tabla `clinic` → `organization` (id, type: clinic|independent, nombre, datos, settings)
- `site`/sede: solo aplica a type=clinic (1..N); independent tiene 0 sedes o 1 sede implícita
- Toda fila de negocio sigue atada a `organization_id` (+ `site_id` donde aplique); RLS por organización
- Un professional independiente es a la vez admin de su organización y profesional clínico (permisos combinados)

### 2. Multi-sede (clínica con muchas sedes) — REQUISITO NUEVO de Bryan

Una clínica puede tener **muchas sedes**:
- Cada sede tiene su propia **agenda** (boxes/profesionales), **números** (recaudación, producción) y **configuración**
- Un profesional puede atender en una o varias sedes
- Un paciente pertenece a la organización (no a la sede), pero sus citas/cobros se asocian a una sede
- Los reportes pueden filtrarse por sede o consolidarse a nivel clínica
- El admin de clínica ve todo; un profesional ve solo sus citas (en las sedes donde atiende)

## Specs a modificar

1. **tenant-identity** (principal): renombrar/ajustar conceptos a organization (clinic|independent), matriz de permisos con el caso independent (admin+profesional), multi-sede en la matriz, aislamiento RLS por organization_id, auditoría. Mantener TI-001..TI-005 y añadir requisitos nuevos (TI-006: multi-sede, TI-007: tipo independent) con sus escenarios.
2. **scheduling**: citas asociadas a organización + sede + box; profesional independiente sin sede explícita; escenario de agenda por sede.
3. **public-booking**: reserva pública por organización/sede (URL con slug de organización y opcional sede).
4. **clinical-records** (y odontogram si aplica): paciente pertenece a organización; acceso por rol y sede donde aplique.

Revisar los demás specs (estimates, manual-billing, notifications, operational-insights, csv-migration, chile-pwa) para que usen el término correcto (organization/sede donde corresponda) sin cambiar su comportamiento.

## ⛔ REGLAS ANTI-BLOQUEO

1. Si algo falla tras 2 intentos, documenta y continúa.
2. Todo curl con `--max-time 25`.
3. NUNCA esperes aprobación humana DENTRO de la fase.
4. Al terminar, **DETENTE**: actualiza el reporte y NO avances a design.

## REGLAS CRÍTICAS

- NO toques fuera de este directorio. NO modifiques PRODUCT.md ni DESIGN.md.
- NO implementes código — solo editar los specs en `openspec/changes/nexodent/specs/`.
- Mantener los IDs de requisitos existentes (TI-001..) y añadir nuevos sin romper referencias.
- Los permisos siguen MÍNIMOS RESTRICTIVOS.
- El conteo final: 11 specs, requisitos y escenarios actualizados (reportar totales nuevos).

## Verificación con evidencia

1. `tenant-identity/spec.md` refleja organization (clinic|independent) + multi-sede + TI-006/TI-007 con escenarios.
2. `scheduling`, `public-booking`, `clinical-records` usan organization/sede coherentemente.
3. Los demás specs revisados sin cambios de comportamiento.
4. Reportar: total requisitos y escenarios tras la corrección.

## Reporte final

Actualiza `REPORTE-CODEX-1.md` (sección "FASE 3b — corrección tenant") con: qué cambió, nuevos requisitos/escenarios, y confirmación de que no se tocó design.
