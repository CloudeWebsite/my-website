import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

export const ink = "#0E0E0D";
export const paper = "#F2F0EB";
export const stone = "#8C877D";
export const timber = "#C98A4B";

export const mono = { fontFamily: "'JetBrains Mono', Menlo, Consolas, monospace", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase" as const, color: stone };
export const serif = { fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif", fontWeight: 400, color: ink, letterSpacing: "-0.01em" };
export const body = { fontFamily: "'Inter Tight', Helvetica, Arial, sans-serif", fontSize: "15px", lineHeight: "1.6", color: "#2a2926" };

export function EmailLayout({ preview, studio, regionTag, children }: { preview: string; studio: string; regionTag: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ background: paper, margin: 0, padding: "40px 0" }}>
        <Container style={{ maxWidth: "560px", background: "#ffffff", border: "1px solid rgba(0,0,0,0.1)", padding: "40px" }}>
          <Text style={{ ...mono, color: ink, fontSize: "13px", letterSpacing: "0.2em", margin: 0 }}>
            {studio} <span style={{ border: `1px solid ${ink}`, padding: "1px 4px", fontSize: "9px" }}>{regionTag}</span>
          </Text>
          <Text style={{ ...mono, fontSize: "9px", margin: "4px 0 0" }}>Architecture + Design</Text>
          <Hr style={{ borderColor: "rgba(0,0,0,0.1)", margin: "28px 0" }} />
          <Section>{children}</Section>
          <Hr style={{ borderColor: "rgba(0,0,0,0.1)", margin: "28px 0 16px" }} />
          <Text style={{ ...mono, fontSize: "9px", margin: 0 }}>■ {studio} — this message was sent automatically.</Text>
        </Container>
      </Body>
    </Html>
  );
}
