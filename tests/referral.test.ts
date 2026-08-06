import { describe, expect, it } from "vitest";

import { referralSchema } from "../src/schemas/referral";

const valid = {
  customerName: "Anu",
  customerPhone: "9876543210",
  referredName: "Manu",
  referredPhone: "9876543211",
  model: "glanza",
};

describe("referralSchema", () => {
  it("accepts the five landing-page fields", () => {
    expect(referralSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a supported model", () => {
    expect(
      referralSchema.safeParse({ ...valid, model: "fortuner" }).success,
    ).toBe(false);
  });
});
