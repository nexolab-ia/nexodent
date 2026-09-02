import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { svgProjection, validateToothChange } from "@/features/odontogram/model";
import { readFile } from "node:fs/promises";
describe("clinical route runtime guards", () => { it("redirects anonymous clinical routes and exposes only validated odontogram projection data", () => { const response = middleware(new NextRequest("http://localhost/patients/patient-1")); expect(response.status).toBe(307); expect(response.headers.get("location")).toContain("/login"); validateToothChange(1, "whole", "healthy", "Control"); expect(svgProjection([])).toHaveLength(32); }); });
describe("clinical application surfaces", () => { it("ships evolution, upload and keyboard-accessible odontogram controls", async () => { const patient = await readFile("app/(app)/patients/[patientId]/page.tsx", "utf8"); const odontogram = await readFile("components/odontogram/odontogram-control.tsx", "utf8"); expect(patient).toContain("createClinicalEvolution"); expect(patient).toContain("uploadPatientDocument"); expect(odontogram).toContain("ArrowRight"); expect(odontogram).toContain("Registrar cambio"); }); });
