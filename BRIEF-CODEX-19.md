# BRIEF-CODEX-19 — Conectar la creación REAL de la organización en el onboarding

## Contexto (orquestador investigó el modelo completo — respetar exactamente)

NexoDent (Next.js 16 + Postgres + Better Auth v1.7.2 + Drizzle + RLS forzado + Coolify).
El onboarding UI YA existe y fue desplegado (CODEX-17/18): `/registro`, `/bienvenida`,
`/onboarding` con `ProfilePicker`. Los formularios de perfil (`SetupForm` en
`app/onboarding/profile-picker.tsx`) hoy SOLO validan y muestran un `successPanel` falso.
Este brief conecta la **creación real de la organización** cuando el usuario envía el formulario.

### Por qué es necesario (arquitectura RLS — VERIFICADA en migraciones)

- `db/migrations/0001_tenant_rls.sql` aplica `FORCE ROW LEVEL SECURITY` y las policies
  `*_tenant_scope ... USING (X = current_setting('app.organization_id', true)::uuid)` a
  `organizations`, `sites`, `memberships`, `membership_sites`, `audit_logs`.
- El rol de la app es `NOBYPASSRLS` (creado en `db/provision.ts`). Un usuario recién registrado
  (que aún no tiene organización) NO puede INSERTAR su propia org/site/membership con ese rol:
  ninguna fila `USING` pasa el `current_setting('app.organization_id')` (todavía no existe).
- PATRÓN EXISTENTE para esto: `db/migrations/0002_auth_bootstrap.sql` crea
  `app_resolve_active_membership(uuid)` como `SECURITY DEFINER SET search_path=public`
  (owner = migrador/superusuario con BYPASSRLS) y otorga EXECUTE a los roles con login vía DO loop.
  REPLICAR ese patrón para la creación del onboarding.

### Modelo de datos (columnas exactas desde 0000_core.sql y db/schema/*)

- `organizations(id uuid PK gen_random_uuid(), type organization_type NOT NULL, slug varchar(120) NOT NULL UNIQUE, name varchar(160) NOT NULL, settings jsonb NOT NULL DEFAULT '{}', created_at, updated_at)`.
  Enum `organization_type`: `clinic` | `independent`.
- `sites(id uuid PK gen_random_uuid(), organization_id uuid NOT NULL REF organizations ON DELETE RESTRICT, slug varchar(120) NOT NULL, name varchar(160) NOT NULL, timezone varchar(64) NOT NULL DEFAULT 'America/Santiago', settings jsonb NOT NULL DEFAULT '{}', created_at, updated_at, UNIQUE(organization_id, slug), UNIQUE(id, organization_id))`.
- `memberships(id uuid PK gen_random_uuid(), organization_id uuid NOT NULL REF organizations ON DELETE RESTRICT, user_id uuid NOT NULL REF users(id) ON DELETE RESTRICT, role membership_role NOT NULL, status membership_status NOT NULL DEFAULT 'active', expires_at timestamptz, created_at, updated_at, UNIQUE(organization_id, user_id), UNIQUE(id, organization_id))`.
  Enum `membership_role`: `organization_admin` | `professional` | `assistant` | `independent_owner`.
- `membership_sites(membership_id, organization_id, site_id, created_at, PK(membership_id,site_id), FK compuestos)`.
- `audit_logs(id, organization_id, site_id, actor_membership_id, action, entity, entity_id, before, after, reason, created_at)`.
- Roles por perfil (ya definidos en `features/tenant-identity/authorize.ts`):
  - **independent** → `independent_owner`
  - **clinic** → `organization_admin`

### Dónde guardar los datos del formulario

Los campos del formulario (nombre, país, ciudad, dirección, teléfono principal, teléfono
secundario, email de contacto) se guardan en el `settings` jsonb de la ORGANIZACIÓN (no del site),
como un objeto de contacto limpio. Ejemplo:
```json
{ "contact": { "country": "Chile", "city": "Santiago", "address": "...", "primaryPhone": "+56...", "secondaryPhone": "...", "contactEmail": "..." } }
```
El `name` de la organización = nombre de la consulta / nombre de la clínica (lo que ya manda el form).

## T1 — Migración nueva `db/migrations/0008_onboarding_org.sql`

Crear una función `SECURITY DEFINER` que cree la organización + primer sitio + membresía +
enlace membership_site + auditoría, TODO en una transacción. Firma (diseña los tipos según patrón 0002):

```sql
CREATE OR REPLACE FUNCTION app_create_onboarding(
  p_user_id uuid,
  p_org_type organization_type,
  p_org_name varchar(160),
  p_country text, p_city text, p_address text,
  p_primary_phone text, p_secondary_phone text, p_contact_email text
)
RETURNS TABLE (organization_id uuid, site_id uuid, membership_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
...
$$;
REVOKE ALL ON FUNCTION app_create_onboarding(uuid, organization_type, varchar, text, text, text, text, text, text) FROM PUBLIC;
-- grant EXECUTE a roles con login (idéntico al DO loop de 0002_auth_bootstrap.sql)
```

Reglas de la función (OBLIGATORIO):
1. **Seguridad / validación de identidad:** verificar que `p_user_id` existe en `users`; si
   no, RAISE EXCEPTION. Verificar que el usuario NO tenga ya una membresía ACTIVA
   (`SELECT 1 FROM memberships WHERE user_id = p_user_id AND status='active' LIMIT 1`);
   si la tiene, RAISE EXCEPTION "already onboarded" (idempotencia/seguridad frente a doble POST).
