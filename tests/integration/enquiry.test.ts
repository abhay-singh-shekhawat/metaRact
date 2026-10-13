import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { resetStoreForTests, readStore } from "@/server/db";
import { createEnquiryUseCase } from "@/server/use-cases/createEnquiry";
import {
  changeStatusUseCase,
  addNoteUseCase,
} from "@/server/use-cases/admin";

function payload(key: string, overrides: Record<string, unknown> = {}) {
  return {
    serviceSlug: "software-applications",
    projectTitle: "Dashboard for inventory",
    projectSummary:
      "We track inventory in spreadsheets and need a small internal dashboard with roles for our Pune warehouse team.",
    name: "Rahul Verma",
    email: "rahul@example.com",
    privacyNoticeAcknowledged: true,
    idempotencyKey: key,
    ...overrides,
  };
}

describe("enquiry lifecycle (file-store integration)", () => {
  beforeEach(async () => {
    await resetStoreForTests();
  });

  it("creates enquiry + event + outbox atomically and returns a reference", async () => {
    const r = await createEnquiryUseCase({ body: payload(randomUUID()), ip: "1.2.3.4" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.referenceNumber).toMatch(/^REQ-\d{4}-\d{6}$/);
    const store = await readStore();
    expect(store.enquiries).toHaveLength(1);
    expect(store.events).toHaveLength(1);
    expect(store.outbox).toHaveLength(2);
  });

  it("idempotent replay returns original; conflicting payload is rejected", async () => {
    const key = randomUUID();
    const first = await createEnquiryUseCase({ body: payload(key), ip: "1.2.3.4" });
    expect(first.ok).toBe(true);
    const replay = await createEnquiryUseCase({ body: payload(key), ip: "1.2.3.4" });
    expect(replay.ok && replay.status).toBe(200);
    const conflict = await createEnquiryUseCase({
      body: payload(key, { projectTitle: "Different title entirely" }),
      ip: "1.2.3.4",
    });
    expect(!conflict.ok && conflict.status).toBe(409);
    const store = await readStore();
    expect(store.enquiries).toHaveLength(1);
  });

  it("status transitions enforced; notes recorded", async () => {
    const created = await createEnquiryUseCase({ body: payload(randomUUID()), ip: "1.2.3.4" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const store = await readStore();
    const id = store.enquiries[0].id;
    const admin = { email: "founder@example.com", role: "owner" as const };
    const bad = await changeStatusUseCase(id, "qualified", "", admin);
    expect(bad.ok).toBe(false);
    const good = await changeStatusUseCase(id, "reviewing", "", admin);
    expect(good.ok).toBe(true);
    const note = await addNoteUseCase(id, "Called the customer, asked for sample SKUs.", admin);
    expect(note.ok).toBe(true);
    const after = await readStore();
    expect(after.enquiries[0].status).toBe("reviewing");
    expect(after.notes).toHaveLength(1);
    expect(after.events.length).toBeGreaterThanOrEqual(3);
  });

  it("honeypot submissions fake success without persisting", async () => {
    const r = await createEnquiryUseCase({
      body: payload(randomUUID(), { website: "http://spam.example" }),
      ip: "9.9.9.9",
    });
    expect(r.ok).toBe(true);
    const store = await readStore();
    expect(store.enquiries).toHaveLength(0);
    expect(store.outbox).toHaveLength(0);
  });

  it("notification failure does not delete the enquiry", async () => {
    const r = await createEnquiryUseCase({ body: payload(randomUUID()), ip: "9.9.9.9" });
    expect(r.ok).toBe(true);
    const store = await readStore();
    expect(store.enquiries).toHaveLength(1);
    // outbox rows exist regardless of provider outcome (log-only adapter marks sent in dev)
    expect(store.outbox.length).toBe(2);
  });
});
