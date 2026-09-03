import { headers } from "next/headers";
import { sql } from "@/db/client";
import { auth } from "@/lib/auth";
import { runAsTenant, type TenantContext } from "@/lib/tenancy";

export type ShellIdentity = {
  displayName: string;
  userName: string;
  email: string;
  pendingNotifications: number;
};

export async function shellIdentity(actor: TenantContext): Promise<ShellIdentity> {
  const session = await auth.api.getSession({ headers: await headers() }) as unknown as {
    user?: { name?: string | null; email?: string | null } | null;
  } | null;
  const userName = session?.user?.name?.trim() || "Profesional";
  const email = session?.user?.email?.trim() || "";
  const row = await runAsTenant(sql, actor, async (tx) => (await tx<Array<{
    organizationName: string;
    organizationType: string;
    pendingNotifications: string | number;
  }>>`
    SELECT o.name AS "organizationName", o.type AS "organizationType",
      (SELECT count(*) FROM notifications n
       WHERE n.organization_id = o.id AND n.state IN ('pending', 'failed')) AS "pendingNotifications"
    FROM organizations o
    WHERE o.id = ${actor.organizationId}
  `)[0]);
  return {
    displayName: row?.organizationType === "independent" ? userName : row?.organizationName || userName,
    userName,
    email,
    pendingNotifications: Number(row?.pendingNotifications ?? 0),
  };
}
