import type { AuthContext } from "@/src/lib/auth/context";
import {
  createImportFileFingerprint,
  createImportRowFingerprint,
  normalizeText,
  type ParsedImportRow,
} from "@/src/lib/imports";
import { formatDateOnly, parseDateOnly } from "@/src/lib/utils/date";
import type {
  ImportBatchInput,
  ImportExpenseRowInput,
  ImportRowIdentityInput,
} from "@/src/app/(app)/despesas/importar/_lib/schemas";
import {
  createImportBatch as createImportBatchRecord,
  findExpenseReferences,
  findImportDuplicateCandidates,
  findImportSuggestionCandidates,
  type PersistImportedExpense,
} from "@/src/app/(app)/despesas/importar/_lib/repository";
import {
  rankExpenseSuggestions,
  type ExpenseImportSuggestion,
} from "@/src/app/(app)/despesas/importar/_lib/suggestions";

export class ImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportValidationError";
  }
}

export type ImportDuplicateMatch = {
  id: string;
  description: string;
  amount: string;
  transactionDate: string;
  statementDate: string;
  source: string | null;
  fileName: string | null;
};

export type ImportCreationResult = {
  batchId: string;
  status: "COMPLETED" | "PARTIAL" | "FAILED";
  importedRows: number;
  ignoredRows: number;
  skippedRows: number;
  failedRows: number;
  errors: string[];
};

export type ImportRepository = {
  findExpenseReferences: typeof findExpenseReferences;
  findImportSuggestionCandidates: typeof findImportSuggestionCandidates;
  findImportDuplicateCandidates: typeof findImportDuplicateCandidates;
  createImportBatch: typeof createImportBatchRecord;
};

const defaultRepository: ImportRepository = {
  findExpenseReferences,
  findImportSuggestionCandidates,
  findImportDuplicateCandidates,
  createImportBatch: createImportBatchRecord,
};

function normalizeSignedAmount(value: string) {
  const normalized = value.replace(",", ".").trim();
  const match = normalized.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) {
    throw new ImportValidationError("O valor importado e invalido.");
  }

  const whole = match[2].replace(/^0+(?=\d)/, "") || "0";
  const fraction = (match[3] ?? "").padEnd(2, "0");
  const cents = Number(whole) * 100 + Number(fraction);
  if (!Number.isSafeInteger(cents)) {
    throw new ImportValidationError("O valor importado e invalido.");
  }
  if (cents === 0) {
    throw new ImportValidationError("O valor importado nao pode ser zero.");
  }

  return `${match[1]}${whole}.${fraction}`;
}

function getSourceNotes(row: ImportExpenseRowInput) {
  const technicalNotes = [
    row.cardholder ? `Portador: ${row.cardholder}` : null,
    row.installment
      ? `Parcela: ${row.installment.current}/${row.installment.total}`
      : null,
    row.authorizationCode ? `Autorizacao: ${row.authorizationCode}` : null,
    row.documentNumber ? `Documento/cartao: ${row.documentNumber}` : null,
  ].filter((value): value is string => Boolean(value));

  return technicalNotes;
}

function buildNotes(row: ImportExpenseRowInput) {
  return (
    [...(row.notes.trim() ? [row.notes.trim()] : []), ...getSourceNotes(row)]
      .join(" | ")
      .slice(0, 1000) || null
  );
}

function toParsedRow(row: ImportRowIdentityInput): ParsedImportRow {
  return {
    rowNumber: row.rowNumber,
    source: row.source,
    description: row.description,
    amount: row.amount,
    transactionDate: row.transactionDate,
    cardholder: row.cardholder,
    installment: row.installment,
    authorizationCode: row.authorizationCode,
    documentNumber: row.documentNumber,
    metadata: row.metadata,
  };
}

function sameDate(left: Date | null, right: string) {
  return left ? formatDateOnly(left) === right : false;
}

