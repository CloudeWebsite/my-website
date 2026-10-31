import Image from "next/image";
import Link from "next/link";
import type { ProjectCard } from "@/lib/queries";
import { Marks } from "@/components/ui/Marks";

export function FeaturedProject({ project }: { project: ProjectCard | null }) {
  if (!project) return null;
  return (
    <section className="section featured" data-theme="dark" id="featured">
      <div className="wrap">
        <div className="featured__head">
          <div>
            <p className="t-mono featured__meta" data-reveal="fade">
              ■ Featured project — {project.year}
            </p>
            <h2 className="featured__title" data-reveal="lines">
              {project.title}
            </h2>
            <p className="t-mono featured__loc" data-reveal="fade">{project.location}</p>
          </div>
          <Link href={`/projects/${project.slug}`} className="btn btn--line" data-transition-title={project.title}>
            View project <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <Link href={`/projects/${project.slug}`} className="featured__media" data-reveal="image" data-cursor="view" data-transition-title={project.title} aria-label={`View ${project.title}`}>
          <span className="featured__inner" data-parallax="0.12">
            {project.coverImage && (
              <Image src={project.coverImage.url} alt={project.coverImage.alt} width={project.coverImage.width} height={project.coverImage.height} sizes="(max-width: 768px) 100vw, 92vw" />
            )}
          </span>
          <Marks note={`${project.type} · SCALE 1:200 · ${project.year}`} />
        </Link>
        <p className="featured__lead" data-reveal="fade">{project.lead}</p>
      </div>
    </section>
  );
}
