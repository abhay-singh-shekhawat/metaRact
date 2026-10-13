import { NextResponse } from "next/server";
import { requestId } from "@/lib/observability/log";
import { isMongoConfigured, pingDb } from "@/lib/mongodb/client";

export const runtime = "nodejs";

export async function GET() {
  const rid = requestId();
  let db: string = process.env.NODE_ENV === "production" ? "unknown" : "local-fallback";
  if (isMongoConfigured()) {
    db = (await pingDb()) ? "connected" : "unreachable";
  }
  const ready = process.env.NODE_ENV === "production" ? db === "connected" : true;
  return NextResponse.json(
    { data: { ready, database: db }, requestId: rid },
    { status: ready ? 200 : 503 }
  );
}
