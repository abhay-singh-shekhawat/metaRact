import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/policies/adminAuth";
import { assignUseCase } from "@/server/use-cases/admin";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  let body: { assignedTo?: string | null } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const result = await assignUseCase(id, body.assignedTo ?? null, auth.admin);
  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
