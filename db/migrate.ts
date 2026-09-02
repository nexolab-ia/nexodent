import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { readEnv } from "@/lib/env";

export async function migrationFiles(): Promise<string[]> {
  return (await readdir(join(process.cwd(), "db/migrations"))).filter((file) => file.endsWith(".sql")).sort();
}

export async function migrate(databaseUrl = readEnv().DATABASE_URL): Promise<void> {
  if (!databaseUrl) throw new Error("Database configuration is required for migration.");
  const sql = postgres(databaseUrl, { max: 1 });
  try {
    for (const file of await migrationFiles()) await sql.unsafe(await readFile(join(process.cwd(), "db/migrations", file), "utf8"));
  } finally { await sql.end(); }
}

if (process.argv[1]?.endsWith("migrate.ts")) migrate().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Migration failed."); process.exitCode = 1; });
