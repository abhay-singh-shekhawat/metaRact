import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/policies/adminAuth";
import { listEnquiriesUseCase } from "@/server/use-cases/admin";
import { StatusPill } from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/admin/sign-in");
  const data = await listEnquiriesUseCase({ page: 1, pageSize: 8 });

  return (
    <section className="container-studio pb-16 pt-8">
      <h1 className="display-h2">Overview</h1>
      <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">
        Signed in as <span className="font-medium text-[var(--ink)]">{auth.admin.email}</span> · role {auth.admin.role}
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["New", data.counts.new ?? 0, "/admin/enquiries?status=new"],
          ["Reviewing", data.counts.reviewing ?? 0, "/admin/enquiries?status=reviewing"],
          ["Qualified", data.counts.qualified ?? 0, "/admin/enquiries?status=qualified"],
          ["Total", data.total, "/admin/enquiries"],
        ].map(([label, count, href]) => (
          <Link key={label as string} href={href as string} className="surface-link p-5">
            <p className="display-h2 tabular-nums">{count as number}</p>
            <p className="meta mt-1.5">{label as string}</p>
          </Link>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="display-h3">Recent enquiries</h2>
          <Link href="/admin/enquiries" className="link-inline text-[14px]">
            View all →
          </Link>
        </div>
        {data.items.length === 0 ? (
          <p className="mt-4 text-[14px] text-[var(--ink-2)]">No enquiries yet. New submissions appear here.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {data.items.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Link
                  href={`/admin/enquiries/${e.id}`}
                  className="text-[14.5px] font-medium text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
                >
                  <span className="font-mono text-[13px] text-[var(--ink-2)]">{e.referenceNumber}</span>
                  <span className="mx-2 text-[var(--ink-3)]">—</span>
                  {e.projectTitle}
                </Link>
                <StatusPill status={e.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
