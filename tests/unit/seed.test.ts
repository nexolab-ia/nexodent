import { describe, expect, it } from "vitest";
import { demoOperationalEvidence, demoPatients, FICTIONAL_DATA_MARKER } from "@/db/fixtures/demo";

describe("demo seed fixtures", () => {
  it("contains deterministic fictional clinic and independent evidence", () => {
    expect(demoPatients).toHaveLength(20);
    expect(demoPatients.every((patient) => patient.fictional && patient.rut.startsWith("11.111.11"))).toBe(true);
    expect(FICTIONAL_DATA_MARKER).toContain("FICTICIOS");
  });
  it("provides odontogram, estimate, billing and notice source evidence without implementing later features", () => {
    expect(demoOperationalEvidence.odontogramVersions).toHaveLength(1);
    expect(demoOperationalEvidence.estimates[0]?.totalClp).toBeGreaterThan(0);
    expect(demoOperationalEvidence.chargesAndPayments[0]?.chargeClp).toBeGreaterThan(demoOperationalEvidence.chargesAndPayments[0]?.paymentClp ?? 0);
    expect(demoOperationalEvidence.noticeSources).toHaveLength(3);
  });
});
