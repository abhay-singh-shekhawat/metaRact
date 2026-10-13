import { NextRequest, NextResponse } from "next/server";
import {
  devCredentials,
  setDevAdminCookie,
  clearDevAdminCookie,
  isDevAuthAllowed,
} from "@/lib/auth/devSession";
import { revokeMongoSession } from "@/lib/auth/adminSession";
import { requireAdmin } from "@/server/policies/adminAuth";
import { isMongoConfigured } from "@/lib/mongodb/client";

export const runtime = "nodejs";

// In-memory login throttle: 20 attempts per 10 minutes per client IP.
// Generic responses never reveal whether an email belongs to an admin.
const attempts = new Map<string, number[]>();
function loginAllowed(key: string): boolean {
  const now = Date.now();
  const windowStart = now - 10 * 60 * 1000;
  const recent = (attempts.get(key) ?? []).filter((t) => t > windowStart);
  if (recent.length >= 20) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  if (attempts.size > 5000) attempts.clear();
  attempts.set(key, recent);
  return true;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ authenticated: false }, { status: auth.status });
  return NextResponse.json({ authenticated: true, email: auth.admin.email, role: auth.admin.role });
}

export async function POST(req: NextRequest) {
  if (!loginAllowed(`login:${clientIp(req)}`)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }
  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  if (isMongoConfigured()) {
    const { findActiveAdminByEmail } = await import("@/server/mongo-store");
    const { verifyPassword } = await import("@/lib/auth/password");
    const { createMongoSession } = await import("@/lib/auth/adminSession");
    const { getDb } = await import("@/lib/mongodb/client");
    const user = await findActiveAdminByEmail(email);
    const valid = user && (await verifyPassword(password, user.passwordHash));
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    await createMongoSession(user._id, user.email, user.role);
    try {
      const db = await getDb();
      const { COLLECTIONS } = await import("@/lib/mongodb/collections");
      await db
        .collection(COLLECTIONS.adminUsers)
        .updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date().toISOString() } });
    } catch {
      /* login already succeeded; timestamp is best-effort */
    }
    return NextResponse.json({ ok: true, email: user.email });
  }

  if (!isDevAuthAllowed()) {
    return NextResponse.json({ error: "Local admin sign-in is disabled in this environment." }, { status: 503 });
  }
  const creds = devCredentials();
  if (email !== creds.email || password !== creds.password) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 }
    );
  }
  await setDevAdminCookie(email);
  return NextResponse.json({ ok: true, email });
}

export async function DELETE() {
  await revokeMongoSession();
  await clearDevAdminCookie();
  return NextResponse.json({ ok: true });
}
