import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { insertDemoFixture } from "./fixtures/demo";

/**
 * Provision de producción (idempotente). Se ejecuta UNA vez por despliegue con
 * credenciales administrativas (DATABASE_URL_ADMIN) y deja la base lista para
 * que la app corra con un rol NOSUPERUSER NOBYPASSRLS (FORCE RLS activo).
 *
 * 1. Crea el rol de aplicación `nexodent_app` si no existe.
 * 2. Aplica las migraciones SQL en orden (una sola vez, con tabla de control).
 * 3. Otorga al rol de aplicación USAGE + DML sobre el schema public y EXECUTE
 *    sobre las funciones públicas (SECURITY DEFINER incluidas).
 * 4. Carga el fixture demo (idempotente, ON CONFLICT).
 * 5. Sincroniza la credencial de acceso del usuario demo.
 * 6. Sincroniza la disponibilidad del owner demo creado por onboarding.
 *
 * Env:
 *   DATABASE_URL_ADMIN   conexión con rol con BYPASSRLS (owner/superusuario)
 *   APP_DB_ROLE_PASSWORD password del rol nexodent_app (sin $)
 *   DEMO_EMAIL           email del usuario demo (debe existir tras el seed)
 *   DEMO_PASSWORD        password de acceso del usuario demo
 */

const qident = (value: string) => '"' + value.replace(/"/g, '""') + '"';
const qlit = (value: string) => "'" + value.replace(/'/g, "''") + "'";

export async function provision(databaseUrl = process.env.DATABASE_URL_ADMIN): Promise<void> {
  if (!databaseUrl) throw new Error("DATABASE_URL_ADMIN is required to provision.");
  const roleName = process.env.APP_DB_ROLE_NAME ?? "nexodent_app";
  const rolePassword = process.env.APP_DB_ROLE_PASSWORD;
  if (!rolePassword) throw new Error("APP_DB_ROLE_PASSWORD is required to provision.");
  const controlTable = "_nexodent_schema_migrations";
  const admin = postgres(databaseUrl, { max: 1 });
  try {
    // 1. Rol de aplicación: NOBYPASSRLS para que FORCE RLS aplique de verdad.
    await admin.unsafe(
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = ${qlit(roleName)}) THEN
           EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOBYPASSRLS', ${qlit(roleName)}, ${qlit(rolePassword)});
         END IF;
       END $$;`
    );

    // 2. Migraciones una sola vez.
    await admin.unsafe(
      `CREATE TABLE IF NOT EXISTS ${qident(controlTable)} (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`
    );
    const applied = new Set(
      (await admin.unsafe<{ name: string }[]>(`SELECT name FROM ${qident(controlTable)}`)).map((row) => row.name)
    );
    const files = (await readdir(join(process.cwd(), "db/migrations")))
      .filter((file) => file.endsWith(".sql"))
      .sort();
    const pending = files.filter((file) => !applied.has(file));
    if (pending.length > 0) {
      for (const file of pending) {
        const sql = await readFile(join(process.cwd(), "db/migrations", file), "utf8");
        await admin.unsafe(sql);
        await admin.unsafe(`INSERT INTO ${qident(controlTable)} (name) VALUES (${qlit(file)}) ON CONFLICT (name) DO NOTHING`);
      }
      console.info(`Provision: aplicadas ${pending.length} migraciones (${pending.join(", ")}).`);
    } else {
      console.info("Provision: sin migraciones pendientes.");
    }

    // 3. Grants del rol de aplicación (idempotente: cubre tablas existentes).
    await admin.unsafe(`GRANT USAGE ON SCHEMA public TO ${qident(roleName)}`);
    await admin.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${qident(roleName)}`);
    await admin.unsafe(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${qident(roleName)}`);
    await admin.unsafe(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${qident(roleName)}`);

    // 4. Fixture demo (idempotente).
    await insertDemoFixture(admin);
    console.info("Provision: fixture demo cargado.");

    // 5. Credencial del usuario demo (provider credential de Better Auth).
    const demoEmail = process.env.DEMO_EMAIL ?? "emilia.demo@nexodent.invalid";
    const demoPassword = process.env.DEMO_PASSWORD;
    if (!demoPassword) throw new Error("DEMO_PASSWORD is required to provision.");
    const demoUser = await admin<{ id: string }[]>`SELECT id FROM users WHERE email = ${demoEmail}`;
    if (!demoUser[0]) throw new Error(`Demo user ${demoEmail} not found after seed.`);
    const userId = demoUser[0].id;
    const existing = await admin<{ id: string; password: string | null }[]>`
      SELECT id, password FROM accounts WHERE provider_id = 'credential' AND account_id = ${userId}`;
    const passwordMatches = existing[0]?.password
      ? await verifyPassword({ hash: existing[0].password, password: demoPassword })
      : false;
    if (!passwordMatches) {
      const hash = await hashPassword(demoPassword);
      await admin.unsafe(
        `INSERT INTO accounts (user_id, account_id, provider_id, issuer, password)
         VALUES ($1, $2, 'credential', 'local:credential', $3)
         ON CONFLICT (provider_id, account_id) DO UPDATE SET password = EXCLUDED.password, issuer = 'local:credential', updated_at = now()`,
        [userId, userId, hash]
      );
      console.info(`Provision: credencial demo sincronizada para ${demoEmail}.`);
    } else {
      console.info("Provision: credencial demo vigente.");
    }

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
    console.info("Provision: listo.");
  } finally {
    await admin.end();
  }
}

if (process.argv[1]?.endsWith("provision.ts")) {
  provision().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Provision failed.");
    process.exitCode = 1;
  });
}
