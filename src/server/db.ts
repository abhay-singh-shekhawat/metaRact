import { promises as fs } from "fs";
import path from "path";
import { generateReference } from "@/lib/security/fingerprint";
import { isWorkersRuntime } from "@/lib/runtime";
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

/**
 * The file-backed store is a local-development fallback only. On Cloudflare
 * Workers there is no persistent filesystem, so enquiries written here would
 * silently vanish between requests. Fail loudly instead (and let the enquiry
 * route report `storage_failed`) so a missing `MONGODB_URI` in production is
 * obvious rather than a slow data leak.
 */
function assertFileStoreAvailable(): void {
  if (isWorkersRuntime()) {
    throw new Error(
      "The file-backed store is unavailable on Cloudflare Workers. Set MONGODB_URI so enquiries are stored in MongoDB Atlas."
    );
  }
}

function emptyStore(): StoreShape {
  return { seq: 0, enquiries: [], events: [], notes: [], outbox: [] };
}

export async function readStore(): Promise<StoreShape> {
  assertFileStoreAvailable();
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
  assertFileStoreAvailable();
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
