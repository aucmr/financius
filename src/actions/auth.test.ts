/**
 * Integration tests for the NextAuth authorize function.
 * These tests run against the `financius_test` database.
 * Before running, ensure the test DB is migrated and seeded.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../../prisma/generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@fin-db:5432/financius_test?schema=public";

function createTestPrisma() {
  const adapter = new PrismaPg({ connectionString: TEST_DB_URL });
  return new PrismaClient({ adapter });
}

/** Inline the authorize logic so we can test it without mocking NextAuth internals */
async function authorize(
  prisma: PrismaClient,
  credentials: { email: string; password: string } | null,
) {
  if (!credentials?.email || !credentials?.password) return null;

  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  });
  if (!user) return null;

  const passwordMatch = await bcrypt.compare(
    credentials.password,
    user.password,
  );
  if (!passwordMatch) return null;

  return { id: user.id, email: user.email, name: user.name };
}

describe("Auth: authorize", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrisma();

    // Seed a test user
    const hashed = await bcrypt.hash("testpass123", 10);
    await prisma.user.upsert({
      where: { email: "test-husband@financius.app" },
      update: { password: hashed },
      create: {
        email: "test-husband@financius.app",
        password: hashed,
        name: "Test Husband",
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: "test-husband@financius.app" },
    });
    await prisma.$disconnect();
  });

  it("returns null when credentials are missing", async () => {
    expect(await authorize(prisma, null)).toBeNull();
  });

  it("returns null when email is not found", async () => {
    const result = await authorize(prisma, {
      email: "nobody@financius.app",
      password: "whatever",
    });
    expect(result).toBeNull();
  });

  it("returns null when password is wrong", async () => {
    const result = await authorize(prisma, {
      email: "test-husband@financius.app",
      password: "wrongpassword",
    });
    expect(result).toBeNull();
  });

  it("returns the user when credentials are correct", async () => {
    const result = await authorize(prisma, {
      email: "test-husband@financius.app",
      password: "testpass123",
    });
    expect(result).not.toBeNull();
    expect(result?.email).toBe("test-husband@financius.app");
    expect(result?.name).toBe("Test Husband");
    expect(result?.id).toBeDefined();
  });
});
