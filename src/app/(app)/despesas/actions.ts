"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  HouseholdAccessError,
  UnauthorizedError,
  getAuthContext,
} from "@/src/lib/auth/context";
import {
  createExpense,
  deleteExpense,
  ExpenseNotFoundError,
  ExpenseValidationError,
  updateExpense,
} from "@/src/app/(app)/despesas/_lib/services";
import {
  getFieldErrors,
  parseExpenseFormInput,
  parseExpenseId,
} from "@/src/app/(app)/despesas/_lib/schemas";

export type ExpenseActionResult =
  | { ok: true; message: string; expenseId?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function invalidFormResult(error: z.ZodError): ExpenseActionResult {
  const fieldErrors = getFieldErrors(error);
  return {
    ok: false,
    message: Object.values(fieldErrors)[0] ?? "Confira os dados informados.",
    fieldErrors,
  };
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return error.message;
  }

  if (error instanceof HouseholdAccessError) {
    return error.message;
  }

  if (
    error instanceof ExpenseValidationError ||
    error instanceof ExpenseNotFoundError
  ) {
    return error.message;
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

export async function createExpenseAction(
  values: unknown,
): Promise<ExpenseActionResult> {
  const parsed = parseExpenseFormInput(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  try {
    const context = await getAuthContext();
    const created = await createExpense(context, parsed.data);
    revalidatePath("/despesas");

    return {
      ok: true,
      message: "Despesa criada com sucesso.",
      expenseId: created.id,
    };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function updateExpenseAction(
  id: unknown,
  values: unknown,
): Promise<ExpenseActionResult> {
  const parsedId = parseExpenseId(id);
  const parsed = parseExpenseFormInput(values);

  if (!parsedId.success) {
    return {
      ok: false,
      message: parsedId.error.issues[0]?.message ?? "Despesa inválida.",
    };
  }

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  try {
    const context = await getAuthContext();
    const updated = await updateExpense(context, parsedId.data, parsed.data);
    revalidatePath("/despesas");
    revalidatePath(`/despesas/${parsedId.data}/editar`);

    return {
      ok: true,
      message: "Despesa atualizada com sucesso.",
      expenseId: updated.id,
    };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function deleteExpenseAction(
  id: unknown,
): Promise<ExpenseActionResult> {
  const parsedId = parseExpenseId(id);

  if (!parsedId.success) {
    return {
      ok: false,
      message: parsedId.error.issues[0]?.message ?? "Despesa inválida.",
    };
  }

  try {
    const context = await getAuthContext();
    await deleteExpense(context, parsedId.data);
    revalidatePath("/despesas");

    return { ok: true, message: "Despesa excluída com sucesso." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}
