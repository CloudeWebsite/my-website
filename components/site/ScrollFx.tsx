"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { groupLines, prefersReducedMotion, registerGsap, splitWords } from "@/lib/motion";

/**
 * Declarative scroll animations. Server components opt in with data attributes:
 *   data-reveal="lines"   headline lines slide up from a mask
 *   data-reveal="words"   word-by-word opacity scrub (0.15 → 1)
 *   data-reveal="fade"    fade + rise
 *   data-reveal="image"   clip-path wipe + inner image scale 1.15 → 1
 *   data-parallax="0.12"  inner image drifts (≤ 15% of travel)
 *   data-count="140"      number counts up
 *   data-wipe             light section wipes open over the dark one above
 * Everything is created inside a gsap.context and reverted on route change.
 */
export function ScrollFx() {
  const pathname = usePathname();

  useEffect(() => {
    const gsap = registerGsap();
    const reduced = prefersReducedMotion();
    let ctx: gsap.Context | null = null;
    const id = window.setTimeout(() => {
      ctx = gsap.context(() => {
        const root = document.querySelector("main");
        if (!root) return;

        root.querySelectorAll<HTMLElement>("[data-reveal='lines']").forEach((el) => {
          const words = splitWords(el);
          if (reduced) return;
          const lines = groupLines(words);
          lines.forEach((line, i) => gsap.fromTo(line, { yPercent: 110 }, { yPercent: 0, duration: 1.1, delay: i * 0.06 + Number(el.dataset.delay ?? 0), ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
        });

        root.querySelectorAll<HTMLElement>("[data-reveal='words']").forEach((el) => {
          const words = splitWords(el);
          el.classList.add("is-scrub");
          if (reduced) return;
          gsap.fromTo(words, { opacity: 0.15 }, { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
        });

        root.querySelectorAll<HTMLElement>("[data-reveal='fade']").forEach((el) => {
          if (reduced) return;
          gsap.from(el, { opacity: 0, y: 28, duration: 1.1, delay: Number(el.dataset.delay ?? 0), scrollTrigger: { trigger: el, start: "top 90%", once: true } });
        });

        root.querySelectorAll<HTMLElement>("[data-reveal='stagger']").forEach((el) => {
          if (reduced) return;
          gsap.from(el.children, { opacity: 0, y: 24, duration: 1, stagger: 0.08, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
        });

        root.querySelectorAll<HTMLElement>("[data-reveal='image']").forEach((el) => {
          if (reduced) return;
          const img = el.querySelector("img");
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%", once: true } });
          tl.fromTo(el, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power3.inOut" });
          if (img) tl.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.8, ease: "power3.out" }, 0);
        });

        root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          if (reduced) return;
          const amount = Math.min(0.15, Number(el.dataset.parallax) || 0.1);
          const target = el.querySelector<HTMLElement>("img, [data-parallax-target]") ?? el;
          gsap.fromTo(target, { yPercent: -amount * 50 }, { yPercent: amount * 50, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        });

        root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
          const to = Number(el.dataset.count);
          if (reduced) {
            el.textContent = String(to);
            return;
          }
          const obj = { v: 0 };
          gsap.to(obj, { v: to, duration: 2, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%", once: true }, onUpdate: () => (el.textContent = String(Math.round(obj.v))) });
        });

        root.querySelectorAll<HTMLElement>("[data-wipe]").forEach((el) => {
          if (reduced) return;
          gsap.fromTo(el, { clipPath: "inset(10% 5% 0% 5%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", scrollTrigger: { trigger: el, start: "top bottom", end: "top 35%", scrub: true } });
        });

        root.querySelectorAll<HTMLElement>("[data-draw]").forEach((el) => {
          if (reduced) return;
          const paths = el.querySelectorAll<SVGPathElement>("path, line, polyline, circle");
          gsap.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, stagger: 0.05, ease: "power2.inOut", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
        });
      });
      ScrollTrigger.refresh();
    }, 60);

    return () => {
      window.clearTimeout(id);
      ctx?.revert();
    };
  }, [pathname]);

  return null;
}
