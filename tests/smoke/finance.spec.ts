import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { onlinePaymentUnavailable } from "@/features/manual-billing/domain";
import { readFile } from "node:fs/promises";
describe("finance route runtime guards", () => { it("redirects anonymous finance routes and keeps online payment outside the runtime boundary", () => { for (const route of ["/estimates", "/billing"]) { expect(middleware(new NextRequest(`http://localhost${route}`)).status).toBe(307); } expect(onlinePaymentUnavailable().transactionCreated).toBe(false); }); });
describe("finance application surfaces", () => { it("ships tenant lists, real forms, empty states and CLP formatting", async () => { const estimates = await readFile("app/(app)/estimates/page.tsx", "utf8"); const billing = await readFile("app/(app)/billing/page.tsx", "utf8"); expect(estimates).toContain("createEstimateDraft"); expect(estimates).toContain('currency:"CLP"'); expect(estimates).toContain("No hay cotizaciones"); expect(billing).toContain("registerManualPayment"); expect(billing).toContain("Cuenta corriente"); expect(billing).toContain("No hay movimientos"); }); });
