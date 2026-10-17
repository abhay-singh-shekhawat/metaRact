import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The enquiry rate limit is the only anti-abuse control that runs before
 * persistence, and it had no test. Its Upstash path belongs to a third-party
 * service — the e2e suite deliberately runs without one — so the in-process
 * fallback that a local deployment, a CI run and an Upstash outage all fall
 * back to is what is covered here.
 */

// The Upstash client is replaced wholesale: a real one would attempt a network
// call, and the behaviour under test is precisely what happens when that fails.
vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {}
  },
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() {
      return {};
    }
    async limit() {
      throw new Error("network down");
    }
  },
}));

const { checkEnquiryRateLimit, rateLimitKey, _resetMemoryLimiter } = await import("@/lib/rate-limit/limiter");

const URL_KEY = "UPSTASH_REDIS_REST_URL";
const TOKEN_KEY = "UPSTASH_REDIS_REST_TOKEN";

function clearUpstash() {
  delete process.env[URL_KEY];
  delete process.env[TOKEN_KEY];
}

beforeEach(() => {
  clearUpstash();
  _resetMemoryLimiter();
});

afterEach(() => {
  vi.useRealTimers();
  _resetMemoryLimiter();
  clearUpstash();
});

describe("checkEnquiryRateLimit", () => {
  it("allows five submissions per window and rejects the sixth", async () => {
    const key = rateLimitKey("203.0.113.9");

    for (let i = 1; i <= 5; i += 1) {
      expect(await checkEnquiryRateLimit(key), `submission ${i}`).toEqual({ success: true, remaining: 5 - i });
    }

    expect(await checkEnquiryRateLimit(key)).toEqual({ success: false, remaining: 0 });
    // A blocked submission must not extend or reset the window.
    expect(await checkEnquiryRateLimit(key)).toEqual({ success: false, remaining: 0 });
  });

  it("budgets each client independently", async () => {
    const a = rateLimitKey("203.0.113.9");
    const b = rateLimitKey("198.51.100.4");

    for (let i = 0; i < 5; i += 1) await checkEnquiryRateLimit(a);

    expect(await checkEnquiryRateLimit(a)).toEqual({ success: false, remaining: 0 });
    expect(await checkEnquiryRateLimit(b)).toEqual({ success: true, remaining: 4 });
  });

  it("opens a fresh window after ten minutes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const key = rateLimitKey("unknown");

    for (let i = 0; i < 5; i += 1) await checkEnquiryRateLimit(key);
    expect(await checkEnquiryRateLimit(key)).toEqual({ success: false, remaining: 0 });

    vi.setSystemTime(new Date("2026-01-01T00:10:01Z"));
    expect(await checkEnquiryRateLimit(key)).toEqual({ success: true, remaining: 4 });
  });

  it("falls back to the in-process limiter when Upstash is unreachable", async () => {
    // Configured, but every call throws: an outage must not fail open.
    process.env[URL_KEY] = "https://example-upstash.invalid";
    process.env[TOKEN_KEY] = "token";

    const key = rateLimitKey("203.0.113.9");
    for (let i = 1; i <= 5; i += 1) {
      expect(await checkEnquiryRateLimit(key), `submission ${i}`).toEqual({ success: true, remaining: 5 - i });
    }
    expect(await checkEnquiryRateLimit(key)).toEqual({ success: false, remaining: 0 });
  });
});
