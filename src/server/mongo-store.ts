import "server-only";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/client";
import {
  COLLECTIONS,
  ensureIndexes,
  type AdminUserDoc,
  type CounterDoc,
  type EnquiryDoc,
  type EnquiryEventDoc,
  type InternalNoteDoc,
  type OutboxDoc,
} from "@/lib/mongodb/collections";
import type {
  EnquiryRecord,
  EnquiryEvent,
  InternalNote,
  OutboxRecord,
} from "@/server/db";
import { generateReference } from "@/lib/security/fingerprint";
import { runAtomically, type MongoSession } from "@/lib/mongodb/transaction";
import {
  isValidTransition,
  type EnquiryStatus,
} from "@/server/policies/statusMachine";

/* ---------- id mapping ---------- */

function oid(id: string): ObjectId | null {
  try {
    return ObjectId.isValid(id) ? new ObjectId(id) : null;
  } catch {
    return null;
  }
}

function toEnquiryRecord(d: EnquiryDoc): EnquiryRecord {
  return {
    id: d._id.toHexString(),
    referenceNumber: d.referenceNumber,
    idempotencyKey: d.idempotencyKey,
    payloadFingerprint: d.payloadFingerprint,
    serviceSlug: d.serviceSlug,
    status: d.status,
    projectTitle: d.projectTitle,
    projectSummary: d.projectSummary,
    serviceDetails: d.serviceDetails,
    name: d.name,
    email: d.email,
    emailNormalized: d.emailNormalized,
    companyOrOrganization: d.companyOrOrganization,
    phone: d.phone,
    preferredContactMethod: d.preferredContactMethod,
    budgetBand: d.budgetBand,
    timelinePreference: d.timelinePreference,
    preferredDate: d.preferredDate,
    referenceUrls: d.referenceUrls,
    privacyNoticeVersion: d.privacyNoticeVersion,
    privacyNoticeAcknowledgedAt: d.privacyNoticeAcknowledgedAt,
    assignedTo: d.assignedTo,
    declineReason: d.declineReason,
    sourcePath: d.sourcePath,
    utmSource: d.utmSource,
    utmMedium: d.utmMedium,
    utmCampaign: d.utmCampaign,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    convertedAt: d.convertedAt,
    archivedAt: d.archivedAt,
  };
}

function toEvent(e: EnquiryEventDoc): EnquiryEvent {
  return {
    id: e._id.toHexString(),
    enquiryId: e.enquiryId.toHexString(),
    actorUserId: e.actorUserId,
    eventType: e.eventType,
    fromStatus: e.fromStatus,
    toStatus: e.toStatus,
    summary: e.summary,
    metadata: e.metadata,
    createdAt: e.createdAt,
  };
}

function toNote(n: InternalNoteDoc): InternalNote {
  return {
    id: n._id.toHexString(),
    enquiryId: n.enquiryId.toHexString(),
    authorUserId: n.authorUserId,
    body: n.body,
    createdAt: n.createdAt,
  };
}

function toOutbox(o: OutboxDoc): OutboxRecord {
  return {
    id: o._id.toHexString(),
    enquiryId: o.enquiryId.toHexString(),
    notificationType: o.notificationType,
    recipient: o.recipient,
    status: o.status,
    attemptCount: o.attemptCount,
    lastAttemptAt: o.lastAttemptAt,
    sentAt: o.sentAt,
    providerMessageId: o.providerMessageId,
    lastErrorCode: o.lastErrorCode,
    createdAt: o.createdAt,
  };
}

