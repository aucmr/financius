// @vitest-environment jsdom

import { beforeAll, describe, expect, it } from "vitest";
import XlsxPopulate from "xlsx-populate/browser/xlsx-populate.min.js";
import type { XlsxSheet } from "xlsx-populate/browser/xlsx-populate.min.js";

import { parseImportCsv } from "@/src/lib/imports/formats";
import { normalizeBtgXlsx } from "@/src/lib/imports/btg-xlsx";

const testPassword = "synthetic-password";
const detailedHeaders = [
  "Data",
  "Descrição",
  "Valor",
  "Tipo de compra",
  "Código de autorização",
  "Final Cartão",
];
let encryptedWorkbook: Blob;
let encryptedWorkbookWithSummaryTables: Blob;
let encryptedWorkbookWithAmbiguousDetails: Blob;

function setRow(
  sheet: XlsxSheet,
  rowNumber: number,
  values: Array<string | number>,
) {
  values.forEach((value, columnIndex) => {
    sheet.cell(rowNumber, columnIndex + 1).value(value);
  });
}

async function createEncryptedWorkbook(
  populate: (sheet: XlsxSheet) => void,
) {
  const workbook = await XlsxPopulate.fromBlankAsync();
  populate(workbook.sheet(0));
  return workbook.outputAsync({ type: "blob", password: testPassword });
}

beforeAll(async () => {
  const numericDate = XlsxPopulate.dateToNumber(new Date(2026, 0, 25));
  encryptedWorkbook = await createEncryptedWorkbook((sheet) => {
    setRow(sheet, 1, ["Fatura BTG"]);
    setRow(sheet, 3, detailedHeaders);
    setRow(sheet, 4, [
      numericDate,
      "Ibep Eibep (5/6)",
      52.36,
      "Parcela sem juros",
      "NIVEBF",
      5250,
    ]);
    setRow(sheet, 5, [
      "08/05/2026",
      'Loja, "Centro"',
      "-10,50",
      "Compra à vista",
      "AUTH02",
      "0050",
    ]);
  });

  encryptedWorkbookWithSummaryTables = await createEncryptedWorkbook(
    (sheet) => {
      const statementDate = XlsxPopulate.dateToNumber(
        new Date(2026, 9, 11),
      );
      setRow(sheet, 1, ["Fatura BTG"]);
      setRow(sheet, 3, ["Data", "Descrição", "Valor"]);
      setRow(sheet, 4, [statementDate, "Pagamento da fatura", -100]);
      setRow(sheet, 6, ["Data", "Descrição", "Valor"]);
      setRow(sheet, 7, [statementDate, "Ajuste", -2]);
      setRow(sheet, 9, detailedHeaders);
      setRow(sheet, 10, [
        statementDate,
        "Compra detalhada",
        12.34,
        "Compra à vista",
        "AUTH03",
        "5250",
      ]);
    },
  );

  encryptedWorkbookWithAmbiguousDetails = await createEncryptedWorkbook(
    (sheet) => {
      const statementDate = XlsxPopulate.dateToNumber(
        new Date(2026, 9, 11),
      );
      setRow(sheet, 1, ["Fatura BTG"]);
      setRow(sheet, 3, detailedHeaders);
      setRow(sheet, 4, [
        statementDate,
        "Compra detalhada 1",
        12.34,
        "Compra à vista",
        "AUTH03",
        "5250",
      ]);
      setRow(sheet, 6, detailedHeaders);
      setRow(sheet, 7, [
        statementDate,
        "Compra detalhada 2",
        56.78,
        "Compra à vista",
        "AUTH04",
        "5250",
      ]);
    },
  );
}, 30_000);

describe("protected BTG XLSX imports", () => {
  it("normalizes worksheet columns and preserves source rows and dates", async () => {
    const content = await normalizeBtgXlsx(encryptedWorkbook, testPassword);
    const parsed = parseImportCsv(content, "BTG", "2026-06-10");

    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]).toMatchObject({
      rowNumber: 4,
      description: "Ibep Eibep",
      amount: "52.36",
      transactionDate: "2026-01-25",
      installment: { current: 5, total: 6 },
      authorizationCode: "NIVEBF",
      documentNumber: "5250",
    });
    expect(parsed.rows[1]).toMatchObject({
      rowNumber: 5,
      description: 'Loja, "Centro"',
      amount: "-10.50",
      transactionDate: "2026-05-08",
      authorizationCode: "AUTH02",
      documentNumber: "0050",
    });
  });

  it("reports an incorrect password without exposing it in the error", async () => {
    await expect(
      normalizeBtgXlsx(encryptedWorkbook, "wrong-password"),
    ).rejects.toThrow("Confira a senha");
  });

  it("selects detailed purchases instead of summary tables", async () => {
    const content = await normalizeBtgXlsx(
      encryptedWorkbookWithSummaryTables,
      testPassword,
    );
    const parsed = parseImportCsv(content, "BTG", "2026-10-11");

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({
      rowNumber: 10,
      description: "Compra detalhada",
      amount: "12.34",
    });
  });

  it("continues to reject multiple equally detailed tables", async () => {
    await expect(
      normalizeBtgXlsx(encryptedWorkbookWithAmbiguousDetails, testPassword),
    ).rejects.toThrow("Mais de uma tabela");
  });
});
