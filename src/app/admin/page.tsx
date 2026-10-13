import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/policies/adminAuth";
import { listEnquiriesUseCase } from "@/server/use-cases/admin";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/admin/sign-in");
  const data = await listEnquiriesUseCase({ page: 1, pageSize: 8 });
  return (
    <section className="container-studio pt-10">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-bold">Overview</h1>
      <p className="mt-1 text-sm text-[var(--ink-2)]">Signed in as {auth.admin.email} ({auth.admin.role})</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ["New", data.counts.new ?? 0, "/admin/enquiries?status=new"],
          ["Reviewing", data.counts.reviewing ?? 0, "/admin/enquiries?status=reviewing"],
          ["Qualified", data.counts.qualified ?? 0, "/admin/enquiries?status=qualified"],
          ["Total", data.total, "/admin/enquiries"],
        ].map(([label, count, href]) => (
          <Link key={label as string} href={href as string} className="card p-5 hover:shadow-md">
            <p className="text-2xl font-bold">{count as number}</p>
            <p className="text-sm text-[var(--ink-2)]">{label as string}</p>
          </Link>
        ))}
      </div>
      <div className="card mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Recent enquiries</h2>
          <Link href="/admin/enquiries" className="text-sm font-semibold text-[var(--action)]">View all →</Link>
        </div>
        {data.items.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink-2)]">No enquiries yet. New submissions appear here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {data.items.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link href={`/admin/enquiries/${e.id}`} className="font-semibold hover:underline">
                  {e.referenceNumber} — {e.projectTitle}
                </Link>
                <span className="rounded-full bg-[var(--bg)] border border-[var(--border)] px-2 py-0.5 text-xs">{e.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
