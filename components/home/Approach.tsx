"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion, registerGsap } from "@/lib/motion";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const STAGES = [
  { n: "01", title: "Briefing", body: "We walk the site with you, listen to how you live, and agree the brief, budget and programme in writing.", time: "2–3 weeks" },
  { n: "02", title: "Concept", body: "Sun studies, massing models and two or three distinct ideas — tested on site until one feels inevitable.", time: "4–6 weeks" },
  { n: "03", title: "Developed Design", body: "Plans, sections and materials resolved in detail; structure and services coordinated with engineers.", time: "6–8 weeks" },
  { n: "04", title: "Documentation & Consent", body: "A complete drawing set for approvals and tender, with specifications a builder can price without guesswork.", time: "8–12 weeks" },
  { n: "05", title: "Construction", body: "Regular site visits, quality reviews and contract administration through to handover — and the first winter after.", time: "12–18 months" },
];

export function Approach({ index = "04" }: { index?: string }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const line = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const gsap = registerGsap();
    const mm = gsap.matchMedia();
    if (prefersReducedMotion()) return;
    mm.add("(min-width: 900px)", () => {
      const t = track.current;
      const s = section.current;
      if (!t || !s) return;
      const distance = () => t.scrollWidth - window.innerWidth + 64;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: s, start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      tl.to(t, { x: () => -distance(), ease: "none" }, 0);
      tl.fromTo(line.current, { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0);
      return () => tl.kill();
    });
    mm.add("(max-width: 899px)", () => {
      if (!line.current) return;
      gsap.fromTo(line.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: track.current, start: "top 70%", end: "bottom 60%", scrub: true } });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} className="section approach" data-theme="dark" id="approach">
      <div className="wrap approach__head">
        <SectionLabel index={index}>Approach</SectionLabel>
        <h2 className="t-h2" data-reveal="lines">
          A clear process, <em>five quiet steps</em>
        </h2>
      </div>
      <div className="approach__viewport">
        <span ref={line} className="approach__line" aria-hidden="true" />
        <ol ref={track} className="approach__track">
          {STAGES.map((s) => (
            <li key={s.n} className="stage">
              <span className="stage__dot" aria-hidden="true" />
              <span className="stage__n t-mono">{s.n}</span>
              <h3 className="t-h3 stage__title">{s.title}</h3>
              <p className="stage__body">{s.body}</p>
              <p className="t-mono stage__time">Typically {s.time}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
