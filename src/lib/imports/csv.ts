import type { ImportSource } from "@/src/lib/imports/types";

export function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeHeader(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function cleanDescription(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countUnquoted(value: string, delimiter: string) {
  let quoted = false;
  let count = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (character === '"') {
      if (quoted && value[index + 1] === '"') {
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && character === delimiter) {
      count += 1;
    }
  }

  return count;
}

export function detectDelimiter(content: string) {
  const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
  return countUnquoted(firstLine, ";") > countUnquoted(firstLine, ",")
    ? ";"
    : ",";
}

export function parseCsvRecords(
  content: string,
  delimiter = detectDelimiter(content),
) {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  const normalizedContent = content.replace(/^\uFEFF/, "");

  for (let index = 0; index < normalizedContent.length; index += 1) {
    const character = normalizedContent[index];

    if (quoted) {
      if (character === '"') {
        if (normalizedContent[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === delimiter) {
      record.push(field);
      field = "";
    } else if (character === "\n") {
      record.push(field.replace(/\r$/, ""));
      if (record.some((value) => value.trim() !== "")) {
        records.push(record);
      }
      record = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) {
    throw new Error("CSV contains an unterminated quoted field.");
  }

  if (field !== "" || record.length > 0) {
    record.push(field.replace(/\r$/, ""));
    if (record.some((value) => value.trim() !== "")) {
      records.push(record);
    }
  }

  return records;
}

export function recordsToRows(records: string[][]) {
  const [headerRecord, ...dataRecords] = records;
  if (!headerRecord) {
    return [];
  }

  const headers = headerRecord.map((header) => normalizeHeader(header));
  return dataRecords.map((values, index) => {
    const row = Object.fromEntries(
      headers.map((header, columnIndex) => [
        header,
        values[columnIndex]?.trim() ?? "",
      ]),
    );

    return { rowNumber: index + 2, values: row };
  });
}

export function getColumn(row: Record<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];
    if (value !== undefined) {
      return value;
    }
  }

  return "";
}

export function parseDateOnly(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid date: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date: ${value}`);
  }

  return value;
}

export function parseBrazilianDate(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    throw new Error(`Invalid Brazilian date: ${value}`);
  }

  return parseDateOnly(`${match[3]}-${match[2]}-${match[1]}`);
}

export function parseDayMonth(value: string, year: number) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid day and month: ${value}`);
  }

  return parseDateOnly(`${year}-${match[2]}-${match[1]}`);
}

export function parseMoney(value: string) {
  let normalized = value
    .replace(/\u00a0/g, "")
    .replace(/R\$/gi, "")
    .replace(/\s+/g, "")
    .trim();

  let negative = false;
  if (normalized.startsWith("(")) {
    negative = true;
    normalized = normalized.replace(/^\(/, "").replace(/\)$/, "");
  }
  if (normalized.startsWith("-")) {
    negative = true;
    normalized = normalized.slice(1);
  }
  if (normalized.startsWith("+")) {
    normalized = normalized.slice(1);
  }

  normalized = normalized.replace(/[^0-9.,]/g, "");
  if (!normalized || !/[0-9]/.test(normalized)) {
    throw new Error(`Invalid monetary value: ${value}`);
  }

  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  let whole = normalized;
  let fraction = "";

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalIndex = Math.max(lastComma, lastDot);
    whole = normalized.slice(0, decimalIndex).replace(/[.,]/g, "");
    fraction = normalized.slice(decimalIndex + 1);
  } else if (lastComma >= 0) {
    whole = normalized.slice(0, lastComma).replace(/\./g, "");
    fraction = normalized.slice(lastComma + 1);
  } else if (lastDot >= 0) {
    whole = normalized.slice(0, lastDot).replace(/,/g, "");
    fraction = normalized.slice(lastDot + 1);
  }

  if (fraction.length > 2) {
    throw new Error(`Monetary value has more than two decimals: ${value}`);
  }

  whole = whole.replace(/^0+(?=\d)/, "") || "0";
  fraction = fraction.padEnd(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function parseInstallment(value: string) {
  const match = value.match(
    /(?:\(|^|\s)(\d{1,3})\s*(?:\/|de)\s*(\d{1,3})(?:\)|$|\s)/i,
  );
  if (!match) {
    return null;
  }

  const current = Number(match[1]);
  const total = Number(match[2]);
  if (current < 1 || total < current) {
    return null;
  }

  return { current, total };
}

export function sourceFromHeader(content: string): ImportSource | null {
  const records = parseCsvRecords(content);
  const headers = new Set(records[0]?.map(normalizeHeader));

  if (headers.has("estabelecimento") && headers.has("portador")) {
    return "XP";
  }
  if (headers.has("descricao") && headers.has("tipo de compra")) {
    return "BTG";
  }
  if (headers.has("lancamento") && headers.has("tipo lancamento")) {
    return "BB";
  }

  return null;
}
