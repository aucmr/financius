import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";
import { ensureDefaultExpenseCategories } from "../src/lib/categories/defaults";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg(connectionString, {
  schema: process.env.DATABASE_SCHEMA ?? "public",
});
const prisma = new PrismaClient({ adapter });

async function seedCategories() {
  const households = await prisma.household.findMany({
    select: { id: true },
  });

  for (const household of households) {
    await ensureDefaultExpenseCategories(prisma, household.id);
  }
}

async function main() {
  await seedCategories();
  console.log("Expense categories seeded per household.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
