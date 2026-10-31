import Link from "next/link";
import { auth } from "@/auth";
import { PageTitle } from "@/components/admin/PageTitle";
import { ProjectsList } from "@/components/admin/ProjectsList";
import { db } from "@/lib/db";

export const metadata = { title: "Projects" };

export default async function ProjectsAdmin() {
  const session = await auth();
  const projects = await db.project.findMany({ orderBy: [{ order: "asc" }], include: { coverImage: { select: { url: true } }, _count: { select: { images: true } } } });
  return (
    <>
      <PageTitle index="02 / Projects" title="Projects">
        <Link href="/admin/projects/new" className="a-btn">
          + New project
        </Link>
      </PageTitle>
      <p className="a-hint" style={{ marginBottom: 16 }}>Drag ⋮⋮ to change the order projects appear on the site.</p>
      <ProjectsList
        isAdmin={session?.user.role === "ADMIN"}
        rows={projects.map((p) => ({ id: p.id, title: p.title, slug: p.slug, location: p.location, year: p.year, type: p.type, status: p.status, featured: p.featured, cover: p.coverImage?.url ?? null, images: p._count.images }))}
      />
    </>
  );
}
