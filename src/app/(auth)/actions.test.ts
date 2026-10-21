import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  changeUserPassword: vi.fn(),
  authUserRepository: {},
  passwordService: {},
}));

vi.mock("@/src/lib/auth/auth", () => ({ auth: mocks.auth }));
vi.mock("@/src/app/(auth)/_lib/services", () => ({
  changeUserPassword: mocks.changeUserPassword,
}));
vi.mock("@/src/app/(auth)/_lib/repository", () => ({
  authUserRepository: mocks.authUserRepository,
}));
vi.mock("@/src/lib/auth/password", () => ({
  passwordService: mocks.passwordService,
}));

import {
  changePasswordAction,
  signUpAction,
} from "@/src/app/(auth)/actions";

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.changeUserPassword.mockReset();
});

describe("signUpAction", () => {
  it.each([
    ["valid account details", {
      name: "Pessoa",
      email: "pessoa@example.com",
      password: "password123",
    }],
    ["an invalid payload", null],
  ])("keeps public sign-up closed for %s", async (_description, payload) => {
    await expect(signUpAction(payload)).resolves.toEqual({
      ok: false,
      message:
        "O cadastro público está fechado. O acesso é liberado manualmente pelo administrador.",
    });
  });

  it("requires an authenticated user before changing a password", async () => {
    mocks.auth.mockResolvedValue(null);

    await expect(
      changePasswordAction({
        currentPassword: "password123",
        newPassword: "new-password-456",
        confirmNewPassword: "new-password-456",
      }),
    ).resolves.toEqual({
      ok: false,
      message: "Sua sessão expirou. Entre novamente para alterar a senha.",
    });
    expect(mocks.changeUserPassword).not.toHaveBeenCalled();
  });

  it("validates the payload on the server before changing a password", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });

    await expect(
      changePasswordAction({
        currentPassword: "password123",
        newPassword: "short",
        confirmNewPassword: "short",
      }),
    ).resolves.toEqual({
      ok: false,
      message: "A nova senha deve ter pelo menos 8 caracteres.",
    });
    expect(mocks.changeUserPassword).not.toHaveBeenCalled();
  });

  it("uses the authenticated user id for the password change", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.changeUserPassword.mockResolvedValue({
      ok: true,
      message: "Senha alterada com sucesso.",
    });
    const input = {
      currentPassword: "password123",
      newPassword: "new-password-456",
      confirmNewPassword: "new-password-456",
    };

    await expect(changePasswordAction(input)).resolves.toEqual({
      ok: true,
      message: "Senha alterada com sucesso.",
    });
    expect(mocks.changeUserPassword).toHaveBeenCalledWith(
      {
        userId: "user-1",
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      },
      mocks.authUserRepository,
      mocks.passwordService,
    );
  });
});
