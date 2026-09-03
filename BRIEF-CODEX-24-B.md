# BRIEF-CODEX-24-B — RUT del alta de paciente con validador/formato chileno (RutField)

## Contexto (feedback de Bryan, 2026-09-03, tras probar el drawer)

El campo RUT del drawer de alta de paciente es un `<input>` libre sin validación visual ni formato. Bryan exige el validador chileno con el formato final `16.308.134-2` (puntos cada 3 dígitos + guion + dígito verificador).

El proyecto YA tiene todo (NO inventar nada):
- `lib/locale/cl.ts`: `normalizeRut` (limpia puntos/guiones/espacios, upper), `isValidRut` (dígito verificador módulo 11, acepta K), `formatRut` → `16.308.134-2`.
- `components/forms/rut-field.tsx`: componente cliente `RutField({name?,label?,required?})` — valida en vivo tras blur (inline `.field-error` "El RUT no es válido. Revisa el dígito verificador.") y formatea a `12.345.678-5` al salir del campo. Es el ÚNICO uso correcto.

## Tarea única

En `components/layout/topbar-actions.tsx` (ficha Información personal del drawer), reemplazar el input libre de RUT (~línea 328-333: `<label>RUT<input name="rut" autoComplete="off" placeholder="12.345.678-5" /></label>`) por:

```tsx
<RutField name="rut" />
```

- Importar `RutField` desde `@/components/forms/rut-field`.
- Mantener el layout: queda en el mismo `.form-row` junto a Sexo (RutField renderiza su propio `<label>RUT …</label>`, igual que los demás campos).
- El server action NO cambia: `createPatientFromTopbar` ya valida con `isValidRut` + `normalizeRut` (doble validación, correcto). El valor enviado puede venir formateado (`16.308.134-2`) o sin formato; `normalizeRut` lo limpia antes de guardar.
- Verificar que no existan OTROS inputs de RUT sin RutField en la app (auditoría: solo estaba este; si hay más en el repo, reemplazarlos igual — verificar con grep `name="rut"`).

## Verificación
1. `timeout 300 npm run lint` → PASS.
2. `timeout 420 npm run build` → PASS (si `.next/lock`: matar next-server + `rm -f .next/lock`).
3. Comprobación estática: en el drawer ya no hay `<input name="rut"` suelto; hay `<RutField name="rut" />`.
4. Voseo grep sin coincidencias.
5. Sin runtime/navegador → documentar; gatekeeper verifica en producción.

## Reglas críticas
- NO commit/push/deploy. NO tocar lógica/validación del server ni otros archivos fuera del alcance (el swap del RUT es solo UI).
- Si algo falla tras 2 intentos, documentar y continuar.

## Reporte
Escribir `REPORTE-CODEX-24-B.md` en la raíz: diff resumido + evidencia.
