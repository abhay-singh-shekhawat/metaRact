import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "crypto";

/**
 * Exercises the migrated production storage path (MongoDB Atlas) against an
 * ephemeral in-process MongoDB. When the memory-server binary is unavailable
 * (e.g. offline CI) the whole suite skips instead of failing the build.
 */
type MemServer = { getUri: () => string; stop: () => Promise<boolean> };

let mem: MemServer | null = null;
let canRun = false;
let createServer: ((opts?: unknown) => Promise<MemServer>) | null = null;

try {
  const mod = await import("mongodb-memory-server");
  createServer = mod.MongoMemoryServer.create.bind(mod.MongoMemoryServer) as never;
  canRun = true;
} catch {
  canRun = false;
}

let store: typeof import("@/server/mongo-store");
let fingerprint: (o: Record<string, unknown>) => string;

function normalized(overrides: Record<string, unknown> = {}) {
  return {
    serviceSlug: "software-applications",
    projectTitle: "Inventory dashboard",
    projectSummary:
      "We track inventory in spreadsheets and need a small internal dashboard with roles for our warehouse team.",
    name: "Rahul Verma",
    email: "rahul@example.com",
    emailNormalized: "rahul@example.com",
    companyOrOrganization: "",
    phone: "",
    preferredContactMethod: "email",
    budgetBand: null,
    timelinePreference: null,
    preferredDate: null,
    referenceUrls: [],
    serviceDetails: {},
    privacyNoticeVersion: "2026-10-01",
    idempotencyKey: randomUUID(),
    sourcePath: "/start-project",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    ...overrides,
  };
}

const admin = { email: "founder@example.com", role: "owner" as const };

