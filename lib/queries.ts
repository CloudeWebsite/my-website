import { cache } from "react";
import type { Prisma, ProjectType } from "@prisma/client";
import { db } from "./db";

const projectCard = {
  id: true,
  slug: true,
  title: true,
  location: true,
  year: true,
  type: true,
  lead: true,
  featured: true,
  coverImage: { select: { url: true, alt: true, width: true, height: true } },
} satisfies Prisma.ProjectSelect;

export type ProjectCard = Prisma.ProjectGetPayload<{ select: typeof projectCard }>;

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[db] ${label}:`, (err as Error).message);
    return fallback;
  }
}

export const getProjects = cache(async (type?: ProjectType, take?: number, skip = 0): Promise<ProjectCard[]> =>
  safe(
    () =>
      db.project.findMany({
        where: { status: "PUBLISHED", ...(type ? { type } : {}) },
        orderBy: [{ order: "asc" }, { year: "desc" }],
        select: projectCard,
        take,
        skip,
      }),
    [],
    "getProjects",
  ),
);

export const countProjects = cache(async (type?: ProjectType): Promise<number> =>
  safe(() => db.project.count({ where: { status: "PUBLISHED", ...(type ? { type } : {}) } }), 0, "countProjects"),
);

export const getFeaturedProject = cache(async (): Promise<ProjectCard | null> =>
  safe(
    () => db.project.findFirst({ where: { status: "PUBLISHED", featured: true }, orderBy: { order: "asc" }, select: projectCard }),
    null,
    "getFeaturedProject",
  ),
);

export const getProject = cache(async (slug: string, includeDrafts = false) =>
  safe(
    () =>
      db.project.findFirst({
        where: { slug, ...(includeDrafts ? {} : { status: "PUBLISHED" as const }) },
        include: { images: { orderBy: { order: "asc" } }, coverImage: true },
      }),
    null,
    "getProject",
  ),
);

export const getAdjacentProject = cache(async (slug: string): Promise<ProjectCard | null> =>
  safe(
    async () => {
      const all = await db.project.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ order: "asc" }, { year: "desc" }], select: projectCard });
      const i = all.findIndex((p) => p.slug === slug);
      if (all.length < 2 || i === -1) return null;
      return all[(i + 1) % all.length];
    },
    null,
    "getAdjacentProject",
  ),
);

export const getServices = cache(async () => safe(() => db.service.findMany({ orderBy: { order: "asc" } }), [], "getServices"));
export const getTeam = cache(async () => safe(() => db.teamMember.findMany({ orderBy: { order: "asc" } }), [], "getTeam"));
export const getTestimonials = cache(async () =>
  safe(
    () =>
      db.testimonial.findMany({
        where: { approved: true },
        orderBy: { order: "asc" },
        include: { project: { select: { title: true, slug: true, location: true } } },
      }),
    [],
    "getTestimonials",
  ),
);

export const getPosts = cache(async (take?: number) =>
  safe(
    () =>
      db.post.findMany({
        where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
        orderBy: { publishedAt: "desc" },
        take,
        select: { id: true, slug: true, title: true, excerpt: true, coverUrl: true, category: true, publishedAt: true },
      }),
    [],
    "getPosts",
  ),
);

export const getPost = cache(async (slug: string) =>
  safe(() => db.post.findFirst({ where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } } }), null, "getPost"),
);
