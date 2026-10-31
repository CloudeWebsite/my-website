import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { authErrorResponse, requireUser } from "@/lib/guard";
import { enquiryPatchSchema } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser("EDITOR");
  } catch (err) {
    return authErrorResponse(err);
  }
  const { id } = await params;
  const body: unknown = await req.json().catch(() => null);
  const parsed = enquiryPatchSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid update." }, { status: 422 });
  try {
    const updated = await db.enquiry.update({ where: { id }, data: parsed.data, select: { id: true, status: true, notes: true, updatedAt: true } });
    revalidatePath("/admin");
    revalidatePath("/admin/enquiries");
    return Response.json(updated);
  } catch {
    return Response.json({ error: "Enquiry not found." }, { status: 404 });
  }
}
