import { db } from "@/lib/db";
import { authErrorResponse, requireUser } from "@/lib/guard";
import { readPrivate } from "@/lib/storage";

/** Streams a private enquiry attachment to signed-in staff only. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser("EDITOR");
  } catch (err) {
    return authErrorResponse(err);
  }
  const { id } = await params;
  const file = await db.enquiryFile.findUnique({ where: { id } });
  if (!file) return Response.json({ error: "Not found" }, { status: 404 });
  try {
    const buf = await readPrivate(file.url);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${file.filename.replace(/[^\w.\- ]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "File unavailable" }, { status: 410 });
  }
}
