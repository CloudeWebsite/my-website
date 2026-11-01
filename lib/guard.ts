import "server-only";
import type { Session } from "next-auth";
import { auth } from "@/auth";

export class AuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
  }
}

/** Server-side role check. Call at the top of every admin action / route. */
export async function requireUser(role: "ADMIN" | "EDITOR" = "EDITOR"): Promise<Session["user"]> {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError(401, "Not signed in.");
  if (role === "ADMIN" && session.user.role !== "ADMIN") throw new AuthError(403, "Administrators only.");
  return session.user;
}

export function authErrorResponse(err: unknown): Response {
  if (err instanceof AuthError) return Response.json({ error: err.message }, { status: err.status });
  console.error(err);
  return Response.json({ error: "Something went wrong." }, { status: 500 });
}
