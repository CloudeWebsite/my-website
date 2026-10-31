import { auth } from "@/auth";
import { PageTitle } from "@/components/admin/PageTitle";
import { PostEditor } from "@/components/admin/PostEditor";

export const metadata = { title: "New entry" };

export default async function NewPost() {
  const session = await auth();
  return (
    <>
      <PageTitle index="06 / Journal / New" title="New entry" />
      <PostEditor id={null} isAdmin={session?.user.role === "ADMIN"} initial={{ title: "", slug: "", excerpt: "", body: { type: "doc", content: [{ type: "paragraph" }] }, coverUrl: "", category: "Studio", status: "DRAFT", publishedAt: "" }} />
    </>
  );
}
