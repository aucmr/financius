"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  HouseholdAccessError,
  UnauthorizedError,
  getAuthContext,
  type AuthContext,
} from "@/src/lib/auth/context";
import {
  archivePayableItem,
  createPayableItem,
  movePayableItem,
  PayableItemNotFoundError,
  PayableValidationError,
  renamePayableItem,
  updateMonthlyPayableStatus,
} from "@/src/app/(app)/contas-a-pagar/_lib/services";
import {
  archivePayableItemSchema,
  getPayableFieldErrors,
  movePayableItemSchema,
  monthlyPayableStatusSchema,
  payableItemFormSchema,
  renamePayableItemSchema,
} from "@/src/app/(app)/contas-a-pagar/_lib/schemas";

export type PayablesActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function invalidFormResult(error: z.ZodError): PayablesActionResult {
  const fieldErrors = getPayableFieldErrors(error);

  return {
    ok: false,
    message: Object.values(fieldErrors)[0] ?? "Confira os dados informados.",
    fieldErrors,
  };
}

async function runPayablesAction(
  operation: (context: AuthContext) => Promise<string>,
): Promise<PayablesActionResult> {
  try {
    const context = await getAuthContext();
    const message = await operation(context);
    revalidatePath("/contas-a-pagar");
    revalidatePath("/contas-a-pagar/gerenciar");

    return { ok: true, message };
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof HouseholdAccessError ||
      error instanceof PayableItemNotFoundError ||
      error instanceof PayableValidationError
    ) {
      return { ok: false, message: error.message };
    }

    throw error;
  }
}

export async function setMonthlyPayableStatusAction(
  values: unknown,
): Promise<PayablesActionResult> {
  const parsed = monthlyPayableStatusSchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runPayablesAction(async (context) => {
    await updateMonthlyPayableStatus(
      context,
      parsed.data.itemId,
      parsed.data.month,
      parsed.data.isPaid,
    );

    return parsed.data.isPaid
      ? "Item marcado como pago."
      : "Item marcado como pendente.";
  });
}

export async function createPayableItemAction(
  values: unknown,
): Promise<PayablesActionResult> {
  const parsed = payableItemFormSchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runPayablesAction(async (context) => {
    await createPayableItem(context, parsed.data);
    return "Item adicionado à checklist.";
  });
}

export async function renamePayableItemAction(
  values: unknown,
): Promise<PayablesActionResult> {
  const parsed = renamePayableItemSchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runPayablesAction(async (context) => {
    await renamePayableItem(context, parsed.data.itemId, {
      name: parsed.data.name,
    });
    return "Item atualizado.";
  });
}

export async function movePayableItemAction(
  values: unknown,
): Promise<PayablesActionResult> {
  const parsed = movePayableItemSchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runPayablesAction(async (context) => {
    const moved = await movePayableItem(
      context,
      parsed.data.itemId,
      parsed.data.direction,
    );

    if (!moved) {
      return parsed.data.direction === "up"
        ? "O item já está no início da lista."
        : "O item já está no final da lista.";
    }

    return "Ordem dos itens atualizada.";
  });
}

export async function archivePayableItemAction(
  values: unknown,
): Promise<PayablesActionResult> {
  const parsed = archivePayableItemSchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runPayablesAction(async (context) => {
    await archivePayableItem(context, parsed.data.itemId);
    return "Item arquivado. O histórico mensal foi preservado.";
  });
}
