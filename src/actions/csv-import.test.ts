import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { parseCSVImport, detectBankFormat } from "@/actions/csv-import";
import type { CSVBank, ParsedExpenseRow } from "@/lib/csv-parser";
import { readFileSync } from "fs";
import { join } from "path";

describe("CSV Import Actions", () => {
  describe("parseCSVImport", () => {
    let xpCsvContent: string;
    let btgCsvContent: string;

    beforeAll(() => {
      try {
        xpCsvContent = readFileSync(
          join(process.cwd(), "aux/XP - Fatura2026-06-10.csv"),
          "utf-8",
        );
        btgCsvContent = readFileSync(
          join(process.cwd(), "aux/BTG - Fatura2026-06-10.csv"),
          "utf-8",
        );
      } catch {
        // Files may not exist in test environment
      }
    });

    it("should parse XP CSV file successfully", async () => {
      if (!xpCsvContent) {
        console.log("Skipping XP CSV test - file not available");
        return;
      }

      const result = await parseCSVImport(xpCsvContent, "XP");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check structure of first expense
      const firstExpense = result[0];
      expect(firstExpense).toHaveProperty("description");
      expect(firstExpense).toHaveProperty("amount");
      expect(typeof firstExpense.description).toBe("string");
      expect(typeof firstExpense.amount).toBe("number");
      expect(firstExpense.amount).toBeGreaterThan(0);
    });

    it("should parse BTG CSV file successfully", async () => {
      if (!btgCsvContent) {
        console.log("Skipping BTG CSV test - file not available");
        return;
      }

      const result = await parseCSVImport(btgCsvContent, "BTG");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check structure of first expense
      const firstExpense = result[0];
      expect(firstExpense).toHaveProperty("description");
      expect(firstExpense).toHaveProperty("amount");
      expect(typeof firstExpense.description).toBe("string");
      expect(typeof firstExpense.amount).toBe("number");
      expect(firstExpense.amount).toBeGreaterThan(0);
    });

    it("should throw error for empty CSV", async () => {
      await expect(parseCSVImport("", "XP")).rejects.toThrow();
    });

    it("should throw error for invalid format", async () => {
      const invalidCSV = "Col1,Col2,Col3\nVal1,Val2,Val3";
      await expect(parseCSVImport(invalidCSV, "XP")).rejects.toThrow();
    });
  });

  describe("detectBankFormat", () => {
    let xpCsvContent: string;
    let btgCsvContent: string;

    beforeAll(() => {
      try {
        xpCsvContent = readFileSync(
          join(process.cwd(), "aux/XP - Fatura2026-06-10.csv"),
          "utf-8",
        );
        btgCsvContent = readFileSync(
          join(process.cwd(), "aux/BTG - Fatura2026-06-10.csv"),
          "utf-8",
        );
      } catch {
        // Files may not exist in test environment
      }
    });

    it("should detect XP format", async () => {
      if (!xpCsvContent) {
        console.log("Skipping XP detection test - file not available");
        return;
      }

      const result = await detectBankFormat(xpCsvContent);
      expect(result).toBe("XP");
    });

    it("should detect BTG format", async () => {
      if (!btgCsvContent) {
        console.log("Skipping BTG detection test - file not available");
        return;
      }

      const result = await detectBankFormat(btgCsvContent);
      expect(result).toBe("BTG");
    });

    it("should return null for unknown format", async () => {
      const unknownCSV = "Name,Age,Email\nJohn,30,john@example.com";
      const result = await detectBankFormat(unknownCSV);
      expect(result).toBeNull();
    });
  });
});
