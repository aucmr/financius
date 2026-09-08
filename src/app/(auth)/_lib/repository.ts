import { prisma } from "@/src/lib/db/prisma";

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
  create: (input: CreateAuthUserInput) => Promise<AuthUser>;
};

export const authUserRepository: AuthUserRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },
  async create(input) {
    return prisma.user.create({ data: input });
  },
};
