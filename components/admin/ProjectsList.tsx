"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { deleteProject, reorderProjects, toggleProject } from "@/app/admin/actions";
import { PROJECT_TYPE_LABEL } from "@/lib/utils";
import { useConfirm } from "./Confirm";
import { Toggle } from "./fields";
import { SortableList } from "./Sortable";
import { useToast } from "./Toast";

export type ProjectRow = { id: string; title: string; slug: string; location: string; year: number; type: string; status: "PUBLISHED" | "DRAFT"; featured: boolean; cover: string | null; images: number };

export function ProjectsList({ rows, isAdmin }: { rows: ProjectRow[]; isAdmin: boolean }) {
  const [items, setItems] = useOptimistic(rows);
  const [, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, optimistic?: ProjectRow[]) =>
    start(async () => {
      if (optimistic) setItems(optimistic);
      const res = await fn();
      if (!res.ok) toast(res.error ?? "Failed.", "error");
      else if (res.message) toast(res.message);
      router.refresh();
    });

  if (!items.length) return <p className="a-empty">No projects yet — create the first one.</p>;
  return (
    <SortableList
      items={items}
      className="a-list"
      onReorder={(next) => run(() => reorderProjects(next.map((p) => p.id)), next)}
      render={(p, handle) => (
        <div className="a-item">
          {handle}
          <div className="a-item__thumb">{p.cover ? <img src={p.cover} alt="" /> : <span className="a-mono">—</span>}</div>
          <div className="a-item__main">
            <Link href={`/admin/projects/${p.id}`} className="a-item__title">
              {p.title}
            </Link>
            <span className="a-mono">
              {p.location} · {p.year} · {PROJECT_TYPE_LABEL[p.type]} · {p.images} images
            </span>
          </div>
          <div className="a-item__actions">
            <Toggle label="Published" checked={p.status === "PUBLISHED"} onChange={(v) => run(() => toggleProject(p.id, "published", v), items.map((x) => (x.id === p.id ? { ...x, status: v ? "PUBLISHED" : "DRAFT" } : x)))} />
            <Toggle label="Featured" checked={p.featured} onChange={(v) => run(() => toggleProject(p.id, "featured", v), items.map((x) => (x.id === p.id ? { ...x, featured: v } : x)))} />
            <a className="a-btn a-btn--ghost a-btn--sm" href={`/admin/preview/project/${p.id}`} target="_blank" rel="noopener noreferrer">
              Preview ↗
            </a>
            <Link className="a-btn a-btn--ghost a-btn--sm" href={`/admin/projects/${p.id}`}>
              Edit
            </Link>
            {isAdmin && (
              <button
                type="button"
                className="a-btn a-btn--ghost a-btn--sm a-danger-text"
                onClick={async () => {
                  if (await confirm({ title: `Delete “${p.title}”?`, body: "The project and all of its images will be permanently removed.", confirm: "Delete project", danger: true }))
                    run(() => deleteProject(p.id), items.filter((x) => x.id !== p.id));
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    />
  );
}
