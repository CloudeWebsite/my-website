import { createElement } from "react";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { isUniqueViolation, nextEnquiryReference } from "@/lib/reference";
import { getSettings } from "@/lib/settings";
import { putPrivate, sniffMime } from "@/lib/storage";
import { siteUrl } from "@/lib/utils";
import { enquirySchema, validateFiles, MAX_FILES } from "@/lib/validation";
import EnquiryConfirmation from "@/emails/EnquiryConfirmation";
import EnquiryNotification from "@/emails/EnquiryNotification";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const limit = await rateLimit("enquiry", ip, 5, "1 h");
  if (!limit.success) return Response.json({ error: "Too many enquiries from this connection. Please try again later or email us directly." }, { status: 429 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Invalid submission." }, { status: 400 });
  }

  // Bots: honeypot filled or form completed impossibly fast → pretend success.
  const honeypot = String(form.get("company") ?? "");
  const elapsed = Number(form.get("elapsed") ?? 0);
  if (honeypot.length > 0 || elapsed < 3000) return Response.json({ reference: "ENQ-RECEIVED" }, { status: 200 });

  const raw = Object.fromEntries(["projectType", "location", "ownsLand", "budgetRange", "timeline", "description", "name", "email", "phone", "contactMethod"].map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return Response.json({ error: "Please check the highlighted answers.", fieldErrors }, { status: 422 });
  }
  const settings = await getSettings();
  if (!settings.budgets.includes(parsed.data.budgetRange)) return Response.json({ error: "Please choose a budget range.", fieldErrors: { budgetRange: "Choose one of the listed ranges." } }, { status: 422 });

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0).slice(0, MAX_FILES + 1);
  const fileError = validateFiles(files);
  if (fileError) return Response.json({ error: fileError, fieldErrors: { files: fileError } }, { status: 422 });
  const buffers: Array<{ file: File; buf: Buffer; mime: string }> = [];
  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    const mime = sniffMime(buf);
    if (!mime || mime !== file.type.replace("image/jpg", "image/jpeg")) return Response.json({ error: `${file.name} doesn't look like a valid ${file.type} file.`, fieldErrors: { files: "One of the files couldn't be verified." } }, { status: 422 });
    buffers.push({ file, buf, mime });
  }

  // Create with a unique, sequential reference (retry on concurrent collision).
  let enquiry: { id: string; reference: string } | null = null;
  for (let attempt = 0; attempt < 5 && !enquiry; attempt++) {
    try {
      enquiry = await db.enquiry.create({
        data: { ...parsed.data, email: parsed.data.email.toLowerCase(), reference: await nextEnquiryReference() },
        select: { id: true, reference: true },
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  if (!enquiry) return Response.json({ error: "Please try again in a moment." }, { status: 503 });

  for (const { file, buf, mime } of buffers) {
    const key = await putPrivate(`enquiries/${enquiry.reference}`, file.name, buf, mime);
    await db.enquiryFile.create({ data: { enquiryId: enquiry.id, url: key, filename: file.name.slice(0, 200), size: file.size, mimeType: mime } });
  }

  const { studio } = settings;
  const d = parsed.data;
  const [client, team] = await Promise.all([
    sendEmail({
      to: d.email,
      subject: `${studio.name} — we have your enquiry (${enquiry.reference})`,
      react: createElement(EnquiryConfirmation, { studio: studio.name, regionTag: studio.regionTag, name: d.name, reference: enquiry.reference, projectType: d.projectType, location: d.location }),
      replyTo: process.env.STUDIO_NOTIFY_EMAIL ?? studio.email,
    }),
    sendEmail({
      to: process.env.STUDIO_NOTIFY_EMAIL ?? studio.email,
      subject: `New enquiry ${enquiry.reference} — ${d.projectType}, ${d.location}`,
      replyTo: d.email,
      react: createElement(EnquiryNotification, {
        studio: studio.name,
        regionTag: studio.regionTag,
        reference: enquiry.reference,
        adminUrl: siteUrl(`/admin/enquiries?open=${enquiry.id}`),
        description: d.description,
        fileCount: buffers.length,
        rows: [
          ["Name", d.name],
          ["Email", d.email],
          ["Phone", d.phone],
          ["Prefers", d.contactMethod],
          ["Project", d.projectType],
          ["Site", d.location],
          ["Owns land", d.ownsLand],
          ["Budget", d.budgetRange],
          ["Start", d.timeline],
        ],
      }),
    }),
  ]);
  if (!client.ok) console.error("[enquiry] confirmation email failed:", client.error);
  if (!team.ok) console.error("[enquiry] notification email failed:", team.error);

  revalidatePath("/admin");
  return Response.json({ reference: enquiry.reference }, { status: 201 });
}
