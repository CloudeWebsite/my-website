import { auth } from "@/auth";
import { deleteEntity, reorderEntities, saveEntity } from "@/app/admin/actions";
import { EntityManager } from "@/components/admin/EntityManager";
import { PageTitle } from "@/components/admin/PageTitle";
import { db } from "@/lib/db";

export const metadata = { title: "Services" };

export default async function ServicesAdmin() {
  const [session, rows] = await Promise.all([auth(), db.service.findMany({ orderBy: { order: "asc" } })]);
  return (
    <>
      <PageTitle index="03 / Services" title="Services" />
      <EntityManager
        noun="service"
        rows={rows.map((r) => ({ id: r.id, title: r.title, subtitle: r.subtitle, description: r.description, deliverables: r.deliverables, imageUrl: r.imageUrl ?? "", _sub: r.subtitle }))}
        titleField="title"
        subtitleField="_sub"
        fields={[
          { name: "title", label: "Title", type: "text", required: true },
          { name: "subtitle", label: "Sub-text (mono line)", type: "text", required: true, hint: "e.g. Bespoke homes · Site analysis · Consents" },
          { name: "description", label: "Description", type: "textarea", required: true },
          { name: "deliverables", label: "Deliverables", type: "list", hint: "One per line, up to six." },
          { name: "imageUrl", label: "Image", type: "image", folder: "services" },
        ]}
        save={saveEntity.bind(null, "services")}
        remove={deleteEntity.bind(null, "services")}
        reorder={reorderEntities.bind(null, "services")}
        canDelete={session?.user.role === "ADMIN"}
      />
    </>
  );
}