describe.skipIf(!canRun)("mongo store (production path)", () => {
  beforeAll(async () => {
    mem = await createServer!({ instance: { dbName: "studio_test" } });
    process.env.MONGODB_URI = mem.getUri();
    process.env.MONGODB_DB_NAME = "studio_test";
    const mod = await import("@/server/mongo-store");
    store = mod;
    fingerprint = (await import("@/lib/security/fingerprint")).payloadFingerprint;
  }, 180_000);

  afterAll(async () => {
    if (mem) await mem.stop();
    delete process.env.MONGODB_URI;
  });

  it("creates enquiry + event + two outbox rows and issues sequential references", async () => {
    const data = normalized();
    const r = await store.createEnquiryMongo(data, fingerprint(data as never), "team@example.com");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.status).toBe(201);
    expect(r.referenceNumber).toMatch(/^REQ-\d{4}-\d{6}$/);
    const detail = await store.getEnquiryMongo(r.enquiryId);
    expect(detail).not.toBeNull();
    expect(detail!.events).toHaveLength(1);
    expect(detail!.notifications).toHaveLength(2);
  });

  it("replays the same submission key and rejects a changed payload", async () => {
    const key = randomUUID();
    const data = normalized({ idempotencyKey: key });
    const first = await store.createEnquiryMongo(data, fingerprint(data as never), "team@example.com");
    expect(first.ok && first.status).toBe(201);
    const replay = await store.createEnquiryMongo(data, fingerprint(data as never), "team@example.com");
    expect(replay.ok && replay.status).toBe(200);
    if (replay.ok && first.ok) expect(replay.referenceNumber).toBe(first.referenceNumber);

    const changed = normalized({ idempotencyKey: key, projectTitle: "A totally different title" });
    const conflict = await store.createEnquiryMongo(changed, fingerprint(changed as never), "team@example.com");
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) expect(conflict.status).toBe(409);
  });

  it("lists with filters, search, counts and pagination", async () => {
    const data = normalized({ serviceSlug: "ai-automation", projectTitle: "Zebra automation" });
    await store.createEnquiryMongo(data, fingerprint(data as never), "team@example.com");
    const all = await store.listEnquiriesMongo({ page: 1, pageSize: 50 });
    expect(all.total).toBeGreaterThanOrEqual(3);
    const byService = await store.listEnquiriesMongo({ service: "ai-automation", page: 1, pageSize: 50 });
    expect(byService.items.every((i) => i.serviceSlug === "ai-automation")).toBe(true);
    const search = await store.listEnquiriesMongo({ q: "Zebra", page: 1, pageSize: 50 });
    expect(search.items.some((i) => i.projectTitle === "Zebra automation")).toBe(true);
    expect((all.counts.new ?? 0)).toBeGreaterThanOrEqual(3);
  });

  it("enforces the status machine, reason requirement and optimistic concurrency", async () => {
    const data = normalized();
    const created = await store.createEnquiryMongo(data, fingerprint(data as never), "team@example.com");
    if (!created.ok) throw new Error("setup failed");
    const id = created.enquiryId;

    const illegal = await store.changeStatusMongo(id, "qualified", "", admin);
    expect(illegal.ok).toBe(false);
    if (!illegal.ok) expect(illegal.status).toBe(409);

    const noReason = await store.changeStatusMongo(id, "declined", "", admin);
    expect(noReason.ok).toBe(false);
    if (!noReason.ok) expect(noReason.status).toBe(400);

    const ok = await store.changeStatusMongo(id, "reviewing", "", admin);
    expect(ok.ok).toBe(true);

    // Two concurrent transitions from the same observed status: exactly one wins.
    const [a, b] = await Promise.all([
      store.changeStatusMongo(id, "qualified", "", admin),
      store.changeStatusMongo(id, "declined", "not a fit", admin),
    ]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
  });

  it("requires an active admin as assignee and records notes", async () => {
    const data = normalized();
    const created = await store.createEnquiryMongo(data, fingerprint(data as never), "team@example.com");
    if (!created.ok) throw new Error("setup failed");
    const id = created.enquiryId;

    const badAssign = await store.assignMongo(id, "ghost@example.com", admin);
    expect(badAssign.ok).toBe(false);
    if (!badAssign.ok) expect(badAssign.status).toBe(400);

    // Assignment is only valid for an active admin user.
    const { getDb } = await import("@/lib/mongodb/client");
    const { COLLECTIONS } = await import("@/lib/mongodb/collections");
    const { ObjectId } = await import("mongodb");
    const db = await getDb();
    await db.collection(COLLECTIONS.adminUsers).updateOne(
      { email: "teammate@example.com" },
      {
        $set: { role: "member", isActive: true },
        $setOnInsert: {
          _id: new ObjectId(),
          email: "teammate@example.com",
          passwordHash: "unused-in-test",
          createdAt: new Date().toISOString(),
          createdBy: null,
          lastLoginAt: null,
        },
      },
      { upsert: true }
    );

    const okAssign = await store.assignMongo(id, "teammate@example.com", admin);
    expect(okAssign.ok).toBe(true);

    const note = await store.addNoteMongo(id, "Called the customer.", admin);
    expect(note.ok).toBe(true);
    const tooLong = await store.addNoteMongo(id, "x".repeat(5001), admin);
    expect(tooLong.ok).toBe(false);

    const detail = await store.getEnquiryMongo(id);
    expect(detail!.notes).toHaveLength(1);
    expect(detail!.enquiry.assignedTo).toBe("teammate@example.com");
  });

  it("caps notification retries at five attempts", async () => {
    const data = normalized();
    const created = await store.createEnquiryMongo(data, fingerprint(data as never), "team@example.com");
    if (!created.ok) throw new Error("setup failed");
    const detail = await store.getEnquiryMongo(created.enquiryId);
    const jobId = detail!.notifications[0].id;

    const { getDb } = await import("@/lib/mongodb/client");
    const { COLLECTIONS } = await import("@/lib/mongodb/collections");
    const { ObjectId } = await import("mongodb");
    const db = await getDb();
    await db
      .collection(COLLECTIONS.outbox)
      .updateOne({ _id: new ObjectId(jobId) }, { $set: { status: "failed", attemptCount: 5 } });

    const claimed = await store.claimNotificationMongo(jobId);
    expect(claimed).toBeNull();
  });
});
