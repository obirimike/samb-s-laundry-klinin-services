import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import authConfig from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      name: "Email and password",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) return null;

        if (user.accountStatus === "SUSPENDED") return null;

        const validPassword = await compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!validPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }

      if (token.id) {
        const currentUser = await db.user.findUnique({
          where: { id: token.id },
          select: { sessionVersion: true, accountStatus: true },
        });

        if (
          !currentUser ||
          currentUser.accountStatus === "SUSPENDED" ||
          currentUser.sessionVersion !== token.sessionVersion
        ) {
          delete token.id;
          delete token.role;
          delete token.sessionVersion;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "CUSTOMER";
      }

      return session;
    },
  },
});