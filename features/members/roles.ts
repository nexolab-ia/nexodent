export const MEMBER_ROLE_OPTIONS = [
  "Administrador Secundario",
  "Profesional Odontología",
  "Asistente Odontología",
] as const;

export type MemberRoleLabel = "Administrador" | (typeof MEMBER_ROLE_OPTIONS)[number];
export type MembershipRole = "organization_admin" | "professional" | "assistant" | "independent_owner";

// MOCK — reemplazar por límite del plan real (hoy el plan es mock en useBillingDemo)
export const PLAN_PROFESSIONAL_LIMIT = 1;

export function getMemberRoleLabel(role: MembershipRole, isOwner: boolean): MemberRoleLabel {
  if (role === "independent_owner" || (role === "organization_admin" && isOwner)) return "Administrador";
  if (role === "organization_admin") return "Administrador Secundario";
  if (role === "professional") return "Profesional Odontología";
  return "Asistente Odontología";
}

export function isPaidMembershipRole(role: MembershipRole) {
  return role === "organization_admin" || role === "independent_owner" || role === "professional";
}
