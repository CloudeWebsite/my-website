import type { ProjectType } from "@prisma/client";
import { countProjects, getProjects } from "@/lib/queries";
import { PROJECT_TYPE_ENUM } from "@/lib/validation";

export const revalidate = 300;
const PAGE = 12;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const t = url.searchParams.get("type")?.toUpperCase();
  const type = t && (PROJECT_TYPE_ENUM as readonly string[]).includes(t) ? (t as ProjectType) : undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const [items, total] = await Promise.all([getProjects(type, PAGE, (page - 1) * PAGE), countProjects(type)]);
  return Response.json({ items, page, pageSize: PAGE, total, hasMore: page * PAGE < total });
}
