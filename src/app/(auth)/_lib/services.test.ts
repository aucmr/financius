import { describe, expect, it } from "vitest";

import type {
  AuthUser,
  AuthUserRepository,
  CreateAuthUserInput,
} from "@/src/app/(auth)/_lib/repository";
import {
  authenticateUser,
  changeUserPassword,
  registerUser,
} from "@/src/app/(auth)/_lib/services";
import { passwordService } from "@/src/lib/auth/password";

function createInMemoryRepository() {
  const users = new Map<string, AuthUser>();

  const repository: AuthUserRepository = {
    async findByEmail(email) {
      return users.get(email) ?? null;
    },
    async findById(id) {
      return [...users.values()].find((user) => user.id === id) ?? null;
    },
    async create(input: CreateAuthUserInput) {
      const user: AuthUser = {
        id: crypto.randomUUID(),
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
      };

      users.set(user.email, user);
      return user;
    },
    async replacePasswordHash(id, expectedPasswordHash, passwordHash) {
      const user = [...users.values()].find((candidate) => candidate.id === id);

      if (!user || user.passwordHash !== expectedPasswordHash) {
        return false;
      }

      user.passwordHash = passwordHash;
      return true;
    },
  };

  return { repository, users };
}

describe("auth service integration", () => {
  it("registers a user and stores hashed password", async () => {
    const { repository } = createInMemoryRepository();

    const result = await registerUser(
      {
        name: "Ada",
        email: "ada@example.com",
        password: "password123",
      },
      repository,
      passwordService,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.passwordHash).not.toBe("password123");
      expect(result.user.email).toBe("ada@example.com");
    }
  });

  it("authenticates with valid credentials after registration", async () => {
    const { repository } = createInMemoryRepository();

    const registerResult = await registerUser(
      {
        name: "Ada",
        email: "ada@example.com",
        password: "password123",
      },
      repository,
      passwordService,
    );

    expect(registerResult.ok).toBe(true);

    const loginResult = await authenticateUser(
      {
        email: "ada@example.com",
        password: "password123",
      },
      repository,
      passwordService,
    );

    expect(loginResult.ok).toBe(true);
  });

  it("rejects invalid login password", async () => {
    const { repository } = createInMemoryRepository();

    await registerUser(
      {
        name: "Ada",
        email: "ada@example.com",
        password: "password123",
      },
      repository,
      passwordService,
    );

    const loginResult = await authenticateUser(
      {
        email: "ada@example.com",
        password: "wrong-password",
      },
      repository,
      passwordService,
    );

    expect(loginResult.ok).toBe(false);
    if (!loginResult.ok) {
      expect(loginResult.message).toBe("Invalid email or password.");
    }
  });

  it("changes a user's password after verifying the current password", async () => {
    const { repository, users } = createInMemoryRepository();
    await registerUser(
      {
        name: "Ada",
        email: "ada@example.com",
        password: "password123",
      },
      repository,
      passwordService,
    );
    const user = users.get("ada@example.com");

    expect(user).toBeDefined();
    if (!user) {
      return;
    }

    const result = await changeUserPassword(
      {
        userId: user.id,
        currentPassword: "password123",
        newPassword: "new-password-456",
      },
      repository,
      passwordService,
    );

    expect(result).toEqual({
      ok: true,
      message: "Senha alterada com sucesso.",
    });
    expect(user.passwordHash).not.toBe("new-password-456");

    const previousPasswordResult = await authenticateUser(
      { email: user.email, password: "password123" },
      repository,
      passwordService,
    );
    const newPasswordResult = await authenticateUser(
      { email: user.email, password: "new-password-456" },
      repository,
      passwordService,
    );

    expect(previousPasswordResult.ok).toBe(false);
    expect(newPasswordResult.ok).toBe(true);
  });

  it("does not update the hash when the current password is incorrect", async () => {
    const { repository, users } = createInMemoryRepository();
    await registerUser(
      {
        name: "Ada",
        email: "ada@example.com",
        password: "password123",
      },
      repository,
      passwordService,
    );
    const user = users.get("ada@example.com");

    expect(user).toBeDefined();
    if (!user) {
      return;
    }
    const originalPasswordHash = user.passwordHash;

    const result = await changeUserPassword(
      {
        userId: user.id,
        currentPassword: "incorrect-password",
        newPassword: "new-password-456",
      },
      repository,
      passwordService,
    );

    expect(result).toEqual({
      ok: false,
      message: "A senha atual está incorreta.",
      field: "currentPassword",
    });
    expect(user.passwordHash).toBe(originalPasswordHash);
  });
});
