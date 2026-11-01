import { Magnetic } from "@/components/site/Magnetic";
import type { StudioSettings } from "@/lib/settings";

export function ContactCta({ studio }: { studio: StudioSettings }) {
  return (
    <section className="section cta" data-theme="dark" id="contact">
      <div className="wrap">
        <p className="t-mono cta__label">■ 07 / Begin</p>
        <h2 className="cta__title" data-reveal="lines">
          Let&apos;s begin <em>with your site.</em>
        </h2>
        <div className="cta__row">
          <Magnetic>
            <button type="button" className="btn btn--solid btn--lg" data-enquire>
              Start an enquiry <span aria-hidden="true">→</span>
            </button>
          </Magnetic>
          <p className="t-mono cta__alt">
            Or write to <a className="link-u" href={`mailto:${studio.email}`}>{studio.email}</a>
          </p>
        </div>
      </div>
    </section>
  );
}
