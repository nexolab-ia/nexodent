# REPORTE-CODEX-19 — Creación real de la organización en onboarding

## Resultado

Se conectó el formulario de onboarding con una creación real y atómica del primer tenant. La operación valida nuevamente en el servidor, toma el usuario exclusivamente desde la sesión de Better Auth y ejecuta una función `SECURITY DEFINER` para atravesar de forma acotada el bootstrap previo a `app.organization_id`.

El perfil `professional` se traduce a `organization_type = 'independent'` y crea una membresía `independent_owner`. El perfil `clinic` se traduce a `organization_type = 'clinic'` y crea una membresía `organization_admin`. El flujo `join` no cambió.

## Archivos tocados

- `db/migrations/0008_onboarding_org.sql` — **nuevo**.
- `app/onboarding/actions.ts` — **nuevo**.
- `app/onboarding/profile-picker.tsx` — **modificado**.
- `REPORTE-CODEX-19.md` — **nuevo**, reporte solicitado.

No se modificaron `lib/auth.ts`, `middleware.ts`, `app/login`, `app/demo`, `db/provision.ts` ni otros archivos prohibidos. No se creó lógica de invitaciones. No se hizo commit, push ni deploy.

## Decisiones de persistencia

### Slug

La función normaliza el nombre con `lower`, `trim`, `translate` para retirar acentos frecuentes del español y una expresión regular que convierte bloques de caracteres ajenos a `a-z0-9` en `-`. Si el resultado queda vacío usa `espacio`. El slug se limita a 120 caracteres.

La función toma un advisory lock transaccional sobre el slug base y busca `slug`, `slug-2`, `slug-3`, etc. El corte se recalcula para que el sufijo nunca supere el límite de 120 caracteres. Además, toma un lock por `user_id` antes de comprobar la membresía activa, por lo que dos POST simultáneos del mismo usuario no pueden crear dos organizaciones.

El primer sitio usa `<slug-organización>-sede`, limitado a 120 caracteres. Como se crea dentro de una organización nueva, cumple la unicidad `(organization_id, slug)`.

### Datos de contacto

La fuente de verdad queda en `organizations.settings.contact`. El teléfono secundario vacío se elimina con `jsonb_strip_nulls`; el email se normaliza a minúsculas. `sites.settings` queda en `{}` para evitar duplicar datos editables entre organización y sede.

Ejemplo generado:

```json
{
  "contact": {
    "country": "Chile",
    "city": "Santiago",
    "address": "Av. Providencia 1234",
    "primaryPhone": "+56 9 1234 5678",
    "contactEmail": "contacto@clinica.cl"
  }
}
```

## Migración completa