2. **Slug único:** derivar de `p_org_name` (normalizar: lower, sin acentos, espacios→'-', sin
   caracteres raros). Si ya existe (UNIQUE organizations.slug), añadir sufijo `-2`, `-3`, ...
   en un loop hasta encontrar uno libre. Usar `to_timestamp`/`substring`+regex o generate a mano
   en plpgsql. PROHIBIDO usar la IP del request (no existe aquí).
3. **Rol según tipo:** `p_org_type='independent'` → rol `independent_owner`; `'clinic'` →
   rol `organization_admin`. (raise if otro valor).
4. **Crear en orden dentro de la función** (todo en una transacción, con BEGIN...RETURN):
   - `organizations` (type, slug, name = p_org_name, settings = jsonb con `contact`).
   - `sites` (un PRIMER sitio: `name` = el nombre de la org o "Sede principal", slug único
     normalizado del site (derivar del org slug + "-sede" o "sede-principal"; unique(org,slug)),
     timezone 'America/Santiago', settings = jsonb con `contact` también o `{}` — decide y documenta).
   - `memberships` (org, user, role, status='active').
   - `membership_sites` (membership, org, site).
   - `audit_logs` (organization_id, actor_membership_id = membership nueva, action='organization.created',
     entity='organization', entity_id=org_id, before='{}', after={contact...} o {role}, reason='onboarding').
5. RETORNAR org_id, site_id, membership_id.

## T2 — Server action de onboarding (nuevo `app/onboarding/actions.ts` con `"use server"`)

- Proteger con sesión: `const session = await auth.api.getSession({ headers: await headers() });`
  si `!session?.user` lanzar error genérico (o redirigir). El `user.id` es `p_user_id`.
- Validar los campos igual que `SetupForm` (name, country, city, address, primaryPhone,
  secondaryPhone opcional, email, accepted checkbox). Devolver errores por campo si falla.
- Llamar la función:
  `const rows = await sql<{ organizationId: string; siteId: string; membershipId: string }[]>\`
  `SELECT organization_id AS "organizationId", site_id AS "siteId", membership_id AS "membershipId" \`
  `FROM app_create_onboarding(${user.id}::uuid, ${type}::organization_type, ${name}, ${country}, ${city}, ${address}, ${primaryPhone}, ${secondaryPhone ?? null}, ${email});`
- Tras crear: `return { ok: true, organizationId, redirectTo: "/agenda" }` (o similar). NO hacer
  `redirect()` dentro de la server action directamente si complica; devolver y que el client navegue.
- Mapear el `type` de perfil: el client ya distingue `professional`|`clinic`; pasar a la action
  el enum correcto (`independent`|`clinic`). El perfil `join` NO crea nada (es pantalla de pasos;
  la tabla de invitaciones NO existe y NO se pide en esta fase).

## T3 — Conectar `SetupForm` (app/onboarding/profile-picker.tsx)

- Reemplazar la simulación (`setComplete(true)`) por la llamada real a la server action del T2.
- `"use client"` ya está. Importar la action. En `handleSubmit`, tras validar lo que ya valida,
  llamar la action (o volcar las validaciones al server para no duplicar; mínimo, el server
  action valida de nuevo y devuelve errores). Manejar `isPending` (loading) con el fetch/estado.
- Si vuelve `ok`: mostrar successPanel real con botón "Ir a mí espacio" que haga
  `router.replace(redirectTo)`. (Ahora sí la sesión tiene org y /agenda responde.)
- Si vuelve errores: mostrarlos por campo (ya existe el mecanismo `errors`).
- El perfil `join` sigue igual (pasos informativos).

## T4 — Verificación (obligatoria, con evidencia)

1. `timeout 420 npm run build` → PASS.
2. `timeout 420 npm run test:smoke` → PASS.
3. `timeout 420 npm run test:unit` → solo puede fallar `foundation.test.ts` (docker-compose.yml
   ausente; ajeno, NO tocar).
4. Revisión estática de la migración: que usa `SECURITY DEFINER SET search_path=public`, que el
   DO loop de grants replica exactamente el de 0002, y que la función hace las 5 inserciones en
   orden con los enums correctos. Deja un ejemplo del `settings` jsonb generado.

## Reporte final

Escribir `REPORTE-CODEX-19.md`:
- Código completo de la migración (función + grants).
- Código de la server action y del cambio en `SetupForm`.
- Cómo se decidió el slug y dónde se guardan los datos de contacto.
- Resultados build/smoke/unit.
- Confirmación de qué archivos se tocaron (esperado: `db/migrations/0008_onboarding_org.sql`
  NUEVO, `app/onboarding/actions.ts` NUEVO, `app/onboarding/profile-picker.tsx` MODIFICADO).

## Reglas

- NO commit, NO push, NO deploy: dejar en working tree para que el orquestador verifique y despliegue.
- El orquestador verificará la migración ANTES de desplegar (la ejecutará vía provision). Dejar la
  migración lista para que el provision la aplique.
- NO imprimir secretos. NO tocar `lib/auth.ts`, `middleware.ts`, `app/login`, `app/demo`,
  `db/provision.ts` (el provision ya aplica migraciones por convención de `db/migrations/*.sql`
  en orden — la 0008 se aplica sola).
- NO crear tabla de invitaciones ni lógica de "join" — fuera de alcance.
- Ejecuta TODO sin detenerte. Español chileno con tuteo.