"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { PlanSvg } from "@/components/hero/PlanSvg";

type View = { s: number; x: number; y: number };
const MIN = 1;
const MAX = 6;

/** Zoom + pan viewer for plans: wheel / pinch / drag / buttons / keyboard. */
export function PlanViewer({ image, vector = true, title }: { image: { url: string; alt: string; width: number; height: number }; vector?: boolean; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [v, setV] = useState<View>({ s: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const last = useRef<{ x: number; y: number; d: number } | null>(null);

  const clampView = useCallback((n: View): View => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return n;
    const s = Math.min(MAX, Math.max(MIN, n.s));
    const minX = r.width - r.width * s;
    const minY = r.height - r.height * s;
    return { s, x: Math.min(0, Math.max(minX, n.x)), y: Math.min(0, Math.max(minY, n.y)) };
  }, []);

  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      const px = cx ?? r.width / 2;
      const py = cy ?? r.height / 2;
      setV((p) => {
        const s = Math.min(MAX, Math.max(MIN, p.s * factor));
        const k = s / p.s;
        return clampView({ s, x: px - (px - p.x) * k, y: py - (py - p.y) * k });
      });
    },
    [clampView],
  );

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onKey = (e: KeyboardEvent) => {
    const step = 60;
    if (e.key === "+" || e.key === "=") zoomAt(1.25);
    else if (e.key === "-") zoomAt(0.8);
    else if (e.key === "0") setV({ s: 1, x: 0, y: 0 });
    else if (e.key === "ArrowLeft") setV((p) => clampView({ ...p, x: p.x + step }));
    else if (e.key === "ArrowRight") setV((p) => clampView({ ...p, x: p.x - step }));
    else if (e.key === "ArrowUp") setV((p) => clampView({ ...p, y: p.y + step }));
    else if (e.key === "ArrowDown") setV((p) => clampView({ ...p, y: p.y - step }));
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={box}
      className="planv"
      tabIndex={0}
      role="application"
      aria-label={`${title}. Use + and − to zoom, arrow keys to pan, 0 to reset.`}
      onKeyDown={onKey}
      data-lenis-prevent
      data-cursor="drag"
      onPointerDown={(e) => {
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        last.current = null;
      }}
      onPointerMove={(e) => {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const pts = Array.from(pointers.current.values());
        const r = box.current!.getBoundingClientRect();
        const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length - r.left;
        const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length - r.top;
        const d = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
        const prev = last.current;
        last.current = { x: cx, y: cy, d };
        if (!prev) return;
        setV((p) => {
          let n = { ...p, x: p.x + (cx - prev.x), y: p.y + (cy - prev.y) };
          if (d && prev.d) {
            const s = Math.min(MAX, Math.max(MIN, n.s * (d / prev.d)));
            const k = s / n.s;
            n = { s, x: cx - (cx - n.x) * k, y: cy - (cy - n.y) * k };
          }
          return clampView(n);
        });
      }}
      onPointerUp={(e) => {
        pointers.current.delete(e.pointerId);
        last.current = null;
      }}
      onPointerCancel={(e) => {
        pointers.current.delete(e.pointerId);
        last.current = null;
      }}
    >
      <div className="planv__canvas" style={{ transform: `translate(${v.x}px, ${v.y}px) scale(${v.s})` }}>
        {vector ? <PlanSvg title={title} /> : <Image src={image.url} alt={image.alt} fill sizes="100vw" style={{ objectFit: "contain" }} />}
      </div>
      <span className="planv__hint t-mono">{Math.round(v.s * 100)}% · drag to pan</span>
      <div className="planv__ui">
        <button type="button" onClick={() => zoomAt(1.4)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => zoomAt(1 / 1.4)} aria-label="Zoom out">
          −
        </button>
        <button type="button" onClick={() => setV({ s: 1, x: 0, y: 0 })} aria-label="Reset view">
          ⟲
        </button>
      </div>
    </div>
  );
}
