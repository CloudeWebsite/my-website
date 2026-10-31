"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError as NextAuthError } from "next-auth";
import type { Prisma } from "@prisma/client";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { AuthError, requireUser } from "@/lib/guard";
import { isUniqueViolation } from "@/lib/reference";
import { SETTING_SCHEMAS, type SettingKey } from "@/lib/settings";
import { removePublic } from "@/lib/storage";
import { IMAGE_KINDS, postSchema, projectImageSchema, projectSchema, serviceSchema, teamSchema, testimonialSchema, userSchema } from "@/lib/validation";

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof AuthError) return { ok: false, error: err.message };
  if (isUniqueViolation(err)) return { ok: false, error: "That slug or email is already in use." };
  console.error("[admin action]", err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

function zodFail(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>): { ok: false; error: string; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  for (const i of issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
  return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
}

function refreshPublic(...paths: string[]) {
  for (const p of ["/", ...paths]) revalidatePath(p);
}

/* ───────────────────────── auth ───────────────────────── */

export async function loginAction(_prev: { error?: string; email?: string } | undefined, form: FormData): Promise<{ error?: string; email?: string }> {
  const email = String(form.get("email") ?? "").slice(0, 200);
  try {
    await signIn("credentials", { email, password: String(form.get("password") ?? ""), redirect: false });
  } catch (err) {
    if (err instanceof NextAuthError) return { error: "Incorrect email or password, or too many attempts. Please wait and try again.", email };
    throw err;
  }
  const next = String(form.get("next") ?? "/admin");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}

/* ───────────────────────── projects ───────────────────────── */

export async function saveProject(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser("EDITOR");
    const parsed = projectSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error.issues);
    const data = { ...parsed.data, body: parsed.data.body as Prisma.InputJsonObject };
    let project;
    if (id) {
      const before = await db.project.findUnique({ where: { id }, select: { slug: true } });
      project = await db.project.update({ where: { id }, data });
      if (before && before.slug !== project.slug) revalidatePath(`/projects/${before.slug}`);
    } else {
      const max = await db.project.aggregate({ _max: { order: true } });
      project = await db.project.create({ data: { ...data, order: (max._max.order ?? -1) + 1 } });
    }
    refreshPublic("/projects", `/projects/${project.slug}`, "/admin/projects");
    return { ok: true, data: { id: project.id }, message: "Project saved." };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  try {
    await requireUser("ADMIN");
    const p = await db.project.findUnique({ where: { id }, include: { images: true } });
    if (!p) return { ok: false, error: "Project not found." };
    await db.project.update({ where: { id }, data: { coverImageId: null } });
    await db.project.delete({ where: { id } });
    await Promise.all(p.images.map((i) => removePublic(i.url)));
    refreshPublic("/projects", `/projects/${p.slug}`, "/admin/projects");
    return { ok: true, message: "Project deleted." };
  } catch (err) {
    return fail(err);
  }
}

export async function toggleProject(id: string, field: "featured" | "published", value: boolean): Promise<ActionResult> {
  try {
    await requireUser("EDITOR");
    const data = field === "featured" ? { featured: value } : { status: value ? ("PUBLISHED" as const) : ("DRAFT" as const) };
    const p = await db.project.update({ where: { id }, data });
    refreshPublic("/projects", `/projects/${p.slug}`, "/admin/projects");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

async function reorder(model: "project" | "projectImage" | "service" | "teamMember" | "testimonial", ids: string[]) {
  if (!Array.isArray(ids) || ids.some((i) => typeof i !== "string")) throw new Error("Invalid order");
  const ops = ids.map((id, order) => {
    switch (model) {
      case "project":
        return db.project.update({ where: { id }, data: { order } });
      case "projectImage":
        return db.projectImage.update({ where: { id }, data: { order } });
      case "service":
        return db.service.update({ where: { id }, data: { order } });
      case "teamMember":
        return db.teamMember.update({ where: { id }, data: { order } });
      case "testimonial":
        return db.testimonial.update({ where: { id }, data: { order } });
    }
  });
  await db.$transaction(ops);
}

export async function reorderProjects(ids: string[]): Promise<ActionResult> {
  try {
    await requireUser("EDITOR");
    await reorder("project", ids);
    refreshPublic("/projects", "/admin/projects");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/* ───────────────────────── project images ───────────────────────── */

export async function addProjectImage(projectId: string, input: { url: string; width: number; height: number; alt: string; caption?: string; kind?: string }): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser("EDITOR");
    const meta = projectImageSchema.safeParse({ alt: input.alt, caption: input.caption ?? "", kind: input.kind ?? "GALLERY" });
    if (!meta.success) return zodFail(meta.error.issues);
    if (typeof input.url !== "string" || !(input.url.startsWith("/uploads/") || input.url.startsWith("https://"))) return { ok: false, error: "Invalid image URL." };
    const count = await db.projectImage.count({ where: { projectId } });
    const img = await db.projectImage.create({
      data: { projectId, url: input.url, width: Math.max(1, Math.round(input.width)), height: Math.max(1, Math.round(input.height)), order: count, ...meta.data, caption: meta.data.caption ?? null },
    });
    const project = await db.project.findUnique({ where: { id: projectId }, select: { coverImageId: true, slug: true } });
    if (project && !project.coverImageId) await db.project.update({ where: { id: projectId }, data: { coverImageId: img.id } });
    refreshPublic(`/projects/${project?.slug ?? ""}`, "/projects");
    return { ok: true, data: { id: img.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function updateProjectImage(id: string, input: { alt: string; caption?: string; kind: string }): Promise<ActionResult> {
  try {
    await requireUser("EDITOR");
    const meta = projectImageSchema.safeParse({ alt: input.alt, caption: input.caption ?? "", kind: input.kind });
    if (!meta.success) return zodFail(meta.error.issues);
    if (!(IMAGE_KINDS as readonly string[]).includes(input.kind)) return { ok: false, error: "Invalid kind." };
    const img = await db.projectImage.update({ where: { id }, data: { ...meta.data, caption: meta.data.caption ?? null }, include: { project: { select: { slug: true } } } });
    refreshPublic(`/projects/${img.project.slug}`);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteProjectImage(id: string): Promise<ActionResult> {
  try {
    await requireUser("EDITOR");
    const img = await db.projectImage.delete({ where: { id }, include: { project: { select: { slug: true } } } });
    if (img.url.startsWith("/uploads/") || img.url.startsWith("https://")) await removePublic(img.url);
    refreshPublic(`/projects/${img.project.slug}`, "/projects");
    return { ok: true, message: "Image removed." };
  } catch (err) {
    return fail(err);
  }
}

export async function setCoverImage(projectId: string, imageId: string): Promise<ActionResult> {
  try {
    await requireUser("EDITOR");
    const img = await db.projectImage.findFirst({ where: { id: imageId, projectId } });
    if (!img) return { ok: false, error: "Image not found." };
    const p = await db.project.update({ where: { id: projectId }, data: { coverImageId: imageId } });
    refreshPublic("/projects", `/projects/${p.slug}`);
    return { ok: true, message: "Cover updated." };
  } catch (err) {
    return fail(err);
  }
}

export async function reorderProjectImages(ids: string[]): Promise<ActionResult> {
  try {
    await requireUser("EDITOR");
    await reorder("projectImage", ids);
    refreshPublic("/projects");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/* ───────────────────────── services / team / testimonials ───────────────────────── */

type Collection = "services" | "team" | "testimonials";

export async function saveEntity(kind: Collection, id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser("EDITOR");
    let saved: { id: string };
    if (kind === "services") {
      const p = serviceSchema.safeParse(input);
      if (!p.success) return zodFail(p.error.issues);
      const data = { ...p.data, imageUrl: p.data.imageUrl ?? null };
      saved = id ? await db.service.update({ where: { id }, data }) : await db.service.create({ data: { ...data, order: await db.service.count() } });
      refreshPublic("/services");
    } else if (kind === "team") {
      const p = teamSchema.safeParse(input);
      if (!p.success) return zodFail(p.error.issues);
      const data = { ...p.data, photoUrl: p.data.photoUrl ?? null };
      saved = id ? await db.teamMember.update({ where: { id }, data }) : await db.teamMember.create({ data: { ...data, order: await db.teamMember.count() } });
      refreshPublic("/studio");
    } else {
      const p = testimonialSchema.safeParse(input);
      if (!p.success) return zodFail(p.error.issues);
      const data = { ...p.data, projectId: p.data.projectId ?? null };
      saved = id ? await db.testimonial.update({ where: { id }, data }) : await db.testimonial.create({ data: { ...data, order: await db.testimonial.count() } });
      refreshPublic("/studio");
    }
    revalidatePath(`/admin/${kind}`);
    return { ok: true, data: { id: saved.id }, message: "Saved." };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteEntity(kind: Collection, id: string): Promise<ActionResult> {
  try {
    await requireUser("ADMIN");
    if (kind === "services") await db.service.delete({ where: { id } });
    else if (kind === "team") await db.teamMember.delete({ where: { id } });
    else await db.testimonial.delete({ where: { id } });
    refreshPublic("/services", "/studio", `/admin/${kind}`);
    return { ok: true, message: "Deleted." };
  } catch (err) {
    return fail(err);
  }
}

export async function reorderEntities(kind: Collection, ids: string[]): Promise<ActionResult> {
  try {
    await requireUser("EDITOR");
    await reorder(kind === "services" ? "service" : kind === "team" ? "teamMember" : "testimonial", ids);
    refreshPublic("/services", "/studio", `/admin/${kind}`);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/* ───────────────────────── journal ───────────────────────── */

export async function savePost(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireUser("EDITOR");
    const parsed = postSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error.issues);
    const d = parsed.data;
    const publishedAt = d.status === "PUBLISHED" ? (d.publishedAt ?? new Date()) : (d.publishedAt ?? null);
    const data = { ...d, body: d.body as Prisma.InputJsonObject, coverUrl: d.coverUrl ?? null, publishedAt };
    const post = id ? await db.post.update({ where: { id }, data }) : await db.post.create({ data });
    refreshPublic("/journal", `/journal/${post.slug}`, "/admin/journal");
    return { ok: true, data: { id: post.id }, message: "Entry saved." };
  } catch (err) {
    return fail(err);
  }
}

export async function deletePost(id: string): Promise<ActionResult> {
  try {
    await requireUser("ADMIN");
    const p = await db.post.delete({ where: { id } });
    refreshPublic("/journal", `/journal/${p.slug}`, "/admin/journal");
    return { ok: true, message: "Entry deleted." };
  } catch (err) {
    return fail(err);
  }
}

/* ───────────────────────── settings ───────────────────────── */

export async function saveSetting(key: SettingKey, value: unknown): Promise<ActionResult> {
  try {
    await requireUser("ADMIN");
    const schema = SETTING_SCHEMAS[key];
    if (!schema) return { ok: false, error: "Unknown setting." };
    const parsed = schema.safeParse(value);
    if (!parsed.success) return zodFail(parsed.error.issues);
    await db.siteSetting.upsert({ where: { key }, create: { key, value: parsed.data as Prisma.InputJsonValue }, update: { value: parsed.data as Prisma.InputJsonValue } });
    revalidatePath("/", "layout");
    return { ok: true, message: "Settings saved." };
  } catch (err) {
    return fail(err);
  }
}

/* ───────────────────────── enquiries ───────────────────────── */

export async function deleteEnquiry(id: string): Promise<ActionResult> {
  try {
    await requireUser("ADMIN");
    await db.enquiry.delete({ where: { id } });
    revalidatePath("/admin/enquiries");
    revalidatePath("/admin");
    return { ok: true, message: "Enquiry deleted." };
  } catch (err) {
    return fail(err);
  }
}

/* ───────────────────────── users ───────────────────────── */

export async function saveUser(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await requireUser("ADMIN");
    const parsed = userSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error.issues);
    const { password, ...rest } = parsed.data;
    const data = { ...rest, email: rest.email.toLowerCase() };
    if (id === me.id && data.role !== "ADMIN") return { ok: false, error: "You can't remove your own admin role." };
    let user;
    if (id) {
      user = await db.user.update({ where: { id }, data: { ...data, ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) } });
    } else {
      if (!password) return { ok: false, error: "Set a password for the new user.", fieldErrors: { password: "Required for new users." } };
      user = await db.user.create({ data: { ...data, passwordHash: await bcrypt.hash(password, 12) } });
    }
    revalidatePath("/admin/users");
    return { ok: true, data: { id: user.id }, message: "User saved." };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    const me = await requireUser("ADMIN");
    if (id === me.id) return { ok: false, error: "You can't delete your own account." };
    await db.user.delete({ where: { id } });
    revalidatePath("/admin/users");
    return { ok: true, message: "User deleted." };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteSubscriber(id: string): Promise<ActionResult> {
  try {
    await requireUser("ADMIN");
    await db.subscriber.delete({ where: { id } });
    revalidatePath("/admin/subscribers");
    return { ok: true, message: "Subscriber removed." };
  } catch (err) {
    return fail(err);
  }
}
