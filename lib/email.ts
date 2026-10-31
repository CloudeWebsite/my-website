import "server-only";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Studio <onboarding@resend.dev>";

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Sends a React Email template through Resend. Without RESEND_API_KEY the
 * rendered text version is printed to the server console (development).
 */
export async function sendEmail(opts: { to: string; subject: string; react: ReactElement; replyTo?: string }): Promise<SendResult> {
  const [html, text] = await Promise.all([render(opts.react), render(opts.react, { plainText: true })]);
  if (!resend) {
    console.info(`\n[email:dev] → ${opts.to}\nSubject: ${opts.subject}\n${text}\n`);
    return { ok: true, id: "dev-console" };
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to: opts.to, subject: opts.subject, html, text, replyTo: opts.replyTo });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id ?? "" };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
