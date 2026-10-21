import { normalizeHeader } from "@/src/lib/imports/csv";
import type {
  XlsxCellValue,
  XlsxPopulateApi,
  XlsxWorkbook,
} from "xlsx-populate/browser/xlsx-populate.min.js";

const maxXlsxSize = 5_000_000;
const maxImportRows = 10_000;
const maxWorksheetRows = maxImportRows + 100;
const maxWorksheetColumns = 64;
const maxNormalizedContentLength = 5_000_000;

const dateAliases = [
  "data",
  "data da compra",
  "data de compra",
  "data compra",
  "data do lancamento",
  "date",
];
const descriptionAliases = [
  "descricao",
  "descricao da compra",
  "descricao do lancamento",
  "estabelecimento",
];
const amountAliases = [
  "valor",
  "valor da compra",
  "valor total",
  "valor r",
];
const purchaseTypeAliases = ["tipo de compra", "tipo compra"];
const authorizationAliases = [
  "codigo de autorizacao",
  "codigo autorizacao",
  "autorizacao",
];
const cardSuffixAliases = [
  "final cartao",
  "final do cartao",
  "cartao final",
  "final do cartao de credito",
];

type BtgColumns = {
  date: number;
  description: number;
  amount: number;
  purchaseType: number | null;
  authorizationCode: number | null;
  cardSuffix: number | null;
};

type BtgTable = {
  matrix: XlsxCellValue[][];
  startRow: number;
  headerRowIndex: number;
  columns: BtgColumns;
};

class BtgXlsxImportError extends Error {}

function findColumnIndex(
  row: XlsxCellValue[],
  aliases: string[],
): number {
  const normalizedAliases = aliases.map(normalizeHeader);
  return row.findIndex(
    (value) =>
      typeof value === "string" &&
      normalizedAliases.includes(normalizeHeader(value)),
  );
}

function findBtgColumns(row: XlsxCellValue[]): BtgColumns | null {
  const date = findColumnIndex(row, dateAliases);
  const description = findColumnIndex(row, descriptionAliases);
  const amount = findColumnIndex(row, amountAliases);

  if (date < 0 || description < 0 || amount < 0) {
    return null;
  }

  const purchaseType = findColumnIndex(row, purchaseTypeAliases);
  const authorizationCode = findColumnIndex(row, authorizationAliases);
  const cardSuffix = findColumnIndex(row, cardSuffixAliases);

  return {
    date,
    description,
    amount,
    purchaseType: purchaseType >= 0 ? purchaseType : null,
    authorizationCode: authorizationCode >= 0 ? authorizationCode : null,
    cardSuffix: cardSuffix >= 0 ? cardSuffix : null,
  };
}

function countBtgDetailColumns(columns: BtgColumns) {
  return [
    columns.purchaseType,
    columns.authorizationCode,
    columns.cardSuffix,
  ].filter((columnIndex) => columnIndex !== null).length;
}

function findBtgTable(workbook: XlsxWorkbook): BtgTable {
  const candidates: BtgTable[] = [];

  for (const sheet of workbook.sheets()) {
    const range = sheet.usedRange();
    if (!range) {
      continue;
    }

    const matrix = range.value();
    if (
      matrix.length > maxWorksheetRows ||
      matrix.some((row) => row.length > maxWorksheetColumns)
    ) {
      throw new BtgXlsxImportError(
        "A planilha excede os limites de linhas ou colunas aceitos.",
      );
    }

    for (let headerRowIndex = 0; headerRowIndex < matrix.length; headerRowIndex += 1) {
      const columns = findBtgColumns(matrix[headerRowIndex]);
      if (columns) {
        candidates.push({
          matrix,
          startRow: range.startCell().rowNumber(),
          headerRowIndex,
          columns,
        });
      }
    }
  }

  if (candidates.length === 0) {
    throw new BtgXlsxImportError(
      "Nao encontrei uma tabela BTG com colunas de data, descricao e valor.",
    );
  }

  const highestDetailColumnCount = Math.max(
    ...candidates.map((candidate) =>
      countBtgDetailColumns(candidate.columns),
    ),
  );
  const mostDetailedCandidates = candidates.filter(
    (candidate) =>
      countBtgDetailColumns(candidate.columns) === highestDetailColumnCount,
  );
  if (mostDetailedCandidates.length > 1) {
    throw new BtgXlsxImportError(
      "Mais de uma tabela de lancamentos foi encontrada no XLSX do BTG.",
    );
  }

  return mostDetailedCandidates[0];
}

