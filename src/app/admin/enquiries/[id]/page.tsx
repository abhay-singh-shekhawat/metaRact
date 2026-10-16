import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/server/policies/adminAuth";
import { getEnquiryUseCase } from "@/server/use-cases/admin";
import { AdminDetailClient, RetryButton } from "@/components/admin/AdminDetailClient";
import { StatusPill } from "@/components/admin/StatusPill";
import type { EnquiryStatus } from "@/server/policies/statusMachine";

export const dynamic = "force-dynamic";

function Panel({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="display-h3">{title}</h2>
        {aside}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default async function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/admin/sign-in");
  const { id } = await params;
  const data = await getEnquiryUseCase(id);
  if (!data) notFound();
  const { enquiry, events, notes, notifications } = data;

  return (
    <section className="container-studio pb-16 pt-8">
      <nav aria-label="Breadcrumb" className="meta">
        <Link href="/admin/enquiries" className="transition-colors hover:text-[var(--ink)]">
          Enquiries
        </Link>
        <span className="mx-2 text-[var(--ink-3)]">/</span>
        <span aria-current="page" className="text-[var(--ink)]">
          {enquiry.referenceNumber}
        </span>
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="display-h2 max-w-[30ch] text-balance">{enquiry.projectTitle}</h1>
        <StatusPill status={enquiry.status} />
      </div>
      <p className="mt-2 font-mono text-[12.5px] text-[var(--ink-2)]">
        {enquiry.referenceNumber} · {enquiry.serviceSlug}
      </p>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid content-start gap-5">
          <Panel title="Brief">
            <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed">{enquiry.projectSummary}</p>

            {enquiry.referenceUrls.length > 0 && (
              <div className="mt-5 border-t border-[var(--line)] pt-4">
                <h3 className="meta">Reference links</h3>
                <ul className="mt-2 space-y-1.5 text-[14px]">
                  {enquiry.referenceUrls.map((u) => (
                    <li key={u}>
                      <a href={u} target="_blank" rel="noreferrer" className="link-inline break-all">
                        {u}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Object.keys(enquiry.serviceDetails).length > 0 && (
              <div className="mt-5 border-t border-[var(--line)] pt-4">
                <h3 className="meta">Service answers</h3>
                <pre className="mt-2 overflow-x-auto rounded-[10px] border border-[var(--line)] bg-[var(--canvas-2)] p-3 font-mono text-[12px] leading-relaxed">
                  {JSON.stringify(enquiry.serviceDetails, null, 2)}
                </pre>
              </div>
            )}
          </Panel>

          <Panel title="Contact">
            <dl className="grid gap-0 text-[14px]">
              {(
                [
                  ["Name", enquiry.name],
                  ["Email", enquiry.email],
                  ["Org", enquiry.companyOrOrganization],
                  ["Phone", enquiry.phone],
                  ["Prefers", enquiry.preferredContactMethod],
                  ["Budget band", enquiry.budgetBand ? `${enquiry.budgetBand} (planning only)` : null],
                  ["Timeline", enquiry.timelinePreference ? `${enquiry.timelinePreference} (preference only)` : null],
                ] as const
              )
                .filter(([, v]) => Boolean(v))
                .map(([k, v]) => (
                  <div key={k} className="flex flex-wrap gap-x-3 border-b border-[var(--line)] py-2.5 last:border-0">
                    <dt className="w-[110px] shrink-0 text-[var(--ink-2)]">{k}</dt>
                    <dd className="min-w-0 break-words">{v}</dd>
                  </div>
                ))}
            </dl>
          </Panel>

          <AdminDetailClient
            enquiry={{ id: enquiry.id, status: enquiry.status as EnquiryStatus, assignedTo: enquiry.assignedTo }}
            isOwner={auth.admin.role === "owner"}
          />
        </div>

        <div className="grid content-start gap-5">
          <Panel
            title="Notifications"
            aside={<span className="meta">{notifications.length}</span>}
          >
            <ul className="space-y-2 text-[13.5px]">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] p-2.5"
                >
                  <span>
                    <span className="font-medium">{n.notificationType}</span>
                    <span className="mx-1.5 text-[var(--ink-3)]">→</span>
                    <span className="text-[var(--ink-2)]">{n.status}</span>
                    {n.lastErrorCode ? <span className="ml-1 text-[var(--danger)]">({n.lastErrorCode})</span> : null}
                  </span>
                  <RetryButton notificationId={n.id} status={n.status} />
                </li>
              ))}
              {notifications.length === 0 && <li className="text-[var(--ink-2)]">Nothing queued.</li>}
            </ul>
          </Panel>

          <Panel title="Internal notes" aside={<span className="meta">{notes.length}</span>}>
            <ul className="space-y-3 text-[13.5px]">
              {notes.map((n) => (
                <li key={n.id} className="rounded-[10px] bg-[var(--surface-2)] p-3">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <p className="meta mt-2">
                    {n.authorUserId} · {new Date(n.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </p>
                </li>
              ))}
              {notes.length === 0 && <li className="text-[var(--ink-2)]">No notes yet.</li>}
            </ul>
          </Panel>

          <Panel title="Timeline" aside={<span className="meta">{events.length}</span>}>
            <ol className="space-y-3 text-[13.5px]">
              {events.map((e) => (
                <li key={e.id} className="border-l-2 border-[var(--line-2)] pl-3.5">
                  <p>{e.summary}</p>
                  <p className="meta mt-1">
                    {e.eventType} · {new Date(e.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </section>
  );
}
