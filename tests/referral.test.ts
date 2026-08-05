import { describe, expect, it } from "vitest";

import { referralSchema } from "../src/schemas/referral";

describe("referralSchema", () => {
  it("accepts the five landing-page fields", () => {
    expect(
      referralSchema.safeParse({
        customerName: "Anu",
        customerPhone: "9876543210",
        referredName: "Manu",
        referredPhone: "9876543211",
        model: "glanza",
        website: "",
      }).success,
    ).toBe(true);
  });

  it("requires a supported model", () => {
    expect(
      referralSchema.safeParse({
        customerName: "Anu",
        customerPhone: "9876543210",
        referredName: "Manu",
        referredPhone: "9876543211",
        model: "fortuner",
      }).success,
    ).toBe(false);
  });
});
