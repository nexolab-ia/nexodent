import { PlanPage } from "@/components/billing/plan-page";
import { sql } from "@/db/client";
import { requestTenantContext } from "@/lib/request-context";
import { runAsTenant } from "@/lib/tenancy";

export default async function PlanSettingsPage() {
  const actor = await requestTenantContext();
  const organization = await runAsTenant(sql, actor, async (tx) => (await tx<Array<{ name: string }>>`
    SELECT name FROM organizations WHERE id = ${actor.organizationId}
  `)[0]);

  if (!organization) throw new Error("La organización no está disponible.");

  return <PlanPage organizationName={organization.name} />;
}
