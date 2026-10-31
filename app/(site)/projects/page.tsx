import type { Metadata } from "next";
import { ProjectsIndex } from "@/components/home/ProjectsIndex";
import { PageHead } from "@/components/ui/PageHead";
import { countProjects, getProjects } from "@/lib/queries";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Projects",
  description: "Selected houses, renovations, interiors and landscapes by the studio.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const [items, total] = await Promise.all([getProjects(undefined, 12), countProjects()]);
  return (
    <>
      <PageHead label="Projects" title="Houses that *belong where they stand*" lead="New homes, careful renovations, interiors and landscapes — each one drawn for a particular family on a particular piece of ground." />
      <ProjectsIndex initial={items} total={total} pageable title="All *work*" index="01" />
    </>
  );
}