```sql
-- 0008_onboarding_org.sql
-- Bootstrap transaccional del primer tenant para un usuario autenticado.
-- SECURITY DEFINER permite crear el tenant antes de que exista app.organization_id.

CREATE OR REPLACE FUNCTION app_create_onboarding(
  p_user_id uuid,
  p_org_type organization_type,
  p_org_name varchar(160),
  p_country text,
  p_city text,
  p_address text,
  p_primary_phone text,
  p_secondary_phone text,
  p_contact_email text
)
RETURNS TABLE (
  organization_id uuid,
  site_id uuid,
  membership_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_slug text;
  v_org_slug text;
  v_site_slug text;
  v_suffix integer := 1;
  v_role membership_role;
  v_contact jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  -- Evita que dos envíos simultáneos del mismo usuario superen juntos la
  -- comprobación de membresía activa.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  IF EXISTS (
    SELECT 1
    FROM memberships
    WHERE user_id = p_user_id
      AND status = 'active'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'already onboarded';
  END IF;

  IF p_org_type = 'independent' THEN
    v_role := 'independent_owner';
  ELSIF p_org_type = 'clinic' THEN
    v_role := 'organization_admin';
  ELSE
    RAISE EXCEPTION 'invalid organization type';
  END IF;

  v_base_slug := lower(trim(p_org_name));
  v_base_slug := translate(
    v_base_slug,
    'áàäâãéèëêíìïîóòöôõúùüûñç',
    'aaaaaeeeeiiiiooooouuuunc'
  );
  v_base_slug := regexp_replace(v_base_slug, '[^a-z0-9]+', '-', 'g');
  v_base_slug := trim(both '-' FROM v_base_slug);
  IF v_base_slug = '' THEN
    v_base_slug := 'espacio';
  END IF;
  v_base_slug := left(v_base_slug, 120);

  -- Serializa nombres equivalentes para que dos altas concurrentes no elijan
  -- el mismo slug antes del INSERT protegido por UNIQUE.
  PERFORM pg_advisory_xact_lock(hashtext(v_base_slug));
  v_org_slug := v_base_slug;
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_org_slug) LOOP
    v_suffix := v_suffix + 1;
    v_org_slug := left(v_base_slug, 120 - length('-' || v_suffix::text)) || '-' || v_suffix;
  END LOOP;

  v_contact := jsonb_build_object(
    'contact', jsonb_strip_nulls(jsonb_build_object(
      'country', trim(p_country),
      'city', trim(p_city),
      'address', trim(p_address),
      'primaryPhone', trim(p_primary_phone),
      'secondaryPhone', nullif(trim(p_secondary_phone), ''),
      'contactEmail', lower(trim(p_contact_email))
    ))
  );

  INSERT INTO organizations (type, slug, name, settings)
  VALUES (p_org_type, v_org_slug, trim(p_org_name), v_contact)
  RETURNING id INTO organization_id;

  v_site_slug := left(v_org_slug, 115) || '-sede';
  INSERT INTO sites (organization_id, slug, name, timezone, settings)
  VALUES (organization_id, v_site_slug, trim(p_org_name), 'America/Santiago', '{}'::jsonb)
  RETURNING id INTO site_id;

  INSERT INTO memberships (organization_id, user_id, role, status)
  VALUES (organization_id, p_user_id, v_role, 'active')
  RETURNING id INTO membership_id;

  INSERT INTO membership_sites (membership_id, organization_id, site_id)
  VALUES (membership_id, organization_id, site_id);

  INSERT INTO audit_logs (
    organization_id,
    actor_membership_id,
    action,
    entity,
    entity_id,
    before,
    after,
    reason
  ) VALUES (
    organization_id,
    membership_id,
    'organization.created',
    'organization',
    organization_id,
    '{}'::jsonb,
    v_contact || jsonb_build_object('role', v_role),
    'onboarding'
  );

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION app_create_onboarding(uuid, organization_type, varchar, text, text, text, text, text, text) FROM PUBLIC;

-- Mismo patrón de grants que 0002_auth_bootstrap.sql: el owner migrador ya
-- puede ejecutar la función y cada rol de login recibe solo EXECUTE.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT rolname FROM pg_roles WHERE rolcanlogin AND rolname <> current_user LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION app_create_onboarding(uuid, organization_type, varchar, text, text, text, text, text, text) TO %I', r.rolname);
  END LOOP;
END $$;
```

## Server action completa

```ts
"use server";

import { headers } from "next/headers";
import { sql } from "@/db/client";
import { auth } from "@/lib/auth";

type OnboardingType = "independent" | "clinic";
type FieldName = "name" | "country" | "city" | "address" | "primaryPhone" | "secondaryPhone" | "email" | "accepted" | "form";
type OnboardingErrors = Partial<Record<FieldName, string>>;

export type OnboardingResult =
  | { ok: true; organizationId: string; redirectTo: "/agenda" }
  | { ok: false; errors: OnboardingErrors };

const phonePattern = /^[\d +-]{6,20}$/;
const emailPattern = /^\S+@\S+\.\S+$/;

export async function createOnboarding(formData: FormData): Promise<OnboardingResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("No fue posible validar tu sesión.");

  const type = String(formData.get("type") ?? "") as OnboardingType;
  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const primaryPhone = String(formData.get("primaryPhone") ?? "").trim();
  const secondaryPhone = String(formData.get("secondaryPhone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const accepted = formData.get("accepted") === "on";
  const errors: OnboardingErrors = {};

  if (type !== "independent" && type !== "clinic") errors.form = "El tipo de espacio no es válido.";
  if (!name) errors.name = type === "clinic" ? "Ingresa el nombre de la clínica." : "Ingresa el nombre de la consulta.";
  else if (name.length > 160) errors.name = "El nombre puede tener hasta 160 caracteres.";
  if (!country) errors.country = "Ingresa el país.";
  if (!city) errors.city = "Ingresa la ciudad.";
  if (!address) errors.address = "Ingresa la dirección.";
  if (!primaryPhone) errors.primaryPhone = "Ingresa el teléfono principal.";
  else if (!phonePattern.test(primaryPhone)) errors.primaryPhone = "Usa entre 6 y 20 dígitos, espacios, + o -.";
  if (secondaryPhone && !phonePattern.test(secondaryPhone)) errors.secondaryPhone = "Usa entre 6 y 20 dígitos, espacios, + o -.";
  if (!email) errors.email = "Ingresa el email de contacto.";
  else if (!emailPattern.test(email) || email.length > 320) errors.email = "Ingresa un email válido.";
  if (!accepted) errors.accepted = "Debes aceptar las políticas y los términos para continuar.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  try {
    const rows = await sql<{ organizationId: string; siteId: string; membershipId: string }[]>`
      SELECT
        organization_id AS "organizationId",
        site_id AS "siteId",
        membership_id AS "membershipId"
      FROM app_create_onboarding(
        ${session.user.id}::uuid,
        ${type}::organization_type,
        ${name},
        ${country},
        ${city},
        ${address},
        ${primaryPhone},
        ${secondaryPhone || null},
        ${email}
      )
    `;
    const created = rows[0];
    if (!created) return { ok: false, errors: { form: "No pudimos crear tu espacio. Inténtalo nuevamente." } };
    return { ok: true, organizationId: created.organizationId, redirectTo: "/agenda" };
  } catch (error) {
    if (error instanceof Error && error.message.includes("already onboarded")) {
      return { ok: false, errors: { form: "Tu cuenta ya tiene un espacio activo. Vuelve a ingresar para continuar." } };
    }
    return { ok: false, errors: { form: "No pudimos crear tu espacio. Inténtalo nuevamente." } };
  }
}
```

