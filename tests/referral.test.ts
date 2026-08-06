import { describe, expect, it } from "vitest";

import { referralSchema } from "../src/schemas/referral";

const valid = {
  customerName: "Anu",
  customerPhone: "9876543210",
  model: "glanza",
  friends: [
    { referredName: "Manu", referredPhone: "9876543211" },
    { referredName: "Ravi", referredPhone: "9876543212" },
  ],
};

describe("referralSchema", () => {
  it("accepts one or more friends", () => {
    expect(referralSchema.safeParse(valid).success).toBe(true);
    expect(
      referralSchema.safeParse({
        ...valid,
        friends: [valid.friends[0]],
      }).success,
    ).toBe(true);
  });

  it("requires a supported model", () => {
    expect(
      referralSchema.safeParse({ ...valid, model: "fortuner" }).success,
    ).toBe(false);
  });

  it("rejects more than five friends", () => {
    expect(
      referralSchema.safeParse({
        ...valid,
        friends: Array.from({ length: 6 }, (_, i) => ({
          referredName: `Friend ${i}`,
          referredPhone: `987654321${i}`,
        })),
      }).success,
    ).toBe(false);
  });
});
