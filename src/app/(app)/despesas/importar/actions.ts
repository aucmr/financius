"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  HouseholdAccessError,
  UnauthorizedError,
  getAuthContext,
} from "@/src/lib/auth/context";
import {
  createImportFileFingerprint,
  detectCsvSource,
  parseImportCsv,
  type ParsedImport,
} from "@/src/lib/imports";
import {
  createImport,
  getImportDuplicateMatches,
  getImportSuggestions,
  ImportValidationError,
  type ImportDuplicateMatch,
} from "@/src/app/(app)/despesas/importar/_lib/services";
import type { ExpenseImportSuggestion } from "@/src/app/(app)/despesas/importar/_lib/suggestions";
import {
  dateOnlySchema,
  getImportFieldErrors,
  importBatchSchema,
  importParseSchema,
  importRowIdentitySchema,
} from "@/src/app/(app)/despesas/importar/_lib/schemas";

export type ParseImportData = ParsedImport & {
  fileName: string;
  fileFingerprint: string;
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

export type ImportActionResult<T = unknown> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function invalidFormResult<T>(error: z.ZodError): ImportActionResult<T> {
  const fieldErrors = getImportFieldErrors(error);
  return {
    ok: false,
    message: Object.values(fieldErrors)[0] ?? "Confira os dados informados.",
    fieldErrors,
  };
}

function getActionErrorMessage(error: unknown) {
  if (
    error instanceof UnauthorizedError ||
    error instanceof HouseholdAccessError ||
    error instanceof ImportValidationError
  ) {
    return error.message;
  }

  if (error instanceof Error && error.message.includes("CSV")) {
    return error.message;
  }

  return "Nao foi possivel concluir a importacao. Tente novamente.";
}

export async function parseImportAction(
  input: unknown,
): Promise<ImportActionResult<ParseImportData>> {
  const parsed = importParseSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  try {
    const detectedSource = detectCsvSource(parsed.data.content);
    if (detectedSource !== parsed.data.source) {
      return {
        ok: false,
        message:
          "O formato detectado nao corresponde a instituicao selecionada.",
      };
    }

    const parsedImport = parseImportCsv(
      parsed.data.content,
      parsed.data.source,
      parsed.data.statementDate,
    );

    return {
      ok: true,
      message: "Arquivo lido com sucesso.",
      data: {
        ...parsedImport,
        fileName: parsed.data.fileName,
        fileFingerprint: await createImportFileFingerprint(parsed.data.content),
      },
    };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

const suggestionSchema = z
  .object({ description: z.string().trim().min(2).max(120) })
  .strict();

export async function getImportSuggestionsAction(
  input: unknown,
): Promise<ImportActionResult<ExpenseImportSuggestion[]>> {
  const parsed = suggestionSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  try {
    const context = await getAuthContext();
    const suggestions = await getImportSuggestions(
      context,
      parsed.data.description,
    );
    return { ok: true, message: "Sugestoes carregadas.", data: suggestions };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

const duplicateSchema = z
  .object({
    row: importRowIdentitySchema,
    statementDate: dateOnlySchema.nullable(),
  })
  .strict();

export async function getImportDuplicateMatchesAction(
  input: unknown,
): Promise<ImportActionResult<ImportDuplicateMatch[]>> {
  const parsed = duplicateSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  try {
    const context = await getAuthContext();
    const matches = await getImportDuplicateMatches(
      context,
      parsed.data.row,
      parsed.data.statementDate,
    );
    return { ok: true, message: "Duplicidades verificadas.", data: matches };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function createImportBatchAction(
  input: unknown,
): Promise<ImportActionResult<ImportCreationResult>> {
  const parsed = importBatchSchema.safeParse(input);
  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  try {
    const context = await getAuthContext();
    const result = await createImport(context, parsed.data);
    revalidatePath("/despesas");
    revalidatePath("/despesas/importar");

    return {
      ok: true,
      message: "Importacao concluida.",
      data: result,
    };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}
