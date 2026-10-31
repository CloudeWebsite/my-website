import type { Metadata } from "next";
import { LocalTime } from "@/components/site/LocalTime";
import { PageHead } from "@/components/ui/PageHead";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact", description: "Start an enquiry, call or visit the studio.", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const { studio, socials } = await getSettings();
  const wa = studio.whatsapp.replace(/[^\d]/g, "");
  return (
    <>
      <PageHead label="Contact" title="Let's begin *with your site.*" lead="Tell us a little about the project and we'll reply within two working days. Most first conversations happen on site." />
      <section className="section" data-theme="light">
        <div className="wrap">
          <div className="contact-grid">
            <div>
              <p className="t-mono">■ Write</p>
              <a className="contact-big link-u" href={`mailto:${studio.email}`}>{studio.email}</a>
            </div>
            <div>
              <p className="t-mono">■ Call</p>
              <a className="contact-big link-u" href={`tel:${studio.phone.replace(/\s/g, "")}`}>{studio.phone}</a>
              <a className="link-u t-mono" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp {studio.whatsapp} ↗</a>
            </div>
            <div>
              <p className="t-mono">■ Visit</p>
              <address className="contact-big" style={{ fontSize: 22 }}>{studio.address}</address>
              <a className="link-u t-mono" href={studio.mapUrl} target="_blank" rel="noopener noreferrer">Open map ↗</a>
            </div>
          </div>
          <div className="contact-grid" style={{ marginTop: 48 }}>
            <div>
              <p className="t-mono">■ Local time</p>
              <span className="contact-big"><LocalTime timezone={studio.timezone} label={studio.timezoneLabel} seconds /></span>
            </div>
            <div>
              <p className="t-mono">■ Coordinates</p>
              <span className="contact-big">{studio.coordinates}</span>
            </div>
            <div>
              <p className="t-mono">■ Follow</p>
              <a className="link-u" href={socials.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a>
              <a className="link-u" href={socials.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            </div>
          </div>
          <div style={{ marginTop: 80 }}>
            <button type="button" className="btn btn--solid btn--lg" data-enquire>
              Start an enquiry <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