## Cambio en `SetupForm`

El cambio reemplaza el éxito simulado por el envío real, presenta errores de campo devueltos por el servidor, bloquea el submit durante la operación y navega con `router.replace` solo después de recibir `ok: true`.

```diff
diff --git a/app/onboarding/profile-picker.tsx b/app/onboarding/profile-picker.tsx
index 9e4c9ca..1ddeca1 100644
--- a/app/onboarding/profile-picker.tsx
+++ b/app/onboarding/profile-picker.tsx
@@ -2,10 +2,12 @@
 
 import { FormEvent, useState } from "react";
 import Link from "next/link";
+import { useRouter } from "next/navigation";
+import { createOnboarding } from "./actions";
 import styles from "../access.module.css";
 
 type ProfileId = "professional" | "clinic" | "join";
-type FieldName = "name" | "country" | "city" | "address" | "primaryPhone" | "secondaryPhone" | "email" | "accepted";
+type FieldName = "name" | "country" | "city" | "address" | "primaryPhone" | "secondaryPhone" | "email" | "accepted" | "form";
 type Errors = Partial<Record<FieldName, string>>;
 
 const profiles: Array<{ id: ProfileId; title: string; description: string; detail: string; icon: "person" | "building" | "community" }> = [
@@ -30,11 +32,14 @@ function Field({ name, label, type = "text", placeholder, optional, error }: { n
 }
 
 function SetupForm({ profile, onBack }: { profile: "professional" | "clinic"; onBack: () => void }) {
+  const router = useRouter();
   const [errors, setErrors] = useState<Errors>({});
   const [complete, setComplete] = useState(false);
+  const [isPending, setIsPending] = useState(false);
+  const [redirectTo, setRedirectTo] = useState("/agenda");
   const isClinic = profile === "clinic";
 
-  function handleSubmit(event: FormEvent<HTMLFormElement>) {
+  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
     event.preventDefault();
     const data = new FormData(event.currentTarget);
     const nextErrors: Errors = {};
@@ -53,7 +58,23 @@ function SetupForm({ profile, onBack }: { profile: "professional" | "clinic"; on
     if (email && !/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Ingresa un email válido.";
     if (data.get("accepted") !== "on") nextErrors.accepted = "Debes aceptar las políticas y los términos para continuar.";
     setErrors(nextErrors);
-    setComplete(Object.keys(nextErrors).length === 0);
+    if (Object.keys(nextErrors).length > 0) return;
+
+    data.set("type", isClinic ? "clinic" : "independent");
+    setIsPending(true);
+    try {
+      const result = await createOnboarding(data);
+      if (!result.ok) {
+        setErrors(result.errors);
+        return;
+      }
+      setRedirectTo(result.redirectTo);
+      setComplete(true);
+    } catch {
+      setErrors({ form: "No pudimos validar tu sesión. Vuelve a ingresar e inténtalo nuevamente." });
+    } finally {
+      setIsPending(false);
+    }
   }
 
   return <div className={styles.profileScreen}>
@@ -64,9 +85,10 @@ function SetupForm({ profile, onBack }: { profile: "professional" | "clinic"; on
     </div>
     {complete ? <div className={styles.successPanel} role="status">
       <strong>Configuración lista</strong>
-      <p>Tu {isClinic ? "clínica" : "consulta"} quedó configurada. En la próxima versión conectaremos tu espacio.</p>
-      <button type="button" className={styles.secondaryButton} onClick={onBack}>Elegir otro perfil</button>
+      <p>Tu {isClinic ? "clínica" : "consulta"} quedó configurada y ya puedes comenzar a usar NexoDent.</p>
+      <button type="button" className={styles.primaryButton} onClick={() => router.replace(redirectTo)}>Ir a mi espacio</button>
     </div> : <form className={styles.profileForm} onSubmit={handleSubmit} noValidate>
+      {errors.form && <p className={styles.fieldError} role="alert">{errors.form}</p>}
       <div className={styles.formGrid}>
         <Field name="name" label={isClinic ? "Nombre de la clínica" : "Nombre"} error={errors.name} />
         <Field name="country" label="País" placeholder="Chile" error={errors.country} />
@@ -81,7 +103,9 @@ function SetupForm({ profile, onBack }: { profile: "professional" | "clinic"; on
         <label><input name="accepted" type="checkbox" /> <span>Acepto las <Link href="/#privacidad">Políticas de Privacidad</Link> y los <Link href="/#terminos">Términos y Condiciones</Link> de NexoDent</span></label>
         {errors.accepted && <small id="accepted-error" className={styles.fieldError} role="alert">{errors.accepted}</small>}
       </fieldset>
-      <button type="submit" className={styles.primaryButton}>{isClinic ? "Crear mi clínica" : "Crear mi consulta"}</button>
+      <button type="submit" className={styles.primaryButton} disabled={isPending} aria-busy={isPending}>
+        {isPending ? "Creando tu espacio…" : isClinic ? "Crear mi clínica" : "Crear mi consulta"}
+      </button>
     </form>}
   </div>;
 }
```

