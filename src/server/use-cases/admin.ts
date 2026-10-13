import { randomUUID } from "crypto";
import { readStore, writeStore } from "@/server/db";
import { isMongoConfigured } from "@/lib/mongodb/client";
import {
  isValidTransition,
  type EnquiryStatus,
} from "@/server/policies/statusMachine";
import type { AdminIdentity } from "@/server/policies/adminAuth";
import { sendEmail } from "@/lib/email/sender";

export interface ListParams {
  status?: string;
  service?: string;
  assignedTo?: string;
  q?: string;
  page: number;
  pageSize: number;
}

export async function listEnquiriesUseCase(params: ListParams) {
  if (isMongoConfigured()) {
    const { listEnquiriesMongo } = await import("@/server/mongo-store");
    return listEnquiriesMongo(params);
  }
  const store = await readStore();
  let rows = [...store.enquiries].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  if (params.status) rows = rows.filter((r) => r.status === params.status);
  if (params.service) rows = rows.filter((r) => r.serviceSlug === params.service);
  if (params.assignedTo === "unassigned")
    rows = rows.filter((r) => !r.assignedTo);
  else if (params.assignedTo)
    rows = rows.filter((r) => r.assignedTo === params.assignedTo);
  if (params.q) {
    const q = params.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.referenceNumber.toLowerCase().includes(q) ||
        r.projectTitle.toLowerCase().includes(q) ||
        r.emailNormalized.includes(q) ||
        r.name.toLowerCase().includes(q)
    );
  }
  const total = rows.length;
  const pageSize = Math.min(Math.max(params.pageSize || 25, 1), 100);
  const page = Math.max(params.page || 1, 1);
  const items = rows.slice((page - 1) * pageSize, page * pageSize);
  const counts: Record<string, number> = {};
  for (const r of store.enquiries) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return { items, total, page, pageSize, counts };
}

