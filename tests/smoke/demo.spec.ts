import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
describe("demo route shell", () => { it("keeps the /demo route and fictional fixture marker available", async () => { await expect(readFile("app/demo/page.tsx", "utf8")).resolves.toContain("Demo NexoDent"); await expect(readFile("db/fixtures/demo.ts", "utf8")).resolves.toContain("DATOS FICTICIOS"); }); });
