import { NextResponse } from "next/server";
import { requestId } from "@/lib/observability/log";
import { isSupabaseConfigured, serviceClient } from "@/lib/supabase/server-privileged";

export const runtime = "nodejs";

export async function GET() {
  const rid = requestId();
  let db: string = process.env.NODE_ENV === "production" ? "unknown" : "local-fallback";
  if (isSupabaseConfigured()) {
    try {
      const svc = serviceClient();
      const { error } = await svc.from("enquiries").select("id", { count: "exact", head: true });
      db = error ? "unreachable" : "connected";
    } catch {
      db = "unreachable";
    }
  }
  const ready = process.env.NODE_ENV === "production" ? db === "connected" : true;
  return NextResponse.json(
    { data: { ready, database: db }, requestId: rid },
    { status: ready ? 200 : 503 }
  );
}
