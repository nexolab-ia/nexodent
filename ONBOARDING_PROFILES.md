# ONBOARDING — Especificación de pantallas por perfil (de Bryan, 2026-09-02)

Fuente: instrucción directa de Bryan. Implementar en fase posterior (CODEX-18), tras CODEX-17 (base UI).

## Al pulsar "Soy profesional independiente"
Pantalla de **crear la organización de tipo individual**.
- Título: **"Vamos a configurar tu consulta particular"**
- Información de la consulta particular:
  - Nombre (de la consulta)
  - País
  - Ciudad
  - Dirección
  - Teléfono principal
  - Teléfono secundario
  - Email de contacto
  - Confirmación (checkbox) de aceptación de **Políticas de Privacidad** y **Términos y Condiciones** de NexoDent.

## Al pulsar "Tengo una clínica"
Pantalla de **crear la organización tipo clínica**.
- Los mismos parámetros que la individual, con diferencia de ETIQUETADO:
  - Título indica "configurar tu **clínica**".
  - Rol/campo "Nombre" = **nombre de la clínica**.
  - El resto de campos idénticos (país, ciudad, dirección, teléfono principal, teléfono secundario, email de contacto, checkbox de políticas/tyc).

## Al pulsar "Quiero unirme a un espacio existente"
Pantalla de **pasos para unirse** (sin formulario de datos):
1. Contactar al **administrador de la clínica**.
2. Solicitarle que te envíe una **invitación a tu correo**.
3. **Aceptar la invitación**.
- Al completar, ya se puede acceder al sistema.

## Decisiones de diseño pendientes (aclarar antes de CODEX-18 si hace falta)
- ¿Los campos individual y clínica se guardan al crear la org (requiere BD/función SECURITY DEFINER) o solo validan el formulario (UI)? Inicialmente UI + validación (coherente con alcance B). Confirmar si la org tipo `independent`/`clinic` debe crearse con estos datos en esta fase (implicaría tocar BD).
- Para "unirse a espacio": ¿existe ya un mecanismo de invitación (tabla), o solo es la pantalla de pasos informativos por ahora? (Hoy no existe; asumir pantalla informativa de pasos, sin lógica de envío aún.)