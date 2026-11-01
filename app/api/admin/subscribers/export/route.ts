import { db } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { authErrorResponse, requireUser } from "@/lib/guard";

export async function GET() {
  try {
    await requireUser("EDITOR");
  } catch (err) {
    return authErrorResponse(err);
  }
  const subs = await db.subscriber.findMany({ where: { confirmed: true }, orderBy: { createdAt: "asc" } });
  const csv = toCsv([["Email", "Signed up", "Confirmed"], ...subs.map((s) => [s.email, s.createdAt.toISOString(), s.confirmedAt?.toISOString() ?? ""])]);
  return new Response(`﻿${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="subscribers.csv"', "Cache-Control": "no-store" } });
}
