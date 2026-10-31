import Link from "next/link";
import { PlanSvg } from "@/components/hero/PlanSvg";

export function NotFoundView() {
  return (
    <section className="section nf" data-theme="dark">
      <div className="nf__plan" aria-hidden="true">
        <PlanSvg palette={{ paper: "transparent", ink: "#F2F0EB", soft: "rgba(242,240,235,0.6)", faint: "rgba(242,240,235,0.08)", accent: "#C98A4B", fill: "rgba(242,240,235,0.08)" }} />
      </div>
      <div className="wrap" style={{ position: "relative" }}>
        <p className="t-mono" style={{ color: "var(--timber)", marginBottom: 24 }}>■ 404 — Sheet missing from set</p>
        <h1 className="t-h1" style={{ maxWidth: "12ch" }}>
          This room hasn&apos;t been <em>drawn yet.</em>
        </h1>
        <p style={{ marginTop: 28, maxWidth: "46ch", color: "rgba(242,240,235,0.7)" }}>The page you were looking for isn&apos;t in this set of drawings. It may have moved, or never existed.</p>
        <div style={{ display: "flex", gap: 24, marginTop: 40, flexWrap: "wrap" }}>
          <Link href="/" className="btn btn--solid" data-transition-title="Home">
            Return to the entrance →
          </Link>
          <Link href="/projects" className="btn btn--line" data-transition-title="Projects">
            Browse projects
          </Link>
        </div>
      </div>
    </section>
  );
}
