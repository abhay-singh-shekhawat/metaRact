export async function verifyTurnstile(token: string | undefined, ip?: string | null): Promise<{ ok: boolean; code?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const isProd = process.env.NODE_ENV === "production";
  if (!secret) {
    // Fail closed in production, open in dev/test with documented bypass
    if (isProd) return { ok: false, code: "TURNSTILE_NOT_CONFIGURED" };
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
