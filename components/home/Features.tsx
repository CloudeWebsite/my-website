import { SectionLabel } from "@/components/ui/SectionLabel";

const icons = {
  sun: (
    <svg viewBox="0 0 64 64" fill="none" className="draw-icon" aria-hidden="true">
      <path pathLength={1} d="M6 46h52" />
      <path pathLength={1} d="M10 46C16 22 48 22 54 46" strokeDasharray="0.02 0.02" />
      <circle pathLength={1} cx="40" cy="27" r="5" />
      <path pathLength={1} d="M40 16v-4M51 27h4M47.8 19.2l2.8-2.8M32.2 19.2l-2.8-2.8" />
      <path pathLength={1} d="M20 46V36h12v10" />
    </svg>
  ),
  contour: (
    <svg viewBox="0 0 64 64" fill="none" className="draw-icon" aria-hidden="true">
      <path pathLength={1} d="M8 40c8-10 18-14 28-10s16 2 20-4" />
      <path pathLength={1} d="M8 50c10-8 20-10 30-6s14 2 18-2" />
      <path pathLength={1} d="M8 30c8-8 16-12 26-8s14 0 18-6" />
      <path pathLength={1} d="M14 20c6-6 14-8 22-5" />
      <path pathLength={1} d="M30 38l6-6 6 6v8H30z" />
    </svg>
  ),
  compass: (
    <svg viewBox="0 0 64 64" fill="none" className="draw-icon" aria-hidden="true">
      <circle pathLength={1} cx="32" cy="32" r="22" />
      <circle pathLength={1} cx="32" cy="32" r="2" />
      <path pathLength={1} d="M32 6v6M32 52v6M6 32h6M52 32h6" />
      <path pathLength={1} d="M32 14l5 18-5 18-5-18z" />
      <path pathLength={1} d="M22 22l20 20M42 22L22 42" strokeDasharray="0.03 0.03" />
    </svg>
  ),
};

const FEATURES = [
  { n: "01", icon: icons.sun, title: "Site-led design", body: "Orientation, light, wind and view decide the form — the house is drawn from the ground up, never imported." },
  { n: "02", icon: icons.contour, title: "Material honesty", body: "Stone, timber and metal chosen to weather well, so the building grows more beautiful as it ages." },
  { n: "03", icon: icons.compass, title: "Considered detailing", body: "The junctions you touch every day — a handrail, a threshold, a window reveal — resolved with care." },
];

export function Features() {
  return (
    <section className="section features" data-theme="light" id="features">
      <div className="wrap">
        <div className="features__head grid">
          <SectionLabel index="01" className="features__label">Philosophy</SectionLabel>
          <h2 className="t-h2 features__title" data-reveal="lines">
            Three principles, <em>applied to every line</em>
          </h2>
        </div>
        <ol className="features__cols">
          {FEATURES.map((f) => (
            <li key={f.n} className="feature">
              <span className="t-mono feature__n">({f.n})</span>
              <span className="feature__icon">{f.icon}</span>
              <h3 className="t-h3 feature__title">{f.title}</h3>
              <p className="feature__body">{f.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
