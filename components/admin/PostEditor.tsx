"use client";

import type { JSONContent } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePost, savePost } from "@/app/admin/actions";
import { slugify } from "@/lib/utils";
import { useConfirm } from "./Confirm";
import { TextArea, TextInput, Toggle } from "./fields";
import { ImageField } from "./ImageUpload";
import { RichEditor } from "./RichEditor";
import { useToast } from "./Toast";

export type PostFormValue = { title: string; slug: string; excerpt: string; body: JSONContent; coverUrl: string; category: string; status: "PUBLISHED" | "DRAFT"; publishedAt: string };

export function PostEditor({ id, initial, isAdmin }: { id: string | null; initial: PostFormValue; isAdmin: boolean }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const set = <K extends keyof PostFormValue>(k: K, val: PostFormValue[K]) => setV((p) => ({ ...p, [k]: val }));

  return (
    <form
      className="a-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const res = await savePost(id, v);
        setBusy(false);
        if (!res.ok) {
          setErrors(res.fieldErrors ?? {});
          toast(res.error, "error");
          return;
        }
        setErrors({});
        toast(res.message ?? "Saved.");
        if (!id && res.data) router.push(`/admin/journal/${res.data.id}`);
        else router.refresh();
      }}
    >
      <div className="a-form__grid">
        <TextInput
          label="Title *"
          value={v.title}
          error={errors.title}
          onChange={(e) => {
            set("title", e.target.value);
            if (!slugTouched) set("slug", slugify(e.target.value));
          }}
        />
        <TextInput
          label="Slug *"
          value={v.slug}
          error={errors.slug}
          hint={`/journal/${v.slug || "…"}`}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
        />
        <TextInput label="Category *" value={v.category} error={errors.category} onChange={(e) => set("category", e.target.value)} placeholder="Process, Materials, Studio…" />
        <TextInput label="Publish date" type="datetime-local" value={v.publishedAt} error={errors.publishedAt} hint="Future dates schedule the entry." onChange={(e) => set("publishedAt", e.target.value)} />
        <div className="a-field">
          <span className="a-mono">Visibility</span>
          <Toggle label="Published" checked={v.status === "PUBLISHED"} onChange={(b) => set("status", b ? "PUBLISHED" : "DRAFT")} />
        </div>
      </div>
      <TextArea label="Excerpt *" rows={2} value={v.excerpt} error={errors.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
      <ImageField label="Cover image" value={v.coverUrl} folder="journal" onChange={(url) => set("coverUrl", url)} />
      <RichEditor label="Body" value={v.body} onChange={(doc) => set("body", doc)} />
      <div className="a-sticky-actions">
        {id && isAdmin && (
          <button
            type="button"
            className="a-btn a-btn--ghost a-danger-text"
            onClick={async () => {
              if (!(await confirm({ title: "Delete this entry?", body: v.title, confirm: "Delete", danger: true }))) return;
              const res = await deletePost(id);
              toast(res.ok ? (res.message ?? "Deleted.") : res.error, res.ok ? "ok" : "error");
              if (res.ok) router.push("/admin/journal");
            }}
          >
            Delete
          </button>
        )}
        <button type="submit" className="a-btn" disabled={busy}>
          {busy ? "Saving…" : id ? "Save changes" : "Create entry"}
        </button>
      </div>
    </form>
  );
}
