# REPORTE-CODEX-31

## Archivo cambiado

- `db/provision.ts`: se agregó el paso 6 para sincronizar de forma idempotente la disponibilidad del owner demo creado por onboarding.

## Bloque agregado

```ts
// 6. Disponibilidad del owner demo creado por onboarding.
// MOCK-demo: org del dueño del producto creada por onboarding (Bryan).
const demoOwnerEmail = "simon.mendoza186@gmail.com";
const demoOwner = await admin.unsafe<
  { membership_id: string; organization_id: string; email: string }[]
>(
  `SELECT m.id AS membership_id, m.organization_id, u.email
   FROM memberships m JOIN users u ON u.id = m.user_id
   WHERE u.email = ${qlit(demoOwnerEmail)}
     AND m.role IN ('organization_admin', 'independent_owner')
     AND m.status = 'active'
   ORDER BY m.created_at ASC LIMIT 1`
);
if (!demoOwner[0]) {
  console.info("Provision: owner demo no encontrado, se omite disponibilidad.");
} else {
  const { membership_id: membershipId, organization_id: organizationId } = demoOwner[0];
  for (const weekday of ["mon", "tue", "wed", "thu", "fri"])
    await admin.unsafe(
      `INSERT INTO professional_availability (organization_id, professional_membership_id, site_id, weekday, starts_at, ends_at)
       SELECT ${qlit(organizationId)}, ${qlit(membershipId)}, NULL, ${qlit(weekday)}, ${qlit("10:00")}, ${qlit("20:00")}
       WHERE NOT EXISTS (
         SELECT 1 FROM professional_availability
         WHERE organization_id = ${qlit(organizationId)}
           AND professional_membership_id = ${qlit(membershipId)}
           AND site_id IS NULL
           AND weekday = ${qlit(weekday)}
       )`
    );
  console.info("Provision: disponibilidad L-V 10:00-20:00 sincronizada para owner demo.");
}
```

## Verificación

- `npm run lint`: **PASS** (exit code 0; sin errores).
- `npm run build`: **PASS** (exit code 0; compilación y TypeScript completados; 27/27 páginas estáticas generadas).
- `git diff --check -- db/provision.ts`: **PASS** (exit code 0).
- El build mantuvo advertencias preexistentes: convención `middleware` deprecada y Better Auth usando el secreto por defecto. No se imprimieron valores secretos.

## Desviaciones

- Ninguna desviación funcional.
- Durante la verificación inicial, un segundo build solapado encontró `.next/lock`; se repitió sin concurrencia y finalizó correctamente con exit code 0.
- No se realizaron commits, push ni deploy.
