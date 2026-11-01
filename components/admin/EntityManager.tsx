"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { ActionResult } from "@/app/admin/actions";
import { cx } from "@/lib/utils";
import { useConfirm } from "./Confirm";
import { Field, TextArea, TextInput, Toggle } from "./fields";
import { ImageField } from "./ImageUpload";
import { SortableList } from "./Sortable";
import { useToast } from "./Toast";

export type FieldDef =
  | { name: string; label: string; type: "text" | "email" | "password"; hint?: string; required?: boolean }
  | { name: string; label: string; type: "textarea"; rows?: number; hint?: string; required?: boolean }
  | { name: string; label: string; type: "list"; hint?: string }
  | { name: string; label: string; type: "image"; folder: string }
  | { name: string; label: string; type: "checkbox" }
  | { name: string; label: string; type: "select"; options: Array<{ value: string; label: string }> };

type Value = string | boolean | string[];
type Row = { id: string } & Record<string, Value | null>;

/**
 * Generic list editor used for services, team, testimonials and users:
 * inline expand-to-edit, drag-to-reorder, optimistic updates, confirm on delete.
 */
export function EntityManager({
  rows,
  fields,
  titleField,
  subtitleField,
  save,
  remove,
  reorder,
  canDelete,
  noun,
}: {
  rows: Row[];
  fields: FieldDef[];
  titleField: string;
  /** Row key holding a pre-computed subtitle (functions can't cross the server → client boundary). */
  subtitleField?: string;
  save: (id: string | null, data: Record<string, Value>) => Promise<ActionResult<{ id: string }>>;
  remove?: (id: string) => Promise<ActionResult>;
  reorder?: (ids: string[]) => Promise<ActionResult>;
  canDelete: boolean;
  noun: string;
}) {
  const [items, setItems] = useState(rows);
  const [openId, setOpenId] = useState<string | null>(null);
  const [, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  useEffect(() => setItems(rows), [rows]);

  const blank = (): Row => ({ id: "__new", ...Object.fromEntries(fields.map((f) => [f.name, f.type === "checkbox" ? false : f.type === "list" ? [] : f.type === "select" ? f.options[0]?.value ?? "" : ""])) });

  const header = (r: Row, handle?: React.ReactNode) => (
    <div className="a-item">
      {handle}
      <div className="a-item__main">
        <button type="button" className="a-item__title" onClick={() => setOpenId(openId === r.id ? null : r.id)} aria-expanded={openId === r.id}>
          {String(r[titleField] ?? "Untitled")}
        </button>
        {subtitleField && <span className="a-mono">{String(r[subtitleField] ?? "")}</span>}
      </div>
      <div className="a-item__actions">
        <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
          {openId === r.id ? "Close" : "Edit"}
        </button>
        {canDelete && remove && (
          <button
            type="button"
            className="a-btn a-btn--ghost a-btn--sm a-danger-text"
            onClick={async () => {
              if (!(await confirm({ title: `Delete this ${noun}?`, body: String(r[titleField] ?? ""), confirm: "Delete", danger: true }))) return;
              setItems((xs) => xs.filter((x) => x.id !== r.id));
              const res = await remove(r.id);
              toast(res.ok ? (res.message ?? "Deleted.") : res.error, res.ok ? "ok" : "error");
              router.refresh();
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="a-row a-row--end" style={{ marginBottom: 16 }}>
        <button type="button" className="a-btn" onClick={() => setOpenId("__new")} disabled={openId === "__new"}>
          + New {noun}
        </button>
      </div>
      {openId === "__new" && (
        <div className="a-panel">
          <EntityForm
            row={blank()}
            fields={fields}
            onCancel={() => setOpenId(null)}
            onSave={async (data) => {
              const res = await save(null, data);
              if (res.ok) {
                toast(res.message ?? "Created.");
                setOpenId(null);
                router.refresh();
              }
              return res;
            }}
          />
        </div>
      )}
      {items.length === 0 && openId !== "__new" && <p className="a-empty">Nothing here yet.</p>}
      {reorder ? (
        <SortableList
          items={items}
          className="a-list"
          onReorder={(next) => {
            setItems(next);
            start(async () => {
              const res = await reorder(next.map((x) => x.id));
              if (!res.ok) toast(res.error, "error");
              router.refresh();
            });
          }}
          render={(r, handle) => (
            <>
              {header(r, handle)}
              {openId === r.id && <Inline r={r} fields={fields} save={save} close={() => setOpenId(null)} />}
            </>
          )}
        />
      ) : (
        <ul className="a-list">
          {items.map((r) => (
            <li key={r.id}>
              {header(r)}
              {openId === r.id && <Inline r={r} fields={fields} save={save} close={() => setOpenId(null)} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Inline({ r, fields, save, close }: { r: Row; fields: FieldDef[]; save: (id: string | null, data: Record<string, Value>) => Promise<ActionResult<{ id: string }>>; close: () => void }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <div className="a-panel">
      <EntityForm
        row={r}
        fields={fields}
        onCancel={close}
        onSave={async (data) => {
          const res = await save(r.id, data);
          if (res.ok) {
            toast(res.message ?? "Saved.");
            router.refresh();
          }
          return res;
        }}
      />
    </div>
  );
}

function EntityForm({ row, fields, onSave, onCancel }: { row: Row; fields: FieldDef[]; onSave: (data: Record<string, Value>) => Promise<ActionResult<{ id: string }>>; onCancel: () => void }) {
  const [v, setV] = useState<Record<string, Value>>(() => Object.fromEntries(fields.map((f) => [f.name, (row[f.name] ?? (f.type === "checkbox" ? false : f.type === "list" ? [] : "")) as Value])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const set = (k: string, val: Value) => setV((p) => ({ ...p, [k]: val }));
  return (
    <form
      className="a-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const res = await onSave(v);
        setBusy(false);
        if (!res.ok) {
          setErrors(res.fieldErrors ?? {});
          toast(res.error, "error");
        } else setErrors({});
      }}
    >
      <div className="a-form__grid">
        {fields.map((f) => {
          const err = errors[f.name];
          const wide = f.type === "textarea" || f.type === "list" || f.type === "image";
          const node = (() => {
            switch (f.type) {
              case "text":
              case "email":
              case "password":
                return <TextInput label={`${f.label}${f.required ? " *" : ""}`} type={f.type} value={String(v[f.name] ?? "")} error={err} hint={f.hint} onChange={(e) => set(f.name, e.target.value)} autoComplete={f.type === "password" ? "new-password" : undefined} />;
              case "textarea":
                return <TextArea label={`${f.label}${f.required ? " *" : ""}`} rows={f.rows ?? 4} value={String(v[f.name] ?? "")} error={err} hint={f.hint} onChange={(e) => set(f.name, e.target.value)} />;
              case "list":
                return <TextArea label={f.label} rows={4} value={(v[f.name] as string[]).join("\n")} error={err} hint={f.hint ?? "One per line."} onChange={(e) => set(f.name, e.target.value.split("\n").map((s) => s.trimStart()).filter((s, i, a) => s !== "" || i === a.length - 1))} />;
              case "image":
                return <ImageField label={f.label} value={String(v[f.name] ?? "")} folder={f.folder} onChange={(url) => set(f.name, url)} />;
              case "checkbox":
                return (
                  <div className="a-field">
                    <span className="a-mono">&nbsp;</span>
                    <Toggle label={f.label} checked={Boolean(v[f.name])} onChange={(b) => set(f.name, b)} />
                  </div>
                );
              case "select":
                return (
                  <Field label={f.label} error={err}>
                    {(id) => (
                      <select id={id} className="a-input" value={String(v[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)}>
                        {f.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                );
            }
          })();
          return (
            <div key={f.name} className={cx(wide && "a-span2")}>
              {node}
            </div>
          );
        })}
      </div>
      <div className="a-row a-row--end">
        <button type="button" className="a-btn a-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="a-btn" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
