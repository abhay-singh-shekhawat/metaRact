"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { allowedTransitions, type EnquiryStatus } from "@/server/policies/statusMachine";

export function AdminDetailClient({
  enquiry,
  isOwner,
}: {
  enquiry: { id: string; status: EnquiryStatus; assignedTo: string | null };
  isOwner: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const options = allowedTransitions(enquiry.status);

  async function post(url: string, body: unknown): Promise<boolean> {
    setBusy(true);
    setMsg(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Action failed. Your input is preserved — fix and retry.");
      return false;
    }
    setMsg("Saved.");
    router.refresh();
    return true;
  }

  return (
    <div className="grid gap-4">
      {msg && <p role="status" aria-live="polite" className="rounded-lg bg-[var(--bg)] border border-[var(--border)] p-3 text-sm">{msg}</p>}
      <form
        className="card flex flex-wrap items-end gap-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          post(`/api/admin/enquiries/${enquiry.id}/status`, {
            status: fd.get("status"),
            reason: fd.get("reason") ?? "",
          });
        }}
      >        <div>
          <label htmlFor="status" className="field-label">Change status (from {enquiry.status})</label>
          <select id="status" name="status" className="field-select !w-auto min-w-[220px]" required defaultValue="">
            <option value="" disabled>Select next status…</option>
            {options.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="min-w-[220px] flex-1">
          <label htmlFor="reason" className="field-label">Reason (required to decline / archive)</label>
          <input id="reason" name="reason" className="field-input" maxLength={2000} placeholder="Internal reason…" />
        </div>
        <button type="submit" disabled={busy || options.length === 0} className="btn-primary !min-h-[44px]">
          {busy ? "Saving…" : "Update status"}
        </button>
        {options.length === 0 && <p className="text-sm text-[var(--ink-2)]">Archived enquiries cannot transition{isOwner ? " (owner restore is a documented manual procedure only)." : "."}</p>}
      </form>

      <form
        className="card flex flex-wrap items-end gap-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          post(`/api/admin/enquiries/${enquiry.id}/assignment`, {
            assignedTo: (fd.get("assignedTo") as string) || null,
          });
        }}
      >
        <div className="min-w-[220px] flex-1">
          <label htmlFor="assignedTo" className="field-label">Assign to (admin email, blank to unassign)</label>
          <input id="assignedTo" name="assignedTo" type="email" className="field-input" defaultValue={enquiry.assignedTo ?? ""} placeholder="founder@example.com" />
        </div>
        <button type="submit" disabled={busy} className="btn-secondary">Save assignment</button>
      </form>

      <form
        className="card grid gap-3 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          const ok = await post(`/api/admin/enquiries/${enquiry.id}/notes`, { body: fd.get("body") });
          if (ok) form.reset();
        }}
      >
        <label htmlFor="note-body" className="field-label">Add internal note (never sent to customers)</label>
        <textarea id="note-body" name="body" className="field-textarea" required minLength={1} maxLength={5000} placeholder="Context for the team…" />
        <button type="submit" disabled={busy} className="btn-secondary w-fit">Add note</button>
      </form>
    </div>
  );
}

export function RetryButton({ notificationId, status }: { notificationId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (status !== "failed") return null;
  return (
    <span>
      <button
        type="button"
        disabled={busy}
        className="btn-secondary !min-h-[32px] !py-1 !px-3 text-xs"
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          const res = await fetch(`/api/admin/notifications/${notificationId}/retry`, { method: "POST" });
          const data = await res.json().catch(() => ({}));
          setBusy(false);
          setMsg(res.ok ? "Retry sent." : ((data as { error?: string }).error ?? "Retry failed."));
          router.refresh();
        }}
      >
        {busy ? "Retrying…" : "Retry"}
      </button>
      {msg && <span role="status" aria-live="polite" className="ml-2 text-xs">{msg}</span>}
    </span>
  );
}
