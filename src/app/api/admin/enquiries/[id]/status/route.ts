import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/policies/adminAuth";
import { changeStatusUseCase } from "@/server/use-cases/admin";
import { ENQUIRY_STATUSES, type EnquiryStatus } from "@/server/policies/statusMachine";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok || auth.ok !== true)
    return NextResponse.json(
      { error: !auth.ok ? auth.error : "Forbidden" },
      { status: !auth.ok ? auth.status : 403 }
    );
  const { id } = await ctx.params;
  let body: { status?: string; reason?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.status || !(ENQUIRY_STATUSES as readonly string[]).includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  const result = await changeStatusUseCase(
    id,
    body.status as EnquiryStatus,
    body.reason ?? "",
    auth.admin
  );
  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