export async function getEnquiryUseCase(id: string) {
  if (isMongoConfigured()) {
    const { getEnquiryMongo } = await import("@/server/mongo-store");
    return getEnquiryMongo(id);
  }
  const store = await readStore();
  const enquiry = store.enquiries.find((e) => e.id === id);
  if (!enquiry) return null;
  return {
    enquiry,
    events: store.events
      .filter((e) => e.enquiryId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    notes: store.notes
      .filter((n) => n.enquiryId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    notifications: store.outbox
      .filter((o) => o.enquiryId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

export async function changeStatusUseCase(
  id: string,
  newStatus: EnquiryStatus,
  reason: string,
  admin: AdminIdentity
) {
  if (isMongoConfigured()) {
    const { changeStatusMongo } = await import("@/server/mongo-store");
    return changeStatusMongo(id, newStatus, reason, admin);
  }
  const store = await readStore();
  const enquiry = store.enquiries.find((e) => e.id === id);
  if (!enquiry) return { ok: false as const, status: 404, error: "Not found." };
  if (!isValidTransition(enquiry.status, newStatus)) {
    return {
      ok: false as const,
      status: 409,
      error: `Cannot move from ${enquiry.status} to ${newStatus}.`,
    };
  }
  if ((newStatus === "declined" || newStatus === "archived") && !reason.trim()) {
    return {
      ok: false as const,
      status: 400,
      error: "A reason is required to decline or archive.",
    };
  }
  const from = enquiry.status;
  const now = new Date().toISOString();
  enquiry.status = newStatus;
  enquiry.updatedAt = now;
  if (newStatus === "declined") enquiry.declineReason = reason.slice(0, 2000);
  if (newStatus === "converted") enquiry.convertedAt = now;
  if (newStatus === "archived") enquiry.archivedAt = now;
  store.events.push({
    id: randomUUID(),
    enquiryId: id,
    actorUserId: admin.email,
    eventType: "status_changed",
    fromStatus: from,
    toStatus: newStatus,
    summary: `${admin.email} moved ${enquiry.referenceNumber} from ${from} to ${newStatus}.`,
    metadata: { reason: reason.slice(0, 500) },
    createdAt: now,
  });
  await writeStore(store);
  return { ok: true as const, status: 200 };
}

export async function assignUseCase(
  id: string,
  assignedTo: string | null,
  admin: AdminIdentity
) {
  if (isMongoConfigured()) {
    const { assignMongo } = await import("@/server/mongo-store");
    return assignMongo(id, assignedTo, admin);
  }
  const store = await readStore();
  const enquiry = store.enquiries.find((e) => e.id === id);
  if (!enquiry) return { ok: false as const, status: 404, error: "Not found." };
  const now = new Date().toISOString();
  enquiry.assignedTo = assignedTo && assignedTo.trim() ? assignedTo.trim() : null;
  enquiry.updatedAt = now;
  store.events.push({
    id: randomUUID(),
    enquiryId: id,
    actorUserId: admin.email,
    eventType: assignedTo ? "assigned" : "unassigned",
    fromStatus: null,
    toStatus: null,
    summary: assignedTo
      ? `${admin.email} assigned ${enquiry.referenceNumber} to ${assignedTo}.`
      : `${admin.email} unassigned ${enquiry.referenceNumber}.`,
    metadata: {},
    createdAt: now,
  });
  await writeStore(store);
  return { ok: true as const, status: 200 };
}

export async function addNoteUseCase(
  id: string,
  body: string,
  admin: AdminIdentity
) {
  if (isMongoConfigured()) {
    const { addNoteMongo } = await import("@/server/mongo-store");
    return addNoteMongo(id, body, admin);
  }
  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > 5000) {
    return {
      ok: false as const,
      status: 400,
      error: "Note must be 1–5000 characters.",
    };
  }
  const store = await readStore();
  const enquiry = store.enquiries.find((e) => e.id === id);
  if (!enquiry) return { ok: false as const, status: 404, error: "Not found." };
  const now = new Date().toISOString();
  store.notes.push({
    id: randomUUID(),
    enquiryId: id,
    authorUserId: admin.email,
    body: trimmed,
    createdAt: now,
  });
  store.events.push({
    id: randomUUID(),
    enquiryId: id,
    actorUserId: admin.email,
    eventType: "internal_note_added",
    fromStatus: null,
    toStatus: null,
    summary: `${admin.email} added an internal note.`,
    metadata: {},
    createdAt: now,
  });
  enquiry.updatedAt = now;
  await writeStore(store);
  return { ok: true as const, status: 201 };
}

export async function retryNotificationUseCase(
  notificationId: string,
  _admin: AdminIdentity
) {
  void _admin;
  if (isMongoConfigured()) {
    const {
      peekNotificationMongo,
      claimNotificationMongo,
      completeOutboxJobMongo,
    } = await import("@/server/mongo-store");
    const peeked = await peekNotificationMongo(notificationId);
    if (!peeked) return { ok: false as const, status: 404, error: "Not found." };
    if (peeked.status !== "failed") {
      return {
        ok: false as const,
        status: 409,
        error: "Only failed notifications can be retried.",
      };
    }
    if (peeked.attemptCount >= 5) {
      return {
        ok: false as const,
        status: 429,
        error: "Retry limit reached for this notification.",
      };
    }
    const claimed = await claimNotificationMongo(notificationId);
    if (!claimed) {
      return {
        ok: false as const,
        status: 409,
        error: "Only failed notifications can be retried.",
      };
    }
    const result = await sendEmail({
      to: claimed.recipient,
      subject:
        claimed.notificationType === "team_new_enquiry"
          ? "New project enquiry (retry)"
          : "We received your project enquiry (retry)",
      html: "<p>Retry of a previous notification. See the admin panel for details.</p>",
      type: claimed.notificationType,
    });
    await completeOutboxJobMongo(claimed.id, result);
    const after = await peekNotificationMongo(notificationId);
    return {
      ok: true as const,
      status: 200,
      notificationStatus: (after?.status ?? (result.ok ? "sent" : "failed")) as
        | "sent"
        | "failed",
    };
  }
  const store = await readStore();
  const row = store.outbox.find((o) => o.id === notificationId);
  if (!row) return { ok: false as const, status: 404, error: "Not found." };
  if (row.status !== "failed") {
    return {
      ok: false as const,
      status: 409,
      error: "Only failed notifications can be retried.",
    };
  }
  if (row.attemptCount >= 5) {
    return {
      ok: false as const,
      status: 429,
      error: "Retry limit reached for this notification.",
    };
  }
  row.status = "processing";
  row.attemptCount += 1;
  row.lastAttemptAt = new Date().toISOString();
  const result = await sendEmail({
    to: row.recipient,
    subject:
      row.notificationType === "team_new_enquiry"
        ? "New project enquiry (retry)"
        : "We received your project enquiry (retry)",
    html: "<p>Retry of a previous notification. See the admin panel for details.</p>",
    type: row.notificationType,
  });
  if (result.ok) {
    row.status = "sent";
    row.sentAt = new Date().toISOString();
    row.providerMessageId = result.messageId ?? null;
    row.lastErrorCode = null;
  } else {
    row.status = "failed";
    row.lastErrorCode = result.errorCode ?? "send_failed";
  }
  await writeStore(store);
  return { ok: true as const, status: 200, notificationStatus: row.status };
}
