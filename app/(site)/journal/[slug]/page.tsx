import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/ui/JsonLd";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { db } from "@/lib/db";
import { getPost } from "@/lib/queries";
import { RichText, docToText } from "@/lib/richtext";
import { getSettings } from "@/lib/settings";
import { formatDate, siteUrl } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    return (await db.post.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } })).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not found" };
  return { title: post.title, description: post.excerpt, alternates: { canonical: `/journal/${post.slug}` }, openGraph: { type: "article", title: post.title, description: post.excerpt, images: post.coverUrl ? [post.coverUrl] : undefined } };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, { studio }] = await Promise.all([getPost(slug), getSettings()]);
  if (!post) notFound();
  const words = docToText(post.body).split(/\s+/).length;
  return (
    <article className="section" data-theme="light" style={{ paddingTop: "calc(var(--header-h) + clamp(80px, 10vw, 160px))" }}>
      <div className="wrap">
        <SectionLabel>
          {post.category} · {post.publishedAt ? formatDate(post.publishedAt) : ""} · {Math.max(1, Math.round(words / 220))} min read
        </SectionLabel>
        <h1 className="t-h1 article-head" data-reveal="lines">
          {post.title}
        </h1>
        {post.coverUrl && (
          <div className="article-cover" data-reveal="image">
            <Image src={post.coverUrl} alt="" width={1600} height={1000} sizes="100vw" priority />
          </div>
        )}
        <div className="article-body">
          <p className="case-lead">{post.excerpt}</p>
          <RichText doc={post.body} />
          <p style={{ marginTop: 64 }}>
            <Link href="/journal" className="link-u t-mono" data-transition-title="Journal">
              ← All entries
            </Link>
          </p>
        </div>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.publishedAt?.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          image: post.coverUrl ? siteUrl(post.coverUrl) : undefined,
          author: { "@type": "Organization", name: studio.name },
          publisher: { "@type": "Organization", name: studio.name },
          mainEntityOfPage: siteUrl(`/journal/${post.slug}`),
        }}
      />
    </article>
  );
}
