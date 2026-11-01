import { getPosts } from "@/lib/queries";

export const revalidate = 300;
export async function GET(req: Request) {
  const take = Math.min(50, Math.max(1, Number(new URL(req.url).searchParams.get("limit") ?? 20) || 20));
  return Response.json(await getPosts(take));
}
