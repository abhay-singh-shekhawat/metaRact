import { describe, it, expect } from "vitest";
import {
  enquiryRequestSchema,
  validateServiceDetails,
  isSafeUrlString,
} from "@/lib/validation/enquiry";

const base = {
  serviceSlug: "websites-digital-experiences",
  projectTitle: "Website for my bakery",
  projectSummary:
    "We need a fast brochure website with an enquiry form and store timings for our bakery in Pune.",
  name: "Asha Sharma",
  email: "asha@example.com",
  privacyNoticeAcknowledged: true,
  idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
};

describe("enquiry schema", () => {
  it("accepts a valid payload", () => {
    expect(enquiryRequestSchema.safeParse(base).success).toBe(true);
  });
  it("rejects disabled/unknown service", () => {
    const r = enquiryRequestSchema.safeParse({ ...base, serviceSlug: "nope" });
    expect(r.success).toBe(false);
  });
  it("rejects short summary and bad email", () => {
    expect(
      enquiryRequestSchema.safeParse({ ...base, projectSummary: "too short" }).success
    ).toBe(false);
    expect(
      enquiryRequestSchema.safeParse({ ...base, email: "not-an-email" }).success
    ).toBe(false);
  });
  it("requires privacy acknowledgement", () => {
    const r = enquiryRequestSchema.safeParse({
      ...base,
      privacyNoticeAcknowledged: false,
    });
    expect(r.success).toBe(false);
  });
  it("rejects unknown budget enum", () => {
    expect(
      enquiryRequestSchema.safeParse({ ...base, budgetBand: "millions" }).success
    ).toBe(false);
  });
});

describe("url safety", () => {
  it("allows https", () => {
    expect(isSafeUrlString("https://example.com/work")).toBe(true);
  });
  it("rejects javascript:, data:, localhost, private IPs, credentials", () => {
    for (const u of [
      "javascript:alert(1)",
      "data:text/html,hi",
      "file:///etc/passwd",
      "http://localhost:3000/x",
      "https://127.0.0.1/x",
      "https://192.168.1.5/x",
      "https://10.0.0.1/x",
      "https://user:pass@example.com/",
    ]) {
      expect(isSafeUrlString(u), u).toBe(false);
    }
  });
});

describe("service details", () => {
  it("accepts valid website details and strips empties", () => {
    const r = validateServiceDetails("websites-digital-experiences", {
      purpose: "lead_generation",
      pageCount: "2_5",
    });
    expect(r.ok).toBe(true);
    expect(r.cleaned).toEqual({ purpose: "lead_generation", pageCount: "2_5" });
  });
  it("rejects invalid enum and unknown keys", () => {
    const r = validateServiceDetails("websites-digital-experiences", {
      purpose: "spaceship",
      hacker: 1,
    } as unknown as Record<string, unknown>);
    expect(r.ok).toBe(false);
  });
  it("validates graphic quantity bounds", () => {
    expect(
      validateServiceDetails("graphic-brand-design", { quantity: 500 }).ok
    ).toBe(false);
    expect(
      validateServiceDetails("graphic-brand-design", { quantity: 12 }).ok
    ).toBe(true);
  });
  it("accepts software and design details", () => {
    expect(
      validateServiceDetails("software-applications", {
        userTypes: "both",
        targetEnvironment: "web",
      }).ok
    ).toBe(true);
    expect(
      validateServiceDetails("product-design-prototyping", {
        fidelity: "clickable",
        screenCount: "6_10",
      }).ok
    ).toBe(true);
  });
});
