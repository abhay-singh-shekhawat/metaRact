import { NextRequest, NextResponse } from "next/server";
import {
  devCredentials,
  setDevAdminCookie,
  clearDevAdminCookie,
  isDevAuthAllowed,
} from "@/lib/auth/devSession";
import { requireAdmin } from "@/server/policies/adminAuth";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ authenticated: false }, { status: auth.status });
  return NextResponse.json({ authenticated: true, email: auth.admin.email, role: auth.admin.role });
}

export async function POST(req: NextRequest) {
  if (!isDevAuthAllowed()) {
    return NextResponse.json({ error: "Local admin sign-in is disabled in this environment." }, { status: 503 });
  }
  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const creds = devCredentials();
  const email = (body.email ?? "").trim().toLowerCase();
  if (
    email !== creds.email ||
    (body.password ?? "") !== creds.password
  ) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 }
    );
  }
  await setDevAdminCookie(email);
  return NextResponse.json({ ok: true, email });
}

export async function DELETE() {
  await clearDevAdminCookie();
  return NextResponse.json({ ok: true });
}
