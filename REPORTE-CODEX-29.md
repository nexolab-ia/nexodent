# REPORTE-CODEX-29

## Alcance entregado

- Se implementó la subnavegación accesible de Plan con las vistas Renovar plan y Agregar profesionales.
- La nueva vista incluye banner informativo, stepper de 1 a 10, desglose proporcional, confirmación, pago MercadoPago simulado y estado de éxito.
- El mock mantiene profesionales y pagos en memoria; el precio mensual y los períodos se recalculan al agregar profesionales.
- El cálculo usa el factor exacto `35 / 30` para cobrar `$5.425`; la representación solicitada del factor es `× 1,16`.
- Se incorporó el panel desplegable de transferencia con datos bancarios demo y monto contextual en ambas vistas.
- El historial compartido registra renovaciones y altas de profesionales con concepto, monto, fecha, método y estado.
- Se agregaron estilos responsive, estados disabled/hover/focus-visible, targets de 44 px y soporte del reduced motion existente.
- Ambos paneles de la subnavegación permanecen montados y usan `hidden`, por lo que cada `aria-controls` conserva un destino válido.

## Archivos cambiados

- `components/billing/use-billing-demo.ts`
- `components/billing/plan-page.tsx`
- `components/billing/plan-tab.tsx`
- `app/globals.css` (bloque Billing)
- `REPORTE-CODEX-29.md`

## Evidencia de verificación

- `npm run lint`: aprobado, sin errores.
- `npm run build`: aprobado; 27 páginas generadas. Solo advertencias preexistentes de middleware y secreto demo de Better Auth.
- `npm run test:unit`: 47/48 aprobados; único fallo preexistente por ausencia de `docker-compose.yml` en `foundation.test.ts`.
- `npm run test:integration`: aprobado, 20/20 tests.
- `git diff --check`: aprobado.
- Anti-voseo (`Agregá|Tenés|Pagás|Querés|Podés|Sumá`): 0 coincidencias.
- Escaneo Unicode de emojis en los archivos alcanzados: 0 coincidencias.
- Validación aritmética: `4650 * 35 / 30 = 5425`; salida CLP esperada `$5.425`.

## UX checks y desviaciones

- Se revisó estructuralmente la jerarquía desktop/mobile y el comportamiento responsive bajo 620 px.
- No se realizó captura visual automatizada: el proyecto no incluye un navegador de prueba configurado y la ruta requiere sesión demo.
- Sin desviaciones funcionales del brief; no se modificaron archivos de BD, migraciones ni módulos ajenos.
