import { z } from "zod";

import { parseCsv } from "../lib/csv";
import { normalizePhone } from "../lib/phone";

export type CustomerImportRow = {
  name: string;
  phone: string;
};

export type RejectedCustomerRow = {
  row: number;
  reason: string;
};

const nameSchema = z.string().trim().min(1).max(100);

export function validateCustomerCsv(text: string): {
  accepted: CustomerImportRow[];
  rejected: RejectedCustomerRow[];
} {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error("CSV is empty");

  const headers = rows[0].map((header) =>
    header.replace(/^\uFEFF/, "").trim().toLowerCase(),
  );
  const nameIndex = headers.indexOf("name");
  const phoneIndex = headers.indexOf("phone");
  if (nameIndex < 0 || phoneIndex < 0) {
    throw new Error('CSV must include "name" and "phone" columns');
  }

  const accepted: CustomerImportRow[] = [];
  const rejected: RejectedCustomerRow[] = [];
  const phones = new Set<string>();

  rows.slice(1).forEach((columns, index) => {
    const row = index + 2;
    if (columns.every((column) => !column.trim())) return;

    const parsedName = nameSchema.safeParse(columns[nameIndex] ?? "");
    if (!parsedName.success) {
      rejected.push({ row, reason: "Missing or invalid name" });
      return;
    }

    const phone = normalizePhone(columns[phoneIndex] ?? "");
    if (!phone) {
      rejected.push({ row, reason: "Invalid Indian mobile number" });
      return;
    }
    if (phones.has(phone)) {
      rejected.push({ row, reason: "Duplicate phone in CSV" });
      return;
    }

    phones.add(phone);
    accepted.push({ name: parsedName.data, phone });
  });

  return { accepted, rejected };
}
