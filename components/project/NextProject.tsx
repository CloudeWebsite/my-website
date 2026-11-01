"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ProjectCard } from "@/lib/queries";
import { prefersReducedMotion, registerGsap } from "@/lib/motion";

/** Scroll into the footer to travel on to the next project. */
export function NextProject({ project }: { project: ProjectCard }) {
  const wrap = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const router = useRouter();

  useEffect(() => {
    router.prefetch(`/projects/${project.slug}`);
    if (prefersReducedMotion()) return;
    const gsap = registerGsap();
    let fired = false;
    const ctx = gsap.context(() => {
      gsap.fromTo(bar.current, { scaleX: 0 }, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            if (self.progress > 0.995 && !fired) {
              fired = true;
              link.current?.click();
            }
          },
        },
      });
    });
    return () => ctx.revert();
  }, [project.slug, router]);

  return (
    <div ref={wrap} style={{ height: "170vh", position: "relative", background: "var(--ink)" }} data-theme="dark">
      <div style={{ position: "sticky", top: 0 }}>
        <Link ref={link} href={`/projects/${project.slug}`} className="next-project" data-cursor="next" data-transition-title={project.title}>
          {project.coverImage && (
            <span className="next-project__img">
              <Image src={project.coverImage.url} alt="" fill sizes="100vw" />
            </span>
          )}
          <span className="next-project__text wrap" style={{ display: "block" }}>
            <span className="t-mono" style={{ display: "block", marginBottom: 24 }}>
              ■ Next project — keep scrolling
            </span>
            <span className="next-project__title" style={{ display: "block" }}>
              {project.title}
            </span>
            <span className="t-mono" style={{ display: "block", marginTop: 20, opacity: 0.75 }}>
              {project.location} — {project.year}
            </span>
          </span>
          <span ref={bar} className="next-project__bar" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
