import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

describe("access routes", () => {
  it("renders a functional email/password login", async () => {
    const [page, form] = await Promise.all([
      readFile("app/login/page.tsx", "utf8"),
      readFile("app/login/login-form.tsx", "utf8"),
    ]);
    expect(page).toContain("<LoginForm />");
    expect(form).toContain("/api/auth/sign-in/email");
    expect(form).toContain('router.replace("/dashboard")');
    expect(form).toContain('role="alert"');
  });

  it("routes demo entry through registration and lands the sign-in endpoint on the dashboard", async () => {
    const [page, route, fixture] = await Promise.all([
      readFile("app/demo/page.tsx", "utf8"),
      readFile("app/api/demo/sign-in/route.ts", "utf8"),
      readFile("db/fixtures/demo.ts", "utf8"),
    ]);
    expect(page).toContain('redirect("/registro")');
    expect(route).toContain('redirect("/dashboard")');
    expect(fixture).toContain("DATOS FICTICIOS");
  });

  it("synchronizes stale demo credential hashes idempotently", async () => {
    const [migration, authSchema, provision] = await Promise.all([
      readFile("db/migrations/0007_add_accounts_issuer.sql", "utf8"),
      readFile("db/schema/auth.ts", "utf8"),
      readFile("db/provision.ts", "utf8"),
    ]);

    expect(migration).toContain("ADD COLUMN IF NOT EXISTS issuer varchar(255)");
    expect(migration).toContain(
      "SET issuer = 'local:credential' WHERE provider_id = 'credential' AND (issuer IS NULL OR issuer = '')",
    );
    expect(authSchema).toContain('issuer: varchar("issuer", { length: 255 })');
    expect(provision).toContain("verifyPassword");
    expect(provision).toContain("provider_id, issuer, password");
    expect(provision).toContain("'credential', 'local:credential'");
    expect(provision).toContain(
      "DO UPDATE SET password = EXCLUDED.password, issuer = 'local:credential'",
    );
  });
});
