"use client";

import { useEffect, useRef, useState } from "react";
import { WALLS } from "@/components/hero/house-data";

declare global {
  interface Window {
    __preloaderDone?: boolean;
  }
}

const KEY = "studio:preloader-seen";

function finish() {
  window.__preloaderDone = true;
  window.dispatchEvent(new Event("preloader:done"));
}

/** First-visit preloader: a blueprint line draws the house plan, then the screen splits open. */
export function Preloader({ name }: { name: string }) {
  const [state, setState] = useState<"pending" | "run" | "out" | "done">("pending");
  const counter = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {
      /* storage unavailable */
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) {
      setState("done");
      finish();
      return;
    }
    setState("run");
    document.documentElement.classList.add("no-scroll");
    const start = performance.now();
    const total = 1800;
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / total);
      const eased = 1 - Math.pow(1 - p, 3);
      if (counter.current) counter.current.textContent = String(Math.round(eased * 100)).padStart(3, "0");
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setState("out");
        try {
          sessionStorage.setItem(KEY, "1");
        } catch {
          /* ignore */
        }
        window.setTimeout(() => {
          document.documentElement.classList.remove("no-scroll");
          finish();
        }, 350);
        window.setTimeout(() => setState("done"), 1300);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (state === "done") return null;

  // plan drawn in its own coordinate system (metres), offset to positive space
  const d = WALLS.map((w) => `M${(w.a[0] + 10).toFixed(2)} ${(w.a[1] + 5.5).toFixed(2)}L${(w.b[0] + 10).toFixed(2)} ${(w.b[1] + 5.5).toFixed(2)}`).join("");

  return (
    <div className={`preloader is-${state}`} aria-hidden="true">
      <div className="preloader__half preloader__half--top" />
      <div className="preloader__half preloader__half--bottom" />
      <div className="preloader__content">
        <svg className="preloader__plan" viewBox="0 0 20 19" fill="none">
          <path d={d} pathLength={1} />
          <path className="preloader__outline" d="M1 1h18v16.5h-6V10H1z" pathLength={1} />
        </svg>
        <div className="preloader__meta">
          <span>{name} — A-000</span>
          <span>Setting out</span>
        </div>
      </div>
      <span ref={counter} className="preloader__count">000</span>
    </div>
  );
}
