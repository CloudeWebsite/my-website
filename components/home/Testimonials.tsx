"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cx } from "@/lib/utils";

type T = { id: string; quote: string; clientName: string; project: { title: string; location: string } | null };

export function Testimonials({ items }: { items: T[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (items.length < 2 || paused) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % items.length), 7000);
    return () => window.clearInterval(id);
  }, [items.length, paused]);
  if (!items.length) return null;
  const t = items[i];
  return (
    <section className="section quote" data-theme="light" aria-roledescription="carousel" aria-label="Client testimonials" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="wrap">
        <p className="t-mono quote__label">■ In their words</p>
        <div className="quote__stage" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.figure key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="quote__fig">
              <blockquote className="quote__text">“{t.quote}”</blockquote>
              <figcaption className="t-mono quote__cap">
                <span>{t.clientName}</span>
                {t.project && (
                  <span>
                    {t.project.title} — {t.project.location}
                  </span>
                )}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        {items.length > 1 && (
          <div className="quote__dots" role="tablist" aria-label="Choose testimonial">
            {items.map((q, j) => (
              <button key={q.id} type="button" role="tab" aria-selected={i === j} aria-label={`Testimonial ${j + 1}`} className={cx("quote__dot", i === j && "is-on")} onClick={() => setI(j)}>
                <span className="t-mono">{String(j + 1).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
