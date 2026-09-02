import { headers } from "next/headers";
import { activeMembershipForUser, auth } from "@/lib/auth";
import type { TenantContext } from "@/lib/tenancy";
export async function requestTenantContext(): Promise<TenantContext> {
  const session = await auth.api.getSession({ headers: await headers() }) as unknown as { user?: { id?: string } | null } | null;
  if (!session?.user?.id) throw new Error("Debes iniciar sesión para realizar esta operación.");
  return activeMembershipForUser(session.user.id);
}
