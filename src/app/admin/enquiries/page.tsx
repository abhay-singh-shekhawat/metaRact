import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/policies/adminAuth";
import { listEnquiriesUseCase } from "@/server/use-cases/admin";
import { enabledServices } from "@/config/services";
import { StatusPill } from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/admin/sign-in");
  const sp = await searchParams;
  const data = await listEnquiriesUseCase({
    status: sp.status || undefined,
    service: sp.service || undefined,
    assignedTo: sp.assignedTo || undefined,
    q: sp.q || undefined,
    page: Number(sp.page || "1"),
    pageSize: Number(sp.pageSize || "25"),
  });
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <section className="container-studio pb-16 pt-8">
      <h1 className="display-h2">Enquiries ({data.total})</h1>

      <form method="get" className="card mt-5 flex flex-wrap gap-3 p-4" role="search">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search ref, title, email…"
          className="field-input !w-auto min-w-[200px] flex-1"
          aria-label="Search enquiries"
        />
        <select name="status" defaultValue={sp.status ?? ""} className="field-select !w-auto" aria-label="Filter by status">
          <option value="">All statuses</option>
          {["new", "reviewing", "awaiting_customer", "qualified", "declined", "converted", "archived"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="service" defaultValue={sp.service ?? ""} className="field-select !w-auto" aria-label="Filter by service">
          <option value="">All services</option>
          {enabledServices().map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.title}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary !min-h-[44px]">
          Filter
        </button>
      </form>

      <div
        className="card mt-4 overflow-x-auto overscroll-x-contain"
        tabIndex={0}
        role="region"
        aria-label="Enquiries table, scroll horizontally to see all columns"
      >
        <table className="w-full min-w-[720px] text-left text-[14px]">
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th className="meta px-4 py-3 font-medium">Reference</th>
              <th className="meta px-4 py-3 font-medium">Title</th>
              <th className="meta px-4 py-3 font-medium">Service</th>
              <th className="meta px-4 py-3 font-medium">Status</th>
              <th className="meta px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((e) => (
              <tr key={e.id} className="border-b border-[var(--line)] transition-colors last:border-0 hover:bg-[var(--surface-2)]">
                <td className="px-4 py-3 font-mono text-[13px]">
                  <Link href={`/admin/enquiries/${e.id}`} className="font-semibold text-[var(--accent)] hover:underline">
                    {e.referenceNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium">{e.projectTitle}</td>
                <td className="px-4 py-3 text-[var(--ink-2)]">{e.serviceSlug}</td>
                <td className="px-4 py-3">
                  <StatusPill status={e.status} />
                </td>
                <td className="px-4 py-3 text-[var(--ink-2)]">
                  {new Date(e.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--ink-2)]">
                  No enquiries match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3 text-[14px]">
        <span className="text-[var(--ink-2)]">
          Page <span className="tabular-nums text-[var(--ink)]">{data.page}</span> of{" "}
          <span className="tabular-nums">{totalPages}</span>
        </span>
        {data.page > 1 && (
          <Link className="btn-secondary !min-h-[36px] !py-1" href={`/admin/enquiries?page=${data.page - 1}`}>
            Previous
          </Link>
        )}
        {data.page < totalPages && (
          <Link className="btn-secondary !min-h-[36px] !py-1" href={`/admin/enquiries?page=${data.page + 1}`}>
            Next
          </Link>
        )}
      </div>
    </section>
  );
}
