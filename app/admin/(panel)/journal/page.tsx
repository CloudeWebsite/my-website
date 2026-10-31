import Link from "next/link";
import { PageTitle } from "@/components/admin/PageTitle";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Journal" };

export default async function JournalAdmin() {
  const posts = await db.post.findMany({ orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }] });
  return (
    <>
      <PageTitle index="06 / Journal" title="Journal">
        <Link href="/admin/journal/new" className="a-btn">
          + New entry
        </Link>
      </PageTitle>
      {posts.length === 0 ? (
        <p className="a-empty">No entries yet.</p>
      ) : (
        <ul className="a-list">
          {posts.map((p) => {
            const scheduled = p.status === "PUBLISHED" && p.publishedAt && p.publishedAt > new Date();
            return (
              <li key={p.id}>
                <div className="a-item">
                  <div className="a-item__thumb">{p.coverUrl ? <img src={p.coverUrl} alt="" /> : <span className="a-mono">—</span>}</div>
                  <div className="a-item__main">
                    <Link href={`/admin/journal/${p.id}`} className="a-item__title">
                      {p.title}
                    </Link>
                    <span className="a-mono">
                      {p.category} · {scheduled ? `Scheduled ${formatDate(p.publishedAt!)}` : p.status === "PUBLISHED" ? `Published ${p.publishedAt ? formatDate(p.publishedAt) : ""}` : "Draft"}
                    </span>
                  </div>
                  <div className="a-item__actions">
                    <Link href={`/admin/journal/${p.id}`} className="a-btn a-btn--ghost a-btn--sm">
                      Edit
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
