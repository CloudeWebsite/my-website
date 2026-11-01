"use client";

import { motion, useAnimationControls } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getLenis, prefersReducedMotion, scrollToTarget } from "@/lib/motion";

/**
 * Intercepts internal link clicks: a black panel wipes up, the destination
 * title flashes in mono, the route changes, and the panel wipes away.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const controls = useAnimationControls();
  const [title, setTitle] = useState("");
  const pending = useRef<{ hash: string } | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.noTransition !== undefined) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) return;
      const samePage = url.pathname === window.location.pathname;
      if (samePage) {
        if (url.hash) {
          e.preventDefault();
          scrollToTarget(url.hash, { offset: 0 });
          history.replaceState(null, "", url.hash);
        } else if (url.search === window.location.search) {
          e.preventDefault();
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(0, { duration: 1.4 });
          else window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }
      e.preventDefault();
      if (busy.current) return;
      const label = a.dataset.transitionTitle ?? a.getAttribute("aria-label") ?? a.textContent ?? "";
      const go = () => router.push(url.pathname + url.search);
      pending.current = { hash: url.hash };
      if (prefersReducedMotion()) {
        go();
        return;
      }
      busy.current = true;
      setTitle(label.replace(/[↗↘→↓]/g, "").trim().slice(0, 48));
      void controls.start({ y: "0%", transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }).then(go);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [controls, router]);

  useEffect(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    window.scrollTo(0, 0);
    const reveal = async () => {
      await new Promise((r) => setTimeout(r, 120));
      if (p.hash) window.setTimeout(() => scrollToTarget(p.hash, { immediate: true }), 50);
      await controls.start({ y: "-100%", transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } });
      controls.set({ y: "100%" });
      busy.current = false;
    };
    void reveal();
  }, [pathname, controls]);

  return (
    <motion.div className="transition" initial={{ y: "100%" }} animate={controls} aria-hidden="true">
      <span className="transition__title">■ {title}</span>
      <span className="transition__meta">Loading sheet</span>
    </motion.div>
  );
}
