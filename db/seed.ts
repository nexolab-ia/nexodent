import postgres from "postgres";
import { readEnv } from "@/lib/env";
import { insertDemoFixture } from "@/db/fixtures/demo";

export async function seed(databaseUrl = readEnv().DATABASE_URL): Promise<void> {
  if (!databaseUrl) throw new Error("DATABASE_URL is required to seed demo data.");
  const sql = postgres(databaseUrl, { max: 1 });
  try { await insertDemoFixture(sql); } finally { await sql.end(); }
}

if (process.argv[1]?.endsWith("seed.ts")) seed().then(() => console.log("Datos demo ficticios cargados de forma idempotente.")).catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Seed failed."); process.exitCode = 1; });
