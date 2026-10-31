import { auth } from "@/auth";
import { deleteEntity, reorderEntities, saveEntity } from "@/app/admin/actions";
import { EntityManager } from "@/components/admin/EntityManager";
import { PageTitle } from "@/components/admin/PageTitle";
import { db } from "@/lib/db";

export const metadata = { title: "Team" };

export default async function TeamAdmin() {
  const [session, rows] = await Promise.all([auth(), db.teamMember.findMany({ orderBy: { order: "asc" } })]);
  return (
    <>
      <PageTitle index="04 / Team" title="Team" />
      <EntityManager
        noun="team member"
        rows={rows.map((r) => ({ id: r.id, name: r.name, role: r.role, bio: r.bio, photoUrl: r.photoUrl ?? "", _sub: r.role }))}
        titleField="name"
        subtitleField="_sub"
        fields={[
          { name: "name", label: "Name", type: "text", required: true },
          { name: "role", label: "Role", type: "text", required: true },
          { name: "bio", label: "Short bio", type: "textarea" },
          { name: "photoUrl", label: "Portrait (shown greyscale, colour on hover)", type: "image", folder: "team" },
        ]}
        save={saveEntity.bind(null, "team")}
        remove={deleteEntity.bind(null, "team")}
        reorder={reorderEntities.bind(null, "team")}
        canDelete={session?.user.role === "ADMIN"}
      />
    </>
  );
}
