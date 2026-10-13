import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/policies/adminAuth";
import { getEnquiryUseCase } from "@/server/use-cases/admin";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  const data = await getEnquiryUseCase(id);
  // 404 for missing records; no existence signal to unauthenticated callers
  // (auth is already enforced above).
  if (!data) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
  return NextResponse.json({ data, ok: true });
}
