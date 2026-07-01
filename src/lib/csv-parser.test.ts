import { describe, it, expect } from "vitest";
import {
  parseCSV,
  detectBankFormat,
  extractExpensesFromCSV,
  parseAmountBRL,
} from "@/lib/csv-parser";

describe("CSV Parser", () => {
  describe("parseCSV", () => {
    it("should parse semicolon-delimited CSV", () => {
      const csv = "Data;Estabelecimento;Valor\n01/05/2026;Store A;R$ 100,00";
      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toContain("Data");
      expect(result[1][1]).toBe("Store A");
    });

    it("should parse comma-delimited CSV with quoted fields", () => {
      const csv = `Data,Descrição,Valor\n"01/05/2026","Store A","R$ 100.00"`;
      const result = parseCSV(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toContain("Data");
    });

    it("should remove BOM character", () => {
      const csv = "\uFEFFData;Valor\n01/05/2026;R$ 100,00";
      const result = parseCSV(csv);
      expect(result[0][0]).toBe("Data");
      expect(result[0][0]).not.toContain("\uFEFF");
    });
  });

  describe("detectBankFormat", () => {
    it("should detect XP format", () => {
      const headers = ["Data", "Estabelecimento", "Portador", "Valor"];
      expect(detectBankFormat(headers)).toBe("XP");
    });

    it("should detect BTG format", () => {
      const headers = ["Data", "Descrição", "Valor", "Tipo de compra"];
      expect(detectBankFormat(headers)).toBe("BTG");
    });

    it("should return null for unknown format", () => {
      const headers = ["Date", "Description", "Amount"];
      expect(detectBankFormat(headers)).toBeNull();
    });
  });

  describe("parseAmountBRL", () => {
    it("should parse Brazilian format (comma as decimal)", () => {
      expect(parseAmountBRL("R$ 100,50")).toBe(100.5);
      expect(parseAmountBRL("R$ 1.234,56")).toBe(1234.56);
    });

    it("should parse standard format (period as decimal)", () => {
      expect(parseAmountBRL("R$ 100.50")).toBe(100.5);
      expect(parseAmountBRL("R$ 1,234.56")).toBe(1234.56);
    });

    it("should handle amounts without currency symbol", () => {
      expect(parseAmountBRL("100,50")).toBe(100.5);
      expect(parseAmountBRL("1.234,56")).toBe(1234.56);
    });

    it("should preserve negative amounts", () => {
      expect(parseAmountBRL("R$ -100,50")).toBe(-100.5);
      expect(parseAmountBRL("R$ -1.234,56")).toBe(-1234.56);
    });

    it("should return 0 for invalid amounts", () => {
      expect(parseAmountBRL("invalid")).toBe(0);
    });
  });

  describe("extractExpensesFromCSV", () => {
    it("should extract expenses from XP format", () => {
      const csv = `Data;Estabelecimento;Portador;Valor;Parcela
01/05/2026;Store A;Person;R$ 100,50;-
02/05/2026;Store B;Person;R$ 50,25;-`;

      const result = extractExpensesFromCSV(csv, "XP");
      expect(result).toHaveLength(2);
      expect(result[0].description).toBe("Store A");
      expect(result[0].amount).toBe(100.5);
      expect(result[1].description).toBe("Store B");
      expect(result[1].amount).toBe(50.25);
    });

    it("should extract expenses from BTG format", () => {
      const csv = `Data,Descrição,Valor,Tipo de compra
01/05,Store A,R$ 100.50,Compra à vista
02/05,Store B,R$ 50.25,Compra à vista`;

      const result = extractExpensesFromCSV(csv, "BTG");
      expect(result).toHaveLength(2);
      expect(result[0].description).toBe("Store A");
      expect(result[0].amount).toBe(100.5);
    });

    it("should skip zero and negative amounts", () => {
      const csv = `Data;Estabelecimento;Valor
01/05/2026;Store A;R$ 100,00
02/05/2026;Payment;R$ -50,00
03/05/2026;Empty;R$ 0,00`;

      const result = extractExpensesFromCSV(csv, "XP");
      // The parser converts R$ -50,00 to 50 (absolute value), then filters out <= 0
      // So only Store A with 100 should remain
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe("Store A");
      expect(result[0].amount).toBe(100);
    });

    it("should throw error for invalid format", () => {
      const csv = `Data,Description
01/05/2026,Store A`;

      expect(() => extractExpensesFromCSV(csv, "XP")).toThrow();
    });
  });
});
