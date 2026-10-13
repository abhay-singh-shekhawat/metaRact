import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/policies/adminAuth";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/admin/sign-in");
  return (
    <section className="container-studio max-w-2xl pt-10">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-bold">Settings</h1>
      <div className="card mt-5 space-y-3 p-6 text-sm">
        <p><strong>Signed in as:</strong> {auth.admin.email} ({auth.admin.role})</p>
        <p className="text-[var(--ink-2)]">
          Membership is managed in <code>admin_memberships</code> (production) or via
          <code> ADMIN_DEV_*</code> credentials (local development). Membership changes are
          never available through a browser-editable secrets form.
        </p>
        <p className="text-[var(--ink-2)]">
          Secrets, email domains and anti-abuse keys are configured in environment
          variables and the hosting secret manager — see <code>.env.example</code> and
          <code> scripts/check-production-config.ts</code>.
        </p>
      </div>
    </section>
  );
}
