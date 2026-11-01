import { Button, Text } from "@react-email/components";
import { EmailLayout, body, ink, mono, serif } from "./Layout";

export type NewsletterConfirmProps = { studio: string; regionTag: string; confirmUrl: string };

export default function NewsletterConfirm({ studio, regionTag, confirmUrl }: NewsletterConfirmProps) {
  return (
    <EmailLayout preview="Confirm your subscription" studio={studio} regionTag={regionTag}>
      <Text style={mono}>Studio notes</Text>
      <Text style={{ ...serif, fontSize: "32px", lineHeight: "1.05", margin: "6px 0 20px" }}>
        One click <em>to confirm.</em>
      </Text>
      <Text style={body}>
        We send a short letter a few times a year: finished houses, drawings from the desk, and the occasional essay on building well.
        Please confirm that you would like to receive it.
      </Text>
      <Button href={confirmUrl} style={{ ...mono, color: "#fff", background: ink, padding: "14px 20px", borderRadius: "2px", marginTop: "12px" }}>
        Confirm subscription →
      </Button>
      <Text style={{ ...body, fontSize: "13px", color: "#8C877D" }}>If you didn&apos;t ask for this, ignore this email and nothing will happen.</Text>
    </EmailLayout>
  );
}
