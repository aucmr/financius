import { describe, expect, it } from "vitest";

import {
  changePasswordInputSchema,
  parseSignInInput,
  parseSignUpInput,
} from "@/src/app/(auth)/_lib/schemas";

describe("auth schemas", () => {
  it("accepts valid sign-in payload", () => {
    const result = parseSignInInput({
      email: "user@example.com",
      password: "password123",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects invalid sign-in email", () => {
    const result = parseSignInInput({
      email: "invalid",
      password: "password123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("Informe um e-mail válido.");
    }
  });

  it("rejects short sign-up name", () => {
    const result = parseSignUpInput({
      name: "A",
      email: "user@example.com",
      password: "password123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("O nome deve ter pelo menos 2 caracteres.");
    }
  });

  it("rejects mismatched new passwords", () => {
    const result = changePasswordInputSchema.safeParse({
      currentPassword: "password123",
      newPassword: "new-password-456",
      confirmNewPassword: "different-password",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "As novas senhas não conferem.",
      );
    }
  });
});
