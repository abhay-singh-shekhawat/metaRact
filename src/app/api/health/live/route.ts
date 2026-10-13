import { NextResponse } from "next/server";
import { requestId } from "@/lib/observability/log";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ data: { status: "ok" }, requestId: requestId() }, { status: 200 });
}
