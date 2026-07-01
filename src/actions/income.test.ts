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

describe("Income actions", () => {
  const prisma = createTestPrisma();
  let createIncome!: typeof import("./income").createIncome;
  let createIncomeForUser!: typeof import("./income").createIncomeForUser;
  let creatorUserId: string;
  let ownerUserId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB_URL;
    const module = await import("./income");
    createIncome = module.createIncome;
    createIncomeForUser = module.createIncomeForUser;

    const creator = await prisma.user.upsert({
      where: { email: "phase2-income-creator@financius.app" },
      update: { name: "Phase 2 Income Creator" },
      create: {
        email: "phase2-income-creator@financius.app",
        password: "hashed-placeholder",
        name: "Phase 2 Income Creator",
      },
    });
    creatorUserId = creator.id;

    const owner = await prisma.user.upsert({
      where: { email: "phase2-income-owner@financius.app" },
      update: { name: "Income Owner" },
      create: {
        email: "phase2-income-owner@financius.app",
        password: "hashed-placeholder",
        name: "Income Owner",
      },
    });
    ownerUserId = owner.id;
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await prisma.income.deleteMany({
      where: {
        OR: [{ userId: creatorUserId }, { ownerUserId }],
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [creatorUserId, ownerUserId] },
      },
    });
    await prisma.$disconnect();
  });

  it("creates income and normalizes the amount", async () => {
    const created = await createIncomeForUser(creatorUserId, {
      description: "Salary",
      amount: 3500.5,
      date: "2026-06-15",
      ownerUserId,
      notes: "Monthly salary",
      recurring: true,
    });

    expect(created.description).toBe("Salary");
    expect(created.amount.toFixed(2)).toBe("3500.50");
    expect(created.userId).toBe(creatorUserId);
    expect(created.ownerUserId).toBe(ownerUserId);
    expect(created.recurring).toBe(true);
  });

  it("throws when owner user is invalid", async () => {
    await expect(
      createIncomeForUser(creatorUserId, {
        description: "Bad owner",
        amount: 100,
        date: "2026-06-15",
        ownerUserId: "missing-owner",
        notes: "",
        recurring: false,
      }),
    ).rejects.toThrow("Invalid owner user");
  });

  it("throws when user is unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    await expect(
      createIncome({
        description: "Unauthorized income",
        amount: 1000,
        date: "2026-06-16",
        ownerUserId,
        notes: "",
        recurring: false,
      }),
    ).rejects.toThrow("Unauthenticated");
  });
});
