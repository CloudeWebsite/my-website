import { PageTitle } from "@/components/admin/PageTitle";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Subscribers" };

export default async function SubscribersPage() {
  const subs = await db.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 1000 });
  const confirmed = subs.filter((s) => s.confirmed).length;
  return (
    <>
      <PageTitle index="07 / Subscribers" title="Subscribers">
        <a className="a-btn a-btn--ghost" href="/api/admin/subscribers/export">
          Export CSV ↓
        </a>
      </PageTitle>
      <p className="a-hint" style={{ marginBottom: 16 }}>
        {confirmed} confirmed · {subs.length - confirmed} awaiting confirmation (double opt-in)
      </p>
      {subs.length === 0 ? (
        <p className="a-empty">No subscribers yet.</p>
      ) : (
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Signed up</th>
                <th>Confirmed</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>
                    <span className={`a-status a-status--${s.confirmed ? "won" : "new"}`}>{s.confirmed ? "Confirmed" : "Pending"}</span>
                  </td>
                  <td className="a-mono">{formatDate(s.createdAt)}</td>
                  <td className="a-mono">{s.confirmedAt ? formatDate(s.confirmedAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
