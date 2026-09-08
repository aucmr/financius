import { authUserRepository } from "@/src/app/(auth)/_lib/repository";
import { parseSignInInput } from "@/src/app/(auth)/_lib/schemas";
import { authenticateUser } from "@/src/app/(auth)/_lib/services";
import { passwordService } from "@/src/lib/auth/password";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = parseSignInInput({
          email: credentials?.email,
          password: credentials?.password,
        });

        if (!parsed.ok) {
          return null;
        }

        const result = await authenticateUser(
          parsed.data,
          authUserRepository,
          passwordService,
        );

        if (!result.ok) {
          return null;
        }

        return {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }

      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
