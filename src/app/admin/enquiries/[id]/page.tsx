import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/server/policies/adminAuth";
import { getEnquiryUseCase } from "@/server/use-cases/admin";
import { AdminDetailClient, RetryButton } from "@/components/admin/AdminDetailClient";
import type { EnquiryStatus } from "@/server/policies/statusMachine";

export const dynamic = "force-dynamic";

export default async function AdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/admin/sign-in");
  const { id } = await params;
  const data = await getEnquiryUseCase(id);
  if (!data) notFound();
  const { enquiry, events, notes, notifications } = data;
  return (
    <section className="container-studio pt-10">
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--ink-2)]">
        <Link href="/admin/enquiries" className="hover:underline">Enquiries</Link> {" / "}
        <span aria-current="page">{enquiry.referenceNumber}</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{enquiry.projectTitle}</h1>
        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-bold">{enquiry.status}</span>
      </div>
      <p className="mt-1 font-mono text-xs text-[var(--ink-2)]">{enquiry.referenceNumber} · {enquiry.serviceSlug}</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid content-start gap-4">
          <div className="card p-6">
            <h2 className="font-bold">Brief</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{enquiry.projectSummary}</p>
            {enquiry.referenceUrls.length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-bold">Reference links</h3>
                <ul className="mt-1 space-y-1 text-sm">
                  {enquiry.referenceUrls.map((u) => (
                    <li key={u}><a href={u} target="_blank" rel="noreferrer" className="text-[var(--action)] underline break-all">{u}</a></li>
                  ))}
                </ul>
              </div>
            )}
            {Object.keys(enquiry.serviceDetails).length > 0 && (
              <div className="mt-3">
                <h3 className="text-sm font-bold">Service answers</h3>
                <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--bg)] p-3 text-xs">{JSON.stringify(enquiry.serviceDetails, null, 2)}</pre>
              </div>
            )}
          </div>
          <div className="card p-6">
            <h2 className="font-bold">Contact</h2>
            <dl className="mt-2 grid gap-1 text-sm">
              <div className="flex gap-2"><dt className="text-[var(--ink-2)]">Name:</dt><dd>{enquiry.name}</dd></div>
              <div className="flex gap-2"><dt className="text-[var(--ink-2)]">Email:</dt><dd>{enquiry.email}</dd></div>
              {enquiry.companyOrOrganization && <div className="flex gap-2"><dt className="text-[var(--ink-2)]">Org:</dt><dd>{enquiry.companyOrOrganization}</dd></div>}
              {enquiry.phone && <div className="flex gap-2"><dt className="text-[var(--ink-2)]">Phone:</dt><dd>{enquiry.phone}</dd></div>}
              <div className="flex gap-2"><dt className="text-[var(--ink-2)]">Prefers:</dt><dd>{enquiry.preferredContactMethod}</dd></div>
              {enquiry.budgetBand && <div className="flex gap-2"><dt className="text-[var(--ink-2)]">Budget band:</dt><dd>{enquiry.budgetBand} (planning only)</dd></div>}
              {enquiry.timelinePreference && <div className="flex gap-2"><dt className="text-[var(--ink-2)]">Timeline:</dt><dd>{enquiry.timelinePreference} (preference only)</dd></div>}
            </dl>
          </div>
          <AdminDetailClient
            enquiry={{ id: enquiry.id, status: enquiry.status as EnquiryStatus, assignedTo: enquiry.assignedTo }}
            isOwner={auth.admin.role === "owner"}
          />
        </div>
        <div className="grid content-start gap-4">
          <div className="card p-6">
            <h2 className="font-bold">Notifications</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-2">
                  <span>{n.notificationType} → {n.status}{n.lastErrorCode ? ` (${n.lastErrorCode})` : ""}</span>
                  <RetryButton notificationId={n.id} status={n.status} />
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h2 className="font-bold">Internal notes ({notes.length})</h2>
            <ul className="mt-2 space-y-3 text-sm">
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-[var(--bg)] p-3">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <p className="mt-1 text-xs text-[var(--ink-2)]">{n.authorUserId} · {new Date(n.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                </li>
              ))}
              {notes.length === 0 && <li className="text-[var(--ink-2)]">No notes yet.</li>}
            </ul>
          </div>
          <div className="card p-6">
            <h2 className="font-bold">Timeline ({events.length})</h2>
            <ol className="mt-2 space-y-2 text-sm">
              {events.map((e) => (
                <li key={e.id} className="border-l-2 border-[var(--border)] pl-3">
                  <p>{e.summary}</p>
                  <p className="text-xs text-[var(--ink-2)]">{e.eventType} · {new Date(e.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
