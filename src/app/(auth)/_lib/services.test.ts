import { describe, expect, it } from "vitest";

import type {
  AuthUser,
  AuthUserRepository,
  CreateAuthUserInput,
} from "@/src/app/(auth)/_lib/repository";
import { authenticateUser, registerUser } from "@/src/app/(auth)/_lib/services";
import { passwordService } from "@/src/lib/auth/password";

function createInMemoryRepository() {
  const users = new Map<string, AuthUser>();

  const repository: AuthUserRepository = {
    async findByEmail(email) {
      return users.get(email) ?? null;
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
});
