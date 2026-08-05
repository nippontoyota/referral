import { describe, expect, it } from "vitest";

import { validateCustomerCsv } from "../src/schemas/customer-import";

describe("validateCustomerCsv", () => {
  it("matches headers case-insensitively and reports every rejected row", () => {
    const result = validateCustomerCsv(
      [
        "PHONE,Name",
        "9876543210,Asha",
        "9876543210,Duplicate",
        "123,Invalid",
        "9123456789,",
      ].join("\n"),
    );

    expect(result.accepted).toEqual([
      { name: "Asha", phone: "+919876543210" },
    ]);
    expect(result.rejected).toEqual([
      { row: 3, reason: "Duplicate phone in CSV" },
      { row: 4, reason: "Invalid Indian mobile number" },
      { row: 5, reason: "Missing or invalid name" },
    ]);
  });
});
