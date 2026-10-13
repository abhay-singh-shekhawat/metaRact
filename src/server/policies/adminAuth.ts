import { getDevAdminEmail, isDevAuthAllowed } from "@/lib/auth/devSession";

// Authorization boundary for Phase 1.
//
// Production path: Supabase Auth + admin_memberships (see supabase/migrations).
// Local/dev path (no Supabase credentials configured): signed dev-admin cookie
// issued by /api/admin/session after checking ADMIN_DEV_* env credentials.
// Both paths expose the same { email, role } shape to use cases.
export interface AdminIdentity {
  email: string;
  role: "owner" | "member";
}

export async function requireAdmin(): Promise<
  { ok: true; admin: AdminIdentity } | { ok: false; status: number; error: string }
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const { createServerClient } = await import("@supabase/ssr");
      const { cookies } = await import("next/headers");
      const store = await cookies();
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll: () => store.getAll(),
          setAll: () => {},
        },
      });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        // Membership check via RLS-friendly query; service validation happens in RPC.
        const { data } = await supabase
          .from("admin_memberships")
          .select("role,is_active")
          .eq("user_id", user.id)
          .maybeSingle();
        const row = data as { role: string; is_active: boolean } | null;
        if (row?.is_active && (row.role === "owner" || row.role === "member")) {
          return {
            ok: true,
            admin: { email: user.email, role: row.role as "owner" | "member" },
          };
        }
        return { ok: false, status: 403, error: "Admin membership required." };
      }
      // fall through to dev session when no supabase user
    } catch {
      // fall through to dev session
    }
  }
  const email = isDevAuthAllowed() ? await getDevAdminEmail() : null;
  if (email) return { ok: true, admin: { email, role: "owner" } };
  return { ok: false, status: 401, error: "Authentication required." };
}

let requestCounter = 0;
export function requestId(): string {
  requestCounter += 1;
  return `${Date.now().toString(36)}-${requestCounter.toString(36)}`;
}

export function sanitizeForLog(value: unknown): string {
  if (typeof value !== "string") return String(value);
  return value.replace(/[\r\n]+/g, " ").slice(0, 200);
}
