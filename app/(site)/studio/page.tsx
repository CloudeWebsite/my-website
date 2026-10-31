import type { Metadata } from "next";
import { ContactCta } from "@/components/home/ContactCta";
import { Intro } from "@/components/home/Intro";
import { Studio } from "@/components/home/Studio";
import { Testimonials } from "@/components/home/Testimonials";
import { PageHead } from "@/components/ui/PageHead";
import { getTeam, getTestimonials } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;
export const metadata: Metadata = { title: "Studio", description: "The people, principles and practice behind the work.", alternates: { canonical: "/studio" } };

export default async function StudioPage() {
  const [team, testimonials, settings] = await Promise.all([getTeam(), getTestimonials(), getSettings()]);
  return (
    <>
      <PageHead label="Studio" title={`${settings.studio.name}, *${settings.studio.city}*`} lead={`Established ${settings.studio.foundedYear}. A small practice of architects, interior designers and model-makers working from one long table.`} />
      <Intro stats={settings.stats} since={settings.studio.foundedYear} />
      <Studio team={team} studioName={settings.studio.name} index="01" />
      <Testimonials items={testimonials} />
      <ContactCta studio={settings.studio} />
    </>
  );
}
