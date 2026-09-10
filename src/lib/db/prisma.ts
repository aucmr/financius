import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/client";

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const schema = process.env.DATABASE_SCHEMA ?? "public";

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Prisma client cannot be initialized.",
    );
  }

  const adapter = new PrismaPg({ connectionString }, { schema });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
