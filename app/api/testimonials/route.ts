import { getTestimonials } from "@/lib/queries";

export const revalidate = 300;
export async function GET() {
  return Response.json(await getTestimonials());
}
