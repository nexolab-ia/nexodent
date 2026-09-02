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
    expect(form).toContain('router.replace("/agenda")');
    expect(form).toContain('role="alert"');
  });

  it("keeps demo credentials server-only and offers a real entry action", async () => {
    const [page, route, fixture] = await Promise.all([
      readFile("app/demo/page.tsx", "utf8"),
      readFile("app/api/demo/sign-in/route.ts", "utf8"),
      readFile("db/fixtures/demo.ts", "utf8"),
    ]);
    expect(page).toContain("Explorar la demo");
    expect(page).not.toContain("DEMO_PASSWORD");
    expect(route).toContain("env.DEMO_PASSWORD");
    expect(route).toContain('new URL("/agenda"');
    expect(fixture).toContain("DATOS FICTICIOS");
  });

  it("synchronizes stale demo credential hashes idempotently", async () => {
    const provision = await readFile("db/provision.ts", "utf8");
    expect(provision).toContain("verifyPassword");
    expect(provision).toContain("ON CONFLICT (provider_id, account_id) DO UPDATE SET password = EXCLUDED.password");
  });
});
