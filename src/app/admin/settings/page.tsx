import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/policies/adminAuth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/admin/sign-in");

  return (
    <section className="container-studio max-w-3xl pb-16 pt-8">
      <h1 className="display-h2">Settings</h1>
      <p className="mt-2 text-[14.5px] text-[var(--ink-2)]">
        Read-only in this release. Membership and secrets are configured outside the browser.
      </p>

      <div className="card mt-6 divide-y divide-[var(--line)]">
        <div className="p-6">
          <p className="meta">Signed in</p>
          <p className="mt-2 text-[14.5px]">
            <span className="font-medium">{auth.admin.email}</span>
            <span className="text-[var(--ink-2)]"> · role {auth.admin.role}</span>
          </p>
        </div>

        <div className="p-6">
          <p className="meta">Membership</p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ink-2)]">
            Managed in <code className="rounded bg-[var(--canvas-2)] px-1.5 py-0.5 font-mono text-[13px]">admin_memberships</code>{" "}
            (production) or via{" "}
            <code className="rounded bg-[var(--canvas-2)] px-1.5 py-0.5 font-mono text-[13px]">ADMIN_DEV_*</code> credentials
            (local development). Membership changes are never available through a browser-editable secrets form.
          </p>
        </div>

        <div className="p-6">
          <p className="meta">Secrets &amp; anti-abuse keys</p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ink-2)]">
            Configured in environment variables and the hosting secret manager — see{" "}
            <code className="rounded bg-[var(--canvas-2)] px-1.5 py-0.5 font-mono text-[13px]">.env.example</code> and{" "}
            <code className="rounded bg-[var(--canvas-2)] px-1.5 py-0.5 font-mono text-[13px]">
              scripts/check-production-config.ts
            </code>
            . The production config check fails closed when anything required is missing.
          </p>
        </div>
      </div>
    </section>
  );
}
