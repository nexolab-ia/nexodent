# BRIEF-CODEX-31 — Sembrar disponibilidad (L-V 10:00-20:00) del owner demo en provision

## Contexto

NexoDent corre en producción (Coolify, dental.nexolabs.cloud). Bryan (dueño del producto) usa una cuenta **demo** creada por onboarding: user `simon.mendoza186@gmail.com` (nombre "Simón Mendoza", org "Simón Mendoza - Odontologo"). La pantalla **Configuración → Usuarios** (`/settings/members`, BRIEF-CODEX-30) lee `professional_availability` para pintar los días "L M X J V" en la tarjeta de cada miembro. Hoy el owner demo **no tiene availability** en producción → su tarjeta no muestra horarios, y Bryan pidió que quede con **L M X J V 10:00-20:00** (su spec visual lo muestra así).

La app NO tiene UI para crear `professional_availability` (solo lecturas en features/scheduling/actions.ts, features/dashboard/actions.ts y members). La disponibilidad se siembra en BD: `db/fixtures/demo.ts` (líneas ~184-186) inserta con `INSERT ... SELECT ... WHERE NOT EXISTS` para las orgs demo del fixture. El `db/provision.ts` (one-shot en cada despliegue, corre con `DATABASE_URL_ADMIN` = BYPASSRLS) es el punto idempotente que ya siembra fixture + credencial demo — ahí va el nuevo bloque.

## Tarea (única, quirúrgica)

Editar `db/provision.ts` agregando un **paso 6** después del paso 5 (credencial demo, línea ~101 antes de `console.info("Provision: listo.")`), con este comportamiento idempotente:

1. Email del owner demo en constante local: `const demoOwnerEmail = "simon.mendoza186@gmail.com";` con comentario `// MOCK-demo: org del dueño del producto creada por onboarding (Bryan).`
2. Resolver la membership owner activa de esa org (rol `organization_admin` o `independent_owner`, status `active`, la más antigua por `created_at`):
   ```sql
   SELECT m.id AS membership_id, m.organization_id, u.email
   FROM memberships m JOIN users u ON u.id = m.user_id
   WHERE u.email = <demoOwnerEmail>
     AND m.role IN ('organization_admin', 'independent_owner')
     AND m.status = 'active'
   ORDER BY m.created_at ASC LIMIT 1
   ```
3. Si no existe (usuario/org ausentes): `console.info("Provision: owner demo no encontrado, se omite disponibilidad.")` y **NO fallar** (idempotente en ambientes sin esa org, p. ej. CI o BD sin onboarding).
4. Si existe: insertar availability de **lunes a viernes 10:00-20:00** con `site_id NULL` siguiendo EXACTAMENTE el patrón de `db/fixtures/demo.ts` líneas 184-186 (INSERT ... SELECT ... WHERE NOT EXISTS por weekday; usa `qlit`/`qident` de provision para valores; weekdays: `mon`,`tue`,`wed`,`thu`,`fri`; `starts_at` = `'10:00'`, `ends_at` = `'20:00'`):
   - Insertar los 5 weekdays en un solo `admin.unsafe` multi-VALUES o un loop; **idempotente**: si ya existe la fila (org+membership+weekday), no duplicar.
5. Log: `console.info("Provision: disponibilidad L-V 10:00-20:00 sincronizada para owner demo.")`

## Reglas

- Tocar SOLO `db/provision.ts`. NO migraciones, NO schema, NO fixtures, NO UI, NO tests (no hace falta test nuevo: es data fix de provision idempotente).
- NO commit, NO push, NO deploy (gatekeeper). NO imprimir secretos ni valores de env.
- Estilo del archivo: comentarios en español, SQL vía `admin.unsafe`, helpers `qlit`/`qident` ya existentes.
- Verificación: `npm run lint` (sin errores nuevos) y `npm run build` (debe pasar; si falla SOLO por el docker-compose preexistente, documentarlo).
- Escribir `REPORTE-CODEX-31.md` en la raíz con: archivo cambiado, snippet del bloque agregado, salida de lint/build, desviaciones (si las hay).

## Anti-bloqueo

- Si algo falla tras 2 intentos, documenta y continúa con la siguiente parte de la tarea. No te detengas a esperar aprobación.
- Si una edición falla por sandbox/bwrap, usa escritura directa por shell.
- Reporte final OBLIGATORIO aunque todo falle.
