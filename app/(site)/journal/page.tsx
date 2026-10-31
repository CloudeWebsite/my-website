import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHead } from "@/components/ui/PageHead";
import { getPosts } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;
export const metadata: Metadata = { title: "Journal", description: "Notes from the studio on process, materials and the houses we build.", alternates: { canonical: "/journal" } };

export default async function JournalPage() {
  const posts = await getPosts(60);
  return (
    <>
      <PageHead label="Journal" title="Notes *from the desk*" lead="Occasional writing on process, materials and the long life of houses." />
      <section className="section" data-theme="light">
        <div className="wrap">
          {posts.length === 0 ? (
            <p className="t-mono">Nothing published yet.</p>
          ) : (
            <ul className="posts">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link href={`/journal/${p.slug}`} className="jcard" data-cursor="view" data-transition-title={p.title}>
                    <span className="jcard__media">{p.coverUrl && <Image src={p.coverUrl} alt="" width={800} height={560} sizes="(max-width: 768px) 100vw, 33vw" />}</span>
                    <span className="t-mono jcard__meta">
                      {p.publishedAt ? formatDate(p.publishedAt) : ""} · {p.category}
                    </span>
                    <span className="jcard__title">{p.title}</span>
                    <span style={{ color: "var(--stone-dark)" }}>{p.excerpt}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
