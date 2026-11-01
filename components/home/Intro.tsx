import type { StatsSettings } from "@/lib/settings";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Marks } from "@/components/ui/Marks";

export function Intro({ stats, since }: { stats: StatsSettings; since: number }) {
  return (
    <section className="section intro" data-theme="light" id="intro">
      <Marks note={`EST. ${since} · SHEET 00`} />
      <div className="wrap grid">
        <SectionLabel index="00" className="intro__label">The studio</SectionLabel>
        <p className="intro__text" data-reveal="words">
          We create spaces <em>that belong</em> to their landscape, their light and the lives lived within them.
        </p>
        <ul className="intro__stats" data-reveal="stagger">
          {stats.map((s) => (
            <li key={s.label} className="intro__stat">
              <span className="intro__num">
                <span data-count={s.value}>{s.value}</span>
                {s.suffix}
              </span>
              <span className="t-mono">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
