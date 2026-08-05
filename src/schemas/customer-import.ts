import { z } from "zod";

import { parseCsv } from "../lib/csv";
import { normalizePhone } from "../lib/phone";

export type CustomerImportRow = {
  name: string;
  phone: string;
  referralToken?: string;
};

export type RejectedCustomerRow = {
  row: number;
  reason: string;
};

const nameSchema = z.string().trim().min(1).max(200);

const NAME_HEADERS = new Set([
  "name",
  "customer name",
  "customer_name",
  "cust name",
  "customer",
]);

const PHONE_HEADERS = new Set([
  "phone",
  "mobile",
  "mobile no",
  "mobile no.",
  "mobile_no",
  "customer no",
  "customer no.",
  "customer_no",
  "customer number",
  "phone number",
  "phoneno",
  "phone_no",
]);

function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return Number.isInteger(value)
      ? String(value)
      : String(Math.trunc(value));
  }
  return String(value).trim();
}

function findColumn(headers: string[], aliases: Set<string>): number {
  return headers.findIndex((header) => aliases.has(header));
}

export function validateCustomerMatrix(matrix: unknown[][]): {
  accepted: CustomerImportRow[];
  rejected: RejectedCustomerRow[];
} {
  if (!matrix.length) throw new Error("File is empty");

  const headers = matrix[0].map((header) =>
    cellText(header).replace(/^\uFEFF/, "").toLowerCase(),
  );
  const nameIndex = findColumn(headers, NAME_HEADERS);
  const phoneIndex = findColumn(headers, PHONE_HEADERS);
  if (nameIndex < 0 || phoneIndex < 0) {
    throw new Error(
      'File must include name and phone columns (e.g. "CUSTOMER NAME", "CUSTOMER NO.")',
    );
  }

  const accepted: CustomerImportRow[] = [];
  const rejected: RejectedCustomerRow[] = [];
  const phones = new Set<string>();

  for (let index = 1; index < matrix.length; index += 1) {
    const columns = matrix[index] ?? [];
    const row = index + 1;
    const nameRaw = cellText(columns[nameIndex]);
    const phoneRaw = cellText(columns[phoneIndex]);
    if (!nameRaw && !phoneRaw) continue;

    const parsedName = nameSchema.safeParse(nameRaw);
    if (!parsedName.success) {
      rejected.push({ row, reason: "Missing or invalid name" });
      continue;
    }

    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      rejected.push({ row, reason: "Invalid Indian mobile number" });
      continue;
    }
    if (phones.has(phone)) {
      rejected.push({ row, reason: "Duplicate phone in file" });
      continue;
    }

    phones.add(phone);
    accepted.push({ name: parsedName.data, phone });
  }

  return { accepted, rejected };
}

export function validateCustomerCsv(text: string) {
  return validateCustomerMatrix(parseCsv(text));
}
