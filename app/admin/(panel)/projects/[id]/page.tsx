import type { JSONContent } from "@tiptap/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImagesManager } from "@/components/admin/ImagesManager";
import { PageTitle } from "@/components/admin/PageTitle";
import { ProjectEditor } from "@/components/admin/ProjectEditor";
import { db } from "@/lib/db";

export const metadata = { title: "Edit project" };

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.project.findUnique({ where: { id }, include: { images: { orderBy: { order: "asc" } } } });
  if (!p) notFound();
  return (
    <>
      <PageTitle index={`02 / Projects / ${p.status === "DRAFT" ? "Draft" : "Published"}`} title={p.title}>
        <Link href="/admin/projects" className="a-btn a-btn--ghost">
          ← All projects
        </Link>
      </PageTitle>
      <ProjectEditor
        id={p.id}
        initial={{ title: p.title, slug: p.slug, location: p.location, year: p.year, type: p.type, status: p.status, featured: p.featured, lead: p.lead, body: p.body as JSONContent, siteArea: p.siteArea ?? "", floorArea: p.floorArea ?? "", client: p.client ?? "", builder: p.builder ?? "", photographer: p.photographer ?? "" }}
      />
      <section className="a-panel">
        <h2 className="a-h2">Images</h2>
        <p className="a-hint">GALLERY images appear in the case study; PLAN feeds the plan viewer; BEFORE + AFTER create the comparison slider. Drag to reorder.</p>
        <ImagesManager projectId={p.id} coverId={p.coverImageId} images={p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, caption: i.caption, kind: i.kind, width: i.width, height: i.height }))} />
      </section>
    </>
  );
}
