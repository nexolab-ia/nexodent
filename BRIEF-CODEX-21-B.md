# BRIEF-CODEX-21-B — Correcciones visuales menores al Dashboard (tras gatekeeper del orquestador)

## Contexto

El orquestador verificó BRIEF-CODEX-21 (build/smoke/integration/lint PASS) y encontró 2
defectos visuales en `app/(app)/dashboard/page.tsx` + `app/globals.css`. NO reescribas el
dashboard: está correcto. Solo aplica los 2 fixes quirúrgicos siguientes y verifica.

## Fix 1 — Deltas "vs ayer" invisibles en "Salud de clínica"

Causa: la página renderiza `<div className="metric-inline"><Delta value={...}/></div>`
como hermano de cada `Metric` de Producción/Cobrado/Captación, pero en `app/globals.css`
`.metric-inline{display:none}` no tiene ningún override → los deltas nunca se ven (código
muerto + requisito del spec incumplido: el panel debía mostrar delta vs ayer).

Fix deseado (diseño decidido):
- En `app/(app)/dashboard/page.tsx`, añadir al componente local `Metric` un prop opcional
  `delta?: number | null` y renderizarlo DENTRO del `<small>` (junto al sub) cuando venga,
  usando el mismo `<Delta/>`/`.metric-delta` (ej. `"{sub} · ▲ 12% vs ayer"` como segundo
  elemento o texto). No alterar el aspecto del resto.
- En las llamadas de Producción, Cobrado y Captación pasar `delta={data.health.productionDelta}`,
  `delta={data.health.collectedDelta}`, `delta={data.health.captureDelta}` respectivamente.
- Eliminar los tres `<div className="metric-inline"><Delta .../></div>` huérfanos y la regla
  CSS `.metric-inline{display:none}` (y la clase si no queda otro uso).

## Fix 2 — Estado crudo en inglés en "Planes de tratamiento" (lista "recientes")

Causa: `data.estimates.recent.map(...)` imprime `{e.state}` tal cual (`sent`, `approved`),
mientras el bloque de estados usa etiquetas españolas.

Fix deseado:
- Definir (o reutilizar) un mapa de estado → label en español ya presente en la página
  (`{sent:"Enviado", approved:"Aprobado", draft:"Borrador", rejected:"Rechazado",
  expired:"Expirado"}`) y usarlo en el listado reciente y en cualquier otro lugar donde se
  muestre `e.state` crudo. Texto en singular y español neutro con tuteo (prohibido voseo).

## Alcance

- TOCAR: `app/(app)/dashboard/page.tsx`, `app/globals.css` (solo eliminar la regla/uso de
  metric-inline). NADA más.
- NO tocar: migraciones, dominio, queries, tests (no cambian), resto del repo.
- NO commit, NO push, NO deploy.

## Verificación obligatoria (evidencia en stdout/reporte corto al final del mensaje)

1. `timeout 420 npm run build` → PASS.
2. `timeout 300 npm run lint` → PASS.
3. `timeout 180 npx vitest run tests/unit/dashboard.test.ts` → PASS.
4. `grep -n "metric-inline" -R "app/(app)/dashboard" app/globals.css` → 0 resultados.
5. `grep -n "e.state" "app/(app)/dashboard/page.tsx"` → 0 resultados (o solo con label
   mapeado).
6. Sin voseo en las líneas tocadas.

Escribe el resultado en 10-15 líneas al final de tu mensaje (no necesitas REPORTE-CODEX-21-B.md;
con stdout basta). Ejecuta TODO sin detenerte a preguntar. No imprimas secretos.
