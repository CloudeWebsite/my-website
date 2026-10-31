import type { Metadata } from "next";
import { RenderStudio } from "@/components/hero/RenderStudio";

export const metadata: Metadata = { title: "Render", robots: { index: false, follow: false } };

/** Internal page used by scripts/render-stills.mjs to produce project imagery. */
export default function RenderPage() {
  return <RenderStudio />;
}
