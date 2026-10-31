import type { EnquiryStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { authErrorResponse, requireUser } from "@/lib/guard";
import { ENQUIRY_STATUSES } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    await requireUser("EDITOR");
  } catch (err) {
    return authErrorResponse(err);
  }
  const status = new URL(req.url).searchParams.get("status");
  const where = status && (ENQUIRY_STATUSES as readonly string[]).includes(status) ? { status: status as EnquiryStatus } : {};
  const rows = await db.enquiry.findMany({ where, orderBy: { createdAt: "desc" }, include: { _count: { select: { files: true } } } });
  const csv = toCsv([
    ["Reference", "Created", "Status", "Name", "Email", "Phone", "Contact method", "Project type", "Location", "Owns land", "Budget", "Timeline", "Description", "Notes", "Files"],
    ...rows.map((r) => [r.reference, r.createdAt.toISOString(), r.status, r.name, r.email, r.phone, r.contactMethod, r.projectType, r.location, r.ownsLand, r.budgetRange, r.timeline, r.description, r.notes, r._count.files]),
  ]);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${csv}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="enquiries-${stamp}.csv"`, "Cache-Control": "no-store" },
  });
}
