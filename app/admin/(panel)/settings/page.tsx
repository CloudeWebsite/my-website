import { PageTitle } from "@/components/admin/PageTitle";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireUser } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import { redirect } from "next/navigation";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  try {
    await requireUser("ADMIN");
  } catch {
    redirect("/admin");
  }
  const settings = await getSettings();
  return (
    <>
      <PageTitle index="08 / Settings" title="Settings" />
      <SettingsForm settings={settings} />
    </>
  );
}
