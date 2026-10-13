import { getDevAdminEmail, isDevAuthAllowed } from "@/lib/auth/devSession";
import { getMongoSessionAdmin } from "@/lib/auth/adminSession";
import { isMongoConfigured } from "@/lib/mongodb/client";

// Authorization boundary.
//
// Production path: MongoDB-backed admin users + stateful sessions
// (see src/lib/mongodb/collections.ts, src/lib/auth/adminSession.ts).
// Local path (no MONGODB_URI configured): signed dev-admin cookie
// issued by /api/admin/session after checking ADMIN_DEV_* env credentials.
// Both paths expose the same { email, role } shape to use cases.
export interface AdminIdentity {
  email: string;
  role: "owner" | "member";
}

export async function requireAdmin(): Promise<
  { ok: true; admin: AdminIdentity } | { ok: false; status: number; error: string }
> {
  if (isMongoConfigured()) {
    const sessionAdmin = await getMongoSessionAdmin();
    if (sessionAdmin) {
      return {
        ok: true,
        admin: { email: sessionAdmin.email, role: sessionAdmin.role },
      };
    }
    // Fall through to the dev session so local operators keep working in
    // non-production environments before the first admin is bootstrapped.
    const devEmail = isDevAuthAllowed() ? await getDevAdminEmail() : null;
    if (devEmail) return { ok: true, admin: { email: devEmail, role: "owner" } };
    return { ok: false, status: 401, error: "Authentication required." };
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
