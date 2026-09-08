import { z } from "zod";

export const signInInputSchema = z.object({
  email: z.email("Email is invalid."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signUpInputSchema = signInInputSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters."),
});

export type SignInInput = z.infer<typeof signInInputSchema>;
export type SignUpInput = z.infer<typeof signUpInputSchema>;

function getZodMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input.";
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
