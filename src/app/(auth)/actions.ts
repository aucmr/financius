"use server";

import { authUserRepository } from "@/src/app/(auth)/_lib/repository";
import {
  parseSignUpInput,
  type SignUpInput,
} from "@/src/app/(auth)/_lib/schemas";
import { registerUser } from "@/src/app/(auth)/_lib/services";
import { passwordService } from "@/src/lib/auth/password";

export async function signUpAction(values: SignUpInput) {
  const parsed = parseSignUpInput(values);

  if (!parsed.ok) {
    return { ok: false, message: parsed.message };
  }

  const result = await registerUser(
    parsed.data,
    authUserRepository,
    passwordService,
  );

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    message: "Account created successfully.",
  };
}
