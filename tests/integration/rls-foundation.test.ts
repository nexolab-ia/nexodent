import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("RLS migration harness", () => {
  it("contains required database extensions and forced RLS migration", async () => {
    const core = await readFile("db/migrations/0000_core.sql", "utf8");
    const rls = await readFile("db/migrations/0001_tenant_rls.sql", "utf8");
    expect(core).toContain('CREATE EXTENSION IF NOT EXISTS "btree_gist"');
    expect(rls).toContain("FORCE ROW LEVEL SECURITY");
  });
});
