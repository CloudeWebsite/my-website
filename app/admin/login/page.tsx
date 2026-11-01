import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const session = await auth();
  if (session?.user) redirect("/admin");
  const { studio } = await getSettings();
  const { callbackUrl } = await searchParams;
  let next = "/admin";
  try {
    const u = new URL(callbackUrl ?? "/admin", "http://x");
    if (u.pathname.startsWith("/admin")) next = u.pathname + u.search;
  } catch {
    /* default */
  }
  return (
    <main className="a-login">
      <div className="a-login__card">
        <p className="a-mono">■ {studio.name} [{studio.regionTag}] — Studio dashboard</p>
        <h1>
          Sign <em>in</em>
        </h1>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
