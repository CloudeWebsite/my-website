"use client";

import { useRef, useState } from "react";

export type Uploaded = { url: string; width: number; height: number };

export async function uploadImage(file: File, folder: string): Promise<Uploaded> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const json = (await res.json()) as Partial<Uploaded> & { error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed.");
  return { url: json.url, width: json.width ?? 1600, height: json.height ?? 1000 };
}

/** Single image picker that stores a URL (services, team, journal covers). */
export function ImageField({ label, value, onChange, folder }: { label: string; value: string; onChange: (url: string) => void; folder: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="a-field">
      <span className="a-mono">{label}</span>
      <div className="a-imgfield">
        <div className="a-imgfield__thumb">{value ? <img src={value} alt="" /> : <span className="a-mono">No image</span>}</div>
        <div className="a-col">
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => onChange("")}>
              Remove
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            setErr("");
            try {
              onChange((await uploadImage(f, folder)).url);
            } catch (er) {
              setErr((er as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
      {err && <p className="a-err">{err}</p>}
    </div>
  );
}