async function getDuplicateMatches(
  context: AuthContext,
  row: ImportRowIdentityInput,
  statementDate: string | null,
  repository: ImportRepository,
) {
  const amount = normalizeSignedAmount(row.amount);
  const transactionDate = parseDateOnly(row.transactionDate);
  const parsedStatementDate = statementDate
    ? parseDateOnly(statementDate)
    : null;
  const fingerprint = await createImportRowFingerprint(toParsedRow(row));
  const candidates = await repository.findImportDuplicateCandidates({
    householdId: context.householdId,
    amount,
    transactionDate,
    statementDate: parsedStatementDate,
    importFingerprint: fingerprint,
  });
  const normalizedDescription = normalizeText(row.description);

  return candidates
    .filter((candidate) => {
      if (candidate.importFingerprint === fingerprint) {
        return true;
      }

      if (normalizeText(candidate.description) !== normalizedDescription) {
        return false;
      }

      const sameTransactionDate = candidate.creditCardTransactionDate
        ? sameDate(candidate.creditCardTransactionDate, row.transactionDate)
        : sameDate(candidate.date, row.transactionDate);
      const sameStatementDate = parsedStatementDate
        ? sameDate(candidate.date, formatDateOnly(parsedStatementDate))
        : sameTransactionDate;

      return sameTransactionDate && sameStatementDate;
    })
    .map((candidate) => ({
      id: candidate.id,
      description: candidate.description,
      amount: candidate.amount.toString(),
      transactionDate: candidate.creditCardTransactionDate
        ? formatDateOnly(candidate.creditCardTransactionDate)
        : formatDateOnly(candidate.date),
      statementDate: formatDateOnly(candidate.date),
      source: candidate.importBatch?.source ?? null,
      fileName: candidate.importBatch?.fileName ?? null,
    }));
}

export async function getImportSuggestions(
  context: AuthContext,
  description: string,
  repository: ImportRepository = defaultRepository,
): Promise<ExpenseImportSuggestion[]> {
  const candidates = await repository.findImportSuggestionCandidates(
    context.householdId,
  );
  return rankExpenseSuggestions(
    description,
    candidates.map((candidate) => ({
      description: candidate.description,
      notes: candidate.notes,
      areaCategoryId: candidate.areaCategory.id,
      areaCategoryName: candidate.areaCategory.name,
      areaSubcategoryId: candidate.areaSubcategory.id,
      areaSubcategoryName: candidate.areaSubcategory.name,
      profileCategoryId: candidate.profileCategory.id,
      profileCategoryName: candidate.profileCategory.name,
    })),
  );
}

export async function getImportDuplicateMatches(
  context: AuthContext,
  row: ImportRowIdentityInput,
  statementDate: string | null,
  repository: ImportRepository = defaultRepository,
) {
  return getDuplicateMatches(context, row, statementDate, repository);
}

function getImportMetadata(
  row: ImportExpenseRowInput,
  fileName: string,
  statementDate: string | null,
) {
  return {
    ...row.metadata,
    source: row.source,
    fileName,
    statementDate,
    cardholder: row.cardholder,
    installment: row.installment
      ? `${row.installment.current}/${row.installment.total}`
      : null,
    authorizationCode: row.authorizationCode,
    documentNumber: row.documentNumber,
  };
}

