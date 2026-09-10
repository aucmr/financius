import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { authenticateUser, registerUser } from "@/src/app/(auth)/_lib/services";
import { passwordService } from "@/src/lib/auth/password";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const describeIfDatabase = hasDatabase ? describe : describe.skip;

describeIfDatabase("login integration with postgres", () => {
  let authUserRepository: typeof import("@/src/app/(auth)/_lib/repository").authUserRepository;
  let prisma: typeof import("@/src/lib/db/prisma").prisma;

  beforeAll(async () => {
    ({ authUserRepository } = await import("@/src/app/(auth)/_lib/repository"));
    ({ prisma } = await import("@/src/lib/db/prisma"));
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("registers and authenticates a real user through Prisma repository", async () => {
    const registerResult = await registerUser(
      {
        name: "Base User",
        email: "base-user@example.com",
        password: "password123",
      },
      authUserRepository,
      passwordService,
    );

    expect(registerResult.ok).toBe(true);

    const loginResult = await authenticateUser(
      {
        email: "base-user@example.com",
        password: "password123",
      },
      authUserRepository,
      passwordService,
    );

    expect(loginResult.ok).toBe(true);

    if (loginResult.ok) {
      expect(loginResult.user.email).toBe("base-user@example.com");
      expect(loginResult.user.passwordHash).not.toBe("password123");
    }
  });

  it("rejects wrong password for existing user", async () => {
    const loginResult = await authenticateUser(
      {
        email: "base-user@example.com",
        password: "wrong-password",
      },
      authUserRepository,
      passwordService,
    );

    expect(loginResult.ok).toBe(false);
    if (!loginResult.ok) {
      expect(loginResult.message).toBe("Invalid email or password.");
    }
  });
});
