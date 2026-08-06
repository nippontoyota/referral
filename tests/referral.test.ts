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

  it("rejects more than fifty friends", () => {
    expect(
      referralSchema.safeParse({
        ...valid,
        friends: Array.from({ length: 51 }, (_, i) => ({
          referredName: `Friend ${i}`,
          referredPhone: `9${String(i).padStart(9, "0")}`,
        })),
      }).success,
    ).toBe(false);
  });
});
