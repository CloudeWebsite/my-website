import { Section, Text } from "@react-email/components";
import { EmailLayout, body, mono, serif, timber } from "./Layout";

export type EnquiryConfirmationProps = {
  studio: string;
  regionTag: string;
  name: string;
  reference: string;
  projectType: string;
  location: string;
};

export default function EnquiryConfirmation({ studio, regionTag, name, reference, projectType, location }: EnquiryConfirmationProps) {
  const first = name.split(" ")[0];
  return (
    <EmailLayout preview={`We have your enquiry — ${reference}`} studio={studio} regionTag={regionTag}>
      <Text style={{ ...mono, color: timber }}>Reference {reference}</Text>
      <Text style={{ ...serif, fontSize: "34px", lineHeight: "1.05", margin: "8px 0 20px" }}>
        Thank you, {first}. <em>We have your site in mind.</em>
      </Text>
      <Text style={body}>
        Your enquiry for a {projectType.toLowerCase()} in {location} has reached the studio. One of our architects will read it in full and
        reply within two working days, usually with a few questions about the site and how you hope to live there.
      </Text>
      <Text style={body}>If anything changes in the meantime, simply reply to this email and quote your reference.</Text>
      <Section style={{ borderTop: "1px solid rgba(0,0,0,0.1)", marginTop: "24px", paddingTop: "16px" }}>
        <Text style={{ ...mono, margin: 0 }}>Next — a short call · a site visit · a written fee proposal</Text>
      </Section>
    </EmailLayout>
  );
}
