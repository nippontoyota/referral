import { describe, expect, it } from "vitest";

import { normalizePhone } from "../src/lib/phone";

/** Mirrors the submit path: normalize both, then apply business rules. */
function checkPhones(customerRaw: string, referredRaw: string) {
  const customerPhone = normalizePhone(customerRaw);
  const referredPhone = normalizePhone(referredRaw);
  if (!customerPhone || !referredPhone) return "invalid";
  if (customerPhone === referredPhone) return "self";
  return "ok" as const;
}

describe("referral phone rules", () => {
  it("allows different valid numbers across formats", () => {
    expect(checkPhones("9876543210", "+91 98765 43211")).toBe("ok");
    expect(checkPhones("09876543210", "9876543211")).toBe("ok");
  });

  it("rejects self-referral even when formats differ", () => {
    expect(checkPhones("9876543210", "+919876543210")).toBe("self");
    expect(checkPhones("09876543210", "9876543210")).toBe("self");
    expect(checkPhones("+91 98765 43210", "9876543210")).toBe("self");
  });

  it("rejects invalid numbers", () => {
    expect(checkPhones("123", "9876543210")).toBe("invalid");
    expect(checkPhones("9876543210", "5876543210")).toBe("invalid");
  });
});
