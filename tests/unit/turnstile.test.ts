import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { isDevAuthAllowed } from "@/lib/auth/devSession";

/**
 * The e2e suite runs with TURNSTILE_SECRET_KEY="" so it can use the documented
 * dev bypass (see tests/e2e/env.ts). That leaves the real siteverify branch
 * uncovered, and it is a security control — so it is covered here instead.
 */

function setEnv(key: "NODE_ENV" | "TURNSTILE_SECRET_KEY" | "ALLOW_DEV_ADMIN", value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[key];
  else env[key] = value;
}

afterEach(() => {
  vi.unstubAllGlobals();
  setEnv("NODE_ENV", "test");
  setEnv("TURNSTILE_SECRET_KEY", undefined);
  setEnv("ALLOW_DEV_ADMIN", undefined);
});

function stubFetch(impl: () => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("verifyTurnstile", () => {
  it("fails closed when no secret is configured outside development", async () => {
    setEnv("NODE_ENV", "production");
    setEnv("TURNSTILE_SECRET_KEY", undefined);
    expect(await verifyTurnstile("any-token")).toEqual({ ok: false, code: "TURNSTILE_NOT_CONFIGURED" });
  });

  it("fails closed on an unrecognised NODE_ENV", async () => {
    // Regression: a misspelled NODE_ENV used to disable verification entirely.
    for (const value of ["developments", "Development", "", "DEVELOPMENT", "prod"]) {
      setEnv("NODE_ENV", value);
      setEnv("TURNSTILE_SECRET_KEY", undefined);
      expect(await verifyTurnstile("any-token"), `NODE_ENV=${JSON.stringify(value)}`).toEqual({
        ok: false,
        code: "TURNSTILE_NOT_CONFIGURED",
      });
    }
  });

  it("allows the documented bypass in development and test without calling out", async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ success: true }));
    for (const value of ["development", "test"]) {
      setEnv("NODE_ENV", value);
      setEnv("TURNSTILE_SECRET_KEY", undefined);
      expect(await verifyTurnstile("")).toEqual({ ok: true });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a missing token when a secret is configured", async () => {
    setEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetchMock = stubFetch(async () => jsonResponse({ success: true }));
    expect(await verifyTurnstile("")).toEqual({ ok: false, code: "TURNSTILE_MISSING" });
    expect(await verifyTurnstile(undefined)).toEqual({ ok: false, code: "TURNSTILE_MISSING" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a token Cloudflare confirms, sending secret, response and remoteip", async () => {
    setEnv("TURNSTILE_SECRET_KEY", "secret-value");
    const fetchMock = stubFetch(async () => jsonResponse({ success: true }));
    expect(await verifyTurnstile("token-abc", "203.0.113.7")).toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(init.method).toBe("POST");
    const body = new URLSearchParams(String(init.body));
    expect(body.get("secret")).toBe("secret-value");
    expect(body.get("response")).toBe("token-abc");
    expect(body.get("remoteip")).toBe("203.0.113.7");
  });

  it("rejects a token Cloudflare declines", async () => {
    setEnv("TURNSTILE_SECRET_KEY", "secret");
    stubFetch(async () => jsonResponse({ success: false, "error-codes": ["invalid-input-response"] }));
    expect(await verifyTurnstile("bad-token")).toEqual({ ok: false, code: "TURNSTILE_FAILED" });
  });

  it("reports a transport failure rather than accepting the token", async () => {
    setEnv("TURNSTILE_SECRET_KEY", "secret");
    stubFetch(async () => {
      throw new Error("network down");
    });
    expect(await verifyTurnstile("token")).toEqual({ ok: false, code: "TURNSTILE_ERROR" });
  });
});

describe("isDevAuthAllowed", () => {
  it("is enabled only for recognised development environments", () => {
    for (const value of ["development", "test"]) {
      setEnv("NODE_ENV", value);
      expect(isDevAuthAllowed(), `NODE_ENV=${value}`).toBe(true);
    }
    // Regression: any non-"production" string used to enable local auth.
    for (const value of ["developments", "", "staging", "Production"]) {
      setEnv("NODE_ENV", value);
      setEnv("ALLOW_DEV_ADMIN", undefined);
      expect(isDevAuthAllowed(), `NODE_ENV=${JSON.stringify(value)}`).toBe(false);
    }
  });

  it("stays available in production only through the explicit escape hatch", () => {
    setEnv("NODE_ENV", "production");
    setEnv("ALLOW_DEV_ADMIN", undefined);
    expect(isDevAuthAllowed()).toBe(false);
    setEnv("ALLOW_DEV_ADMIN", "true");
    expect(isDevAuthAllowed()).toBe(true);
  });
});
