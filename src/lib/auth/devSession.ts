import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "studio_admin_session";

/**
 * Dev/test fallback auth. Available only when explicitly allowed:
 * non-production environments, or production with ALLOW_DEV_ADMIN=true
 * (emergency operator access; never the normal production path).
 */
export function isDevAuthAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ALLOW_DEV_ADMIN === "true";
}

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-only-secret-change-me";
}

export function signSession(email: string): string {
  const norm = email.trim().toLowerCase();
  const sig = createHmac("sha256", secret()).update(norm).digest("hex");
  return `${Buffer.from(norm).toString("base64url")}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  let email: string;
  try {
    email = Buffer.from(b64, "base64url").toString("utf-8");
  } catch {
    return null;
  }
  const expected = createHmac("sha256", secret()).update(email).digest("hex");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return email;
}

export async function getDevAdminEmail(): Promise<string | null> {
  if (!isDevAuthAllowed()) return null;
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setDevAdminCookie(email: string): Promise<void> {
  if (!isDevAuthAllowed()) throw new Error("Dev admin auth is not allowed in this environment.");
  const store = await cookies();
  store.set(COOKIE, signSession(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearDevAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export function devCredentials(): { email: string; password: string } {
  return {
    email: (process.env.ADMIN_DEV_EMAIL || "founder@example.com").toLowerCase(),
    password: process.env.ADMIN_DEV_PASSWORD || "change-me-in-env-local",
  };
}

export const ADMIN_COOKIE = COOKIE;
