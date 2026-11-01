"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";

type Side = { url: string; alt: string; label: string };

/** Drag (or keyboard via the range input) to compare drawing and result. */
export function BeforeAfter({ before, after }: { before: Side; after: Side }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fromEvent = (e: PointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };

  return (
    <div
      ref={box}
      className="ba"
      data-cursor="drag"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        fromEvent(e);
      }}
      onPointerMove={(e) => dragging.current && fromEvent(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <Image src={before.url} alt={before.alt} fill sizes="(max-width: 1600px) 100vw, 1600px" />
      <div className="ba__after" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <Image src={after.url} alt={after.alt} fill sizes="(max-width: 1600px) 100vw, 1600px" />
      </div>
      <span className="ba__tag ba__tag--l t-mono">{before.label}</span>
      <span className="ba__tag ba__tag--r t-mono">{after.label}</span>
      <div className="ba__handle" style={{ left: `${pos}%` }} aria-hidden="true">
        <span className="ba__knob">◂ ▸</span>
      </div>
      <input className="ba__range" type="range" min={0} max={100} step={1} value={Math.round(pos)} onChange={(e) => setPos(Number(e.target.value))} aria-label="Compare drawing and realised plan" />
    </div>
  );
}
