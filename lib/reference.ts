import { Prisma } from "@prisma/client";
import { db } from "./db";

/** Generate the next enquiry reference for the year, e.g. ENQ-2026-0042. */
export async function nextEnquiryReference(year = new Date().getFullYear()): Promise<string> {
  const prefix = `ENQ-${year}-`;
  const last = await db.enquiry.findFirst({ where: { reference: { startsWith: prefix } }, orderBy: { reference: "desc" }, select: { reference: true } });
  const n = last ? Number(last.reference.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}
