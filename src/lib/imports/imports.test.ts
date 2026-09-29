import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  createImportRowFingerprint,
  decodeCsvBytes,
  detectCsvSource,
  parseImportCsv,
  parseMoney,
  parseCsvRecords,
} from "@/src/lib/imports";

describe("CSV import formats", () => {
  it("parses XP statements and ignores card payments", () => {
    const content = readFileSync("docs/aux/XP - Fatura2026-06-10.csv", "utf-8");
    const parsed = parseImportCsv(content, "XP", "2026-06-10");

    expect(detectCsvSource(content)).toBe("XP");
    expect(parsed.rows.length).toBeGreaterThan(30);
    expect(parsed.rows[0]).toMatchObject({
      description: "PADARIA E MERCEARIA PAL",
      amount: "26.77",
      transactionDate: "2026-05-01",
      cardholder: "AUCIOMAR CERQUEIRA",
    });
    expect(parsed.ignoredRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: "card_payment" }),
      ]),
    );
  });

  it("preserves source row numbers and amounts from the August XP statement", () => {
    const content = readFileSync("docs/aux/Fatura2026-08-10.csv", "utf-8");
    const parsed = parseImportCsv(content, "XP", "2026-08-10");
    const expectedRows = [
      { rowNumber: 3, amount: "298.21" },
      { rowNumber: 36, amount: "73.07" },
      { rowNumber: 38, amount: "137.17" },
      { rowNumber: 44, amount: "67.60" },
      { rowNumber: 46, amount: "143.55" },
      { rowNumber: 55, amount: "259.90" },
      { rowNumber: 56, amount: "154.48" },
    ];

    for (const expectedRow of expectedRows) {
      expect(parsed.rows).toContainEqual(expect.objectContaining(expectedRow));
    }
  });

  it("parses BTG month-only dates and installments", () => {
    const content = readFileSync(
      "docs/aux/BTG - Fatura2026-06-10.csv",
      "utf-8",
    );
    const parsed = parseImportCsv(content, "BTG", "2026-06-10");

    expect(detectCsvSource(content)).toBe("BTG");
    expect(parsed.rows[0]).toMatchObject({
      description: "Ibep Eibep",
      amount: "52.36",
      transactionDate: "2026-01-25",
      installment: { current: 5, total: 6 },
      authorizationCode: "NIVEBF",
      documentNumber: "5250",
    });
  });

  it("decodes and parses the BB Latin-1/Windows-1252 statement", () => {
    const bytes = readFileSync(
      "docs/aux/BB - Extrato conta corrente - 072025.csv",
    );
    const decoded = decodeCsvBytes(bytes);
    const parsed = parseImportCsv(decoded.text, "BB", null);

    expect(decoded.encoding).toBe("windows-1252");
    expect(detectCsvSource(decoded.text)).toBe("BB");
    expect(parsed.rows[0]).toMatchObject({
      description: "Auciomar Carlos Teixeira D",
      amount: "10792.25",
      transactionDate: "2025-07-01",
    });
    expect(parsed.rows.every((row) => Number(row.amount) > 0)).toBe(true);
    expect(parsed.ignoredRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: "bank_credit" }),
      ]),
    );
  });

  it("handles quoted delimiters and Brazilian money formats", () => {
    expect(parseMoney("R$\u00a052.36")).toBe("52.36");
    expect(parseMoney("R$ 26,77")).toBe("26.77");
    expect(parseMoney("-10.792,25")).toBe("-10792.25");
    expect(
      parseCsvRecords('Data,Descricao,Valor\n01/01/2026,"Loja, Centro",10,00'),
    ).toHaveLength(2);
  });

  it("creates stable row fingerprints while distinguishing installments", async () => {
    const content = readFileSync("docs/aux/XP - Fatura2026-06-10.csv", "utf-8");
    const row = parseImportCsv(content, "XP", "2026-06-10").rows[0];
    const sameFingerprint = await createImportRowFingerprint({ ...row });
    const changedFingerprint = await createImportRowFingerprint({
      ...row,
      installment: { current: 2, total: 2 },
    });

    expect(sameFingerprint).toBe(await createImportRowFingerprint(row));
    expect(changedFingerprint).not.toBe(sameFingerprint);
  });
});
