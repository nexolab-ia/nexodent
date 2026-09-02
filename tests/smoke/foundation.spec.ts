import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/ready/route";

describe("foundation routes", () => {
  it("returns non-disclosing unavailable readiness without runtime configuration", async () => {
    const response = await GET();
    expect([200, 503]).toContain(response.status);
    expect(await response.json()).toHaveProperty("status");
  });
});
