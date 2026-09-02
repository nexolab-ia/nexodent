import { databaseIsReachable } from "@/db/client";
import { runtimeIsConfigured } from "@/lib/env";

export async function readinessStatus(probe = databaseIsReachable, configured = runtimeIsConfigured()): Promise<number> {
  return configured && await probe() ? 200 : 503;
}
export async function GET() {
  const status = await readinessStatus();
  return Response.json({ status: status === 200 ? "ready" : "not_ready" }, { status });
}
