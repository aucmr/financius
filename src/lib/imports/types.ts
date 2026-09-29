export const importSources = ["XP", "BTG", "BB"] as const;

export type ImportSource = (typeof importSources)[number];

export type ImportInstallment = {
  current: number;
  total: number;
};

export type ParsedImportRow = {
  rowNumber: number;
  source: ImportSource;
  description: string;
  amount: string;
  transactionDate: string;
  cardholder: string | null;
  installment: ImportInstallment | null;
  authorizationCode: string | null;
  documentNumber: string | null;
  metadata: Record<string, string | null>;
};

export type IgnoredImportRow = {
  rowNumber: number;
  source: ImportSource;
  description: string;
  amount: string | null;
  reason: "card_payment" | "bank_credit" | "non_outgoing" | "invalid_row";
};

export type ParsedImport = {
  source: ImportSource;
  rows: ParsedImportRow[];
  ignoredRows: IgnoredImportRow[];
  statementDate: string | null;
};
