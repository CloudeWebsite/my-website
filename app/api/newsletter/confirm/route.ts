import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/utils";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return NextResponse.redirect(siteUrl("/newsletter?status=invalid"));
  const sub = await db.subscriber.findUnique({ where: { token } });
  if (!sub) return NextResponse.redirect(siteUrl("/newsletter?status=invalid"));
  if (!sub.confirmed) await db.subscriber.update({ where: { id: sub.id }, data: { confirmed: true, confirmedAt: new Date() } });
  return NextResponse.redirect(siteUrl("/newsletter?status=confirmed"));
}
