"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { deleteEnquiry } from "@/app/admin/actions";
import { cx, formatBytes, formatDate } from "@/lib/utils";
import { ENQUIRY_STATUSES } from "@/lib/validation";
import { useConfirm } from "./Confirm";
import { useToast } from "./Toast";

export type EnquiryRow = {
  id: string;
  reference: string;
  status: (typeof ENQUIRY_STATUSES)[number];
  name: string;
  email: string;
  phone: string;
  contactMethod: string;
  projectType: string;
  location: string;
  ownsLand: string;
  budgetRange: string;
  timeline: string;
  description: string;
  notes: string;
  createdAt: string;
  files: Array<{ id: string; filename: string; size: number }>;
};

const STATUS_LABEL: Record<EnquiryRow["status"], string> = { NEW: "New", CONTACTED: "Contacted", PROPOSAL: "Proposal", WON: "Won", LOST: "Lost" };

export function EnquiriesBoard({ rows, counts, isAdmin }: { rows: EnquiryRow[]; counts: Record<string, number>; isAdmin: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const filter = params.get("status") ?? "ALL";
  const q = params.get("q") ?? "";
  const [openId, setOpenId] = useState<string | null>(params.get("open"));
  const [, startTransition] = useTransition();
  const toast = useToast();
  const confirm = useConfirm();

  const [optimistic, applyOptimistic] = useOptimistic(rows, (state: EnquiryRow[], patch: { id: string } & Partial<EnquiryRow>) => state.map((r) => (r.id === patch.id ? { ...r, ...patch } : r)));
  const open = useMemo(() => optimistic.find((r) => r.id === openId) ?? null, [optimistic, openId]);
  const [notes, setNotes] = useState("");
  useEffect(() => setNotes(open?.notes ?? ""), [open?.id]);

  const setParam = (k: string, v: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (v === null || v === "" || v === "ALL") sp.delete(k);
    else sp.set(k, v);
    sp.delete("open");
    router.replace(`/admin/enquiries${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  async function patch(id: string, body: { status?: EnquiryRow["status"]; notes?: string }) {
    startTransition(async () => {
      applyOptimistic({ id, ...body });
      const res = await fetch(`/api/enquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast(j.error ?? "Update failed.", "error");
      } else toast(body.status ? `Marked ${STATUS_LABEL[body.status].toLowerCase()}.` : "Notes saved.");
      router.refresh();
    });
  }

  return (
    <>
      <div className="a-toolbar">
        <div className="a-tabs" role="tablist" aria-label="Filter by status">
          {["ALL", ...ENQUIRY_STATUSES].map((s) => (
            <button key={s} type="button" role="tab" aria-selected={filter === s} className={cx("a-tab", filter === s && "is-on")} onClick={() => setParam("status", s)}>
              {s === "ALL" ? "All" : STATUS_LABEL[s as EnquiryRow["status"]]} <span className="a-mono">{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="a-row">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", String(new FormData(e.currentTarget).get("q") ?? ""));
            }}
            role="search"
          >
            <input name="q" defaultValue={q} placeholder="Search name, email, reference…" className="a-input a-input--sm" aria-label="Search enquiries" />
          </form>
          <a className="a-btn a-btn--ghost a-btn--sm" href={`/api/admin/enquiries/export${filter !== "ALL" ? `?status=${filter}` : ""}`}>
            Export CSV ↓
          </a>
        </div>
      </div>

      {optimistic.length === 0 ? (
        <p className="a-empty">No enquiries {filter !== "ALL" ? `with status “${STATUS_LABEL[filter as EnquiryRow["status"]]}”` : "yet"}.</p>
      ) : (
        <div className="a-tablewrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Received</th>
                <th>Client</th>
                <th>Project</th>
                <th>Budget</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {optimistic.map((r) => (
                <tr key={r.id} className={cx(r.id === openId && "is-on")} onClick={() => setOpenId(r.id)}>
                  <td>
                    <button type="button" className="a-link a-mono" onClick={() => setOpenId(r.id)}>
                      {r.reference}
                    </button>
                  </td>
                  <td className="a-mono">{formatDate(r.createdAt)}</td>
                  <td>
                    {r.name}
                    <span className="a-sub">{r.email}</span>
                  </td>
                  <td>
                    {r.projectType}
                    <span className="a-sub">{r.location}</span>
                  </td>
                  <td>{r.budgetRange}</td>
                  <td>
                    <span className={`a-status a-status--${r.status.toLowerCase()}`}>{STATUS_LABEL[r.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="a-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenId(null)} />
            <motion.aside
              key={open.id}
              className="a-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={`Enquiry ${open.reference}`}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onKeyDown={(e) => e.key === "Escape" && setOpenId(null)}
            >
              <div className="a-drawer__head">
                <div>
                  <p className="a-mono">{formatDate(open.createdAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  <h2>{open.reference}</h2>
                </div>
                <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setOpenId(null)} autoFocus>
                  Close ✕
                </button>
              </div>
              <div className="a-field">
                <span className="a-mono">Status</span>
                <div className="a-seg" role="radiogroup" aria-label="Status">
                  {ENQUIRY_STATUSES.map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={open.status === s} className={cx("a-seg__b", open.status === s && "is-on", `a-status--${s.toLowerCase()}`)} onClick={() => open.status !== s && patch(open.id, { status: s })}>
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
              <dl className="a-dl">
                {(
                  [
                    ["Name", open.name],
                    ["Email", <a key="e" className="a-link" href={`mailto:${open.email}?subject=${encodeURIComponent(`Your enquiry ${open.reference}`)}`}>{open.email}</a>],
                    ["Phone", <a key="p" className="a-link" href={`tel:${open.phone.replace(/\s/g, "")}`}>{open.phone}</a>],
                    ["Prefers", open.contactMethod],
                    ["Project", open.projectType],
                    ["Site", open.location],
                    ["Owns land", open.ownsLand],
                    ["Budget", open.budgetRange],
                    ["Start", open.timeline],
                  ] as Array<[string, React.ReactNode]>
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt className="a-mono">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="a-field">
                <span className="a-mono">Brief</span>
                <p className="a-brief">{open.description}</p>
              </div>
              <div className="a-field">
                <span className="a-mono">Attachments ({open.files.length})</span>
                {open.files.length === 0 ? (
                  <p className="a-muted">None</p>
                ) : (
                  <ul className="a-files">
                    {open.files.map((f) => (
                      <li key={f.id}>
                        <a className="a-link" href={`/api/admin/files/${f.id}`}>
                          ↓ {f.filename}
                        </a>
                        <span className="a-mono">{formatBytes(f.size)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="a-field">
                <label htmlFor="enq-notes" className="a-mono">
                  Internal notes
                </label>
                <textarea id="enq-notes" className="a-input" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Call notes, next steps, fee discussed…" />
                <div className="a-row a-row--end">
                  <button type="button" className="a-btn a-btn--sm" disabled={notes === open.notes} onClick={() => patch(open.id, { notes })}>
                    Save notes
                  </button>
                </div>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="a-btn a-btn--danger a-btn--sm"
                  onClick={async () => {
                    if (!(await confirm({ title: `Delete ${open.reference}?`, body: "The enquiry and its attachments will be permanently removed.", confirm: "Delete", danger: true }))) return;
                    const res = await deleteEnquiry(open.id);
                    toast(res.ok ? (res.message ?? "Deleted.") : res.error, res.ok ? "ok" : "error");
                    if (res.ok) {
                      setOpenId(null);
                      router.refresh();
                    }
                  }}
                >
                  Delete enquiry
                </button>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
