import { describe, expect, it } from "vitest";

import { createReferralToken } from "../src/lib/referral-token";

describe("createReferralToken", () => {
  it("returns unique URL-safe 128-bit tokens", () => {
    const first = createReferralToken();
    const second = createReferralToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(second).not.toBe(first);
  });
});
