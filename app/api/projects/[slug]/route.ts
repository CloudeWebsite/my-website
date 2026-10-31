import { getProject } from "@/lib/queries";

export const revalidate = 300;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(project);
}
