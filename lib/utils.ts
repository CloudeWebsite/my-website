export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function pad(n: number, size = 2): string {
  return String(n).padStart(size, "0");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function siteUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }): string {
  return new Intl.DateTimeFormat("en-GB", opts).format(typeof d === "string" ? new Date(d) : d);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Split "Architecture *shaped by place*" into plain / italic runs. */
export function parseEmphasis(input: string): Array<{ text: string; em: boolean }> {
  const out: Array<{ text: string; em: boolean }> = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    if (m.index > last) out.push({ text: input.slice(last, m.index), em: false });
    out.push({ text: m[1], em: true });
    last = m.index + m[0].length;
  }
  if (last < input.length) out.push({ text: input.slice(last), em: false });
  return out;
}

export const PROJECT_TYPE_LABEL: Record<string, string> = {
  RESIDENTIAL: "Residential",
  RENOVATION: "Renovation",
  INTERIORS: "Interiors",
  LANDSCAPE: "Landscape",
};
