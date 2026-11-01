"use client";

import type { JSONContent } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveProject } from "@/app/admin/actions";
import { slugify } from "@/lib/utils";
import { PROJECT_TYPE_ENUM } from "@/lib/validation";
import { Field, TextArea, TextInput, Toggle } from "./fields";
import { RichEditor } from "./RichEditor";
import { useToast } from "./Toast";

export type ProjectFormValue = {
  title: string;
  slug: string;
  location: string;
  year: number;
  type: (typeof PROJECT_TYPE_ENUM)[number];
  status: "PUBLISHED" | "DRAFT";
  featured: boolean;
  lead: string;
  body: JSONContent;
  siteArea: string;
  floorArea: string;
  client: string;
  builder: string;
  photographer: string;
};

export function ProjectEditor({ id, initial }: { id: string | null; initial: ProjectFormValue }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const router = useRouter();
  const toast = useToast();
  const set = <K extends keyof ProjectFormValue>(k: K, val: ProjectFormValue[K]) => setV((p) => ({ ...p, [k]: val }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await saveProject(id, v);
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast(res.error, "error");
      return;
    }
    setErrors({});
    toast(res.message ?? "Saved.");
    if (!id && res.data) router.push(`/admin/projects/${res.data.id}`);
    else router.refresh();
  }

  return (
    <form className="a-form" onSubmit={onSubmit} noValidate>
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
          label="Slug (URL) *"
          value={v.slug}
          error={errors.slug}
          hint={`/projects/${v.slug || "…"}`}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
        />
        <TextInput label="Location *" value={v.location} error={errors.location} onChange={(e) => set("location", e.target.value)} />
        <TextInput label="Year *" type="number" value={v.year} error={errors.year} onChange={(e) => set("year", Number(e.target.value))} />
        <Field label="Type *" error={errors.type}>
          {(fid) => (
            <select id={fid} className="a-input" value={v.type} onChange={(e) => set("type", e.target.value as ProjectFormValue["type"])}>
              {PROJECT_TYPE_ENUM.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="a-field">
          <span className="a-mono">Visibility</span>
          <div className="a-row">
            <Toggle label="Published" checked={v.status === "PUBLISHED"} onChange={(b) => set("status", b ? "PUBLISHED" : "DRAFT")} />
            <Toggle label="Featured on home" checked={v.featured} onChange={(b) => set("featured", b)} />
          </div>
        </div>
      </div>
      <TextArea label="Lead line *" rows={2} value={v.lead} error={errors.lead} hint="One sentence, shown large at the top of the case study." onChange={(e) => set("lead", e.target.value)} />
      <RichEditor label="Story" value={v.body} onChange={(doc) => set("body", doc)} />
      {errors.body && <p className="a-err">{errors.body}</p>}
      <div className="a-form__grid">
        <TextInput label="Client" value={v.client} onChange={(e) => set("client", e.target.value)} />
        <TextInput label="Builder" value={v.builder} onChange={(e) => set("builder", e.target.value)} />
        <TextInput label="Site area" value={v.siteArea} onChange={(e) => set("siteArea", e.target.value)} placeholder="e.g. 2,400 m²" />
        <TextInput label="Floor area" value={v.floorArea} onChange={(e) => set("floorArea", e.target.value)} placeholder="e.g. 248 m²" />
        <TextInput label="Photography" value={v.photographer} onChange={(e) => set("photographer", e.target.value)} />
      </div>
      <div className="a-sticky-actions">
        {id && (
          <a className="a-btn a-btn--ghost" href={`/admin/preview/project/${id}`} target="_blank" rel="noopener noreferrer">
            Preview ↗
          </a>
        )}
        <button type="submit" className="a-btn" disabled={saving}>
          {saving ? "Saving…" : id ? "Save changes" : "Create project"}
        </button>
      </div>
    </form>
  );
}
