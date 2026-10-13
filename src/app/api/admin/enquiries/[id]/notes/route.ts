import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/policies/adminAuth";
import { addNoteUseCase } from "@/server/use-cases/admin";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await ctx.params;
  let body: { body?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const result = await addNoteUseCase(id, String(body.body ?? ""), auth.admin);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true }, { status: 201 });
}
