import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("tenant identity route shell", () => {
  it("keeps login and settings route modules present", async () => {
    await expect(readFile("app/login/page.tsx", "utf8")).resolves.toContain("Sign in");
    await expect(readFile("app/(app)/settings/members/page.tsx", "utf8")).resolves.toContain("Members");
    await expect(readFile("app/(app)/settings/sites/page.tsx", "utf8")).resolves.toContain("Sites");
  });
});