function formatDate(date: Date) {
  if (!Number.isFinite(date.getTime())) {
    throw new BtgXlsxImportError(
      "A planilha contem uma data que nao pode ser lida.",
    );
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function cellToString(value: XlsxCellValue) {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return formatDate(value);
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  throw new BtgXlsxImportError(
    "A planilha contem um tipo de celula nao suportado.",
  );
}

function dateCellToString(value: XlsxCellValue, xlsx: XlsxPopulateApi) {
  if (value instanceof Date) {
    return formatDate(value);
  }
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 1 &&
    value < 100_000
  ) {
    return formatDate(xlsx.numberToDate(value));
  }

  return cellToString(value);
}

function valueAt(row: XlsxCellValue[], columnIndex: number | null) {
  return columnIndex === null ? null : (row[columnIndex] ?? null);
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function normalizeBtgTable(table: BtgTable, xlsx: XlsxPopulateApi) {
  const records = [
    [
      "Data",
      "Descricao",
      "Valor",
      "Tipo de compra",
      "Codigo de autorizacao",
      "Final Cartao",
      "__source_row",
    ],
  ];

  for (
    let rowIndex = table.headerRowIndex + 1;
    rowIndex < table.matrix.length;
    rowIndex += 1
  ) {
    const row = table.matrix[rowIndex];
    const values = [
      dateCellToString(valueAt(row, table.columns.date), xlsx),
      cellToString(valueAt(row, table.columns.description)),
      cellToString(valueAt(row, table.columns.amount)),
      cellToString(valueAt(row, table.columns.purchaseType)),
      cellToString(valueAt(row, table.columns.authorizationCode)),
      cellToString(valueAt(row, table.columns.cardSuffix)),
    ];

    if (values.every((value) => value.trim() === "")) {
      continue;
    }
    if (records.length > maxImportRows) {
      throw new BtgXlsxImportError(
        "A fatura excede o limite de 10.000 linhas.",
      );
    }

    records.push([
      ...values,
      String(table.startRow + rowIndex),
    ]);
  }

  const content = records
    .map((record) => record.map(escapeCsvCell).join(";"))
    .join("\n");

  if (content.length > maxNormalizedContentLength) {
    throw new BtgXlsxImportError(
      "A fatura excede o limite de tamanho aceito para importacao.",
    );
  }

  return content;
}

export async function normalizeBtgXlsx(file: Blob, password: string) {
  if (file.size === 0) {
    throw new BtgXlsxImportError("O arquivo XLSX esta vazio.");
  }
  if (file.size > maxXlsxSize) {
    throw new BtgXlsxImportError("O XLSX deve ter no maximo 5 MB.");
  }
  if (!password) {
    throw new BtgXlsxImportError("Informe a senha da fatura BTG.");
  }

  let xlsx: XlsxPopulateApi;
  try {
    xlsx = (await import("xlsx-populate/browser/xlsx-populate.min.js"))
      .default;
  } catch {
    throw new BtgXlsxImportError(
      "Nao foi possivel carregar o leitor de arquivos XLSX.",
    );
  }

  let workbook: XlsxWorkbook;
  try {
    workbook = await xlsx.fromDataAsync(file, { password });
  } catch {
    throw new BtgXlsxImportError(
      "Nao foi possivel abrir o XLSX. Confira a senha e se o arquivo esta valido.",
    );
  }

  return normalizeBtgTable(findBtgTable(workbook), xlsx);
}
