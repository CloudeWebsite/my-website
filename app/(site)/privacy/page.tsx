import type { Metadata } from "next";
import { Legal } from "@/components/ui/Legal";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default async function PrivacyPage() {
  const { studio } = await getSettings();
  return (
    <Legal title="Privacy *notice*" updated="31 October 2026">
      <p>This notice explains what {studio.name} collects through this website, why, and what you can ask us to do with it.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Enquiries: your name, email, phone number, preferred contact method, project details and any files you choose to attach.</li>
        <li>Newsletter: your email address, and whether and when you confirmed your subscription.</li>
        <li>Technical: your IP address is processed briefly to prevent abuse (rate limiting); it is not stored with your enquiry.</li>
      </ul>
      <h2>Why</h2>
      <p>We use enquiry details only to respond to you and, if we work together, to deliver the project. We send the newsletter only after you confirm by email, and every issue includes a way to stop it.</p>
      <h2>Storage and retention</h2>
      <p>Data is stored with our hosting and database providers. Enquiries that do not become projects are deleted after 24 months. Attachments are private and visible only to studio staff.</p>
      <h2>Your rights</h2>
      <p>You can ask to see, correct or delete anything we hold about you by writing to {studio.email}.</p>
      <h2>Cookies</h2>
      <p>We use only essential cookies (for example, to keep staff signed in to the studio dashboard). We do not use advertising or tracking cookies.</p>
    </Legal>
  );
}
