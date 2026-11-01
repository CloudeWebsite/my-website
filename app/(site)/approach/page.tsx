import type { Metadata } from "next";
import { Approach, STAGES } from "@/components/home/Approach";
import { ContactCta } from "@/components/home/ContactCta";
import { Features } from "@/components/home/Features";
import { PageHead } from "@/components/ui/PageHead";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Approach", description: "How we work: briefing, concept, developed design, documentation and construction.", alternates: { canonical: "/approach" } };

export default async function ApproachPage() {
  const { studio } = await getSettings();
  return (
    <>
      <PageHead label="Approach" title="Calm, *exact and unhurried*" lead={`A typical house takes ${STAGES.length} stages and around two years from first conversation to moving in. Here is what happens, and when.`} />
      <div style={{ background: "var(--paper)", paddingTop: "clamp(64px, 8vw, 120px)" }}>
        <Features />
      </div>
      <Approach index="02" />
      <ContactCta studio={studio} />
    </>
  );
}
