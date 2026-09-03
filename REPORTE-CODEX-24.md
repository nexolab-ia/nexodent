# REPORTE-CODEX-24

## Alcance ejecutado

Se completaron T1-T4 en orden, sin modificar server actions, dominio, migraciones ni validaciones de los formularios host.

## Cambios

- `lib/locale/phone-countries.ts`: dataset extensible `PHONE_COUNTRIES`, tipo `PhoneCountry` y país predeterminado derivado del primer registro.
- `components/forms/phone-field.tsx`: nuevo `PhoneField` cliente con valor nacional controlado, normalización a dígitos sin ceros iniciales, valor E.164-like ensamblado en un `input` oculto, bandera de Chile en SVG, fallback neutral y selector preparado para múltiples países.
- `components/layout/topbar-actions.tsx`: ambos teléfonos del alta de paciente usan `PhoneField` con los nombres originales `phone` y `phoneSecondary`.
- `app/onboarding/profile-picker.tsx`: ambos teléfonos usan `PhoneField` con los nombres originales `primaryPhone` y `secondaryPhone`; la validación de `handleSubmit` quedó intacta.
- `app/globals.css`: estilos del control, chip, bandera, menú futuro, foco, error y compatibilidad visual con onboarding.

## Evidencia de verificación

| Comprobación | Resultado |
|---|---|
| `timeout 300 npm run lint` | PASS (exit 0) |
| `timeout 420 npm run build` | PASS (exit 0; compilación, TypeScript y 25 páginas estáticas completadas) |
| `timeout 300 npm run test:unit` | Resultado esperado: 47/48; único fallo preexistente en `tests/unit/foundation.test.ts` por ausencia de `docker-compose.yml` (ENOENT) |
| `timeout 420 npm run test:integration` | PASS: 20/20, 9 archivos |
| `git diff --check` | PASS |
| Usos de `PhoneField` | Confirmados los cuatro nombres: `phone`, `phoneSecondary`, `primaryPhone`, `secondaryPhone` |
| `<input type="tel">` en hosts | Sin coincidencias; el único input telefónico visible está encapsulado en `PhoneField` |
| `+56` fuera del dataset | Sin coincidencias en `app/`, `components/`, `features/` y `lib/` para TS/TSX/CSS |
| Emojis de bandera | Sin coincidencias; la bandera es SVG inline |
| Voseo prohibido del brief | Sin coincidencias para el patrón solicitado |

## Comportamiento comprobado por implementación

- Entrada vacía produce valor oculto vacío, no solamente el prefijo.
- Espacios y caracteres no numéricos se eliminan al ensamblar; los ceros nacionales iniciales se descartan.
- `09 8765 4321` y `9 8765 4321` producen el mismo valor, derivando el prefijo desde el país seleccionado.
- Se conservan `aria-invalid`, `aria-describedby`, alerta de error, asociación del label y foco visible.

## Desvíos y límites

- La suite unitaria conserva el fallo de foundation ya documentado y fuera del alcance; no se creó ni modificó `docker-compose.yml`.
- El build emitió el aviso existente de deprecación de `middleware` y avisos de Better Auth por no configurar un secreto durante el build; no se imprimió ningún valor secreto.
- No había navegador/runtime visual disponible en esta ejecución. La comprobación visual final queda para el gatekeeper en producción después del deploy.
- No se realizó commit, push ni deploy.
