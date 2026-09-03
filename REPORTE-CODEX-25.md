# Reporte CODEX-25 — Configuración Fase 1

Se completaron T1–T3 en orden. La pantalla de Configuración ahora tiene un layout persistente con navegación secundaria y tres rutas scaffold. No se realizó commit, push ni deploy.

## T1 — Layout y navegación

- Se creó `components/settings/settings-nav.tsx` como componente cliente.
- La navegación se genera exclusivamente desde `SETTINGS_SECTIONS`, con la sección **Mi clínica** y los ítems Organización, Plan y Usuarios y permisos.
- Cada ítem incorpora un ícono SVG de línea, área táctil mínima de 44 px y estado activo mediante `aria-current="page"`.
- Se creó `app/(app)/settings/layout.tsx` para mantener el menú y el contenido visibles simultáneamente.
- `app/(app)/settings/page.tsx` redirige a `/settings/organizacion` mediante `redirect()` de Next.js.
- Se añadió a `app/globals.css` el layout de dos columnas, estilos de estados y adaptación móvil con navegación horizontal desplazable.
- El CSS anterior de `.settings-page` y `.settings-links` se conservó para evitar afectar otros usos.

## T2 — Páginas scaffold

| Ruta | Título | Estado | Texto |
|---|---|---|---|
| `/settings/organizacion` | Organización | En desarrollo | Datos de tu clínica o consulta: nombre, ubicación y contacto. |
| `/settings/plan` | Plan | En desarrollo | Suscripción, cobros y medios de pago de tu espacio. |
| `/settings/usuarios` | Usuarios y permisos | En desarrollo | Quiénes acceden a la clínica y con qué rol. |

Las rutas existentes `members`, `sites` y `notifications` no se modificaron y continúan presentes.

## T3 — Evidencia de verificación

| Verificación | Resultado | Evidencia acotada |
|---|---|---|
| `timeout 300 npm run lint` | PASS | ESLint finalizó con código 0. |
| `timeout 420 npm run build` | PASS | Next.js 16.1.1 compiló correctamente, generó 28/28 páginas y enumeró `/settings`, `/settings/organizacion`, `/settings/plan` y `/settings/usuarios`. |
| `timeout 300 npm run test:unit` | FALLO PREEXISTENTE ESPERADO | 47/48 tests pasaron. `tests/unit/foundation.test.ts` falla porque no existe `docker-compose.yml` (`ENOENT` en la línea 19). |
| `timeout 420 npm run test:integration` | PASS | 9 archivos y 20/20 tests pasaron. |
| Comprobación estática de rutas | PASS | Los tres archivos existen y contienen los `h1` requeridos. |
| Navegación basada en datos | PASS | Los tres `href` aparecen una sola vez dentro de `SETTINGS_SECTIONS`; el render itera la constante. |
| Estado activo y CSS | PASS | `aria-current` depende de `usePathname`; están presentes los selectores `settings-layout`, `settings-nav`, `settings-group`, `settings-content` y `settings-badge`. |
| Búsqueda de voseo en archivos nuevos | PASS | Sin coincidencias. |
| Conservación de rutas anteriores | PASS | Existen los `page.tsx` de `members`, `sites` y `notifications`. |

### Advertencias no bloqueantes

- El build muestra la advertencia existente de Next.js sobre la convención obsoleta `middleware` y mensajes de Better Auth porque el entorno usa el secreto predeterminado. No se imprimió ningún secreto y el proceso terminó con código 0.
- Vitest muestra una advertencia sobre sintaxis ESM en `vitest.config.ts`; no afecta el resultado de las suites.

## Verificación UX

- El layout conserva navegación y contenido simultáneos en escritorio.
- En anchos menores a 768 px, la navegación secundaria pasa a una fila horizontal desplazable sin ocultar opciones.
- Todos los enlaces tienen un mínimo de 44 px, estado activo textual/visual y etiquetas accesibles.
- Se reutilizan los tokens de `DESIGN.md`: `--surface-2`, `--ink`, `--muted`, `--accent` y `--border`.
- No se realizó inspección en navegador porque este entorno no dispone de runtime visual. Tras el deploy, el gatekeeper debe validar `GET /settings/organizacion` y el seguimiento del redirect desde `GET /settings`.

## Desvíos

- El manifiesto del build clasifica las rutas de Configuración como dinámicas (`ƒ`) debido al layout protegido existente, no como estáticas. Las cuatro rutas compilaron y el redirect está implementado con la API server de Next.js.
- No se corrigió el fallo unitario conocido porque corresponde a infraestructura fuera del alcance de CODEX-25.

## Archivos del alcance

- `app/(app)/settings/page.tsx`
- `app/(app)/settings/layout.tsx`
- `app/(app)/settings/organizacion/page.tsx`
- `app/(app)/settings/plan/page.tsx`
- `app/(app)/settings/usuarios/page.tsx`
- `components/settings/settings-nav.tsx`
- `app/globals.css`
- `REPORTE-CODEX-25.md`

Los archivos no relacionados que ya estaban sin seguimiento se preservaron sin cambios.
