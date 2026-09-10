"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "@/src/lib/auth/context";
import { prisma } from "@/src/lib/db/prisma";

import { associateMemberSchema } from "@/src/app/(app)/household/schemas";

export type AssociateMemberActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function associateHouseholdMemberAction(
  values: unknown,
): Promise<AssociateMemberActionResult> {
  const parsed = associateMemberSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "E-mail inválido.",
    };
  }

  try {
    const context = await getAuthContext();
    const target = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: {
        id: true,
        householdMembership: {
          select: {
            householdId: true,
            household: {
              select: {
                id: true,
                members: { select: { userId: true } },
                _count: { select: { expenses: true } },
              },
            },
          },
        },
      },
    });

    if (!target) {
      return {
        ok: false,
        message: "Não encontramos uma conta com esse e-mail.",
      };
    }

    if (target.id === context.userId) {
      return {
        ok: false,
        message: "Escolha o e-mail da outra pessoa do casal.",
      };
    }

    if (context.members.length >= 2) {
      return { ok: false, message: "Este household já possui dois membros." };
    }

    if (target.householdMembership?.householdId === context.householdId) {
      return { ok: false, message: "Essa conta já pertence ao household." };
    }

    const targetHousehold = target.householdMembership?.household;

    if (
      targetHousehold &&
      (targetHousehold.members.length > 1 ||
        targetHousehold._count.expenses > 0)
    ) {
      return {
        ok: false,
        message:
          "Essa conta já possui dados em outro household e não pode ser movida.",
      };
    }

    await prisma.$transaction(async (transaction) => {
      if (target.householdMembership) {
        await transaction.householdMember.delete({
          where: { userId: target.id },
        });
      }

      await transaction.householdMember.create({
        data: {
          householdId: context.householdId,
          userId: target.id,
        },
      });

      if (targetHousehold) {
        await transaction.household.delete({
          where: { id: targetHousehold.id },
        });
      }
    });

    revalidatePath("/despesas");
    return { ok: true, message: "Conta associada ao household." };
  } catch {
    return { ok: false, message: "Não foi possível associar essa conta." };
  }
}
