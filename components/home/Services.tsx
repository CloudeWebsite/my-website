"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { Service } from "@prisma/client";
import { cx } from "@/lib/utils";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function Services({ services, index = "03" }: { services: Service[]; index?: string }) {
  const [open, setOpen] = useState<string | null>(services[0]?.id ?? null);
  const uid = useId();
  return (
    <section className="section services" data-theme="light" id="services">
      <div className="wrap grid">
        <div className="services__aside">
          <div className="services__sticky">
            <SectionLabel index={index}>Services</SectionLabel>
            <h2 className="t-h2" data-reveal="lines">
              Comprehensive design <em>from vision to delivery</em>
            </h2>
            <p className="services__intro" data-reveal="fade">
              One studio from the first site walk to the final handover — so the idea that wins the brief is the idea that gets built.
            </p>
            <button type="button" className="link-u t-mono" data-enquire>
              Enquire →
            </button>
          </div>
        </div>
        <ul className="acc">
          {services.map((s, i) => {
            const isOpen = open === s.id;
            return (
              <li key={s.id} className={cx("acc__item", isOpen && "is-open")}>
                <h3>
                  <button type="button" className="acc__btn" aria-expanded={isOpen} aria-controls={`${uid}-${s.id}`} onClick={() => setOpen(isOpen ? null : s.id)}>
                    <span className="t-mono acc__n">{String(i + 1).padStart(2, "0")}</span>
                    <span className="acc__title">{s.title}</span>
                    <span className="t-mono acc__sub">{s.subtitle}</span>
                    <span className="acc__icon" aria-hidden="true" />
                  </button>
                </h3>
                <div id={`${uid}-${s.id}`} className="acc__panel" role="region" aria-label={s.title} inert={!isOpen}>
                  <div className="acc__inner">
                    <p className="acc__desc">{s.description}</p>
                    <ul className="acc__list">
                      {s.deliverables.map((d) => (
                        <li key={d} className="t-mono">
                          — {d}
                        </li>
                      ))}
                    </ul>
                    {s.imageUrl && (
                      <span className="acc__img">
                        <Image src={s.imageUrl} alt="" width={480} height={320} sizes="240px" />
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
