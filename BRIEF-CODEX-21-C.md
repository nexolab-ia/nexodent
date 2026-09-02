# BRIEF-CODEX-21-C — Fix dashboard: params Date en queries bajo runAsTenant rompen en runtime Next

## Contexto y causa raíz (diagnóstico del orquestador, VERIFICADO con evidencia — no re-diagnostiques)

El dashboard desplegado falla con 500 en producción y local:
`TypeError: The "string" argument must be of type string or an instance of Buffer or
ArrayBuffer. Received an instance of Date` (digest 1941464736 prod / 2372270922 local).

Evidencia del diagnóstico (orquestador):
1. Aislado en node crudo (`postgres.js` + `sql.begin` + set_config GUCs + query con params
   `Date`): **OK**.
2. En el runtime de Next dev (Turbopack), instrumentando las mismas queries dentro de
   `runAsTenant`: TODOS los pasos que pasan un parámetro `Date` (${start}/${end}/
   ${previous.start}/...) FALLAN con ese TypeError; el único paso SIN parámetro Date
   (`capacity`, weekday string) pasa OK. → El serializador de postgres.js bajo Next no
   acepta objetos Date como parámetro en transacción; los strings ISO sí funcionan.
3. Ruta debug temporal usada: `app/api/debug/dash/route.ts` (existe en el working tree,
   NO se commitea — bórrala al terminar).

Regla derivada (aplicar SOLO en dashboard por ahora): **en queries dentro de
`runAsTenant`/transacciones, pasar fechas como strings ISO (`toISOString()`), nunca como
objeto Date**. Nota: probablemente afecta también a `createAppointment`/`reschedule`
(params Date en INSERT/UPDATE en tx) — NO lo toques en este brief; el orquestador lo
evaluará aparte (riesgo latente en booking, fuera de alcance).

## Fix (único archivo de lógica)

En `features/dashboard/actions.ts` (`dashboardSummary`): al inicio, tras calcular
`start/end/previous` (objetos Date que SIGUEN usándose para lógica JS: comparaciones del
día, `localWeekday(start)`, armado del sparkline con `addDaysLocal`, etc.), derivar
variantes string ISO y usarlas como parámetros en TODOS los SQL:
- `const startIso = start.toISOString(), endIso = end.toISOString(),
  prevStartIso = previous.start.toISOString(), prevEndIso = previous.end.toISOString();`
- Reemplazar en los templates SQL: `${start}`→`${startIso}`, `${end}`→`${endIso}`,
  `${previous.start}`→`${prevStartIso}`, `${previous.end}`→`${prevEndIso}`,
  y el `${sparkStart}`→`${sparkStart.toISOString()}` (todas las queries: counts, agenda,
  captures, finance y previousFinance, movements, sparkline).
- NO cambiar firmas, tipos del payload, ni el resto de archivos. `capacity` no lleva Date
  (queda igual). `pendingClinical` no lleva Date params (queda igual; la comparación
  `r.startsAt>=today.start` en JS se mantiene con Date).
- Sin voseo, español neutro en comentarios si agregas alguno.

## Alcance

- TOCAR: `features/dashboard/actions.ts` y BORRAR `app/api/debug/dash/route.ts` (y el dir
  `app/api/debug/` si queda vacío) al terminar la verificación.
- NO tocar nada más (ni tests — el fix no cambia comportamiento esperado).

## Verificación obligatoria (evidencia al final del mensaje)

Hay un dev server corriendo en http://127.0.0.1:3000 (DB local provisionada con el mismo
rol NOBYPASSRLS). Turbopack recarga solo.

1. `timeout 120 npx tsc --noEmit` → PASS.
2. `timeout 300 npm run lint` → PASS.
3. `timeout 180 npx vitest run tests/unit/dashboard.test.ts` → PASS.
4. Antes de borrar la ruta debug, curl: `curl -s http://127.0.0.1:3000/api/debug/dash`
   → TODOS los pasos deben decir OK (ninguno FAIL).
5. Con sesión (opcional pero ideal): haz POST sign-in con email
   `emilia.demo@nexodent.invalid` y el DEMO_PASSWORD del archivo
   `/home/hermes/.hermes/home/.secrets/nexodent_deploy.env` (NO imprimas el valor), guarda
   cookies, GET `http://127.0.0.1:3000/dashboard` → 200 y el HTML contiene "Resumen",
   "Agenda del día", "Salud de clínica", "Ingresos del día", "Planes de tratamiento",
   "Evoluciones pendientes".
6. `timeout 420 npm run build` → PASS (para confirmar que el fix compila en prod mode).

Ejecuta TODO sin detenerte. No imprimas secretos. Resultado en 15-20 líneas al final del
mensaje (sin reporte en archivo; basta stdout).
