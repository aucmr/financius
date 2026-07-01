import { parse } from "csv-parse/sync";

export type CSVBank = "XP" | "BTG";

export type ParsedExpenseRow = {
  description: string;
  amount: number;
};

export function parseCSV(content: string, delimiter?: string): string[][] {
  // Remove BOM if present
  let cleanContent = content.replace(/^\uFEFF/, "");

  // Auto-detect delimiter if not provided
  let detectedDelimiter = delimiter;
  if (!detectedDelimiter) {
    // Check first line to detect delimiter
    const firstLine = cleanContent.split("\n")[0];
    detectedDelimiter = firstLine.includes(";") ? ";" : ",";
  }

  const records = parse(cleanContent, {
    skip_empty_lines: true,
    trim: true,
    delimiter: detectedDelimiter,
  }) as string[][];

  return records;
}

export function detectBankFormat(headers: string[]): CSVBank | null {
  const headerStr = headers.join("|").toUpperCase();

  if (headerStr.includes("ESTABELECIMENTO") && headerStr.includes("PORTADOR")) {
    return "XP";
  }

  if (headerStr.includes("DESCRIÇÃO") && headerStr.includes("TIPO DE COMPRA")) {
    return "BTG";
  }

  return null;
}

export function getColumnIndices(headers: string[], bank: CSVBank) {
  const upperHeaders = headers.map((h) => h.toUpperCase());

  if (bank === "XP") {
    return {
      descriptionIdx: upperHeaders.findIndex((h) => h === "ESTABELECIMENTO"),
      amountIdx: upperHeaders.findIndex((h) => h === "VALOR"),
    };
  }

  // BTG
  return {
    descriptionIdx: upperHeaders.findIndex((h) => h === "DESCRIÇÃO"),
    amountIdx: upperHeaders.findIndex((h) => h === "VALOR"),
  };
}

export function parseAmountBRL(amountStr: string): number {
  // Remove "R$" prefix and whitespace
  let cleaned = amountStr.replace(/^R\$\s*/, "").trim();

  // Handle both . and , as decimal separators
  // Brazilian format: 1.234,56 (period for thousands, comma for decimals)
  // Standard format: 1,234.56 (comma for thousands, period for decimals)

  // If it contains both . and ,, use the last one as decimal
  if (cleaned.includes(".") && cleaned.includes(",")) {
    const lastDotIdx = cleaned.lastIndexOf(".");
    const lastCommaIdx = cleaned.lastIndexOf(",");

    if (lastCommaIdx > lastDotIdx) {
      // Brazilian format: 1.234,56 -> remove . and replace , with .
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // Standard format: 1,234.56 -> remove ,
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    // Only comma - could be decimal separator
    cleaned = cleaned.replace(",", ".");
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseExpenseRow(
  row: string[],
  descriptionIdx: number,
  amountIdx: number,
): ParsedExpenseRow | null {
  if (descriptionIdx < 0 || amountIdx < 0) {
    return null;
  }

  if (descriptionIdx >= row.length || amountIdx >= row.length) {
    return null;
  }

  const description = row[descriptionIdx]?.trim();
  const amountStr = row[amountIdx]?.trim();

  if (!description || !amountStr) {
    return null;
  }

  const amount = parseAmountBRL(amountStr);

  // Skip zero amounts and payments (negative amounts in reverse)
  if (amount <= 0) {
    return null;
  }

  return {
    description,
    amount,
  };
}

export function extractExpensesFromCSV(
  content: string,
  bank: CSVBank,
): ParsedExpenseRow[] {
  const records = parseCSV(content);

  if (records.length < 2) {
    return [];
  }

  const headers = records[0];
  const { descriptionIdx, amountIdx } = getColumnIndices(headers, bank);

  if (descriptionIdx < 0 || amountIdx < 0) {
    throw new Error(
      `Invalid ${bank} CSV format. Could not find required columns.`,
    );
  }

  const expenses: ParsedExpenseRow[] = [];

  // Start from row 1 (skip header)
  for (let i = 1; i < records.length; i++) {
    const parsed = parseExpenseRow(records[i], descriptionIdx, amountIdx);
    if (parsed) {
      expenses.push(parsed);
    }
  }

  return expenses;
}
