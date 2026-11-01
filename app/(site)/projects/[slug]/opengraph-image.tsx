import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getProject } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const alt = "Project";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function imageData(url: string): Promise<string | null> {
  try {
    if (url.startsWith("/")) {
      const buf = await readFile(path.join(process.cwd(), "public", url));
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    }
    return url;
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, { studio }] = await Promise.all([getProject(slug), getSettings()]);
  const src = project?.coverImage ? await imageData(project.coverImage.url) : null;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0E0E0D", color: "#F2F0EB", fontFamily: "serif" }}>
        {src && <img src={src} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(14,14,13,0.95), rgba(14,14,13,0.1) 60%)" }} />
        <div style={{ position: "absolute", left: 60, right: 60, bottom: 56, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 18, letterSpacing: 4, textTransform: "uppercase", fontFamily: "monospace", color: "#C98A4B" }}>
            {`■ ${studio.name} — ${project?.year ?? ""}`}
          </div>
          <div style={{ fontSize: 104, lineHeight: 1, marginTop: 16, letterSpacing: -2 }}>{project?.title ?? "Project"}</div>
          <div style={{ fontSize: 22, marginTop: 18, fontFamily: "monospace", letterSpacing: 3, textTransform: "uppercase", opacity: 0.75 }}>{project?.location ?? ""}</div>
        </div>
      </div>
    ),
    size,
  );
}