async function nextReference(
  db: Awaited<ReturnType<typeof getDb>>,
  session: MongoSession
): Promise<string> {
  const res = await db
    .collection<CounterDoc>(COLLECTIONS.counters)
    .findOneAndUpdate(
      { _id: "enquiry_seq" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after", session }
    );
  const seq = (res as unknown as { seq: number } | null)?.seq ?? 1;
  return generateReference(new Date().getUTCFullYear(), seq);
}

/* ---------- create ---------- */

export interface NormalizedEnquiry {
  serviceSlug: string;
  projectTitle: string;
  projectSummary: string;
  name: string;
  email: string;
  emailNormalized: string;
  companyOrOrganization: string;
  phone: string;
  preferredContactMethod: string;
  budgetBand: string | null;
  timelinePreference: string | null;
  preferredDate: string | null;
  referenceUrls: string[];
  serviceDetails: Record<string, unknown>;
  privacyNoticeVersion: string;
  idempotencyKey: string;
  sourcePath: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

export async function createEnquiryMongo(
  data: NormalizedEnquiry,
  fingerprint: string,
  teamRecipient: string
): Promise<
  | { ok: true; status: 201 | 200; referenceNumber: string; duplicate: boolean; enquiryId: string }
  | { ok: false; status: 409 }
> {
  const db = await getDb();
  await ensureIndexes(db);
  const col = db.collection<EnquiryDoc>(COLLECTIONS.enquiries);

  const existing = await col.findOne({ idempotencyKey: data.idempotencyKey });
  if (existing) {
    if (existing.payloadFingerprint !== fingerprint) return { ok: false, status: 409 };
    return {
      ok: true,
      status: 200,
      referenceNumber: existing.referenceNumber,
      duplicate: true,
      enquiryId: existing._id.toHexString(),
    };
  }

  const now = new Date().toISOString();
  const enquiryId = new ObjectId();
  let referenceNumber: string;
  try {
    // One unit: the reference number, the enquiry, its first audit event and
    // both outbox rows. Committed separately, a crash part-way through would
    // leave a numbered enquiry with no history and no notifications — and the
    // number itself is drawn from the counter inside this same unit, so a
    // failed insert does not consume one.
    referenceNumber = await runAtomically(async (session) => {
      const reference = await nextReference(db, session);
      await col.insertOne(
        {
          _id: enquiryId,
          referenceNumber: reference,
          idempotencyKey: data.idempotencyKey,
          payloadFingerprint: fingerprint,
          serviceSlug: data.serviceSlug,
          status: "new",
          projectTitle: data.projectTitle,
          projectSummary: data.projectSummary,
          serviceDetails: data.serviceDetails,
          name: data.name,
          email: data.email,
          emailNormalized: data.emailNormalized,
          companyOrOrganization: data.companyOrOrganization,
          phone: data.phone,
          preferredContactMethod: data.preferredContactMethod,
          budgetBand: data.budgetBand,
          timelinePreference: data.timelinePreference,
          preferredDate: data.preferredDate,
          referenceUrls: data.referenceUrls,
          privacyNoticeVersion: data.privacyNoticeVersion,
          privacyNoticeAcknowledgedAt: now,
          assignedTo: null,
          declineReason: null,
          sourcePath: data.sourcePath,
          utmSource: data.utmSource,
          utmMedium: data.utmMedium,
          utmCampaign: data.utmCampaign,
          createdAt: now,
          updatedAt: now,
          convertedAt: null,
          archivedAt: null,
        } as EnquiryDoc,
        { session }
      );
      await db.collection(COLLECTIONS.events).insertOne(
        {
          _id: new ObjectId(),
          enquiryId,
          actorUserId: null,
          eventType: "created",
          fromStatus: null,
          toStatus: "new",
          summary: `Enquiry ${reference} created via ${data.sourcePath || "/start-project"}.`,
          metadata: { serviceSlug: data.serviceSlug },
          createdAt: now,
        },
        { session }
      );
      await db.collection(COLLECTIONS.outbox).insertMany(
        [
          {
            _id: new ObjectId(),
            enquiryId,
            notificationType: "team_new_enquiry",
            recipient: teamRecipient,
            status: "pending",
            attemptCount: 0,
            lastAttemptAt: null,
            sentAt: null,
            providerMessageId: null,
            lastErrorCode: null,
            createdAt: now,
          },
          {
            _id: new ObjectId(),
            enquiryId,
            notificationType: "customer_receipt",
            recipient: data.emailNormalized,
            status: "pending",
            attemptCount: 0,
            lastAttemptAt: null,
            sentAt: null,
            providerMessageId: null,
            lastErrorCode: null,
            createdAt: now,
          },
        ],
        { session }
      );
      return reference;
    });
  } catch (e) {
    // Concurrent insert with the same idempotency key: resolve as replay/conflict.
    if ((e as { code?: number })?.code === 11000) {
      const raced = await col.findOne({ idempotencyKey: data.idempotencyKey });
      if (raced) {
        if (raced.payloadFingerprint !== fingerprint) return { ok: false, status: 409 };
        return {
          ok: true,
          status: 200,
          referenceNumber: raced.referenceNumber,
          duplicate: true,
          enquiryId: raced._id.toHexString(),
        };
      }
    }
    throw e;
  }

  return { ok: true, status: 201, referenceNumber, duplicate: false, enquiryId: enquiryId.toHexString() };
}

export async function readOutboxForMongo(enquiryIdHex: string): Promise<OutboxRecord[]> {
  const id = oid(enquiryIdHex);
  if (!id) return [];
  const db = await getDb();
  const rows = await db
    .collection<OutboxDoc>(COLLECTIONS.outbox)
    .find({ enquiryId: id })
    .toArray();
  return rows.map(toOutbox);
}

export async function completeOutboxJobMongo(
  jobIdHex: string,
  result: { ok: boolean; messageId?: string; errorCode?: string }
): Promise<void> {
  const id = oid(jobIdHex);
  if (!id) return;
  const db = await getDb();
  const now = new Date().toISOString();
  await db.collection(COLLECTIONS.outbox).updateOne(
    { _id: id },
    result.ok
      ? {
          $set: {
            status: "sent",
            sentAt: now,
            providerMessageId: result.messageId ?? null,
            lastErrorCode: null,
          },
        }
      : { $set: { status: "failed", lastErrorCode: result.errorCode ?? "send_failed" } }
  );
}

export async function markOutboxProcessingMongo(jobIdHex: string): Promise<boolean> {
  const id = oid(jobIdHex);
  if (!id) return false;
  const db = await getDb();
  const res = await db.collection(COLLECTIONS.outbox).updateOne(
    { _id: id, status: { $ne: "sent" } },
    {
      $set: { status: "processing", lastAttemptAt: new Date().toISOString() },
      $inc: { attemptCount: 1 },
    }
  );
  return res.matchedCount === 1;
}

/* ---------- admin reads ---------- */

export interface ListParams {
  status?: string;
  service?: string;
  assignedTo?: string;
  q?: string;
  page: number;
  pageSize: number;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listEnquiriesMongo(params: ListParams) {
  const db = await getDb();
  await ensureIndexes(db);
  const col = db.collection<EnquiryDoc>(COLLECTIONS.enquiries);
  const filter: Record<string, unknown> = {};
  if (params.status) filter.status = params.status;
  if (params.service) filter.serviceSlug = params.service;
  if (params.assignedTo === "unassigned") filter.assignedTo = null;
  else if (params.assignedTo) filter.assignedTo = params.assignedTo;
  if (params.q) {
    const rx = { $regex: escapeRegExp(params.q), $options: "i" };
    filter.$or = [
      { referenceNumber: rx },
      { projectTitle: rx },
      { emailNormalized: rx },
      { name: rx },
    ];
  }
  const pageSize = Math.min(Math.max(params.pageSize || 25, 1), 100);
  const page = Math.max(params.page || 1, 1);
  const [items, total, countsAgg] = await Promise.all([
    col
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    col.countDocuments(filter),
    col.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]).toArray(),
  ]);
  const counts: Record<string, number> = {};
  for (const row of countsAgg as Array<{ _id: string; n: number }>) {
    counts[row._id] = row.n;
  }
  return { items: items.map(toEnquiryRecord), total, page, pageSize, counts };
}

export async function getEnquiryMongo(id: string) {
  const _id = oid(id);
  if (!_id) return null;
  const db = await getDb();
  const enquiry = await db.collection<EnquiryDoc>(COLLECTIONS.enquiries).findOne({ _id });
  if (!enquiry) return null;
  const [events, notes, notifications] = await Promise.all([
    db
      .collection<EnquiryEventDoc>(COLLECTIONS.events)
      .find({ enquiryId: _id })
      .sort({ createdAt: 1 })
      .toArray(),
    db
      .collection<InternalNoteDoc>(COLLECTIONS.notes)
      .find({ enquiryId: _id })
      .sort({ createdAt: 1 })
      .toArray(),
    db
      .collection<OutboxDoc>(COLLECTIONS.outbox)
      .find({ enquiryId: _id })
      .sort({ createdAt: 1 })
      .toArray(),
  ]);
  return {
    enquiry: toEnquiryRecord(enquiry),
    events: events.map(toEvent),
    notes: notes.map(toNote),
    notifications: notifications.map(toOutbox),
  };
}

/* ---------- admin writes ---------- */

export async function changeStatusMongo(
  id: string,
  newStatus: EnquiryStatus,
  reason: string,
  admin: { email: string }
): Promise<{ ok: true; status: 200 } | { ok: false; status: number; error: string }> {
  const _id = oid(id);
  if (!_id) return { ok: false, status: 404, error: "Not found." };
  const db = await getDb();
  await ensureIndexes(db);
  const col = db.collection<EnquiryDoc>(COLLECTIONS.enquiries);
  const current = await col.findOne({ _id }, { projection: { status: 1, referenceNumber: 1 } });
  if (!current) return { ok: false, status: 404, error: "Not found." };
  if (!isValidTransition(current.status, newStatus)) {
    return {
      ok: false,
      status: 409,
      error: `Cannot move from ${current.status} to ${newStatus}.`,
    };
  }
  if ((newStatus === "declined" || newStatus === "archived") && !reason.trim()) {
    return {
      ok: false,
      status: 400,
      error: "A reason is required to decline or archive.",
    };
  }
  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: newStatus,
    updatedAt: now,
  };
  if (newStatus === "declined") update.declineReason = reason.slice(0, 2000);
  if (newStatus === "converted") update.convertedAt = now;
  if (newStatus === "archived") update.archivedAt = now;
  // Optimistic concurrency: fail if another operator moved it first. The status
  // the transition was validated against stays in the filter, including across
  // a driver retry of the transaction, so two operators racing from the same
  // status still produce exactly one winner.
  const matched = await runAtomically(async (session) => {
    const res = await col.updateOne({ _id, status: current.status }, { $set: update }, { session });
    if (res.matchedCount === 0) return false;
    await db.collection(COLLECTIONS.events).insertOne(
      {
        _id: new ObjectId(),
        enquiryId: _id,
        actorUserId: admin.email,
        eventType: "status_changed",
        fromStatus: current.status,
        toStatus: newStatus,
        summary: `${admin.email} moved ${current.referenceNumber} from ${current.status} to ${newStatus}.`,
        metadata: { reason: reason.slice(0, 500) },
        createdAt: now,
      },
      { session }
    );
    return true;
  });
  if (!matched) {
    return {
      ok: false,
      status: 409,
      error: "This enquiry was updated by someone else. Please reload and try again.",
    };
  }
  return { ok: true, status: 200 };
}

