import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Two drivers:
 *  - local:    public files → /public/uploads, private files → /storage (gitignored)
 *  - supabase: Supabase Storage REST API (public + private bucket)
 */
const driver = (process.env.STORAGE_DRIVER ?? "local") as "local" | "supabase";
const SUPA_URL = process.env.SUPABASE_URL?.replace(/\/$/, "") ?? "";
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const PUBLIC_BUCKET = process.env.SUPABASE_PUBLIC_BUCKET ?? "media";
const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET ?? "enquiries";

const PUBLIC_DIR = path.join(process.cwd(), "public", "uploads");
const PRIVATE_DIR = path.join(process.cwd(), "storage");

function safeName(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 6);
  const base = path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}-${base || "file"}${ext}`;
}

async function supabaseUpload(bucket: string, key: string, data: Buffer, contentType: string): Promise<void> {
  const res = await fetch(`${SUPA_URL}/storage/v1/object/${bucket}/${key}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": contentType, "x-upsert": "false", "cache-control": "31536000" },
    body: new Uint8Array(data),
  });
  if (!res.ok) throw new Error(`Supabase upload failed: ${res.status} ${await res.text()}`);
}

/** Store a publicly served image. Returns its URL. */
export async function putPublic(folder: string, filename: string, data: Buffer, contentType: string): Promise<string> {
  const key = `${folder}/${safeName(filename)}`;
  if (driver === "supabase") {
    await supabaseUpload(PUBLIC_BUCKET, key, data, contentType);
    return `${SUPA_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/${key}`;
  }
  const target = path.join(PUBLIC_DIR, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
  return `/uploads/${key}`;
}

/** Store a private file (enquiry attachment). Returns an opaque storage key. */
export async function putPrivate(folder: string, filename: string, data: Buffer, contentType: string): Promise<string> {
  const key = `${folder}/${safeName(filename)}`;
  if (driver === "supabase") {
    await supabaseUpload(PRIVATE_BUCKET, key, data, contentType);
    return `supabase:${key}`;
  }
  const target = path.join(PRIVATE_DIR, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
  return `local:${key}`;
}

export async function readPrivate(storageKey: string): Promise<Buffer> {
  const [kind, ...rest] = storageKey.split(":");
  const key = rest.join(":");
  if (key.includes("..")) throw new Error("Invalid key");
  if (kind === "supabase") {
    const res = await fetch(`${SUPA_URL}/storage/v1/object/${PRIVATE_BUCKET}/${key}`, { headers: { Authorization: `Bearer ${SUPA_KEY}` } });
    if (!res.ok) throw new Error(`Supabase download failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(path.join(PRIVATE_DIR, key));
}

/** Best-effort removal of a public file we own. */
export async function removePublic(url: string): Promise<void> {
  try {
    if (url.startsWith("/uploads/")) {
      const target = path.join(PUBLIC_DIR, url.replace(/^\/uploads\//, ""));
      if (!target.startsWith(PUBLIC_DIR)) return;
      await unlink(target);
    } else if (driver === "supabase" && url.startsWith(`${SUPA_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/`)) {
      const key = url.slice(`${SUPA_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/`.length);
      await fetch(`${SUPA_URL}/storage/v1/object/${PUBLIC_BUCKET}/${key}`, { method: "DELETE", headers: { Authorization: `Bearer ${SUPA_KEY}` } });
    }
  } catch {
    /* file already gone */
  }
}

/** Sniff magic bytes so a renamed executable can't pass as a JPG. */
export function sniffMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  if (buf.subarray(4, 12).toString("ascii").startsWith("ftypavif")) return "image/avif";
  return null;
}
