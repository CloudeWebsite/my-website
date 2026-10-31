"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { HeroSettings } from "@/lib/settings";
import { getLenis, prefersReducedMotion, registerGsap, splitWords } from "@/lib/motion";
import { cx, parseEmphasis } from "@/lib/utils";
import { FrameSequence } from "./frames";
import { PlanSvg } from "./PlanSvg";

type Driver = { setStage: (s: number, immediate?: boolean) => void; start: () => void; stop: () => void; resize: (w: number, h: number) => void; dispose: () => void };

const SHEETS = ["A-101 · Ground floor plan · 1:100", "A-102 · Furnished layout · 1:100", "A-301 · Axonometric cut · NTS", "A-501 · Perspective · Dusk"];
const FRAMES = Number(process.env.NEXT_PUBLIC_HERO_FRAMES ?? 0);

function Emph({ text }: { text: string }) {
  return (
    <>
      {parseEmphasis(text).map((r, i) => (r.em ? <em key={i}>{r.text}</em> : <span key={i}>{r.text}</span>))}
    </>
  );
}

export function Hero({ hero }: { hero: HeroSettings }) {
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const fills = useRef<Array<HTMLSpanElement | null>>([]);
  const headlines = useRef<Array<HTMLElement | null>>([]);
  const driver = useRef<Driver | null>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<"pending" | "3d" | "frames" | "static">("pending");
  const activeRef = useRef(0);

  // ── create the renderer (3D, frame sequence or static fallback) ──
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let disposed = false;
    let d: Driver | null = null;
    const boot = async () => {
      if (FRAMES > 0) {
        const seq = new FrameSequence(el, FRAMES);
        d = { setStage: (s) => seq.setStage(s), start: () => seq.start(), stop: () => seq.stop(), resize: (w, h) => seq.resize(w, h), dispose: () => seq.dispose() };
        setMode("frames");
      } else {
        const { HouseScene, webglAvailable } = await import("./scene");
        if (disposed) return;
        if (!webglAvailable()) {
          setMode("static");
          return;
        }
        const small = window.innerWidth < 768 || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 4;
        const scene = new HouseScene(el, { quality: small ? "low" : "high" });
        const startIntro = () => scene.playIntro(prefersReducedMotion() ? 10 : 2600);
        if (window.__preloaderDone) startIntro();
        else window.addEventListener("preloader:done", startIntro, { once: true });
        const onMove = (e: PointerEvent) => scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
        window.addEventListener("pointermove", onMove, { passive: true });
        d = {
          setStage: (s, immediate) => scene.setStage(s, immediate),
          start: () => scene.start(),
          stop: () => scene.stop(),
          resize: (w, h) => scene.resize(w, h),
          dispose: () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("preloader:done", startIntro);
            scene.dispose();
          },
        };
        setMode("3d");
      }
      driver.current = d;
      const r = el.getBoundingClientRect();
      d.resize(r.width, r.height);
      d.start();
    };
    void boot();

    const ro = new ResizeObserver(([entry]) => driver.current?.resize(entry.contentRect.width, entry.contentRect.height));
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? driver.current?.start() : driver.current?.stop()), { threshold: 0 });
    if (section.current) io.observe(section.current);
    return () => {
      disposed = true;
      ro.disconnect();
      io.disconnect();
      d?.dispose();
      driver.current = null;
    };
  }, []);

  // ── headline word masks + intro ──
  useEffect(() => {
    const gsap = registerGsap();
    headlines.current.forEach((h, i) => {
      if (!h) return;
      const words = splitWords(h);
      gsap.set(words, { yPercent: i === 0 ? 110 : 110 });
    });
    const first = headlines.current[0];
    const intro = () => {
      if (!first) return;
      gsap.to(first.querySelectorAll(".w-in"), { yPercent: 0, duration: 1.2, stagger: 0.05, ease: "power3.out", delay: 0.15 });
      gsap.from(content.current?.querySelectorAll("[data-hero-in]") ?? [], { opacity: 0, y: 16, duration: 1, stagger: 0.08, delay: 0.5 });
    };
    if (window.__preloaderDone) intro();
    else window.addEventListener("preloader:done", intro, { once: true });
    return () => window.removeEventListener("preloader:done", intro);
  }, []);

  const swapTo = (next: number) => {
    const prev = activeRef.current;
    if (next === prev) return;
    activeRef.current = next;
    setActive(next);
    const gsap = registerGsap();
    const out = headlines.current[prev]?.querySelectorAll(".w-in");
    const inn = headlines.current[next]?.querySelectorAll(".w-in");
    const down = next > prev;
    if (out) gsap.to(out, { yPercent: down ? -110 : 110, duration: 0.6, stagger: 0.02, ease: "power2.in", overwrite: true });
    if (inn) gsap.fromTo(inn, { yPercent: down ? 110 : -110 }, { yPercent: 0, duration: 0.9, stagger: 0.04, ease: "power3.out", delay: 0.25, overwrite: true });
  };

  // ── scroll pin + scrub ──
  useEffect(() => {
    const gsap = registerGsap();
    const reduced = prefersReducedMotion();
    if (reduced || !pin.current || !section.current) return;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: mobile ? "+=150%" : "+=300%",
          pin: pin.current,
          scrub: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            const s = Math.min(1, p / 0.86) * 3;
            driver.current?.setStage(s);
            const t = (s * 4) / 3;
            fills.current.forEach((f, i) => f && (f.style.transform = `scaleX(${Math.min(1, Math.max(0, t - i))})`));
            swapTo(Math.min(3, Math.floor(Math.min(t, 3.999))));
          },
        },
      });
      trigger.current = tl.scrollTrigger ?? null;
      tl.to({}, { duration: 0.86 });
      tl.to(frame.current, { clipPath: "inset(7% 5% 9% 5%)", ease: "power2.inOut", duration: 0.14 }, 0.86);
      tl.to([content.current, ".hero__bottom", ".hero__marks"], { opacity: 0, y: -30, ease: "power2.in", duration: 0.08 }, 0.86);
      tl.fromTo(".hero__paper", { scaleY: 0 }, { scaleY: 1, ease: "power2.inOut", duration: 0.12 }, 0.88);
    }, section);
    return () => {
      ctx.revert();
      trigger.current = null;
    };
  }, []);

  const goToStage = (i: number) => {
    const st = trigger.current;
    if (!st) {
      driver.current?.setStage(i, prefersReducedMotion());
      fills.current.forEach((f, j) => f && (f.style.transform = `scaleX(${j <= i ? 1 : 0})`));
      swapTo(i);
      return;
    }
    const y = st.start + ((i / 3) * 0.86 + (i === 3 ? 0 : 0.005)) * (st.end - st.start);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.6 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section ref={section} className="hero" data-theme="dark" id="top" aria-label="Introduction">
      <div ref={pin} className="hero__pin">
        <div className="hero__paper" aria-hidden="true" />
        <div ref={frame} className="hero__frame">
          <canvas ref={canvas} className={cx("hero__canvas", mode !== "pending" && "is-ready")} aria-hidden="true" />
          {mode === "static" && (
            <div className="hero__static">
              <PlanSvg className="hero__static-plan" />
            </div>
          )}
          <div className="hero__vignette" aria-hidden="true" />
          <div className="hero__marks" aria-hidden="true">
            <span className="reg reg--tl">+</span>
            <span className="reg reg--tr">+</span>
            <span className="reg reg--bl">+</span>
            <span className="reg reg--br">+</span>
            <span className="hero__sheet t-mono">
              {SHEETS.map((s, i) => (
                <span key={s} className={cx(i === active && "is-on")}>
                  {s}
                </span>
              ))}
            </span>
          </div>
        </div>

        <div ref={content} className="hero__content wrap">
          <div className="hero__labels t-mono" data-hero-in>
            {hero.stages.map((s, i) => (
              <span key={s.label} className={cx(i === active && "is-on")}>
                ■ {s.label}
              </span>
            ))}
          </div>
          <div className="hero__heads">
            {hero.stages.map((s, i) =>
              i === 0 ? (
                <h1 key={i} ref={(el) => void (headlines.current[i] = el)} className="hero__h">
                  <Emph text={s.headline} />
                </h1>
              ) : (
                <p key={i} ref={(el) => void (headlines.current[i] = el)} className="hero__h" aria-hidden="true">
                  <Emph text={s.headline} />
                </p>
              ),
            )}
          </div>
          <div className="hero__bodies" data-hero-in>
            {hero.stages.map((s, i) => (
              <p key={i} className={cx("hero__body", i === active && "is-on")} aria-hidden={i !== active}>
                {s.body}
              </p>
            ))}
          </div>
          <div className="hero__ctas" data-hero-in>
            <button type="button" className="btn btn--solid" data-enquire>
              Enquire about a project <span aria-hidden="true">→</span>
            </button>
            <a href="/projects" className="link-u t-mono hero__work" data-transition-title="Projects">
              View our work
            </a>
          </div>
        </div>

        <div className="hero__bottom wrap" data-hero-in>
          <div className="hero__tabs" role="tablist" aria-label="Design stages">
            {hero.stages.map((s, i) => (
              <button key={s.tab} type="button" role="tab" aria-selected={i === active} className={cx("hero__tab t-mono", i === active && "is-on")} onClick={() => goToStage(i)}>
                <span className="hero__tab-n">{String(i + 1).padStart(2, "0")}</span> {s.tab}
                <span className="hero__tab-line" aria-hidden="true">
                  <span ref={(el) => void (fills.current[i] = el)} />
                </span>
              </button>
            ))}
          </div>
          <div className="hero__meta t-mono">
            <span className="hero__scroll">
              Scroll <span aria-hidden="true">↓</span>
            </span>
            <span aria-live="polite">
              {String(active + 1).padStart(2, "0")} / {String(hero.stages.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
