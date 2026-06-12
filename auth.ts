import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { normalizeUsername } from "@/lib/validations/username";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const rawUsername = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!rawUsername?.trim() || !password) return null;

        const username = normalizeUsername(rawUsername);

        const found = await db.select().from(users).where(eq(users.username, username)).limit(1);
        const user = found[0];
        if (!user?.passwordHash || !user.username) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name ?? user.username,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.valid = true;
        if ("username" in user && typeof user.username === "string") {
          token.username = user.username;
        }
        return token;
      }

      if (!token.sub) return token;

      const found = await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(eq(users.id, token.sub))
        .limit(1);

      if (!found[0]) {
        token.valid = false;
        return token;
      }

      token.valid = true;
      if (found[0].username) token.username = found[0].username;
      return token;
    },
    session({ session, token }) {
      if (token.valid === false || !token.sub) {
        return { expires: session.expires };
      }
      if (session.user) {
        session.user.id = token.sub;
        if (typeof token.username === "string") {
          session.user.username = token.username;
        }
      }
      return session;
    },
  },
});
