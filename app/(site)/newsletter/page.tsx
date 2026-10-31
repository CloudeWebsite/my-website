import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/ui/PageHead";

export const metadata: Metadata = { title: "Newsletter", robots: { index: false } };

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const ok = status === "confirmed";
  return (
    <>
      <PageHead label="Studio notes" title={ok ? "You're *on the list.*" : "That link has *expired.*"} lead={ok ? "Thank you for confirming. The next letter will find you." : "The confirmation link is invalid or has already been used. Subscribe again from the footer to receive a new one."} />
      <section className="section" data-theme="dark" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Link href="/" className="btn btn--line" data-transition-title="Home">
            Back to the studio →
          </Link>
        </div>
      </section>
    </>
  );
}
