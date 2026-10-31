import sharp from "sharp";
import { authErrorResponse, requireUser } from "@/lib/guard";
import { putPublic, sniffMime } from "@/lib/storage";

export const runtime = "nodejs";
const MAX = 15 * 1024 * 1024;
const FOLDERS = new Set(["projects", "team", "services", "journal", "misc"]);

/**
 * Image upload for the CMS. Images are verified by magic bytes, re-encoded
 * (strips EXIF / embedded payloads), capped at 2560px and stored as WebP.
 */
export async function POST(req: Request) {
  try {
    await requireUser("EDITOR");
  } catch (err) {
    return authErrorResponse(err);
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const folderRaw = String(form?.get("folder") ?? "misc");
  const folder = FOLDERS.has(folderRaw) ? folderRaw : "misc";
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "No file." }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "Images must be under 15 MB." }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniffMime(buf);
  if (!mime || !mime.startsWith("image/")) return Response.json({ error: "Upload a JPG, PNG, WebP or AVIF image." }, { status: 415 });
  try {
    const out = await sharp(buf).rotate().resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    const name = file.name.replace(/\.[a-z0-9]+$/i, "") + ".webp";
    const url = await putPublic(folder, name, out.data, "image/webp");
    return Response.json({ url, width: out.info.width, height: out.info.height });
  } catch (err) {
    console.error("[upload]", err);
    return Response.json({ error: "That image couldn't be processed." }, { status: 422 });
  }
}
