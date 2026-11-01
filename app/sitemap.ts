import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ["", "/projects", "/services", "/approach", "/studio", "/journal", "/contact", "/privacy", "/terms"].map((p) => ({
    url: siteUrl(p || "/"),
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : p === "/projects" ? 0.9 : 0.6,
  }));
  try {
    const [projects, posts] = await Promise.all([
      db.project.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      db.post.findMany({ where: { status: "PUBLISHED", publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...statics,
      ...projects.map((p) => ({ url: siteUrl(`/projects/${p.slug}`), lastModified: p.updatedAt, priority: 0.8 })),
      ...posts.map((p) => ({ url: siteUrl(`/journal/${p.slug}`), lastModified: p.updatedAt, priority: 0.5 })),
    ];
  } catch {
    return statics;
  }
}
