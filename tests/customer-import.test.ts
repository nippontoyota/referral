import { describe, expect, it } from "vitest";

import { validateCustomerMatrix } from "../src/schemas/customer-import";

describe("validateCustomerMatrix", () => {
  it("accepts CUSTOMER NAME / CUSTOMER NO. headers and numeric phones", () => {
    const result = validateCustomerMatrix([
      ["CUSTOMER NAME", "CUSTOMER NO."],
      ["LINEESHA", 6238181342],
      ["NEPTUNE LOGITEK LIMITED", "9656107485"],
      ["", ""],
      ["BAD", "123"],
      ["DUP", 6238181342],
    ]);

    expect(result.accepted).toEqual([
      { name: "LINEESHA", phone: "+916238181342" },
      { name: "NEPTUNE LOGITEK LIMITED", phone: "+919656107485" },
    ]);
    expect(result.rejected.map((row) => row.reason)).toEqual([
      "Invalid Indian mobile number",
      "Duplicate phone in file",
    ]);
  });
});
