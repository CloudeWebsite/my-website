import type { EnquiryStatus, Prisma } from "@prisma/client";
import { Suspense } from "react";
import { auth } from "@/auth";
import { EnquiriesBoard, type EnquiryRow } from "@/components/admin/EnquiriesBoard";
import { PageTitle } from "@/components/admin/PageTitle";
import { db } from "@/lib/db";
import { ENQUIRY_STATUSES } from "@/lib/validation";

export const metadata = { title: "Enquiries" };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; open?: string }> }) {
  const { status, q } = await searchParams;
  const session = await auth();
  const where: Prisma.EnquiryWhereInput = {};
  if (status && (ENQUIRY_STATUSES as readonly string[]).includes(status)) where.status = status as EnquiryStatus;
  if (q?.trim()) {
    const term = q.trim().slice(0, 100);
    where.OR = [{ name: { contains: term, mode: "insensitive" } }, { email: { contains: term, mode: "insensitive" } }, { reference: { contains: term, mode: "insensitive" } }, { location: { contains: term, mode: "insensitive" } }];
  }
  const [rows, grouped] = await Promise.all([
    db.enquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 500, include: { files: { select: { id: true, filename: true, size: true } } } }),
    db.enquiry.groupBy({ by: ["status"], _count: true }),
  ]);
  const counts: Record<string, number> = { ALL: grouped.reduce((a, g) => a + g._count, 0) };
  for (const g of grouped) counts[g.status] = g._count;
  const data: EnquiryRow[] = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: undefined }) as unknown as EnquiryRow);
  return (
    <>
      <PageTitle index="01 / Enquiries" title="Enquiries" />
      <Suspense>
        <EnquiriesBoard rows={data} counts={counts} isAdmin={session?.user.role === "ADMIN"} />
      </Suspense>
    </>
  );
}
