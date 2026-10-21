import { prisma } from "@/src/lib/db/prisma";
import { ensureDefaultExpenseCategories } from "@/src/lib/categories/defaults";

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  passwordHash: string;
};

export type CreateAuthUserInput = {
  name: string;
  email: string;
  passwordHash: string;
};

export type AuthUserRepository = {
  findByEmail: (email: string) => Promise<AuthUser | null>;
  findById: (id: string) => Promise<AuthUser | null>;
  create: (input: CreateAuthUserInput) => Promise<AuthUser>;
  replacePasswordHash: (
    id: string,
    expectedPasswordHash: string,
    passwordHash: string,
  ) => Promise<boolean>;
};

export const authUserRepository: AuthUserRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },
  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },
  async create(input) {
    return prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({ data: input });

      const household = await transaction.household.create({
        data: {
          name: `${user.name}'s household`,
          members: {
            create: {
              userId: user.id,
            },
          },
        },
        select: { id: true },
      });
      await ensureDefaultExpenseCategories(transaction, household.id);

      return user;
    });
  },
  async replacePasswordHash(id, expectedPasswordHash, passwordHash) {
    const result = await prisma.user.updateMany({
      where: { id, passwordHash: expectedPasswordHash },
      data: { passwordHash },
    });

    return result.count === 1;
  },
};
