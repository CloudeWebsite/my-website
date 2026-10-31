import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ConfirmProvider } from "@/components/admin/Confirm";
import { Sidebar } from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/Toast";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  const [{ studio }, newCount] = await Promise.all([getSettings(), db.enquiry.count({ where: { status: "NEW" } })]);
  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="a-shell">
          <Sidebar studio={studio.name} user={session.user} newCount={newCount} />
          <main className="a-main" id="main">
            {children}
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
