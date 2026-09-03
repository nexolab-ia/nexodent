# Reporte Codex 26 — Organización funcional

## Resultado

T1–T4 quedaron implementadas y verificadas. La página `/settings/organizacion` ahora carga y guarda de forma independiente el perfil de la clínica y su horario, conserva claves ajenas del `settings` JSONB, permite reemplazar o borrar el logo y registra auditoría. No se realizaron commit, push ni deploy.

## Diff resumido

| Archivo | Cambio |
|---|---|
| `components/forms/phone-field.tsx` | `initialValue` opcional con separación aditiva del prefijo `+56`. |
| `app/(app)/settings/organizacion/actions.ts` | Validación, autorización, merge JSONB, borrado de logo, auditoría y redirects para perfil y horario. |
| `app/(app)/settings/organizacion/page.tsx` | Lectura tenant, defaults, banners y las dos tarjetas/formularios solicitados. |
| `components/settings/org-logo-picker.tsx` | Preview, validación MIME, redimensionado a 200×200, carga y eliminación. |
| `app/globals.css` | Composición responsive de tarjetas, grillas, logo, acciones y avisos. |

El diff rastreado del alcance contiene 96 inserciones y 9 eliminaciones; los dos archivos nuevos de implementación suman 178 líneas. No se tocó ninguna migración, política RLS ni otra página. Los documentos no relacionados que ya estaban sin seguimiento se preservaron sin cambios.

## Evidencia automatizada

| Comando | Resultado |
|---|---|
| `timeout 300 npm run lint` | PASS, exit 0. |
| `timeout 300 npx eslint 'components/settings/*.tsx' 'components/forms/phone-field.tsx'` | PASS, exit 0; cubre componentes omitidos por el script principal. |
| `timeout 420 npm run build` | PASS, exit 0; compilación, TypeScript y 28 páginas estáticas completadas. Emitió únicamente la advertencia existente de `middleware` obsoleto y avisos de Better Auth por ausencia deliberada de secreto de build; no se imprimió ningún secreto. |
| `timeout 300 npm run test:unit` | Resultado esperado: 47/48 tests PASS, 11/12 archivos PASS, exit 1. El único fallo preexistente es `foundation.test.ts`, que intenta leer el ausente `docker-compose.yml`. |
| `timeout 420 npm run test:integration` | PASS: 20/20 tests y 9/9 archivos, exit 0. |
| `git diff --check` | PASS, exit 0. |

## Evidencia estática

- El grep encontró todos los labels, títulos y botones requeridos, además de los seis `defaultValue` de nombre, dirección, ciudad, email y horarios.
- `En desarrollo` no aparece en `app/(app)/settings/organizacion/page.tsx` (`grep` exit 1 esperado).
- El patrón de voseo `Entrá|Conocé|tenés|Querés|Ingresá|Gestioná|Registrá|podés` no produjo coincidencias en `app`, `components` ni `features` (`grep` exit 1 esperado).
- La ciudad usa `COUNTRY_OPTIONS[0].regions`, conserva como opción un valor histórico ajeno al dataset y ambos teléfonos usan `primaryPhone`/`secondaryPhone` con `initialValue`.

## Runtime PostgreSQL efímero

En el segundo intento se levantó PostgreSQL efímero, se aplicaron las migraciones y se ejecutó el flujo de persistencia con `nexodent_app` configurado como `NOSUPERUSER NOBYPASSRLS`. El primer intento no resolvió dependencias desde `/tmp`; se corrigió solo el cargador del harness y se repitió una vez, sin modificar el repositorio.

```json
{
  "role": { "superuser": false, "bypassRls": false },
  "name": "Después",
  "markerPreserved": "preserve",
  "contact": {
    "city": "Santiago",
    "address": "Nueva 123",
    "country": "Chile",
    "contactEmail": "after@example.test",
    "primaryPhone": "+56922222222"
  },
  "schedule": { "openTime": "09:00", "closeTime": "18:30" },
  "logoDeleted": true,
  "auditCount": 2,
  "auditReasons": ["settings.organization_profile", "settings.organization_schedule"]
}
```

Esto prueba UPDATE bajo RLS real, reemplazo completo de `contact`, preservación de una clave ajena, merge de `schedule`, borrado JSONB de `logo` y las dos filas de auditoría.

## Desvíos y límites

- El brief nombra `authorize(actor, "org:manage")`, pero el contrato ejecutable de `features/tenant-identity/authorize.ts` define `"organization:manage"`; ambas actions usan ese identificador real. Solo `organization_admin` e `independent_owner` reciben el permiso.
- No se agregaron tests unitarios específicos: la validación quedó cubierta por lint, TypeScript/build, inspección estática y el harness PostgreSQL pedido. El único fallo unitario permanece fuera del alcance.
- No hubo commit, push, deploy, migración nueva ni exposición de secretos.

## Rollback

La unidad se revierte eliminando `actions.ts` y `org-logo-picker.tsx`, restaurando el scaffold de `page.tsx` y retirando únicamente `initialValue` de `PhoneField` y los estilos `.organization-*`, `.settings-card`, `.card-grid`, `.logo-*`, `.form-row`, `.settings-card-actions` y `.notice-banner`; no requiere revertir trabajo ajeno.
