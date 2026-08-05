import * as XLSX from "xlsx";

import {
  validateCustomerCsv,
  validateCustomerMatrix,
  type CustomerImportRow,
  type RejectedCustomerRow,
} from "@/schemas/customer-import";

export async function parseCustomerUpload(file: File): Promise<{
  accepted: CustomerImportRow[];
  rejected: RejectedCustomerRow[];
}> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv") {
    return validateCustomerCsv(await file.text());
  }

  if (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    file.type.includes("spreadsheet") ||
    file.type.includes("excel")
  ) {
    const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), {
      type: "buffer",
      cellDates: false,
      raw: true,
    });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error("Workbook has no sheets");
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
      raw: true,
    });
    return validateCustomerMatrix(matrix);
  }

  throw new Error("Upload a .csv, .xlsx, or .xls file");
}
