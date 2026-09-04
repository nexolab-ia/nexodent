import { MembersPage } from "@/components/settings/members-page";
import { getMemberRoleLabel, isPaidMembershipRole, type MembershipRole, PLAN_PROFESSIONAL_LIMIT } from "@/features/members/roles";
import { sql } from "@/db/client";
import { requestTenantContext } from "@/lib/request-context";
import { runAsTenant } from "@/lib/tenancy";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  role: MembershipRole;
  status: "active" | "suspended" | "removed";
  memberSince: string;
  weekdays: string[];
};

export default async function MembersSettingsPage() {
  const actor = await requestTenantContext();
  const rows = await runAsTenant(sql, actor, (tx) => tx<MemberRow[]>`
    SELECT
      m.id,
      u.name,
      u.email,
      m.role::text AS role,
      m.status::text AS status,
      to_char(m.created_at AT TIME ZONE 'America/Santiago', 'DD/MM/YYYY') AS "memberSince",
      COALESCE(array_agg(DISTINCT pa.weekday) FILTER (WHERE pa.weekday IS NOT NULL), ARRAY[]::text[]) AS weekdays
    FROM memberships m
    INNER JOIN users u ON u.id = m.user_id
    LEFT JOIN professional_availability pa ON pa.professional_membership_id = m.id
      AND pa.organization_id = m.organization_id
    WHERE m.organization_id = ${actor.organizationId}
      AND m.status = 'active'
    GROUP BY m.id, u.id
    ORDER BY m.created_at ASC
  `);

  const hasIndependentOwner = rows.some((member) => member.role === "independent_owner");
  // MOCK-owner: persistir owner real cuando exista backend de suscripción/invitaciones
  const oldestAdminId = hasIndependentOwner ? null : rows.find((member) => member.role === "organization_admin")?.id;
  const members = rows.map((member) => {
    const isOwner = member.role === "independent_owner" || member.id === oldestAdminId;
    return { ...member, isOwner, isPaidRole: isPaidMembershipRole(member.role), roleLabel: getMemberRoleLabel(member.role, isOwner) };
  }).sort((a, b) => Number(b.isOwner) - Number(a.isOwner));
  const professionalUsage = rows.filter((member) => member.status === "active" && isPaidMembershipRole(member.role)).length;

  return <MembersPage members={members} professionalLimit={PLAN_PROFESSIONAL_LIMIT} professionalUsage={professionalUsage} />;
}
