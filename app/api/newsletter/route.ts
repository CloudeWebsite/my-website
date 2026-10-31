import { randomBytes } from "node:crypto";
import { createElement } from "react";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/utils";
import { newsletterSchema } from "@/lib/validation";
import NewsletterConfirm from "@/emails/NewsletterConfirm";

const OK = { message: "Almost there — check your inbox to confirm." };

export async function POST(req: Request) {
  const limit = await rateLimit("newsletter", clientIp(req.headers), 5, "10 m");
  if (!limit.success) return Response.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  const parsed = newsletterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid email." }, { status: 422 });
  if (parsed.data.website) return Response.json(OK);
  const email = parsed.data.email.toLowerCase();
  const existing = await db.subscriber.findUnique({ where: { email } });
  // Same response whether or not the address exists (no enumeration).
  if (existing?.confirmed) return Response.json(OK);
  const token = randomBytes(24).toString("base64url");
  await db.subscriber.upsert({ where: { email }, create: { email, token }, update: { token } });
  const { studio } = await getSettings();
  const res = await sendEmail({
    to: email,
    subject: `Confirm your subscription to ${studio.name}`,
    react: createElement(NewsletterConfirm, { studio: studio.name, regionTag: studio.regionTag, confirmUrl: siteUrl(`/api/newsletter/confirm?token=${token}`) }),
  });
  if (!res.ok) {
    console.error("[newsletter]", res.error);
    return Response.json({ error: "We couldn't send the confirmation email. Please try again." }, { status: 502 });
  }
  return Response.json(OK);
}
