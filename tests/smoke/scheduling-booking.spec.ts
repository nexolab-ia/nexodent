import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
describe("scheduling and public booking route shells", () => { it("keeps agenda and public booking modules present", async () => { await expect(readFile("app/(app)/agenda/page.tsx", "utf8")).resolves.toContain("AgendaClient"); await expect(readFile("app/r/[orgSlug]/page.tsx", "utf8")).resolves.toContain("Reserva tu hora"); await expect(readFile("app/api/public/booking/route.ts", "utf8")).resolves.toContain("POST"); }); });
