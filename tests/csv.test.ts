import { describe, expect, it } from "vitest";

import { escapeCsv, parseCsv } from "../src/lib/csv";

describe("CSV helpers", () => {
  it("parses quoted commas, escaped quotes, and CRLF", () => {
    expect(parseCsv('name,phone\r\n"Rao, Jr.","9""87"\r\n')).toEqual([
      ["name", "phone"],
      ["Rao, Jr.", '9"87'],
    ]);
  });

  it("escapes CSV formula-independent syntax correctly", () => {
    expect(escapeCsv('Rao, "Jr."')).toBe('"Rao, ""Jr."""');
    expect(escapeCsv("plain")).toBe("plain");
  });
});
