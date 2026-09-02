/**
 * J0 RED-first contract marker, recorded before worker hardening.
 *
 * This file is intentionally excluded from the configured test scripts. These
 * executable specifications document the pre-implementation failures without
 * claiming that the RED suite was run in this environment.
 */
import { describe, expect, it } from "vitest";

describe.skip("process-boundary security RED marker", () => {
  it("allows only one claim when two workers race", () => {
    throw new Error("RED: atomic SKIP LOCKED claiming was not implemented when recorded");
  });

  it("stops retrying after the configured attempt bound", () => {
    throw new Error("RED: bounded retry policy was not implemented when recorded");
  });

  it("rejects malicious CSV and worker payloads without residual data", () => {
    expect("untrusted payload persisted").toBe("rejected before persistence");
  });
});
