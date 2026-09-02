import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import postgres from "postgres";
import { provision } from "../db/provision";

const pw = "local-admin-pass-2026";
const rolePw = "local-app-role-pass";
const demoPw = "Demo-2026-Clave";
const host = "localhost:55439";
const scheme = "postgres://";
const adminUrl = scheme + "admin" + ":" + pw + "@" + host + "/postgres";
const appUrl = scheme + "nexodent_app" + ":" + rolePw + "@" + host + "/postgres";

function setEnv(key: string, value: string) {
  (process.env as Record<string, string>)[key] = value;
}

async function main() {
  const dir = await mkdtemp(join(tmpdir(), "nexodent-provision-"));
  const embedded = new EmbeddedPostgres({
    databaseDir: dir,
    port: 55439,
    user: "admin",
    password: pw,
    persistent: false,
    onLog: () => undefined,
    onError: () => undefined,
  });
  await embedded.initialise();
  await embedded.start();
  const admin = postgres(adminUrl, { max: 1 });
  try {
    setEnv("DATABASE_URL_ADMIN", adminUrl);
    setEnv("APP_DB_ROLE_PASSWORD", rolePw);
    setEnv("APP_DB_ROLE_NAME", "nexodent_app");
    setEnv("DEMO_EMAIL", "emilia.demo@nexodent.invalid");
    setEnv("DEMO_PASSWORD", demoPw);
    await provision();

    const role = await admin<{ rolname: string; rolbypassrls: boolean; rolsuper: boolean }[]>`
      SELECT rolname, rolbypassrls, rolsuper FROM pg_roles WHERE rolname = 'nexodent_app'`;
    console.log("rol app:", JSON.stringify(role[0]));
    if (!role[0] || role[0].rolbypassrls !== false || role[0].rolsuper !== false) throw new Error("rol app mal creado");

    const app = postgres(appUrl, { max: 1 });
    try {
      const hidden = await app`SELECT count(*)::int AS n FROM organizations`;
      console.log("orgs visibles sin tenant (esperado 0):", hidden[0].n);
      if (Number(hidden[0].n) !== 0) throw new Error("RLS no fuerza: el rol app ve filas sin GUC");

      await app.unsafe("SET app.organization_id = '10000000-0000-4000-8000-000000000001'");
      const visible = await app`SELECT count(*)::int AS n FROM organizations`;
      console.log("orgs visibles con tenant demo (esperado 1):", visible[0].n);
      if (Number(visible[0].n) !== 1) throw new Error("RLS no muestra la org del GUC");

      const cred = await admin<{ provider_id: string; password: string }[]>`
        SELECT provider_id, password FROM accounts WHERE account_id = '10000000-0000-4000-8000-000000000101'`;
      console.log("credencial demo:", cred[0]?.provider_id, cred[0]?.password ? "hash " + cred[0].password.length + " chars" : "FALTA");
      if (!cred[0] || cred[0].provider_id !== "credential") throw new Error("credencial demo no creada");
      const { verifyPassword } = await import("better-auth/crypto");
      const ok = await verifyPassword({ hash: cred[0].password, password: demoPw });
      console.log("verify password demo:", ok);
      if (!ok) throw new Error("password demo no verifica");
    } finally {
      await app.end();
    }

    await provision();
    console.log("segunda corrida OK (idempotente)");

    const migs = await admin<{ name: string }[]>`SELECT name FROM _nexodent_schema_migrations ORDER BY name`;
    console.log("migraciones control:", migs.map((m) => m.name).join(", "));
  } finally {
    await admin.end();
    await embedded.stop();
    await rm(dir, { recursive: true, force: true });
  }
}

main().then(() => console.log("PROVISION TEST PASSED")).catch((e) => { console.error("PROVISION TEST FAILED:", e); process.exitCode = 1; });
