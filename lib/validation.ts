import { z } from "zod";

/* ───────────────────────── Enquiry (shared client + server) ───────────────────────── */

export const PROJECT_TYPES = ["New home", "Renovation", "Interior", "Masterplan", "Other"] as const;
export const OWNS_LAND = ["Yes", "No", "In progress"] as const;
export const CONTACT_METHODS = ["Email", "Phone", "WhatsApp"] as const;

export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_FILE_EXT = ".pdf,.jpg,.jpeg,.png,.webp";

const trimmed = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max, `Keep it under ${max} characters.`);

export const enquiryStepSchemas = [
  z.object({ projectType: z.enum(PROJECT_TYPES, { message: "Choose the kind of project." }) }),
  z.object({
    location: trimmed(2, 160, "Tell us where the site is."),
    ownsLand: z.enum(OWNS_LAND, { message: "Let us know about the land." }),
  }),
  z.object({ budgetRange: trimmed(1, 60, "Choose a budget range.") }),
  z.object({
    timeline: z
      .string()
      .regex(/^\d{4}-\d{2}(-\d{2})?$/, "Choose an ideal start date.")
      .refine((v) => {
        const d = new Date(v.length === 7 ? `${v}-01` : v);
        const now = new Date();
        now.setMonth(now.getMonth() - 1);
        return d >= now;
      }, "That date has already passed."),
  }),
  z.object({ description: trimmed(20, 4000, "A few sentences (at least 20 characters) help us prepare.") }),
  z.object({
    name: trimmed(2, 120, "Your name, please."),
    email: z.email("That email doesn't look right.").max(200),
    phone: z
      .string()
      .trim()
      .min(7, "Add a phone or WhatsApp number.")
      .max(30)
      .regex(/^[+()\d\s-]+$/, "Digits, spaces and + only."),
    contactMethod: z.enum(CONTACT_METHODS, { message: "How should we reach you?" }),
  }),
] as const;

export const enquirySchema = enquiryStepSchemas[0]
  .extend(enquiryStepSchemas[1].shape)
  .extend(enquiryStepSchemas[2].shape)
  .extend(enquiryStepSchemas[3].shape)
  .extend(enquiryStepSchemas[4].shape)
  .extend(enquiryStepSchemas[5].shape);

export type EnquiryInput = z.infer<typeof enquirySchema>;

export function validateFiles(files: ReadonlyArray<{ size: number; type: string; name: string }>): string | null {
  if (files.length > MAX_FILES) return `Up to ${MAX_FILES} files, please.`;
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) return `${f.name} is larger than 10 MB.`;
    if (!(ACCEPTED_FILE_TYPES as readonly string[]).includes(f.type)) return `${f.name} must be a PDF, JPG, PNG or WebP.`;
  }
  return null;
}

/* ───────────────────────── Newsletter ───────────────────────── */

export const newsletterSchema = z.object({
  email: z.email("That email doesn't look right.").max(200),
  website: z.string().max(0).optional(), // honeypot
});

/* ───────────────────────── Admin ───────────────────────── */

export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "PROPOSAL", "WON", "LOST"] as const;
export const enquiryPatchSchema = z
  .object({
    status: z.enum(ENQUIRY_STATUSES).optional(),
    notes: z.string().max(10000).optional(),
  })
  .refine((v) => v.status !== undefined || v.notes !== undefined, "Nothing to update.");

const docSchema = z.object({ type: z.literal("doc"), content: z.array(z.unknown()).optional() }).passthrough();

export const PROJECT_TYPE_ENUM = ["RESIDENTIAL", "RENOVATION", "INTERIORS", "LANDSCAPE"] as const;
export const PUBLISH_STATUS = ["PUBLISHED", "DRAFT"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only.");

export const projectSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: slugSchema,
  location: z.string().trim().min(2).max(160),
  year: z.coerce.number().int().min(1950).max(2100),
  type: z.enum(PROJECT_TYPE_ENUM),
  status: z.enum(PUBLISH_STATUS),
  featured: z.boolean(),
  lead: z.string().trim().min(10).max(400),
  body: docSchema,
  siteArea: optionalText(60),
  floorArea: optionalText(60),
  client: optionalText(120),
  builder: optionalText(120),
  photographer: optionalText(120),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const IMAGE_KINDS = ["GALLERY", "PLAN", "BEFORE", "AFTER"] as const;
export const projectImageSchema = z.object({
  alt: z.string().trim().min(3, "Alt text is required for accessibility.").max(200),
  caption: optionalText(240),
  kind: z.enum(IMAGE_KINDS),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(2).max(80),
  subtitle: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1200),
  deliverables: z.array(z.string().trim().min(1).max(80)).max(6),
  imageUrl: optionalText(500),
});

export const teamSchema = z.object({
  name: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(800),
  photoUrl: optionalText(500),
});

export const testimonialSchema = z.object({
  quote: z.string().trim().min(10).max(600),
  clientName: z.string().trim().min(2).max(120),
  projectId: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  approved: z.boolean(),
});

export const postSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: slugSchema,
  excerpt: z.string().trim().min(10).max(400),
  body: docSchema,
  coverUrl: optionalText(500),
  category: z.string().trim().min(2).max(40),
  status: z.enum(PUBLISH_STATUS),
  publishedAt: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : new Date(v)))
    .nullable()
    .optional(),
});

export const userSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(200),
  role: z.enum(["ADMIN", "EDITOR"]),
  password: z.string().min(10, "At least 10 characters.").max(200).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});
