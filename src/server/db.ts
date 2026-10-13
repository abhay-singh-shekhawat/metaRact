import { promises as fs } from "fs";
import path from "path";
import { generateReference } from "@/lib/security/fingerprint";
import type { EnquiryStatus } from "@/server/policies/statusMachine";

export interface EnquiryRecord {
  id: string;
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

export interface EnquiryEvent {
  id: string;
  enquiryId: string;
  actorUserId: string | null;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface InternalNote {
  id: string;
  enquiryId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export interface OutboxRecord {
  id: string;
  enquiryId: string;
  notificationType: "team_new_enquiry" | "customer_receipt";
  recipient: string;
  status: "pending" | "processing" | "sent" | "failed";
  attemptCount: number;
  lastAttemptAt: string | null;
  sentAt: string | null;
  providerMessageId: string | null;
  lastErrorCode: string | null;
  createdAt: string;
}

interface StoreShape {
  seq: number;
  enquiries: EnquiryRecord[];
  events: EnquiryEvent[];
  notes: InternalNote[];
  outbox: OutboxRecord[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "studio.json");

function emptyStore(): StoreShape {
  return { seq: 0, enquiries: [], events: [], notes: [], outbox: [] };
}

export async function readStore(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || !Array.isArray(parsed.enquiries)) return emptyStore();
    return {
      seq: parsed.seq ?? 0,
      enquiries: parsed.enquiries,
      events: parsed.events ?? [],
      notes: parsed.notes ?? [],
      outbox: parsed.outbox ?? [],
    };
  } catch {
    return emptyStore();
  }
}

export async function writeStore(store: StoreShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(tmp, DATA_FILE);
}

export function nextReference(store: StoreShape): string {
  store.seq += 1;
  return generateReference(new Date().getUTCFullYear(), store.seq);
}

export function resetStoreForTests(): Promise<void> {
  return writeStore(emptyStore());
}
