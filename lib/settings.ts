import { cache } from "react";
import { z } from "zod";
import { db } from "./db";

/**
 * Site-wide settings are stored as JSON rows in `SiteSetting` and edited in
 * /admin/settings. Every key has a schema + defaults so the site renders even
 * before the table is seeded.
 */
export const studioSchema = z.object({
  name: z.string().min(1).max(40),
  regionTag: z.string().min(1).max(4),
  subline: z.string().max(60),
  city: z.string().max(60),
  country: z.string().max(60),
  coordinates: z.string().max(60),
  timezone: z.string().max(60),
  timezoneLabel: z.string().max(8),
  address: z.string().max(200),
  mapUrl: z.string().max(400),
  email: z.email(),
  phone: z.string().max(40),
  whatsapp: z.string().max(40),
  currency: z.string().max(6),
  foundedYear: z.number().int().min(1900).max(2100),
});

export const socialsSchema = z.object({
  instagram: z.string().max(200),
  pinterest: z.string().max(200),
  linkedin: z.string().max(200),
});

export const statsSchema = z.array(z.object({ value: z.number().int().min(0), suffix: z.string().max(4), label: z.string().max(40) })).max(4);

export const heroStageSchema = z.object({
  label: z.string().max(60),
  headline: z.string().max(80),
  body: z.string().max(240),
  tab: z.string().max(20),
});
export const heroSchema = z.object({ stages: z.array(heroStageSchema).length(4) });

export const budgetSchema = z.array(z.string().max(60)).min(2).max(8);

export type StudioSettings = z.infer<typeof studioSchema>;
export type SocialSettings = z.infer<typeof socialsSchema>;
export type StatsSettings = z.infer<typeof statsSchema>;
export type HeroSettings = z.infer<typeof heroSchema>;

export const DEFAULT_SETTINGS = {
  studio: {
    name: "KHAAKA",
    regionTag: "PK",
    subline: "Architecture + Design",
    city: "Karachi",
    country: "Pakistan",
    coordinates: "24°51'36\"N 67°00'36\"E",
    timezone: "Asia/Karachi",
    timezoneLabel: "PKT",
    address: "Studio 4, 21-C Khayaban-e-Ittehad, DHA Phase VI, Karachi 75500",
    mapUrl: "https://maps.google.com/?q=24.8600,67.0100",
    email: "studio@khaaka.pk",
    phone: "+92 21 3500 0000",
    whatsapp: "+92 300 000 0000",
    currency: "PKR",
    foundedYear: 2008,
  } satisfies StudioSettings,
  socials: {
    instagram: "https://instagram.com/",
    pinterest: "https://pinterest.com/",
    linkedin: "https://linkedin.com/",
  } satisfies SocialSettings,
  stats: [
    { value: 18, suffix: "", label: "Years practising" },
    { value: 140, suffix: "+", label: "Homes completed" },
    { value: 12, suffix: "", label: "Design awards" },
  ] satisfies StatsSettings,
  hero: {
    stages: [
      { label: "01 / Concept & Inquiry", headline: "Architecture *shaped by place*", body: "Every commission begins with the ground it stands on: its light, its wind, the line of its view.", tab: "Blueprint" },
      { label: "02 / Spatial Planning", headline: "From line to *living space*", body: "Every boundary drawn, every room weighed against light, view and the way a family actually lives.", tab: "Layout" },
      { label: "03 / The Realised Work", headline: "Rooms gathered *around light*", body: "Cut open, the plan reads as intended: a quiet sequence of rooms, each with its own measure of sky.", tab: "Realised" },
      { label: "04 / Built", headline: "Enduring *residential craft*", body: "A considered practice delivering homes that age beautifully into their landscape.", tab: "Built" },
    ],
  } satisfies HeroSettings,
  budgets: [
    "Under PKR 25M",
    "PKR 25M – 50M",
    "PKR 50M – 100M",
    "PKR 100M – 200M",
    "Above PKR 200M",
    "Not sure yet",
  ],
};

export const SETTING_SCHEMAS = {
  studio: studioSchema,
  socials: socialsSchema,
  stats: statsSchema,
  hero: heroSchema,
  budgets: budgetSchema,
} as const;

export type SettingKey = keyof typeof SETTING_SCHEMAS;
export type Settings = { [K in SettingKey]: z.infer<(typeof SETTING_SCHEMAS)[K]> };

export const getSettings = cache(async (): Promise<Settings> => {
  const out: Settings = structuredClone(DEFAULT_SETTINGS);
  try {
    const rows = await db.siteSetting.findMany();
    for (const row of rows) {
      const key = row.key as SettingKey;
      const schema = SETTING_SCHEMAS[key];
      if (!schema) continue;
      const parsed = schema.safeParse(row.value);
      if (parsed.success) (out as Record<SettingKey, unknown>)[key] = parsed.data;
    }
  } catch (err) {
    console.error("[settings] falling back to defaults:", (err as Error).message);
  }
  return out;
});
