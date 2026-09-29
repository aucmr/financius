import {
  cleanDescription,
  getColumn,
  normalizeHeader,
  normalizeText,
  parseBrazilianDate,
  parseCsvRecords,
  parseDayMonth,
  parseInstallment,
  parseMoney,
  parseDateOnly,
  recordsToRows,
  sourceFromHeader,
} from "@/src/lib/imports/csv";
import type {
  IgnoredImportRow,
  ImportSource,
  ParsedImport,
  ParsedImportRow,
} from "@/src/lib/imports/types";

function assertSource(content: string, source: ImportSource) {
  const detectedSource = sourceFromHeader(content);
  if (detectedSource !== source) {
    throw new Error(
      `The CSV headers do not match the selected ${source} format.`,
    );
  }
}

function assertRequiredHeaders(content: string, requiredHeaders: string[]) {
  const records = parseCsvRecords(content);
  const headers = new Set(records[0]?.map(normalizeHeader));
  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.has(normalizeHeader(header)),
  );

  if (missingHeaders.length > 0) {
    throw new Error(`Missing CSV columns: ${missingHeaders.join(", ")}.`);
  }
}

function safeAmount(value: string) {
  try {
    return parseMoney(value);
  } catch {
    return null;
  }
}

function addIgnored(
  ignoredRows: IgnoredImportRow[],
  row: {
    rowNumber: number;
    description: string;
    amount: string | null;
  },
  source: ImportSource,
  reason: IgnoredImportRow["reason"],
) {
  ignoredRows.push({
    rowNumber: row.rowNumber,
    source,
    description: cleanDescription(row.description) || "Sem descricao",
    amount: row.amount,
    reason,
  });
}

function parseXp(content: string, statementDate: string): ParsedImport {
  assertRequiredHeaders(content, [
    "Data",
    "Estabelecimento",
    "Portador",
    "Valor",
    "Parcela",
  ]);
  const rows = recordsToRows(parseCsvRecords(content));
  const parsedRows: ParsedImportRow[] = [];
  const ignoredRows: IgnoredImportRow[] = [];

  for (const row of rows) {
    const description = cleanDescription(
      getColumn(row.values, ["Estabelecimento"]),
    );
    const rawAmount = getColumn(row.values, ["Valor"]);
    const amount = safeAmount(rawAmount);
    const normalizedDescription = normalizeText(description);

    if (normalizedDescription.includes("pagamentos validos normais")) {
      addIgnored(
        ignoredRows,
        { ...row, description, amount },
        "XP",
        "card_payment",
      );
      continue;
    }

    try {
      if (!description || !amount || amount === "0.00") {
        throw new Error("Missing description or amount.");
      }

      const transactionDate = parseBrazilianDate(
        getColumn(row.values, ["Data"]),
      );
      const installment = parseInstallment(getColumn(row.values, ["Parcela"]));
      parsedRows.push({
        rowNumber: row.rowNumber,
        source: "XP",
        description,
        amount,
        transactionDate,
        cardholder:
          cleanDescription(getColumn(row.values, ["Portador"])) || null,
        installment,
        authorizationCode: null,
        documentNumber: null,
        metadata: {
          originalAmount: rawAmount,
          parcel: getColumn(row.values, ["Parcela"]) || null,
        },
      });
    } catch {
      addIgnored(
        ignoredRows,
        { ...row, description, amount },
        "XP",
        "invalid_row",
      );
    }
  }

  return { source: "XP", rows: parsedRows, ignoredRows, statementDate };
}

