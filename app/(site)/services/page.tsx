import type { Metadata } from "next";
import { ContactCta } from "@/components/home/ContactCta";
import { Services } from "@/components/home/Services";
import { PageHead } from "@/components/ui/PageHead";
import { getServices } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;
export const metadata: Metadata = { title: "Services", description: "New homes, renovations, interior architecture, masterplanning and landscape.", alternates: { canonical: "/services" } };

export default async function ServicesPage() {
  const [services, { studio }] = await Promise.all([getServices(), getSettings()]);
  return (
    <>
      <PageHead label="Services" title="One studio, *from first sketch to final handover*" lead="We work across five disciplines, usually several at once — so the house, its interiors and its garden are conceived as one." />
      <div style={{ background: "var(--paper)", paddingTop: "clamp(64px, 8vw, 120px)" }}>
        <Services services={services} index="01" />
      </div>
      <ContactCta studio={studio} />
    </>
  );
}
