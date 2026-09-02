# BRIEF-CODEX-18 — Pantallas de configuración por perfil (UI-solo, validación)

## Alcance (decidido con el cliente — respetar exactamente)

Continúa el onboarding UI. La base ya existe (CODEX-17): `/registro`, `/bienvenida`, `/onboarding`
con `ProfilePicker` de 3 tarjetas. Este brief añade la pantalla que aparece al pulsar el botón
"Continuar" DENTRO del onboarding, según el perfil elegido.

**TODAS las pantallas son UI + validación de formulario. PROHIBIDO crear organización,
membresía, escribir en BD, ni llamar funciones SECURITY DEFINER.** La persistencia y creación
se conecta en una fase posterior (el cliente lo confirmó explícitamente).

## Referencias / archivos a tocar

- `app/onboarding/page.tsx` (server) — layout base del onboarding.
- `app/onboarding/profile-picker.tsx` (client) — contiene las 3 tarjetas + el estado `selected`.
- `app/access.module.css` — ya tiene `.wideCard`, `.profile*`. Añadir clases para los formularios
  de perfil aquí (o CSS module nuevo) siguiendo tokens (`--surface`, `--border`, `--radius`, `--accent`).
- Reutilizar tokens de `app/globals.css`.

## Comportamiento del botón "Continuar"

Hoy el botón Continuar del picker muestra una nota placeholder. REEMPLAZAR por navegación real
a la pantalla de configuración del perfil elegido, usando **estado interno del picker** (client-side),
sin cambiar de ruta (puedes renderizar la sub-pantalla dentro del mismo componente `page.tsx`
controlado por `selected`) — evita tocar el router a fondo. Decide el enfoque más simple que
mantenga la sesión y el diseño: render condicional en el mismo componente es aceptable.

## T1 — Pantalla "Profesional independiente"

Título: **"Vamos a configurar tu consulta particular"**
Subtítulo muted: "Completa la información de tu consulta. Podrás editarla después."

Campos (formulario, con las etiquetas exactas):
- **Nombre** (de la consulta) — text.
- **País** — text (o select básico; usa text para no depender de datos externos; placeholder "Chile").
- **Ciudad** — text.
- **Dirección** — text.
- **Teléfono principal** — tel, type="tel".
- **Teléfono secundario** — tel, type="tel", opcional.
- **Email de contacto** — email.
- **Checkbox de aceptación**: "Acepto las [Políticas de Privacidad] y los [Términos y Condiciones] de NexoDent"
  (link a `/#privacidad` y `/#terminos` — enlaces simples, no hace falta página real; si no existen,
  usar `href="#"` con `title`). **REQUERIDO**: opción no enviar sin marcar.

Validación (client-side):
- Obligatorios: nombre, país, ciudad, dirección, teléfono principal, email de contacto + checkbox.
- Email con formato básico (`/^\S+@\S+\.\S+$/`).
- Teléfonos: solo dígitos, espacios, `+`, `-` (longitud 6-20).
- Mostrar errores por campo en texto pequeño (`role="alert"`), no solo un alert global si puedes; si
  simplifica, un alert general + resaltado de campos inválidos (`aria-invalid`).

Botón submit: "Crear mi consulta". Al pulsar: **simular éxito** (mostrar un estado de confirmación
con `role="status"`: "Tu consulta quedó configurada. En la próxima versión conectaremos tu espacio.")
NO crear nada en BD. NO navegar a un punto muerto.

## T2 — Pantalla "Tengo una clínica"

MISMO formulario, diferencias de ETIQUETADO:
- Título: **"Vamos a configurar tu clínica"**
- Subtítulo: "Completa la información de tu clínica. Podrás editarla después."
- Campo "Nombre" = **nombre de la clínica** (label exacto "Nombre de la clínica").
- Todos los demás campos IDÉNTICOS (país, ciudad, dirección, teléfono principal, teléfono secundario,
  email de contacto, checkbox de Políticas/Términos).
- Botón submit: "Crear mi clínica". Mismo comportamiento de simulación de éxito.

## T3 — Pantalla "Quiero unirme a un espacio existente"

NO es formulario — es una pantalla **informativa de pasos** (sin campos). Título sugerido:
"Únete a tu clínica en tres pasos". Contenido (texUAL de Bryan, respetar):
1. **Contacta al administrador de tu clínica** — pide acceso a NexoDent.
2. **Solicita una invitación** — el administrador te enviará una invitación a tu correo.
3. **Acepta la invitación** — y ya podrás acceder al sistema.

Presentarlo como 3 tarjetas numeradas/paso a paso (01-02-03) con iconos, coherentes con el estilo
de la app. Botón: "Entendido" (opcional, es informativo) que puede volver a `/onboarding` o quedarse.

## T4 — Navegación del picker

- Cada tarjeta, al pulsar "Continuar", lleva al formulario/pasos del perfil elegido.
- En las pantallas de formulario, un link "Volver" para elegir otro perfil (vuelve al estado de
  selección). Mantener todo client-side sin perder la sesión.

## Verificación (obligatoria, con evidencia)

1. `timeout 420 npm run build` → PASS.
2. En `app/onboarding`: las 3 ramas renderizan según `selected` (revisa por inspección del código
   y si puedes, test manual del componente). Al menos confirma build + que no hay errores de tipos.
3. `timeout 420 npm run test:smoke` → PASS.
4. `timeout 420 npm run test:unit` → solo puede fallar `foundation.test.ts` (ajeno).
5. Inspección: sigue tokens de diseño (modo oscuro, cian, tarjetas), tuteo chileno, fieldset de
   checkbox accesible (`aria-invalid`), texto de pasos fiel al de Bryan.

## Reporte final

Escribir `REPORTE-CODEX-18.md`:
- Archivos modificados/creados.
- Cómo implementaste las 3 pantallas (estructura client-side).
- Resultados build/smoke/unit.
- Confirmación de NO tocar BD, RLS, auth ni crear organizaciones.
- Captura de estructura HTML o resumen visual de cada pantalla.

## Reglas

- NO commit, NO push, NO deploy (orquestador lo hace).
- NO imprimir secretos. NO tocar `lib/auth.ts`, `db/*`, `middleware.ts`, `app/login`, `app/demo`.
- Ejecuta TODO sin detenerte. Español chileno con tuteo.