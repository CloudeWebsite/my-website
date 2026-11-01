import Link from "next/link";
import { PageTitle } from "@/components/admin/PageTitle";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function Overview() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [newThisWeek, open, published, drafts, subscribers, latest, byStatus] = await Promise.all([
    db.enquiry.count({ where: { createdAt: { gte: weekAgo } } }),
    db.enquiry.count({ where: { status: { in: ["NEW", "CONTACTED", "PROPOSAL"] } } }),
    db.project.count({ where: { status: "PUBLISHED" } }),
    db.project.count({ where: { status: "DRAFT" } }),
    db.subscriber.count({ where: { confirmed: true } }),
    db.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.enquiry.groupBy({ by: ["status"], _count: true }),
  ]);
  const won = byStatus.find((s) => s.status === "WON")?._count ?? 0;
  const lost = byStatus.find((s) => s.status === "LOST")?._count ?? 0;
  const stats = [
    { label: "New enquiries this week", value: newThisWeek, href: "/admin/enquiries?status=NEW" },
    { label: "Open enquiries", value: open, href: "/admin/enquiries" },
    { label: "Published projects", value: published, sub: `${drafts} draft${drafts === 1 ? "" : "s"}`, href: "/admin/projects" },
    { label: "Confirmed subscribers", value: subscribers, href: "/admin/subscribers" },
    { label: "Win rate", value: won + lost ? `${Math.round((won / (won + lost)) * 100)}%` : "—", sub: `${won} won · ${lost} lost`, href: "/admin/enquiries?status=WON" },
  ];
  return (
    <>
      <PageTitle index="00 / Overview" title="Good to see you." />
      <div className="a-stats">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="a-stat">
            <span className="a-stat__v">{s.value}</span>
            <span className="a-mono">{s.label}</span>
            {s.sub && <span className="a-sub">{s.sub}</span>}
          </Link>
        ))}
      </div>
      <section className="a-panel">
        <div className="a-row a-row--between">
          <h2 className="a-h2">Latest enquiries</h2>
          <Link href="/admin/enquiries" className="a-link a-mono">
            All enquiries →
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="a-empty">No enquiries yet. They will appear here the moment someone submits the form.</p>
        ) : (
          <table className="a-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Received</th>
                <th>Client</th>
                <th>Project</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link className="a-link a-mono" href={`/admin/enquiries?open=${e.id}`}>
                      {e.reference}
                    </Link>
                  </td>
                  <td className="a-mono">{formatDate(e.createdAt)}</td>
                  <td>{e.name}</td>
                  <td>
                    {e.projectType} <span className="a-sub">{e.location}</span>
                  </td>
                  <td>
                    <span className={`a-status a-status--${e.status.toLowerCase()}`}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
