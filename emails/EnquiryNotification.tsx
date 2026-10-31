import { Button, Text } from "@react-email/components";
import { EmailLayout, body, ink, mono, serif } from "./Layout";

export type EnquiryNotificationProps = {
  studio: string;
  regionTag: string;
  reference: string;
  adminUrl: string;
  rows: Array<[string, string]>;
  description: string;
  fileCount: number;
};

export default function EnquiryNotification({ studio, regionTag, reference, adminUrl, rows, description, fileCount }: EnquiryNotificationProps) {
  return (
    <EmailLayout preview={`New enquiry ${reference}`} studio={studio} regionTag={regionTag}>
      <Text style={mono}>New enquiry</Text>
      <Text style={{ ...serif, fontSize: "32px", lineHeight: "1.05", margin: "6px 0 20px" }}>{reference}</Text>
      <table cellPadding={0} cellSpacing={0} style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ ...mono, padding: "8px 12px 8px 0", borderTop: "1px solid rgba(0,0,0,0.08)", width: "38%", verticalAlign: "top" }}>{k}</td>
              <td style={{ ...body, padding: "8px 0", borderTop: "1px solid rgba(0,0,0,0.08)" }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Text style={{ ...body, whiteSpace: "pre-wrap", marginTop: "20px" }}>{description}</Text>
      <Text style={mono}>{fileCount} attachment{fileCount === 1 ? "" : "s"}</Text>
      <Button href={adminUrl} style={{ ...mono, color: "#fff", background: ink, padding: "14px 20px", borderRadius: "2px", marginTop: "12px" }}>
        Open in dashboard →
      </Button>
    </EmailLayout>
  );
}