async function prepareImportedExpense(
  context: AuthContext,
  row: ImportExpenseRowInput,
  batch: ImportBatchInput,
  repository: ImportRepository,
): Promise<PersistImportedExpense> {
  if (row.source !== batch.source) {
    throw new ImportValidationError(
      "A linha nao pertence ao formato selecionado.",
    );
  }

  const references = await repository.findExpenseReferences(
    context.householdId,
    {
      areaCategoryId: row.areaCategoryId,
      areaSubcategoryId: row.areaSubcategoryId,
      profileCategoryId: row.profileCategoryId,
      responsibleUserId: row.responsibleUserId,
    },
  );

  if (!references.areaCategory) {
    throw new ImportValidationError(
      "A categoria de area selecionada e invalida.",
    );
  }
  if (!references.areaSubcategory) {
    throw new ImportValidationError(
      "A subcategoria nao pertence a categoria de area selecionada.",
    );
  }
  if (!references.profileCategory) {
    throw new ImportValidationError(
      "A categoria de perfil selecionada e invalida.",
    );
  }
  if (!references.responsibleMember) {
    throw new ImportValidationError(
      "O responsavel precisa ser membro do mesmo household.",
    );
  }

  const duplicateMatches = await getDuplicateMatches(
    context,
    row,
    batch.statementDate,
    repository,
  );
  if (duplicateMatches.length > 0 && !row.allowDuplicateImport) {
    throw new ImportValidationError(
      "A linha parece duplicada e precisa de confirmacao.",
    );
  }

  const amount = normalizeSignedAmount(row.amount);
  const transactionDate = parseDateOnly(row.transactionDate);
  const statementDate = batch.statementDate
    ? parseDateOnly(batch.statementDate)
    : null;
  const isCardImport = row.source === "XP" || row.source === "BTG";
  const rowFingerprint = await createImportRowFingerprint(toParsedRow(row));

  return {
    householdId: context.householdId,
    description: row.description.trim(),
    amount,
    date: isCardImport ? (statementDate as Date) : transactionDate,
    creditCardTransactionDate: isCardImport ? transactionDate : null,
    areaCategoryId: row.areaCategoryId,
    areaSubcategoryId: row.areaSubcategoryId,
    profileCategoryId: row.profileCategoryId,
    userId: context.userId,
    responsibleUserId: row.responsibleUserId,
    notes: buildNotes(row),
    recurring: row.recurring,
    shared: row.shared,
    importFingerprint: rowFingerprint,
    importRowNumber: row.rowNumber,
    importMetadata: getImportMetadata(row, batch.fileName, batch.statementDate),
  };
}

export async function createImport(
  context: AuthContext,
  batch: ImportBatchInput,
  repository: ImportRepository = defaultRepository,
): Promise<ImportCreationResult> {
  if (new Set(batch.rows.map((row) => row.responsibleUserId)).size > 1) {
    throw new ImportValidationError(
      "O arquivo deve usar um unico responsavel.",
    );
  }

  const expenses: PersistImportedExpense[] = [];
  const errors: string[] = [];

  for (const row of batch.rows) {
    try {
      expenses.push(
        await prepareImportedExpense(context, row, batch, repository),
      );
    } catch (error) {
      errors.push(
        `Linha ${row.rowNumber}: ${error instanceof Error ? error.message : "Falha ao validar a linha."}`,
      );
    }
  }

  const failedRows = errors.length;
  const importedRows = expenses.length;
  const status: ImportCreationResult["status"] =
    failedRows === 0
      ? batch.skippedRows === 0 && batch.ignoredRows === 0
        ? "COMPLETED"
        : "PARTIAL"
      : importedRows === 0
        ? "FAILED"
        : "PARTIAL";

  const createdBatch = await repository.createImportBatch({
    householdId: context.householdId,
    userId: context.userId,
    source: batch.source,
    fileName: batch.fileName,
    fileFingerprint: batch.fileFingerprint,
    statementDate: batch.statementDate
      ? parseDateOnly(batch.statementDate)
      : null,
    status,
    totalRows: batch.totalRows,
    importedRows,
    ignoredRows: batch.ignoredRows,
    skippedRows: batch.skippedRows,
    failedRows,
    expenses,
  });

  return {
    batchId: createdBatch.id,
    status,
    importedRows,
    ignoredRows: batch.ignoredRows,
    skippedRows: batch.skippedRows,
    failedRows,
    errors,
  };
}

export { createImportFileFingerprint };
