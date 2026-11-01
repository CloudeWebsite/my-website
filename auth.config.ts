import type { NextAuthConfig } from "next-auth";

/** Edge-safe part of the auth config (used by middleware). */
export const authConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAdminArea = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
      const isAdminApi = pathname.startsWith("/api/admin");
      if (isAdminArea || isAdminApi) return Boolean(auth?.user);
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: "ADMIN" | "EDITOR" }).role ?? "EDITOR";
        token.uid = user.id ?? "";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as "ADMIN" | "EDITOR" | undefined) ?? "EDITOR";
        session.user.id = (token.uid as string | undefined) ?? "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
