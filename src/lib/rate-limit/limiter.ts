import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Decision = { success: boolean; remaining: number };

const memory = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;

let upstashLimiter: Ratelimit | null = null;
function getUpstash(): Ratelimit | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  )
    return null;
  if (!upstashLimiter) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    upstashLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(LIMIT, "10 m"),
      analytics: false,
      prefix: "enquiry",
    });
  }
  return upstashLimiter;
}

export async function checkEnquiryRateLimit(key: string): Promise<Decision> {
  const upstash = getUpstash();
  if (upstash) {
    try {
      const r = await upstash.limit(key);
      return { success: r.success, remaining: r.remaining };
    } catch {
      // fall through to memory limiter rather than failing open silently
    }
  }
  const now = Date.now();
  // Prune stale buckets so the dev fallback cannot grow without bound.
  if (memory.size > 5000) {
    for (const [k, v] of memory) {
      if (v.resetAt <= now) memory.delete(k);
      if (memory.size <= 4000) break;
    }
    if (memory.size > 5000) memory.clear();
  }
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true, remaining: LIMIT - 1 };
  }
  entry.count += 1;
  if (entry.count > LIMIT) return { success: false, remaining: 0 };
  return { success: true, remaining: LIMIT - entry.count };
}

export function rateLimitKey(ip: string): string {
  return `enquiry:${ip || "unknown"}`;
}

export function _resetMemoryLimiter(): void {
  memory.clear();
}
