import { describe, expect, it } from "vitest";

import {
  DoubleTickError,
  isTransientError,
} from "../src/lib/doubletick";

describe("isTransientError", () => {
  it("retries rate limits and server errors only", () => {
    expect(isTransientError(new DoubleTickError("limited", 429))).toBe(true);
    expect(isTransientError(new DoubleTickError("down", 503))).toBe(true);
    expect(isTransientError(new DoubleTickError("bad request", 400))).toBe(
      false,
    );
  });
});
