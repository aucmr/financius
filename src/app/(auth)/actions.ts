"use server";

import {
  changePasswordInputSchema,
} from "@/src/app/(auth)/_lib/schemas";
import { authUserRepository } from "@/src/app/(auth)/_lib/repository";
import { changeUserPassword } from "@/src/app/(auth)/_lib/services";
import { auth } from "@/src/lib/auth/auth";
import { passwordService } from "@/src/lib/auth/password";

export async function signUpAction(_values: unknown) {
  void _values;

  return {
    ok: false as const,
    message:
      "O cadastro público está fechado. O acesso é liberado manualmente pelo administrador.",
  };
}

export async function changePasswordAction(values: unknown) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      ok: false as const,
      message: "Sua sessão expirou. Entre novamente para alterar a senha.",
    };
  }

  const parsed = changePasswordInputSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false as const,
      message:
        parsed.error.issues[0]?.message ?? "Confira os dados informados.",
    };
  }

  return changeUserPassword(
    {
      userId,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    },
    authUserRepository,
    passwordService,
  );
}
