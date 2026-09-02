import { describe, expect, it } from "vitest";
import { can, AuthorizationError } from "@/features/tenant-identity/authorize";
import { changeMembership, changeSiteAssignment, type TenantIdentityStore } from "@/features/tenant-identity/actions";
import { claimsForMembership } from "@/lib/auth";

const siteA = "11111111-1111-4111-8111-111111111111";
const base = { membershipId: "22222222-2222-4222-8222-222222222222", organizationId: "33333333-3333-4333-8333-333333333333", siteIds: [siteA], active: true } as const;
function store(events: string[]): TenantIdentityStore { return { transaction: async (work) => work({ updateMembership: async () => { events.push("membership"); }, replaceMembershipSite: async () => { events.push("site"); }, append: async () => { events.push("audit"); } }) }; }

describe("least-privilege tenancy", () => {
  it("denies assistants clinical and billing permissions", () => {
    expect(can({ ...base, role: "assistant" }, "clinical:manage")).toBe(false);
    expect(can({ ...base, role: "assistant" }, "billing:manage")).toBe(false);
  });
  it("allows an independent owner to combine admin and professional permissions", () => {
    expect(can({ ...base, role: "independent_owner" }, "membership:manage")).toBe(true);
    expect(can({ ...base, role: "independent_owner" }, "clinical:manage")).toBe(true);
  });
  it("enforces assigned-site scope for professionals", () => {
    expect(can({ ...base, role: "professional", resourceSiteId: "44444444-4444-4444-8444-444444444444", ownsAppointment: true }, "appointment:own")).toBe(false);
  });
  it("persists a membership mutation before its append-only audit entry", async () => {
    const events: string[] = [];
    await changeMembership({ ...base, role: "organization_admin" }, { targetMembershipId: base.membershipId, before: { role: "professional" }, after: { role: "assistant" }, reason: "Role change" }, store(events));
    expect(events).toEqual(["membership", "audit"]);
  });
  it("persists a site assignment before its append-only audit entry", async () => {
    const events: string[] = [];
    await changeSiteAssignment({ ...base, role: "organization_admin" }, { targetMembershipId: base.membershipId, before: {}, after: {}, reason: "Site assignment", siteId: siteA }, store(events));
    expect(events).toEqual(["site", "audit"]);
  });
  it("audits denied membership changes without revealing a target", async () => {
    const events: string[] = [];
    await expect(changeMembership({ ...base, role: "assistant" }, { targetMembershipId: base.membershipId, before: {}, after: {}, reason: "No access" }, store(events))).rejects.toBeInstanceOf(AuthorizationError);
    expect(events).toEqual(["audit"]);
  });
  it("creates claims only for an active non-expired membership and permits no expiry", () => {
    const claims = claimsForMembership({ ...base, role: "professional", expiresAt: null }, new Date("2029-01-01"));
    expect(claims.siteIds).toEqual([siteA]);
    expect(() => claimsForMembership({ ...base, role: "professional", active: false, expiresAt: null })).toThrow("Active membership required");
    expect(() => claimsForMembership({ ...base, role: "professional", expiresAt: new Date("2028-01-01") }, new Date("2029-01-01"))).toThrow("Active membership required");
  });
});
