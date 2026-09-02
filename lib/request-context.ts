import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-call";
import { activeMembershipForUser, auth } from "@/lib/auth";
import type { TenantContext } from "@/lib/tenancy";
export async function requestTenantContext(): Promise<TenantContext> {
  const session = await auth.api.getSession({ headers: await headers() }) as unknown as { user?: { id?: string } | null } | null;
  if (!session?.user?.id) throw new Error("Debes iniciar sesión para realizar esta operación.");
  try {
    return await activeMembershipForUser(session.user.id);
  } catch (error) {
    if (error instanceof APIError && error.status === "UNAUTHORIZED") redirect("/onboarding");
    throw error;
  }
}
