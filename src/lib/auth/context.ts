import { auth } from "@/src/lib/auth/auth";
import { prisma } from "@/src/lib/db/prisma";

export class UnauthorizedError extends Error {
  constructor() {
    super("You must be signed in to continue.");
    this.name = "UnauthorizedError";
  }
}

export class HouseholdAccessError extends Error {
  constructor(message = "Your household is not available.") {
    super(message);
    this.name = "HouseholdAccessError";
  }
}

export type HouseholdMemberContext = {
  id: string;
  name: string;
  email: string;
};

export type AuthContext = {
  userId: string;
  householdId: string;
  householdName: string;
  members: HouseholdMemberContext[];
};

async function createLegacyHousehold(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  if (!user) {
    throw new HouseholdAccessError("The signed-in user no longer exists.");
  }

  try {
    await prisma.household.create({
      data: {
        name: `${user.name}'s household`,
        members: {
          create: { userId },
        },
      },
    });
  } catch {
    // Another request may have provisioned the legacy user at the same time.
  }
}

export async function getAuthContext(): Promise<AuthContext> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new UnauthorizedError();
  }

  let membership = await prisma.householdMember.findUnique({
    where: { userId },
    select: {
      household: {
        select: {
          id: true,
          name: true,
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    await createLegacyHousehold(userId);
    membership = await prisma.householdMember.findUnique({
      where: { userId },
      select: {
        household: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  if (!membership) {
    throw new HouseholdAccessError();
  }

  return {
    userId,
    householdId: membership.household.id,
    householdName: membership.household.name,
    members: membership.household.members
      .map(({ user }) => user)
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}
