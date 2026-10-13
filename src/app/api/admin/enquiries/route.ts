import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/policies/adminAuth";
import { listEnquiriesUseCase } from "@/server/use-cases/admin";
import { ENQUIRY_STATUSES } from "@/server/policies/statusMachine";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const service = url.searchParams.get("serviceSlug") || url.searchParams.get("service") || undefined;
  const assignedTo = url.searchParams.get("assignedTo") || undefined;
  const q = url.searchParams.get("q") || undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "25") || 25));

  if (status && !(ENQUIRY_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status filter." }, { status: 422 });
  }
  const allowedParams = ["status", "serviceSlug", "service", "assignedTo", "q", "page", "pageSize"];
  let badParam: string | null = null;
  url.searchParams.forEach((_v, k) => {
    if (!badParam && !allowedParams.includes(k)) badParam = k;
  });
  if (badParam) {
    return NextResponse.json({ error: `Unsupported filter: ${badParam}` }, { status: 422 });
  }

  const data = await listEnquiriesUseCase({ status, service, assignedTo, q, page, pageSize });
  return NextResponse.json({ data, ok: true });
}
