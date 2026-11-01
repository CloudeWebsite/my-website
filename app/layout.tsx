import type { Metadata, Viewport } from "next";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/utils";
import { mono, sans, serif } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { studio } = await getSettings();
  const title = `${studio.name} — Residential Architecture, ${studio.city}`;
  const description = `${studio.name} is an established architectural studio in ${studio.city}, ${studio.country}, designing considered, enduring homes shaped by their landscape.`;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s — ${studio.name}` },
    description,
    applicationName: studio.name,
    openGraph: { type: "website", siteName: studio.name, title, description, locale: "en_GB" },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: "/" },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0E0E0D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${serif.variable} ${mono.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
