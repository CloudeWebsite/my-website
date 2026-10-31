"use client";

import { useEffect, useRef } from "react";

/** 8px dot that grows into a labelled circle over [data-cursor] targets. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");
    let x = -100;
    let y = -100;
    let cx = x;
    let cy = y;
    let raf = 0;
    let state = "";
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      el.classList.add("is-on");
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor], a, button, [role=button], input, textarea, select, label");
      const next = target?.dataset.cursor ?? (target ? (target.matches("input, textarea, select") ? "text" : "link") : "");
      if (next !== state) {
        state = next;
        el.dataset.state = state;
        if (label.current) label.current.textContent = state === "view" || state === "drag" || state === "open" || state === "next" ? state.toUpperCase() : "";
      }
    };
    const leave = () => el.classList.remove("is-on");
    const down = () => el.classList.add("is-down");
    const up = () => el.classList.remove("is-down");
    const loop = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      <div className="cursor__ring">
        <span ref={label} className="cursor__label" />
      </div>
    </div>
  );
}