function parseBtg(content: string, statementDate: string): ParsedImport {
  assertRequiredHeaders(content, [
    "Data",
    "Descricao",
    "Valor",
    "Tipo de compra",
  ]);
  const rows = recordsToRows(parseCsvRecords(content));
  const parsedRows: ParsedImportRow[] = [];
  const ignoredRows: IgnoredImportRow[] = [];
  const statementYear = Number(statementDate.slice(0, 4));

  for (const row of rows) {
    const originalDescription = cleanDescription(
      getColumn(row.values, ["Descricao"]),
    );
    const description = originalDescription
      .replace(/\s*\(\d{1,3}\s*\/\s*\d{1,3}\)\s*$/, "")
      .trim();
    const rawAmount = getColumn(row.values, ["Valor"]);
    const amount = safeAmount(rawAmount);
    const normalizedDescription = normalizeText(description);

    if (normalizedDescription.includes("pagamentos validos normais")) {
      addIgnored(
        ignoredRows,
        { ...row, description, amount },
        "BTG",
        "card_payment",
      );
      continue;
    }

    try {
      if (!description || !amount || amount === "0.00") {
        throw new Error("Missing description or amount.");
      }

      const purchaseType = cleanDescription(
        getColumn(row.values, ["Tipo de compra"]),
      );
      const parcelText = `${originalDescription} ${purchaseType}`;
      parsedRows.push({
        rowNumber: row.rowNumber,
        source: "BTG",
        description,
        amount,
        transactionDate: parseDayMonth(
          getColumn(row.values, ["Data"]),
          statementYear,
        ),
        cardholder: null,
        installment: parseInstallment(parcelText),
        authorizationCode:
          cleanDescription(getColumn(row.values, ["Codigo de autorizacao"])) ||
          null,
        documentNumber:
          cleanDescription(getColumn(row.values, ["Final Cartao"])) || null,
        metadata: {
          originalDescription:
            originalDescription !== description ? originalDescription : null,
          originalAmount: rawAmount,
          purchaseType: purchaseType || null,
        },
      });
    } catch {
      addIgnored(
        ignoredRows,
        { ...row, description, amount },
        "BTG",
        "invalid_row",
      );
    }
  }

  return { source: "BTG", rows: parsedRows, ignoredRows, statementDate };
}

function cleanBankDescription(value: string) {
  return cleanDescription(value).replace(/^\d{2}\/\d{2}\s+\d{2}:\d{2}\s+/, "");
}

function parseBb(content: string): ParsedImport {
  assertRequiredHeaders(content, [
    "Data",
    "Lancamento",
    "Detalhes",
    "Valor",
    "Tipo Lancamento",
  ]);
  const rows = recordsToRows(parseCsvRecords(content));
  const parsedRows: ParsedImportRow[] = [];
  const ignoredRows: IgnoredImportRow[] = [];

  for (const row of rows) {
    const launchType = cleanDescription(
      getColumn(row.values, ["Tipo Lancamento"]),
    );
    const launchTypeNormalized = normalizeText(launchType);
    const launch = cleanDescription(getColumn(row.values, ["Lancamento"]));
    const details = cleanBankDescription(getColumn(row.values, ["Detalhes"]));
    const description = details || launch;
    const rawAmount = getColumn(row.values, ["Valor"]);
    const amount = safeAmount(rawAmount);
    const normalizedDescription = normalizeText(description);
    const rawDate = getColumn(row.values, ["Data"]);

    if (
      !rawDate ||
      rawDate === "00/00/0000" ||
      normalizedDescription.includes("saldo do dia") ||
      normalizedDescription === "saldo anterior"
    ) {
      continue;
    }

    try {
      const transactionDate = parseBrazilianDate(rawDate);
      if (launchTypeNormalized !== "saida") {
        addIgnored(
          ignoredRows,
          { ...row, description, amount },
          "BB",
          "bank_credit",
        );
        continue;
      }

      if (
        launchTypeNormalized.includes("pagamento fatura") ||
        launchTypeNormalized.includes("pagto fatura")
      ) {
        addIgnored(
          ignoredRows,
          { ...row, description, amount },
          "BB",
          "card_payment",
        );
        continue;
      }

      if (!description || !amount || amount === "0.00") {
        throw new Error("Missing description or amount.");
      }

      parsedRows.push({
        rowNumber: row.rowNumber,
        source: "BB",
        description,
        amount: amount.startsWith("-") ? amount.slice(1) : amount,
        transactionDate,
        cardholder: null,
        installment: null,
        authorizationCode: null,
        documentNumber:
          cleanDescription(getColumn(row.values, ["N documento"])) || null,
        metadata: {
          originalAmount: rawAmount,
          launchType: launch || null,
          transactionType: launchType || null,
        },
      });
    } catch {
      addIgnored(
        ignoredRows,
        { ...row, description, amount },
        "BB",
        "invalid_row",
      );
    }
  }

  return { source: "BB", rows: parsedRows, ignoredRows, statementDate: null };
}

export function parseImportCsv(
  content: string,
  source: ImportSource,
  statementDate: string | null,
): ParsedImport {
  if (!content.trim()) {
    return { source, rows: [], ignoredRows: [], statementDate };
  }

  if ((source === "XP" || source === "BTG") && !statementDate) {
    throw new Error("A statement date is required for credit card imports.");
  }

  if (statementDate) {
    parseDateOnly(statementDate);
  }

  assertSource(content, source);
  if (source === "XP") {
    return parseXp(content, statementDate as string);
  }
  if (source === "BTG") {
    return parseBtg(content, statementDate as string);
  }
  return parseBb(content);
}

export function detectCsvSource(content: string) {
  return sourceFromHeader(content);
}
