import type { Metadata } from "next";
import { NotFoundView } from "@/components/site/NotFoundView";
import SiteLayout from "./(site)/layout";

export const metadata: Metadata = { title: "Not found", robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <SiteLayout>
      <NotFoundView />
    </SiteLayout>
  );
}