## Verificación

| Verificación | Resultado | Evidencia |
| --- | --- | --- |
| `timeout 120 npx tsc --noEmit` | **PASS** | Exit code `0`; no se informaron errores de TypeScript. |
| `git diff --check` | **PASS** | Exit code `0`; no se encontraron errores de whitespace. |
| Revisión estática de `0008_onboarding_org.sql` | **PASS** | Contiene `SECURITY DEFINER`, `SET search_path = public`, revocación a `PUBLIC` y un DO loop de grants con la misma estructura de `0002_auth_bootstrap.sql`. |
| Orden de inserciones | **PASS** | `organizations` → `sites` → `memberships` → `membership_sites` → `audit_logs`. |
| Migración en PostgreSQL embebido | **PASS** | Se aplicaron `0000` a `0008`; un rol `LOGIN`, `NOSUPERUSER`, `NOBYPASSRLS` ejecutó el bootstrap. Se comprobaron los cinco registros relacionados para dos altas, sufijo de slug, normalización de contacto y rechazo de un segundo onboarding. |
| `timeout 420 npm run build` | **PASS** | Exit code `0`; compilación correcta en 25,9 s, TypeScript correcto y 22 páginas generadas. Se mantuvieron las advertencias ajenas por el secreto predeterminado de Better Auth y la convención deprecada de `middleware`. |
| `timeout 420 npm run test:smoke` | **PASS** | Exit code `0`; 9 archivos y 19 pruebas aprobadas en 2,56 s. |
| `timeout 420 npm run test:unit` | **FALLO ESPERADO Y AJENO** | Exit code `1`; 10 archivos aprobados y 1 fallido, 42 de 43 pruebas aprobadas. El único fallo fue `tests/unit/foundation.test.ts` por `ENOENT: no such file or directory, open 'docker-compose.yml'`. |

## Comportamiento de seguridad y atomicidad

- El `user_id` nunca viene del cliente: se obtiene de `auth.api.getSession`.
- La action vuelve a validar todos los campos y el consentimiento, aunque el cliente ya los haya validado.
- La función rechaza usuarios inexistentes y usuarios con una membresía activa mediante `already onboarded`.
- Los locks transaccionales cierran las carreras de doble POST y selección concurrente de slug.
- PostgreSQL ejecuta la función invocada por una sola sentencia como una unidad atómica: una excepción en cualquiera de las cinco inserciones revierte toda la sentencia.
- La auditoría registra `organization.created`, la membresía creadora, el contacto y el rol asignado, con `reason = 'onboarding'`.

## Límite de reversión

Para retirar únicamente este trabajo, elimina `db/migrations/0008_onboarding_org.sql`, `app/onboarding/actions.ts` y `REPORTE-CODEX-19.md`, y revierte solo los cambios de `app/onboarding/profile-picker.tsx`. Si la migración ya fue aplicada en un entorno, la reversión debe eliminar primero la función `app_create_onboarding(...)` mediante una migración compensatoria; no se debe editar el historial aplicado.
