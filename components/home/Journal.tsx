import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { SectionLabel } from "@/components/ui/SectionLabel";

type P = { id: string; slug: string; title: string; excerpt: string; coverUrl: string | null; category: string; publishedAt: Date | null };

export function Journal({ posts, index = "06" }: { posts: P[]; index?: string }) {
  if (!posts.length) return null;
  return (
    <section className="section journal" data-theme="light" id="journal">
      <div className="wrap">
        <div className="journal__head">
          <SectionLabel index={index}>Journal</SectionLabel>
          <Link href="/journal" className="link-u t-mono" data-transition-title="Journal">
            All entries →
          </Link>
        </div>
        <ul className="journal__list" data-reveal="stagger">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/journal/${p.slug}`} className="jcard" data-cursor="view" data-transition-title={p.title}>
                <span className="jcard__media">{p.coverUrl && <Image src={p.coverUrl} alt="" width={800} height={560} sizes="(max-width: 768px) 100vw, 33vw" />}</span>
                <span className="t-mono jcard__meta">
                  {p.publishedAt ? formatDate(p.publishedAt) : ""} · {p.category}
                </span>
                <span className="jcard__title">{p.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
