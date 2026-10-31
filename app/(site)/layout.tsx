import { EnquiryProvider } from "@/components/enquiry/EnquiryProvider";
import { Cursor } from "@/components/site/Cursor";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { PageTransition } from "@/components/site/PageTransition";
import { Preloader } from "@/components/site/Preloader";
import { ScrollFx } from "@/components/site/ScrollFx";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { JsonLd } from "@/components/ui/JsonLd";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/utils";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { studio, socials, budgets } = await getSettings();
  const [lat, lng] = (() => {
    const m = studio.mapUrl.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    return m ? [Number(m[1]), Number(m[2])] : [undefined, undefined];
  })();
  return (
    <EnquiryProvider budgets={budgets} studioName={studio.name}>
      <a href="#main" className="skip t-mono" data-no-transition>
        Skip to content
      </a>
      <Preloader name={studio.name} />
      <SmoothScroll />
      <Cursor />
      <Header studio={studio} />
      <main id="main">{children}</main>
      <Footer studio={studio} socials={socials} />
      <PageTransition />
      <ScrollFx />
      <div className="grain" aria-hidden="true" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", "@id": siteUrl("/#org"), name: studio.name, url: siteUrl(), email: studio.email, telephone: studio.phone, sameAs: Object.values(socials).filter((s) => s.length > 10), foundingDate: String(studio.foundedYear) },
            {
              "@type": ["LocalBusiness", "ProfessionalService"],
              "@id": siteUrl("/#business"),
              name: `${studio.name} Architecture + Design`,
              url: siteUrl(),
              email: studio.email,
              telephone: studio.phone,
              address: { "@type": "PostalAddress", streetAddress: studio.address, addressLocality: studio.city, addressCountry: studio.country },
              ...(lat !== undefined ? { geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng } } : {}),
              parentOrganization: { "@id": siteUrl("/#org") },
            },
          ],
        }}
      />
    </EnquiryProvider>
  );
}
