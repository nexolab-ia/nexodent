import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { readEnv } from "@/lib/env";
import * as schema from "@/db/schema";

const env = readEnv();
export const sql = postgres(env.DATABASE_URL ?? "postgres://localhost:5432/nexodent", { max: 3, prepare: false, connect_timeout: 5 });
export const db = drizzle({ client: sql, schema });

export async function databaseIsReachable(databaseUrl = readEnv().DATABASE_URL): Promise<boolean> {
  if (!databaseUrl) return false;
  const probe = postgres(databaseUrl, { max: 1, connect_timeout: 2 });
  try { await probe.unsafe("SELECT 1"); return true; } catch { return false; } finally { await probe.end({ timeout: 2 }); }
}
