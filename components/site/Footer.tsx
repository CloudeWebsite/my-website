import Link from "next/link";
import type { SocialSettings, StudioSettings } from "@/lib/settings";
import { BackToTop } from "./BackToTop";
import { LocalTime } from "./LocalTime";
import { NAV } from "./nav";
import { Newsletter } from "./Newsletter";

export function Footer({ studio, socials }: { studio: StudioSettings; socials: SocialSettings }) {
  const wa = studio.whatsapp.replace(/[^\d]/g, "");
  return (
    <footer className="footer" data-theme="dark">
      <div className="wrap footer__grid">
        <div className="footer__col footer__col--wide">
          <p className="t-mono footer__head">■ Studio</p>
          <address className="footer__address">{studio.address}</address>
          <a className="link-u t-mono" href={studio.mapUrl} target="_blank" rel="noopener noreferrer">
            Open map ↗
          </a>
        </div>
        <div className="footer__col">
          <p className="t-mono footer__head">■ Contact</p>
          <a className="link-u" href={`mailto:${studio.email}`}>{studio.email}</a>
          <a className="link-u" href={`tel:${studio.phone.replace(/\s/g, "")}`}>{studio.phone}</a>
          <a className="link-u" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>
        </div>
        <div className="footer__col">
          <p className="t-mono footer__head">■ Navigate</p>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="link-u" data-transition-title={n.label}>{n.label}</Link>
          ))}
          <Link href="/journal" className="link-u" data-transition-title="Journal">Journal</Link>
        </div>
        <div className="footer__col">
          <p className="t-mono footer__head">■ Follow</p>
          <a className="link-u" href={socials.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a>
          <a className="link-u" href={socials.pinterest} target="_blank" rel="noopener noreferrer">Pinterest ↗</a>
          <a className="link-u" href={socials.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        </div>
        <div className="footer__col footer__col--wide">
          <Newsletter />
        </div>
      </div>
      <div className="wrap footer__bottom t-mono">
        <span>© {new Date().getFullYear()} {studio.name}</span>
        <Link href="/privacy" className="link-u" data-transition-title="Privacy">Privacy</Link>
        <Link href="/terms" className="link-u" data-transition-title="Terms">Terms</Link>
        <span>
          Local time <LocalTime timezone={studio.timezone} label={studio.timezoneLabel} />
        </span>
        <span className="footer__coords">{studio.coordinates}</span>
        <BackToTop />
      </div>
      <div className="footer__mark" aria-hidden="true">
        <span>{studio.name}</span>
      </div>
    </footer>
  );
}
