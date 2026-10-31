import bcrypt from "bcryptjs";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { headers } from "next/headers";
import { authConfig } from "./auth.config";
import { db } from "./lib/db";
import { clientIp, rateLimit } from "./lib/ratelimit";
import { loginSchema } from "./lib/validation";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: "ADMIN" | "EDITOR" } & DefaultSession["user"];
  }
  interface User {
    role?: "ADMIN" | "EDITOR";
  }
}

// Always run a bcrypt comparison so unknown emails take as long as wrong passwords.
const DUMMY_HASH = bcrypt.hashSync("timing-equaliser", 12);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const h = await headers();
        const limit = await rateLimit("login", `${clientIp(h)}:${parsed.data.email.toLowerCase()}`, 8, "15 m");
        if (!limit.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
        const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !ok) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
