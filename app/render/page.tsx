import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderStudio } from "@/components/hero/RenderStudio";

export const metadata: Metadata = { title: "Render", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Internal page used by scripts/render-stills.mjs to produce project imagery. */
export default function RenderPage() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_RENDER_ROUTE !== "1") notFound();
  return <RenderStudio />;
}
