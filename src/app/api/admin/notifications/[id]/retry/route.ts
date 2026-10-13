import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/policies/adminAuth";
import { retryNotificationUseCase } from "@/server/use-cases/admin";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  const result = await retryNotificationUseCase(id, auth.admin);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, notificationStatus: result.notificationStatus });
}
