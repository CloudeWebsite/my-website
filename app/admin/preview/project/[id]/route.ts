import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authErrorResponse, requireUser } from "@/lib/guard";

/** Enables draft mode for signed-in staff and opens the (possibly unpublished) case study. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser("EDITOR");
  } catch (err) {
    return authErrorResponse(err);
  }
  const { id } = await params;
  const p = await db.project.findUnique({ where: { id }, select: { slug: true } });
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });
  (await draftMode()).enable();
  redirect(`/projects/${p.slug}`);
}
