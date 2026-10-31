import { auth } from "@/auth";
import { deleteEntity, reorderEntities, saveEntity } from "@/app/admin/actions";
import { EntityManager } from "@/components/admin/EntityManager";
import { PageTitle } from "@/components/admin/PageTitle";
import { db } from "@/lib/db";

export const metadata = { title: "Testimonials" };

export default async function TestimonialsAdmin() {
  const [session, rows, projects] = await Promise.all([auth(), db.testimonial.findMany({ orderBy: { order: "asc" }, include: { project: { select: { title: true } } } }), db.project.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } })]);
  return (
    <>
      <PageTitle index="05 / Testimonials" title="Testimonials" />
      <p className="a-hint" style={{ marginBottom: 16 }}>Only approved testimonials appear on the site.</p>
      <EntityManager
        noun="testimonial"
        rows={rows.map((r) => ({ id: r.id, quote: r.quote, clientName: r.clientName, projectId: r.projectId ?? "", approved: r.approved, _sub: `${r.approved ? "Approved" : "Awaiting approval"}${r.project ? ` · ${r.project.title}` : ""} · “${r.quote.slice(0, 70)}…”` }))}
        titleField="clientName"
        subtitleField="_sub"
        fields={[
          { name: "quote", label: "Quote", type: "textarea", required: true },
          { name: "clientName", label: "Client name", type: "text", required: true },
          { name: "projectId", label: "Project", type: "select", options: [{ value: "", label: "— None —" }, ...projects.map((p) => ({ value: p.id, label: p.title }))] },
          { name: "approved", label: "Approved for the website", type: "checkbox" },
        ]}
        save={saveEntity.bind(null, "testimonials")}
        remove={deleteEntity.bind(null, "testimonials")}
        reorder={reorderEntities.bind(null, "testimonials")}
        canDelete={session?.user.role === "ADMIN"}
      />
    </>
  );
}
