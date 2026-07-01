import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "../../prisma/generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@fin-db:5432/financius_test?schema=public";

function createTestPrisma() {
  const adapter = new PrismaPg({ connectionString: TEST_DB_URL });
  return new PrismaClient({ adapter });
}

describe("Expenses actions", () => {
  const prisma = createTestPrisma();
  let createExpense!: typeof import("./expenses").createExpense;
  let createExpenseForUser!: typeof import("./expenses").createExpenseForUser;
  let creatorUserId: string;
  let responsibleUserId: string;
  let areaCategoryId: string;
  let profileCategoryId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB_URL;
    const module = await import("./expenses");
    createExpense = module.createExpense;
    createExpenseForUser = module.createExpenseForUser;

    const creator = await prisma.user.upsert({
      where: { email: "phase2-expense-creator@financius.app" },
      update: { name: "Phase 2 Test User" },
      create: {
        email: "phase2-expense-creator@financius.app",
        password: "hashed-placeholder",
        name: "Phase 2 Test User",
      },
    });
    creatorUserId = creator.id;

    const responsible = await prisma.user.upsert({
      where: { email: "phase2-expense-responsible@financius.app" },
      update: { name: "Expense Responsible User" },
      create: {
        email: "phase2-expense-responsible@financius.app",
        password: "hashed-placeholder",
        name: "Expense Responsible User",
      },
    });
    responsibleUserId = responsible.id;

    const area = await prisma.category.upsert({
      where: { name_kind: { name: "Test Area Category", kind: "AREA" } },
      update: { type: "EXPENSE" },
      create: {
        name: "Test Area Category",
        kind: "AREA",
        type: "EXPENSE",
        color: "#111111",
      },
    });

    const profile = await prisma.category.upsert({
      where: { name_kind: { name: "Test Profile Category", kind: "PROFILE" } },
      update: { type: "EXPENSE" },
      create: {
        name: "Test Profile Category",
        kind: "PROFILE",
        type: "EXPENSE",
        color: "#222222",
      },
    });

    areaCategoryId = area.id;
    profileCategoryId = profile.id;
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await prisma.expense.deleteMany({
      where: {
        OR: [
          { userId: creatorUserId },
          { userId: responsibleUserId },
          { responsibleUserId },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [creatorUserId, responsibleUserId] },
      },
    });
    await prisma.$disconnect();
  });

  it("creates an expense with decimal formatting and dual categories", async () => {
    const created = await createExpenseForUser(creatorUserId, {
      description: "Supermarket",
      amount: 123.4,
      date: "2026-06-01",
      areaCategoryId,
      profileCategoryId,
      responsibleUserId,
      shared: true,
    });

    expect(created.description).toBe("Supermarket");
    expect(created.amount.toFixed(2)).toBe("123.40");
    expect(created.shared).toBe(true);
    expect(created.areaCategoryId).toBe(areaCategoryId);
    expect(created.profileCategoryId).toBe(profileCategoryId);
    expect(created.responsibleUserId).toBe(responsibleUserId);
  });

  it("rejects invalid AREA/PROFILE category combinations", async () => {
    await expect(
      createExpenseForUser(creatorUserId, {
        description: "Wrong categories",
        amount: 50,
        date: "2026-06-02",
        areaCategoryId: profileCategoryId,
        profileCategoryId: areaCategoryId,
        responsibleUserId,
        shared: false,
      }),
    ).rejects.toThrow("Invalid AREA category");
  });

  it("rejects invalid responsible user", async () => {
    await expect(
      createExpenseForUser(creatorUserId, {
        description: "Wrong responsible",
        amount: 50,
        date: "2026-06-02",
        areaCategoryId,
        profileCategoryId,
        responsibleUserId: "missing-user-id",
        shared: false,
      }),
    ).rejects.toThrow("Invalid responsible user");
  });

  it("throws when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    await expect(
      createExpense({
        description: "Unauthorized expense",
        amount: 20,
        date: "2026-06-03",
        areaCategoryId,
        profileCategoryId,
        responsibleUserId,
        shared: false,
      }),
    ).rejects.toThrow("Unauthenticated");
  });
});
