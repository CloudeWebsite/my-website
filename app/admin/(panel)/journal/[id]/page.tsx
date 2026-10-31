import type { JSONContent } from "@tiptap/react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { PageTitle } from "@/components/admin/PageTitle";
import { PostEditor } from "@/components/admin/PostEditor";
import { db } from "@/lib/db";

export const metadata = { title: "Edit entry" };

function local(d: Date | null): string {
  if (!d) return "";
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, p] = await Promise.all([auth(), db.post.findUnique({ where: { id } })]);
  if (!p) notFound();
  return (
    <>
      <PageTitle index="06 / Journal" title={p.title} />
      <PostEditor id={p.id} isAdmin={session?.user.role === "ADMIN"} initial={{ title: p.title, slug: p.slug, excerpt: p.excerpt, body: p.body as JSONContent, coverUrl: p.coverUrl ?? "", category: p.category, status: p.status, publishedAt: local(p.publishedAt) }} />
    </>
  );
}
