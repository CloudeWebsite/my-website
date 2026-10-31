import type { Metadata } from "next";
import Image from "next/image";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { BeforeAfter } from "@/components/project/BeforeAfter";
import { NextProject } from "@/components/project/NextProject";
import { PlanViewer } from "@/components/project/PlanViewer";
import { JsonLd } from "@/components/ui/JsonLd";
import { Marks } from "@/components/ui/Marks";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { db } from "@/lib/db";
import { getAdjacentProject, getProject } from "@/lib/queries";
import { RichText, docToText } from "@/lib/richtext";
import { getSettings } from "@/lib/settings";
import { PROJECT_TYPE_LABEL, siteUrl } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const rows = await db.project.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } });
    return rows.map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return { title: "Project not found" };
  return {
    title: `${p.title}, ${p.location}`,
    description: p.lead,
    alternates: { canonical: `/projects/${p.slug}` },
    openGraph: { title: p.title, description: p.lead, type: "article" },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();
  const [project, next, { studio }] = await Promise.all([getProject(slug, preview), getAdjacentProject(slug), getSettings()]);
  if (!project) notFound();
  const gallery = project.images.filter((i) => i.kind === "GALLERY" && i.id !== project.coverImageId);
  const before = project.images.find((i) => i.kind === "BEFORE");
  const after = project.images.find((i) => i.kind === "AFTER");
  const plans = project.images.filter((i) => i.kind === "PLAN");
  const cover = project.coverImage ?? gallery[0];
  const meta: Array<[string, string | number | null]> = [
    ["Location", project.location],
    ["Client", project.client],
    ["Site area", project.siteArea],
    ["Floor area", project.floorArea],
    ["Type", PROJECT_TYPE_LABEL[project.type]],
    ["Status", project.year > new Date().getFullYear() ? "In progress" : "Completed"],
    ["Year", project.year],
    ["Photography", project.photographer],
    ["Builder", project.builder],
  ];

  return (
    <>
      {preview && (
        <a href="/admin/preview/exit" className="preview-bar t-mono" data-no-transition>
          ■ Preview mode — {project.status === "DRAFT" ? "draft, not public" : "published"} · Exit preview
        </a>
      )}
      <section className="case-hero" data-theme="dark">
        {cover && (
          <div className="case-hero__img" data-parallax="0.1">
            <Image src={cover.url} alt={cover.alt} fill priority sizes="100vw" />
          </div>
        )}
        <div className="case-hero__text wrap">
          <p className="t-mono" data-reveal="fade">■ {PROJECT_TYPE_LABEL[project.type]} — {project.year}</p>
          <h1 className="case-hero__title" data-reveal="lines">
            {project.title}
          </h1>
          <p className="case-hero__meta t-mono">
            <span>{project.location}</span>
            <span>{studio.name} · Sheet {project.slug.slice(0, 3).toUpperCase()}-{String(project.year).slice(2)}</span>
          </p>
        </div>
      </section>

      <section className="section" data-theme="light">
        <div className="wrap grid case-body">
          <aside className="case-meta" aria-label="Project information">
            <SectionLabel>Project data</SectionLabel>
            <dl>
              {meta
                .filter(([, v]) => v !== null && v !== "")
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="t-mono">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
          </aside>
          <div className="case-main">
            <p className="case-lead" data-reveal="lines">
              {project.lead}
            </p>
            <RichText doc={project.body} />
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="section" data-theme="light" style={{ paddingTop: 0 }}>
          <div className="wrap gallery">
            {gallery.map((img, i) => (
              <figure key={img.id} className={i % 3 === 0 ? "gallery__fig" : "gallery__fig gallery__fig--half"}>
                <div className="gallery__media" data-reveal="image" data-cursor="view">
                  <Image src={img.url} alt={img.alt} width={img.width} height={img.height} sizes={i % 3 === 0 ? "100vw" : "(max-width: 768px) 100vw, 50vw"} />
                  <Marks />
                </div>
                <figcaption className="gallery__cap t-mono">
                  <span>{img.caption ?? img.alt}</span>
                  <span>
                    Fig. {String(i + 1).padStart(2, "0")} · Scale 1:200 · {PROJECT_TYPE_LABEL[project.type]}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {before && after && (
        <section className="section" data-theme="dark">
          <div className="wrap">
            <SectionLabel>From drawing to room</SectionLabel>
            <h2 className="t-h2" data-reveal="lines" style={{ marginBottom: 48 }}>
              Plan <em>and</em> plan, realised
            </h2>
            <BeforeAfter before={{ url: before.url, alt: before.alt, label: before.caption ?? "Drawing" }} after={{ url: after.url, alt: after.alt, label: after.caption ?? "Realised" }} />
          </div>
        </section>
      )}

      {plans.length > 0 && (
        <section className="section" data-theme="light">
          <div className="wrap">
            <SectionLabel>Drawings</SectionLabel>
            <h2 className="t-h2" data-reveal="lines" style={{ marginBottom: 48 }}>
              Ground floor <em>plan</em>
            </h2>
            <PlanViewer image={{ url: plans[0].url, alt: plans[0].alt, width: plans[0].width, height: plans[0].height }} vector={project.type !== "INTERIORS"} title={`${project.title} — ground floor plan`} />
          </div>
        </section>
      )}

      {next && <NextProject project={next} />}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.title,
          headline: project.lead,
          description: docToText(project.body).slice(0, 300),
          url: siteUrl(`/projects/${project.slug}`),
          image: cover ? siteUrl(cover.url) : undefined,
          dateCreated: String(project.year),
          locationCreated: { "@type": "Place", name: project.location },
          creator: { "@type": "Organization", name: studio.name, url: siteUrl() },
          genre: PROJECT_TYPE_LABEL[project.type],
        }}
      />
    </>
  );
}
