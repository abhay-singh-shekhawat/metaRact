/**
 * True only for environments that are explicitly non-production.
 *
 * This check used to be `process.env.NODE_ENV === "production"`, which meant
 * any unexpected value — a typo like "developments", an empty string, an unset
 * variable in a bare script — silently disabled verification. Anti-abuse has to
 * fail closed, so only a recognised development value opens the bypass.
 */
function isDevLike(): boolean {
  const env = process.env.NODE_ENV;
  return env === "development" || env === "test";
}

export async function verifyTurnstile(token: string | undefined, ip?: string | null): Promise<{ ok: boolean; code?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Fail closed everywhere except development/test, which use the documented bypass.
    if (!isDevLike()) return { ok: false, code: "TURNSTILE_NOT_CONFIGURED" };
    return { ok: true };
  }
  if (!token) return { ok: false, code: "TURNSTILE_MISSING" };
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip || "" }),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success ? { ok: true } : { ok: false, code: "TURNSTILE_FAILED" };
  } catch {
    return { ok: false, code: "TURNSTILE_ERROR" };
  }
}
