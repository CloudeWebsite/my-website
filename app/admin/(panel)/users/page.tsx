import { redirect } from "next/navigation";
import { deleteUser, saveUser } from "@/app/admin/actions";
import { EntityManager } from "@/components/admin/EntityManager";
import { PageTitle } from "@/components/admin/PageTitle";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  try {
    await requireUser("ADMIN");
  } catch {
    redirect("/admin");
  }
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  return (
    <>
      <PageTitle index="09 / Users" title="Users" />
      <p className="a-hint" style={{ marginBottom: 16 }}>Admins manage everything. Editors can edit content and enquiries but cannot delete, change settings or manage users.</p>
      <EntityManager
        noun="user"
        rows={users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, password: "", _sub: `${u.role} · ${u.email} · since ${formatDate(u.createdAt)}` }))}
        titleField="name"
        subtitleField="_sub"
        fields={[
          { name: "name", label: "Name", type: "text", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "role", label: "Role", type: "select", options: [{ value: "EDITOR", label: "Editor" }, { value: "ADMIN", label: "Admin" }] },
          { name: "password", label: "Password", type: "password", hint: "Leave blank to keep the current password. Minimum 10 characters." },
        ]}
        save={saveUser}
        remove={deleteUser}
        canDelete
      />
    </>
  );
}
