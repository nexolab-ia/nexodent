# REPORTE-CODEX-24-B

## Resultado

Se reemplazó el input libre de RUT del drawer de alta de paciente por el componente compartido `RutField`. El campo conserva su posición en la misma `.form-row` junto a Sexo y ahora aplica validación chilena en vivo y formato al perder el foco.

No se modificaron la server action, la lógica de dominio ni la validación del servidor. No se realizó commit, push ni deploy.

## Diff resumido

- `components/layout/topbar-actions.tsx`
  - Importa `RutField` desde `@/components/forms/rut-field`.
  - Sustituye el bloque `<label>` con `<input name="rut">` por `<RutField name="rut" />`.
- `REPORTE-CODEX-24-B.md`
  - Registra esta evidencia.

El worktree ya contenía cambios ajenos a esta tarea; se preservaron sin modificarlos ni incluirlos como trabajo de este brief.

## Evidencia

| Verificación | Resultado | Evidencia |
| --- | --- | --- |
| `timeout 300 npm run lint` | PASS | ESLint terminó con código 0. |
| `timeout 420 npm run build` | PASS | Next.js compiló, comprobó TypeScript, generó 25/25 páginas y terminó con código 0. Emitió avisos preexistentes de configuración de autenticación y deprecación de middleware, sin bloquear el build. No se imprimieron valores de secretos. |
| Input libre en el drawer | PASS | `grep -n '<input[^>]*name="rut"' components/layout/topbar-actions.tsx` terminó con código 1, sin coincidencias. |
| Uso de `RutField` | PASS | `components/layout/topbar-actions.tsx:330` contiene `<RutField name="rut" />`. |
| Auditoría global de `name="rut"` | PASS | En `app/` y `components/` solo aparecen el valor por defecto del componente reutilizable `RutField` y su uso en el drawer; no quedan otros inputs libres de RUT. |
| Voseo | PASS | Grep de formas de voseo en `app/`, `components/`, `features/` y `lib/` para TS/TSX/CSS terminó con código 1, sin coincidencias. |

## Runtime

No se ejecutó navegador ni validación interactiva, según la instrucción del brief. La comprobación funcional en producción queda para el gatekeeper.
