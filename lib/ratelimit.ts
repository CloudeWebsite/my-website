import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Window = `${number} ${"s" | "m" | "h"}`;
export type LimitResult = { success: boolean; remaining: number; reset: number };

const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasUpstash ? Redis.fromEnv() : null;
const upstashLimiters = new Map<string, Ratelimit>();

/** In-memory sliding window for local development (single process only). */
const memory = new Map<string, number[]>();

function windowMs(w: Window): number {
  const [n, unit] = w.split(" ") as [string, "s" | "m" | "h"];
  return Number(n) * (unit === "s" ? 1000 : unit === "m" ? 60_000 : 3_600_000);
}

export async function rateLimit(bucket: string, identifier: string, limit: number, window: Window): Promise<LimitResult> {
  if (redis) {
    const key = `${bucket}:${limit}:${window}`;
    let rl = upstashLimiters.get(key);
    if (!rl) {
      rl = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, window), prefix: `rl:${bucket}`, analytics: false });
      upstashLimiters.set(key, rl);
    }
    const r = await rl.limit(identifier);
    return { success: r.success, remaining: r.remaining, reset: r.reset };
  }
  const now = Date.now();
  const ms = windowMs(window);
  const key = `${bucket}:${identifier}`;
  const hits = (memory.get(key) ?? []).filter((t) => now - t < ms);
  const success = hits.length < limit;
  if (success) hits.push(now);
  memory.set(key, hits);
  return { success, remaining: Math.max(0, limit - hits.length), reset: (hits[0] ?? now) + ms };
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "anonymous";
}
