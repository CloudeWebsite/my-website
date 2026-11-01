"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, registerGsap, setLenis } from "@/lib/motion";

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const gsap = registerGsap();
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, touchMultiplier: 1.4 });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    // web fonts and late images shift layout; recompute trigger positions once they settle
    let alive = true;
    void document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      alive = false;
      cancelAnimationFrame(id);
      window.removeEventListener("load", onLoad);
    };
  }, [pathname]);

  return null;
}