export async function findActiveAdminByEmail(email: string): Promise<AdminUserDoc | null> {
  const db = await getDb();
  await ensureIndexes(db);
  return db
    .collection<AdminUserDoc>(COLLECTIONS.adminUsers)
    .findOne({ email: email.trim().toLowerCase(), isActive: true });
}

export async function assignMongo(
  id: string,
  assignedTo: string | null,
  admin: { email: string }
): Promise<{ ok: true; status: 200 } | { ok: false; status: number; error: string }> {
  const _id = oid(id);
  if (!_id) return { ok: false, status: 404, error: "Not found." };
  const trimmed = assignedTo && assignedTo.trim() ? assignedTo.trim() : null;
  if (trimmed) {
    const member = await findActiveAdminByEmail(trimmed);
    if (!member) {
      return {
        ok: false,
        status: 400,
        error: "Assignee must be an active team member.",
      };
    }
  }
  const db = await getDb();
  await ensureIndexes(db);
  const col = db.collection<EnquiryDoc>(COLLECTIONS.enquiries);
  const current = await col.findOne({ _id }, { projection: { referenceNumber: 1 } });
  if (!current) return { ok: false, status: 404, error: "Not found." };
  const now = new Date().toISOString();
  await runAtomically(async (session) => {
    await col.updateOne({ _id }, { $set: { assignedTo: trimmed, updatedAt: now } }, { session });
    await db.collection(COLLECTIONS.events).insertOne(
      {
        _id: new ObjectId(),
        enquiryId: _id,
        actorUserId: admin.email,
        eventType: trimmed ? "assigned" : "unassigned",
        fromStatus: null,
        toStatus: null,
        summary: trimmed
          ? `${admin.email} assigned ${current.referenceNumber} to ${trimmed}.`
          : `${admin.email} unassigned ${current.referenceNumber}.`,
        metadata: {},
        createdAt: now,
      },
      { session }
    );
  });
  return { ok: true, status: 200 };
}

