"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { addProjectImage, deleteProjectImage, reorderProjectImages, setCoverImage, updateProjectImage } from "@/app/admin/actions";
import { IMAGE_KINDS } from "@/lib/validation";
import { cx } from "@/lib/utils";
import { useConfirm } from "./Confirm";
import { uploadImage } from "./ImageUpload";
import { SortableList } from "./Sortable";
import { useToast } from "./Toast";

export type ImageRow = { id: string; url: string; alt: string; caption: string | null; kind: (typeof IMAGE_KINDS)[number]; width: number; height: number };
type Pending = { key: string; file: File; preview: string; alt: string; caption: string; kind: ImageRow["kind"]; state: "ready" | "uploading" | "error"; error?: string };

export function ImagesManager({ projectId, images, coverId }: { projectId: string; images: ImageRow[]; coverId: string | null }) {
  const [items, setItems] = useState(images);
  const [pending, setPending] = useState<Pending[]>([]);
  const [, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  useEffect(() => setItems(images), [images]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ key: `${f.name}-${f.size}-${Math.random()}`, file: f, preview: URL.createObjectURL(f), alt: "", caption: "", kind: "GALLERY" as const, state: "ready" as const }));
    setPending((p) => [...p, ...next]);
  };

  const uploadAll = async () => {
    const missing = pending.filter((p) => p.alt.trim().length < 3);
    if (missing.length) {
      toast("Every image needs alt text (at least 3 characters).", "error");
      return;
    }
    for (const p of pending) {
      setPending((ps) => ps.map((x) => (x.key === p.key ? { ...x, state: "uploading" } : x)));
      try {
        const up = await uploadImage(p.file, "projects");
        const res = await addProjectImage(projectId, { ...up, alt: p.alt, caption: p.caption, kind: p.kind });
        if (!res.ok) throw new Error(res.error);
        setPending((ps) => ps.filter((x) => x.key !== p.key));
        URL.revokeObjectURL(p.preview);
      } catch (err) {
        setPending((ps) => ps.map((x) => (x.key === p.key ? { ...x, state: "error", error: (err as Error).message } : x)));
      }
    }
    toast("Upload complete.");
    router.refresh();
  };

  return (
    <div className="a-images">
      <div
        className="a-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
      >
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        <p>Drop images here or</p>
        <button type="button" className="a-btn a-btn--sm" onClick={() => input.current?.click()}>
          Choose files
        </button>
        <p className="a-hint">JPG, PNG, WebP · up to 15 MB · resized to 2560 px and converted to WebP · alt text is required</p>
      </div>

      {pending.length > 0 && (
        <div className="a-pending">
          {pending.map((p) => (
            <div key={p.key} className={cx("a-pending__row", p.state === "error" && "is-error")}>
              <img src={p.preview} alt="" />
              <input className="a-input a-input--sm" placeholder="Alt text (describe the image) *" value={p.alt} onChange={(e) => setPending((ps) => ps.map((x) => (x.key === p.key ? { ...x, alt: e.target.value } : x)))} aria-label="Alt text" />
              <input className="a-input a-input--sm" placeholder="Caption (optional)" value={p.caption} onChange={(e) => setPending((ps) => ps.map((x) => (x.key === p.key ? { ...x, caption: e.target.value } : x)))} aria-label="Caption" />
              <select className="a-input a-input--sm" value={p.kind} onChange={(e) => setPending((ps) => ps.map((x) => (x.key === p.key ? { ...x, kind: e.target.value as ImageRow["kind"] } : x)))} aria-label="Image kind">
                {IMAGE_KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              <span className="a-mono">{p.state === "uploading" ? "Uploading…" : p.state === "error" ? p.error : ""}</span>
              <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setPending((ps) => ps.filter((x) => x.key !== p.key))}>
                ✕
              </button>
            </div>
          ))}
          <div className="a-row a-row--end">
            <button type="button" className="a-btn" onClick={uploadAll}>
              Upload {pending.length} image{pending.length > 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      <SortableList
        grid
        items={items}
        className="a-gallery"
        onReorder={(next) => {
          setItems(next);
          start(async () => {
            const res = await reorderProjectImages(next.map((i) => i.id));
            if (!res.ok) toast(res.error, "error");
            router.refresh();
          });
        }}
        render={(img, handle) => (
          <ImageCard
            img={img}
            handle={handle}
            isCover={img.id === coverId}
            onCover={async () => {
              const res = await setCoverImage(projectId, img.id);
              toast(res.ok ? (res.message ?? "Cover set.") : res.error, res.ok ? "ok" : "error");
              router.refresh();
            }}
            onDelete={async () => {
              if (!(await confirm({ title: "Remove this image?", body: img.alt, confirm: "Remove", danger: true }))) return;
              setItems((xs) => xs.filter((x) => x.id !== img.id));
              const res = await deleteProjectImage(img.id);
              toast(res.ok ? (res.message ?? "Removed.") : res.error, res.ok ? "ok" : "error");
              router.refresh();
            }}
          />
        )}
      />
    </div>
  );
}

function ImageCard({ img, handle, isCover, onCover, onDelete }: { img: ImageRow; handle: React.ReactNode; isCover: boolean; onCover: () => void; onDelete: () => void }) {
  const [alt, setAlt] = useState(img.alt);
  const [caption, setCaption] = useState(img.caption ?? "");
  const [kind, setKind] = useState(img.kind);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const dirty = alt !== img.alt || caption !== (img.caption ?? "") || kind !== img.kind;
  return (
    <div className={cx("a-imgcard", isCover && "is-cover")}>
      <div className="a-imgcard__media">
        <img src={img.url} alt={img.alt} />
        {handle}
        {isCover && <span className="a-imgcard__badge a-mono">Cover</span>}
      </div>
      <input className="a-input a-input--sm" value={alt} onChange={(e) => setAlt(e.target.value)} aria-label="Alt text" placeholder="Alt text *" />
      <input className="a-input a-input--sm" value={caption} onChange={(e) => setCaption(e.target.value)} aria-label="Caption" placeholder="Caption" />
      <div className="a-row">
        <select className="a-input a-input--sm" value={kind} onChange={(e) => setKind(e.target.value as ImageRow["kind"])} aria-label="Kind">
          {IMAGE_KINDS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        {dirty && (
          <button
            type="button"
            className="a-btn a-btn--sm"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const res = await updateProjectImage(img.id, { alt, caption, kind });
              setSaving(false);
              toast(res.ok ? "Image updated." : res.error, res.ok ? "ok" : "error");
            }}
          >
            Save
          </button>
        )}
      </div>
      <div className="a-row">
        {!isCover && (
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={onCover}>
            Set as cover
          </button>
        )}
        <button type="button" className="a-btn a-btn--ghost a-btn--sm a-danger-text" onClick={onDelete}>
          Remove
        </button>
      </div>
    </div>
  );
}
