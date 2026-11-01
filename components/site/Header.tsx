"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { StudioSettings } from "@/lib/settings";
import { cx } from "@/lib/utils";
import { getLenis } from "@/lib/motion";
import { LocalTime } from "./LocalTime";
import { Magnetic } from "./Magnetic";
import { NAV } from "./nav";
import { Wordmark } from "./Wordmark";

export function Header({ studio }: { studio: StudioSettings }) {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isHome = pathname === "/";

  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setSolid(y > 80);
      if (Math.abs(y - lastY) > 6) {
        setHidden(y > lastY && y > 240);
        lastY = y;
      }
      const sections = document.querySelectorAll<HTMLElement>("[data-theme]");
      let current: "dark" | "light" = "dark";
      for (const s of Array.from(sections)) {
        const r = s.getBoundingClientRect();
        if (r.top <= 32 && r.bottom > 32) current = (s.dataset.theme as "dark" | "light") ?? "dark";
      }
      setTheme(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const lenis = getLenis();
    if (open) {
      lenis?.stop();
      document.documentElement.classList.add("no-scroll");
      const first = menuRef.current?.querySelector<HTMLElement>("a");
      first?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
        if (e.key === "Tab" && menuRef.current) {
          const items = Array.from(menuRef.current.querySelectorAll<HTMLElement>("a, button"));
          const all = toggleRef.current ? [toggleRef.current, ...items] : items;
          const i = all.indexOf(document.activeElement as HTMLElement);
          if (e.shiftKey && i <= 0) {
            e.preventDefault();
            all[all.length - 1].focus();
          } else if (!e.shiftKey && i === all.length - 1) {
            e.preventDefault();
            all[0].focus();
          }
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    lenis?.start();
    document.documentElement.classList.remove("no-scroll");
  }, [open]);

  return (
    <>
      <header className={cx("header", solid && "is-solid", hidden && !open && "is-hidden", (theme === "light" && !open) && "is-light", open && "is-open")}>
        <div className="header__bar wrap">
          <Wordmark name={studio.name} tag={studio.regionTag} subline={studio.subline} />
          <nav className="header__nav" aria-label="Primary">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={cx("header__link link-u", pathname.startsWith(n.href) && n.href !== "/#features" && "is-active")} data-transition-title={n.label}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="header__actions">
            <Magnetic>
              <button type="button" className="btn btn--line header__cta" data-enquire>
                Enquire <span aria-hidden="true">↘</span>
              </button>
            </Magnetic>
            <button ref={toggleRef} type="button" className="header__toggle" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <span className="header__burger" aria-hidden="true" />
            </button>
          </div>
        </div>
        {isHome && (
          <div className={cx("header__sub wrap", solid && "is-gone")}>
            <span>■ Established architectural studio — {studio.city}</span>
            <span className="header__sub-right">
              <LocalTime timezone={studio.timezone} label={studio.timezoneLabel} />
              <span className="header__coords">{studio.coordinates}</span>
            </span>
          </div>
        )}
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            className="menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav className="menu__nav wrap" aria-label="Mobile">
              {NAV.map((n, i) => (
                <motion.div key={n.href} className="menu__item" initial={{ y: "110%" }} animate={{ y: "0%" }} exit={{ y: "-110%" }} transition={{ delay: 0.25 + i * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                  <Link href={n.href} className="menu__link" onClick={() => setOpen(false)} data-transition-title={n.label}>
                    <span className="menu__index">{String(i + 1).padStart(2, "0")}</span>
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.div className="menu__foot wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.6 }}>
              <span>{studio.email}</span>
              <span>{studio.phone}</span>
              <span>
                <LocalTime timezone={studio.timezone} label={studio.timezoneLabel} /> · {studio.coordinates}
              </span>
              <button type="button" className="btn btn--solid" data-enquire onClick={() => setOpen(false)}>
                Start an enquiry →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