export async function addNoteMongo(
  id: string,
  body: string,
  admin: { email: string }
): Promise<{ ok: true; status: 201 } | { ok: false; status: number; error: string }> {
  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > 5000) {
    return { ok: false, status: 400, error: "Note must be 1–5000 characters." };
  }
  const _id = oid(id);
  if (!_id) return { ok: false, status: 404, error: "Not found." };
  const db = await getDb();
  await ensureIndexes(db);
  const exists = await db
    .collection(COLLECTIONS.enquiries)
    .findOne({ _id }, { projection: { _id: 1 } });
  if (!exists) return { ok: false, status: 404, error: "Not found." };
  const now = new Date().toISOString();
  const noteId = new ObjectId();
  const eventId = new ObjectId();
  await runAtomically(async (session) => {
    await db.collection(COLLECTIONS.notes).insertOne(
      {
        _id: noteId,
        enquiryId: _id,
        authorUserId: admin.email,
        body: trimmed,
        createdAt: now,
      },
      { session }
    );
    await db.collection(COLLECTIONS.events).insertOne(
      {
        _id: eventId,
        enquiryId: _id,
        actorUserId: admin.email,
        eventType: "internal_note_added",
        fromStatus: null,
        toStatus: null,
        summary: `${admin.email} added an internal note.`,
        metadata: {},
        createdAt: now,
      },
      { session }
    );
    await db
      .collection(COLLECTIONS.enquiries)
      .updateOne({ _id }, { $set: { updatedAt: now } }, { session });
  });
  return { ok: true, status: 201 };
}

/** Atomically claim a failed notification for retry; returns the claimed job or null. */
export async function claimNotificationMongo(
  notificationIdHex: string
): Promise<OutboxRecord | null> {
  const _id = oid(notificationIdHex);
  if (!_id) return null;
  const db = await getDb();
  const res = await db.collection<OutboxDoc>(COLLECTIONS.outbox).findOneAndUpdate(
    { _id, status: "failed", attemptCount: { $lt: 5 } },
    {
      $set: { status: "processing", lastAttemptAt: new Date().toISOString() },
      $inc: { attemptCount: 1 },
    },
    { returnDocument: "after" }
  );
  const doc = res as unknown as OutboxDoc | null;
  return doc ? toOutbox(doc) : null;
}

export async function peekNotificationMongo(
  notificationIdHex: string
): Promise<OutboxRecord | null> {
  const _id = oid(notificationIdHex);
  if (!_id) return null;
  const db = await getDb();
  const doc = await db.collection<OutboxDoc>(COLLECTIONS.outbox).findOne({ _id });
  return doc ? toOutbox(doc) : null;
}
