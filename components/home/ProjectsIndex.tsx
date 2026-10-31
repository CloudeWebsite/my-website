"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectCard } from "@/lib/queries";
import { PROJECT_TYPE_LABEL, cx } from "@/lib/utils";
import { SectionLabel } from "@/components/ui/SectionLabel";

const FILTERS = ["ALL", "RESIDENTIAL", "RENOVATION", "INTERIORS", "LANDSCAPE"] as const;
type Filter = (typeof FILTERS)[number];

export function ProjectsIndex({ initial, total, pageable = false, title = "Selected *work*", index = "02" }: { initial: ProjectCard[]; total: number; pageable?: boolean; title?: string; index?: string }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [view, setView] = useState<"list" | "grid">("list");
  const [items, setItems] = useState(initial);
  const [count, setCount] = useState(total);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState<ProjectCard | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, cx: 0, cy: 0 });

  const visible = pageable ? items : filter === "ALL" ? items : items.filter((p) => p.type === filter);

  const load = useCallback(
    async (f: Filter, p: number) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects?page=${p}${f === "ALL" ? "" : `&type=${f}`}`);
        const json = (await res.json()) as { items: ProjectCard[]; total: number };
        setItems((prev) => (p === 1 ? json.items : [...prev, ...json.items]));
        setCount(json.total);
        setPage(p);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const choose = (f: Filter) => {
    setFilter(f);
    if (pageable) void load(f, 1);
  };

  // infinite load
  useEffect(() => {
    if (!pageable || !sentinel.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !loading && items.length < count) void load(filter, page + 1);
    }, { rootMargin: "400px" });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [pageable, loading, items.length, count, filter, page, load]);

  // cursor-following preview with lerp lag
  useEffect(() => {
    let raf = 0;
    const move = (e: PointerEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };
    const loop = () => {
      const p = pos.current;
      p.cx += (p.x - p.cx) * 0.12;
      p.cy += (p.y - p.cy) * 0.12;
      if (preview.current) preview.current.style.transform = `translate3d(${p.cx}px, ${p.cy}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  const [lead, em] = title.split("*");
  return (
    <section className="section work" data-theme="light" id="work" data-wipe>
      <div className="wrap">
        <div className="work__head">
          <div>
            <SectionLabel index={index}>Projects index</SectionLabel>
            <h2 className="t-h2" data-reveal="lines">
              {lead}
              {em && <em>{em}</em>}
            </h2>
          </div>
          <div className="work__controls">
            <div className="chips" role="group" aria-label="Filter projects">
              {FILTERS.map((f) => (
                <button key={f} type="button" className={cx("chip t-mono", filter === f && "is-on")} aria-pressed={filter === f} onClick={() => choose(f)}>
                  {f === "ALL" ? "All" : PROJECT_TYPE_LABEL[f]}
                </button>
              ))}
            </div>
            <div className="toggle t-mono" role="group" aria-label="Layout">
              <button type="button" aria-pressed={view === "list"} className={cx(view === "list" && "is-on")} onClick={() => setView("list")}>
                List
              </button>
              <span aria-hidden="true">/</span>
              <button type="button" aria-pressed={view === "grid"} className={cx(view === "grid" && "is-on")} onClick={() => setView("grid")}>
                Grid
              </button>
            </div>
          </div>
        </div>

        {visible.length === 0 && !loading && <p className="t-mono work__empty">No projects in this category yet.</p>}

        {view === "list" ? (
          <ol className="plist" onPointerLeave={() => setHover(null)}>
            {visible.map((p, i) => (
              <li key={p.id} className="plist__item">
                <Link href={`/projects/${p.slug}`} className="plist__row" onPointerEnter={() => setHover(p)} onFocus={() => setHover(null)} data-cursor="view" data-transition-title={p.title}>
                  <span className="t-mono plist__i">{String(i + 1).padStart(2, "0")}</span>
                  {p.coverImage && (
                    <span className="plist__thumb">
                      <Image src={p.coverImage.url} alt="" width={160} height={100} sizes="120px" />
                    </span>
                  )}
                  <span className="plist__name">{p.title}</span>
                  <span className="t-mono plist__loc">{p.location}</span>
                  <span className="t-mono plist__year">{p.year}</span>
                  <span className="t-mono plist__type">{PROJECT_TYPE_LABEL[p.type]}</span>
                  <span className="plist__arrow" aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="pgrid">
            {visible.map((p, i) => (
              <li key={p.id} className={cx("pgrid__item", `pgrid__item--${i % 5}`)}>
                <Link href={`/projects/${p.slug}`} data-cursor="view" data-transition-title={p.title}>
                  <span className="pgrid__media">
                    {p.coverImage && <Image src={p.coverImage.url} alt={p.coverImage.alt} width={p.coverImage.width} height={p.coverImage.height} sizes="(max-width: 768px) 100vw, 50vw" />}
                  </span>
                  <span className="pgrid__cap">
                    <span className="t-mono">{String(i + 1).padStart(2, "0")}</span>
                    <span className="pgrid__name">{p.title}</span>
                    <span className="t-mono">
                      {p.location} — {p.year}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {pageable && <div ref={sentinel} className="work__sentinel t-mono">{loading ? "Loading…" : items.length < count ? "" : `${count} projects`}</div>}
        {!pageable && (
          <div className="work__more">
            <Link href="/projects" className="btn btn--line-dark" data-transition-title="Projects">
              All projects <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>
      <div ref={preview} className={cx("ppreview", hover && "is-on")} aria-hidden="true">
        {visible.map((p) =>
          p.coverImage ? (
            <Image key={p.id} src={p.coverImage.url} alt="" width={480} height={320} sizes="360px" className={cx(hover?.id === p.id && "is-on")} />
          ) : null,
        )}
      </div>
    </section>
  );
}
