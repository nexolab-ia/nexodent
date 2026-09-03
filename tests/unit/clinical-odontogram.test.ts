import { describe, expect, it } from "vitest";
import {
  chronological,
  isLikelyDuplicate,
  validateClinicalUpload,
  validatePatient,
} from "@/features/clinical-records/domain";
import {
  quarantineAndScan,
  uploadAndLinkClinicalDocument,
} from "@/lib/storage";
import {
  ODONTOGRAM_STATES,
  reduceOdontogram,
  svgProjection,
  validateToothChange,
} from "@/features/odontogram/model";
import { can } from "@/features/tenant-identity/authorize";
const context = {
  membershipId: "11111111-1111-4111-8111-111111111111",
  organizationId: "22222222-2222-4222-8222-222222222222",
  role: "professional" as const,
  siteIds: [],
  active: true,
};
describe("clinical records", () => {
  it("validates consent, warns likely duplicates, and preserves chronological history", () => {
    expect(
      validatePatient({
        firstName: " Ana ",
        lastName: "Paz",
        rut: "11",
        consentGranted: true,
      }).firstName,
    ).toBe("Ana");
    expect(isLikelyDuplicate({ rut: "11" }, { rut: "11" })).toBe(true);
    expect(() =>
      validatePatient({
        firstName: "Ana",
        lastName: "Paz",
        consentGranted: false,
      }),
    ).toThrow("consentimiento");
    expect(
      chronological([
        { occurredAt: new Date("2027-01-02") },
        { occurredAt: new Date("2027-01-01") },
      ])[0]?.occurredAt.toISOString(),
    ).toContain("2027-01-01");
  });
  it("validates the optional patient profile without breaking legacy input", () => {
    expect(
      validatePatient({
        firstName: "Ana",
        lastName: "Paz",
        consentGranted: true,
      }),
    ).toMatchObject({ firstName: "Ana", lastName: "Paz" });
    expect(
      validatePatient({
        firstName: " Ana ",
        lastName: " Paz ",
        consentGranted: true,
        sex: undefined,
        birthDate: "",
        phoneSecondary: " ",
        city: " ",
        address: " ",
        convenioId: "",
        observations: " ",
      }),
    ).toMatchObject({
      sex: undefined,
      birthDate: undefined,
      phoneSecondary: undefined,
      city: undefined,
      address: undefined,
      convenioId: undefined,
      observations: undefined,
    });
    expect(() =>
      validatePatient({
        firstName: "Ana",
        lastName: "Paz",
        consentGranted: true,
        sex: "invalid" as never,
      }),
    ).toThrow("Selecciona una opción de sexo válida.");
    expect(() =>
      validatePatient({
        firstName: "Ana",
        lastName: "Paz",
        consentGranted: true,
        birthDate: "03/09/2020",
      }),
    ).toThrow("La fecha de nacimiento no puede ser futura.");
    expect(() =>
      validatePatient({
        firstName: "Ana",
        lastName: "Paz",
        consentGranted: true,
        birthDate: "2999-01-01",
      }),
    ).toThrow("La fecha de nacimiento no puede ser futura.");
  });
  it("rejects invalid uploads before a partial object remains", async () => {
    const calls: string[] = [];
    const store = {
      putQuarantine: async () => {
        calls.push("put");
      },
      remove: async () => {
        calls.push("remove");
      },
      scan: async () => "clean" as const,
    };
    await expect(
      quarantineAndScan(store, "q/invalid", new Uint8Array(1), 0, {
        fileName: "bad.exe",
        mimeType: "application/octet-stream",
        byteSize: 1,
      }),
    ).rejects.toThrow("PDF");
    expect(calls).toEqual([]);
    validateClinicalUpload(
      { fileName: "scan.pdf", mimeType: "application/pdf", byteSize: 1024 },
      0,
    );
    await expect(
      uploadAndLinkClinicalDocument(
        store,
        "q/clean",
        new Uint8Array(1),
        0,
        { fileName: "scan.pdf", mimeType: "application/pdf", byteSize: 1 },
        async () => {
          throw new Error("db failed");
        },
      ),
    ).rejects.toThrow("db failed");
    expect(calls).toContain("remove");
  });
  it("denies assistants access to clinical evolutions", () => {
    expect(can({ ...context, role: "assistant" }, "clinical:manage")).toBe(
      false,
    );
  });
});
describe("odontogram", () => {
  it("only accepts structured permanent tooth values", () => {
    validateToothChange(1, "whole", "healthy", "Control");
    expect(ODONTOGRAM_STATES).not.toContain("diagnosis" as never);
    expect(() =>
      validateToothChange(33, "whole", "healthy", "Control"),
    ).toThrow();
    expect(() =>
      validateToothChange(1, "whole", "recommendation", "Control"),
    ).toThrow();
  });
  it("reduces accepted events without mutating history and projects SVG data", () => {
    const events = [
      {
        tooth: 1,
        surface: "whole" as const,
        stateAfter: "caries" as const,
        occurredAt: new Date(),
        version: 1,
      },
      {
        tooth: 1,
        surface: "whole" as const,
        stateAfter: "restoration" as const,
        occurredAt: new Date(),
        version: 2,
      },
    ];
    expect(reduceOdontogram(events).get("1:whole")).toBe("restoration");
    expect(events).toHaveLength(2);
    expect(svgProjection(events).find((item) => item.tooth === 1)?.state).toBe(
      "restoration",
    );
  });
});
