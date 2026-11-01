import type { Metadata } from "next";
import { Legal } from "@/components/ui/Legal";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Terms", alternates: { canonical: "/terms" } };

export default async function TermsPage() {
  const { studio } = await getSettings();
  return (
    <Legal title="Terms of *use*" updated="31 October 2026">
      <p>These terms apply to your use of this website. By using it you accept them.</p>
      <h2>Content</h2>
      <p>All drawings, images and text on this site are the copyright of {studio.name} unless stated otherwise. You may share links freely; please ask before reproducing images.</p>
      <h2>No professional advice</h2>
      <p>Material on this site is general. It is not architectural, planning or legal advice for your project, which can only follow an appointment.</p>
      <h2>Enquiries</h2>
      <p>Sending an enquiry does not create a contract. Our services are provided only under a signed appointment agreement.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: {studio.email}.</p>
    </Legal>
  );
}
