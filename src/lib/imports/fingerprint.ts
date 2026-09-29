import { normalizeText } from "@/src/lib/imports/csv";
import type { ParsedImportRow } from "@/src/lib/imports/types";

function canonicalize(value: string | null | undefined) {
  return normalizeText(value ?? "");
}

async function hash(value: string) {
  const bytes = new TextEncoder().encode(value);
  const subtle = globalThis.crypto?.subtle;

  if (subtle) {
    const digest = await subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  let first = 2166136261;
  let second = 16777619;
  for (const byte of bytes) {
    first = Math.imul(first ^ byte, 16777619);
    second = Math.imul(second ^ byte, 2166136261);
  }

  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
}

export function getRowFingerprintInput(row: ParsedImportRow) {
  return [
    row.source,
    canonicalize(row.description),
    row.amount,
    row.transactionDate,
    row.installment
      ? `${row.installment.current}/${row.installment.total}`
      : "",
    canonicalize(row.authorizationCode),
    canonicalize(row.documentNumber),
  ].join("|");
}

export async function createImportRowFingerprint(row: ParsedImportRow) {
  return hash(getRowFingerprintInput(row));
}

export async function createImportFileFingerprint(content: string) {
  return hash(content.replace(/^\uFEFF/, ""));
}
