"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Pulls its child towards the pointer (max `strength` px). */
export function Magnetic({ children, strength = 8, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
    };
    const leave = () => {
      el.style.transform = "translate3d(0,0,0)";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);
  return (
    <span ref={ref} className={`magnetic ${className ?? ""}`}>
      {children}
    </span>
  );
}
