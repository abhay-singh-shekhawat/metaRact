import "server-only";
import type { Db, ObjectId } from "mongodb";
import type { EnquiryStatus } from "@/server/policies/statusMachine";

/** MongoDB document shapes. `_id` is always an ObjectId; `id` strings exposed to callers are its hex form. */

export interface EnquiryDoc {
  _id: ObjectId;
  referenceNumber: string;
  idempotencyKey: string;
  payloadFingerprint: string;
  serviceSlug: string;
  status: EnquiryStatus;
  projectTitle: string;
  projectSummary: string;
  serviceDetails: Record<string, unknown>;
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
  privacyNoticeVersion: string;
  privacyNoticeAcknowledgedAt: string;
  assignedTo: string | null;
  declineReason: string | null;
  sourcePath: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  createdAt: string;
  updatedAt: string;
  convertedAt: string | null;
  archivedAt: string | null;
}

export interface EnquiryEventDoc {
  _id: ObjectId;
  enquiryId: ObjectId;
  actorUserId: string | null;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface InternalNoteDoc {
  _id: ObjectId;
  enquiryId: ObjectId;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export type OutboxStatus = "pending" | "processing" | "sent" | "failed";

export interface OutboxDoc {
  _id: ObjectId;
  enquiryId: ObjectId;
  notificationType: "team_new_enquiry" | "customer_receipt";
  recipient: string;
  status: OutboxStatus;
  attemptCount: number;
  lastAttemptAt: string | null;
  sentAt: string | null;
  providerMessageId: string | null;
  lastErrorCode: string | null;
  createdAt: string;
}

export interface AdminUserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  role: "owner" | "member";
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
  lastLoginAt: string | null;
}

export interface AdminSessionDoc {
  _id: ObjectId;
  tokenHash: string;
  adminUserId: ObjectId;
  email: string;
  role: "owner" | "member";
  expiresAt: Date;
  createdAt: string;
  revokedAt: string | null;
}

export interface CounterDoc {
  _id: string;
  seq: number;
}

export const COLLECTIONS = {
  enquiries: "enquiries",
  events: "enquiry_events",
  notes: "enquiry_internal_notes",
  outbox: "notification_outbox",
  adminUsers: "admin_users",
  adminSessions: "admin_sessions",
  counters: "counters",
} as const;

let indexesEnsured = false;

/**
 * Create collections' indexes. Idempotent; runs once per server instance.
 * Unique indexes enforce reference numbers, idempotency keys, per-enquiry
 * notification pairs, admin emails, and session tokens at the database level.
 */
export async function ensureIndexes(db: Db): Promise<void> {
  if (indexesEnsured) return;
  await Promise.all([
    db.collection(COLLECTIONS.enquiries).createIndexes([
      { key: { referenceNumber: 1 }, unique: true, name: "enquiries_reference_unique" },
      { key: { idempotencyKey: 1 }, unique: true, name: "enquiries_idempotency_unique" },
      { key: { payloadFingerprint: 1 }, name: "enquiries_fingerprint_idx" },
      { key: { status: 1, createdAt: -1 }, name: "enquiries_status_created_idx" },
      { key: { serviceSlug: 1, createdAt: -1 }, name: "enquiries_service_created_idx" },
      { key: { assignedTo: 1 }, name: "enquiries_assigned_idx" },
      { key: { emailNormalized: 1 }, name: "enquiries_email_idx" },
      { key: { createdAt: -1 }, name: "enquiries_created_idx" },
    ]),
    db.collection(COLLECTIONS.events).createIndexes([
      { key: { enquiryId: 1, createdAt: -1 }, name: "events_enquiry_idx" },
    ]),
    db.collection(COLLECTIONS.notes).createIndexes([
      { key: { enquiryId: 1, createdAt: -1 }, name: "notes_enquiry_idx" },
    ]),
    db.collection(COLLECTIONS.outbox).createIndexes([
      {
        key: { enquiryId: 1, notificationType: 1 },
        unique: true,
        name: "outbox_enquiry_type_unique",
      },
      { key: { status: 1, createdAt: 1 }, name: "outbox_status_idx" },
    ]),
    db.collection(COLLECTIONS.adminUsers).createIndexes([
      { key: { email: 1 }, unique: true, name: "admin_users_email_unique" },
    ]),
    db.collection(COLLECTIONS.adminSessions).createIndexes([
      { key: { tokenHash: 1 }, unique: true, name: "admin_sessions_token_unique" },
      { key: { adminUserId: 1 }, name: "admin_sessions_user_idx" },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "admin_sessions_ttl" },
    ]),
  ]);
  indexesEnsured = true;
}
