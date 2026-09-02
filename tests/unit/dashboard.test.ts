import { describe, expect, it } from "vitest";
import { addDaysLocal, attendancePercent, dayBounds, deltaPercent, occupancyPercent, parseDayParam, percent, resolveScope } from "@/features/dashboard/domain";
import type { TenantContext } from "@/lib/tenancy";
const actor=(role:TenantContext["role"]):TenantContext=>({membershipId:"11111111-1111-4111-8111-111111111111",organizationId:"22222222-2222-4222-8222-222222222222",role,siteIds:[],active:true});
describe("dashboard domain",()=>{
 it("resolves scope by role",()=>{expect(resolveScope(actor("organization_admin"))).toBe("clinic");expect(resolveScope(actor("independent_owner"),"own")).toBe("own");expect(resolveScope(actor("professional"),"clinic")).toBe("own");expect(resolveScope(actor("assistant"),"own")).toBe("clinic")});
 it("calculates percentages and edge cases",()=>{expect(percent(1,3)).toBe(33);expect(percent(1,0)).toBeNull();expect(deltaPercent(120,100)).toBe(20);expect(deltaPercent(2,0)).toBeNull();expect(occupancyPercent(30,60)).toBe(50);expect(attendancePercent(3,1)).toBe(75);expect(attendancePercent(0,0)).toBeNull()});
 it("uses real Santiago DST day bounds",()=>{expect(dayBounds({year:2026,month:1,day:15}).start.toISOString()).toBe("2026-01-15T03:00:00.000Z");expect(dayBounds({year:2026,month:7,day:15}).start.toISOString()).toBe("2026-07-15T04:00:00.000Z")});
 it("parses valid dates and rejects impossible ones",()=>{expect(parseDayParam("2026-09-03")).toEqual({year:2026,month:9,day:3});expect(()=>parseDayParam("2026-02-30")).toThrow();expect(()=>parseDayParam("03-09-2026")).toThrow();expect(addDaysLocal({year:2026,month:12,day:31},1)).toEqual({year:2027,month:1,day:1})});
});
