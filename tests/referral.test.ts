import { describe, expect, it } from "vitest";

import { referralSchema } from "../src/schemas/referral";

const valid = {
  customerName: "Anu",
  customerPhone: "9876543210",
  friends: [
    {
      referredName: "Manu",
      referredPhone: "9876543211",
      model: "glanza",
    },
    {
      referredName: "Ravi",
      referredPhone: "9876543212",
      model: "hyryder",
    },
  ],
};

describe("referralSchema", () => {
  it("accepts one or more friends with per-friend models", () => {
    expect(referralSchema.safeParse(valid).success).toBe(true);
    expect(
      referralSchema.safeParse({
        ...valid,
        friends: [valid.friends[0]],
      }).success,
    ).toBe(true);
  });

  it("requires a supported model on each friend", () => {
    expect(
      referralSchema.safeParse({
        ...valid,
        friends: [{ ...valid.friends[0], model: "fortuner" }],
      }).success,
    ).toBe(false);
  });

  it("rejects more than fifty friends", () => {
    expect(
      referralSchema.safeParse({
        ...valid,
        friends: Array.from({ length: 51 }, (_, i) => ({
          referredName: `Friend ${i}`,
          referredPhone: `9${String(i).padStart(9, "0")}`,
          model: i % 2 === 0 ? "glanza" : "hyryder",
        })),
      }).success,
    ).toBe(false);
  });
});
