import type { TenantContext } from "@/lib/tenancy";

export const capabilities = [
  "organization:manage", "site:manage", "membership:manage", "operations:manage", "billing:manage", "audit:read",
  "patient:demographics", "appointment:schedule", "communication:manage", "clinical:manage", "odontogram:manage", "estimate:manage", "appointment:own",
  "retention:delete",
] as const;
export type Capability = (typeof capabilities)[number];

const matrix: Record<TenantContext["role"], readonly Capability[]> = {
  organization_admin: ["organization:manage", "site:manage", "membership:manage", "operations:manage", "billing:manage", "audit:read", "patient:demographics", "appointment:schedule", "communication:manage", "retention:delete"],
  professional: ["clinical:manage", "odontogram:manage", "estimate:manage", "appointment:own"],
  assistant: ["patient:demographics", "appointment:schedule", "communication:manage"],
  independent_owner: ["organization:manage", "site:manage", "membership:manage", "operations:manage", "billing:manage", "audit:read", "patient:demographics", "appointment:schedule", "communication:manage", "retention:delete", "clinical:manage", "odontogram:manage", "estimate:manage", "appointment:own"],
};

export class AuthorizationError extends Error { readonly status = 404; constructor() { super("The requested resource is unavailable."); } }
export type AuthorizationInput = TenantContext & { resourceSiteId?: string | null; ownsAppointment?: boolean; legalHold?: boolean; deletionApproved?: boolean };

export function can(input: AuthorizationInput, capability: Capability): boolean {
  if (!input.active || !matrix[input.role].includes(capability)) return false;
  if (capability === "appointment:own" && !input.ownsAppointment) return false;
  if (input.resourceSiteId && input.role !== "organization_admin" && input.role !== "independent_owner" && !input.siteIds.includes(input.resourceSiteId)) return false;
  if (capability === "retention:delete" && (!input.deletionApproved || input.legalHold)) return false;
  return true;
}

export function authorize(input: AuthorizationInput, capability: Capability): void { if (!can(input, capability)) throw new AuthorizationError(); }
