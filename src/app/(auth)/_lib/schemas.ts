import { z } from "zod";

export const signInInputSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

export const signUpInputSchema = signInInputSchema.extend({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
});

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmNewPassword: z.string().min(1, "Confirme sua nova senha."),
  })
  .strict()
  .refine((input) => input.newPassword === input.confirmNewPassword, {
    message: "As novas senhas não conferem.",
    path: ["confirmNewPassword"],
  })
  .refine((input) => input.currentPassword !== input.newPassword, {
    message: "A nova senha deve ser diferente da senha atual.",
    path: ["newPassword"],
  });

export type SignInInput = z.infer<typeof signInInputSchema>;
export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

function getZodMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Confira os dados informados.";
}

export function parseSignInInput(
  input: Partial<Record<keyof SignInInput, unknown>>,
) {
  const parsed = signInInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      message: getZodMessage(parsed.error),
    };
  }

  return {
    ok: true as const,
    data: parsed.data,
  };
}

export function parseSignUpInput(
  input: Partial<Record<keyof SignUpInput, unknown>>,
) {
  const parsed = signUpInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      message: getZodMessage(parsed.error),
    };
  }

  return {
    ok: true as const,
    data: parsed.data,
  };
}
