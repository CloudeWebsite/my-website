"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

let registered = false;
export function registerGsap(): typeof gsap {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "power3.out", duration: 1 });
    registered = true;
  }
  return gsap;
}

let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  lenis = l;
};
export const getLenis = () => lenis;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToTarget(target: string | number | HTMLElement, opts: { immediate?: boolean; offset?: number } = {}) {
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (el === null) return;
  if (lenis) {
    lenis.scrollTo(el, { immediate: opts.immediate, offset: opts.offset ?? 0, duration: 1.4 });
    return;
  }
  if (typeof el === "number") window.scrollTo({ top: el, behavior: opts.immediate ? "auto" : "smooth" });
  else {
    const top = el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0);
    window.scrollTo({ top, behavior: opts.immediate || prefersReducedMotion() ? "auto" : "smooth" });
  }
}

/**
 * Split an element's text into word spans (preserving <em>/<strong>).
 * Each word gets an overflow mask so it can slide up from below.
 */
export function splitWords(root: HTMLElement): HTMLElement[] {
  if (root.dataset.split === "1") return Array.from(root.querySelectorAll<HTMLElement>(".w-in"));
  root.dataset.split = "1";
  root.setAttribute("aria-label", root.textContent?.replace(/\s+/g, " ").trim() ?? "");
  const out: HTMLElement[] = [];
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent ?? "").split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            continue;
          }
          const mask = document.createElement("span");
          mask.className = "w";
          mask.setAttribute("aria-hidden", "true");
          const inner = document.createElement("span");
          inner.className = "w-in";
          inner.textContent = part;
          mask.appendChild(inner);
          frag.appendChild(mask);
          out.push(inner);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName !== "BR") walk(child);
    }
  };
  walk(root);
  return out;
}

/** Group split words into visual lines (by offsetTop) for line-staggered reveals. */
export function groupLines(words: HTMLElement[]): HTMLElement[][] {
  const lines: HTMLElement[][] = [];
  let lastTop = Number.NaN;
  for (const w of words) {
    const top = (w.parentElement as HTMLElement).offsetTop;
    if (Math.abs(top - lastTop) > 4 || !lines.length) {
      lines.push([w]);
      lastTop = top;
    } else lines[lines.length - 1].push(w);
  }
  return lines;
}
