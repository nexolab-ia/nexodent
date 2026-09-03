# REPORTE-CODEX-23-B

## Resultado

T1-T3 ejecutadas en orden. No se realizó commit, push ni deploy.

## Cambios exactos

- `components/layout/topbar-actions.tsx`
  - Importa `COUNTRY_OPTIONS` desde `app/onboarding/regions.ts`.
  - Deriva las regiones con `const regions = COUNTRY_OPTIONS[0].regions`.
  - Reemplaza el input libre de `city` por un `select` con placeholder deshabilitado y `optgroup` por región; cada opción envía el nombre visible de la ciudad.
  - Dirección y flujo de persistencia permanecen sin cambios.
- `app/globals.css`
  - Amplía `.patient-dialog` de `min(30rem, 100%)` a `min(36rem, 100%)`.
  - El bloque móvil `@media (max-width: 767px)` no fue modificado.

Resumen del diff funcional al verificar: 2 archivos, 17 inserciones y 2 eliminaciones.

## Evidencia de verificación

| Comando | Resultado |
| --- | --- |
| `timeout 300 npm run lint` | PASS, exit 0. |
| `timeout 420 npm run build` | PASS, exit 0. Compilación, TypeScript y generación de 25 páginas completadas. Se observaron avisos no bloqueantes ya existentes sobre la convención `middleware` y el secreto por defecto de Better Auth; no se imprimió ningún valor secreto. No apareció `.next/lock`, por lo que no fue necesaria limpieza. |
| `timeout 300 npm run test:unit` | Resultado esperado del brief: 47/48 PASS; exit 1 únicamente por `tests/unit/foundation.test.ts`, que no encuentra el archivo preexistente ausente `docker-compose.yml`. 11/12 archivos de prueba pasaron. |
| `timeout 420 npm run test:integration` | PASS, exit 0: 20/20 tests y 9/9 archivos. |
| `git diff --check` | PASS, sin errores. |

### Comprobaciones estáticas

- `components/layout/topbar-actions.tsx` contiene el import de `COUNTRY_OPTIONS`, `const regions = COUNTRY_OPTIONS[0].regions`, `<select name="city" defaultValue="">` y el placeholder `Selecciona una ciudad…` deshabilitado.
- No existe `<input name="city"` en el source del drawer.
- El render recorre `regions`, crea un `optgroup` por `region.id`/`region.label` y usa el nombre de cada ciudad como `value`.
- `grep -rnoE "Entrá|Conocé|tenés|Querés|Ingresá|Gestioná|Registrá|podés" app/ components/ features/ --include="*.tsx"` no produjo coincidencias (exit 1 esperado de `grep`).
- `.patient-dialog` usa `width: min(36rem, 100%)`; la regla móvil conserva `width: 100%`, `.form-row` conserva sus dos columnas en desktop y `.field-full` no cambió.

## Runtime/navegador

No hay ejecutable de Chromium, Chrome o Firefox disponible ni dependencia `playwright` instalada en este entorno. No se ejecutó inspección visual en navegador; corresponde al gatekeeper validar el resultado visual en producción después del deploy.

## Desvíos

Ninguno respecto del brief. No se modificó `app/onboarding/regions.ts`, acciones de servidor, dominio, migraciones ni tests.

## Límite de rollback

Revertir únicamente:

1. El import y la constante `regions`, y restaurar el input `city` en `components/layout/topbar-actions.tsx`.
2. Restaurar `width: min(30rem, 100%)` en `.patient-dialog` dentro de `app/globals.css`.
3. Eliminar este reporte.

Ese rollback retira exclusivamente el selector geográfico y el ancho ampliado, sin afectar el dataset compartido ni trabajo ajeno presente en el worktree.
