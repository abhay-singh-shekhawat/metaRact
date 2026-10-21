import { describe, it, expect, vi } from "vitest";
import {
  isValidTransition,
  allowedTransitions,
} from "@/server/policies/statusMachine";
import {
  canonicalize,
  payloadFingerprint,
  generateReference,
} from "@/lib/security/fingerprint";
import { isProductionConfigComplete } from "@/config/site";

describe("status machine", () => {
  it("allows new -> reviewing, blocks new -> qualified", () => {
    expect(isValidTransition("new", "reviewing")).toBe(true);
    expect(isValidTransition("new", "qualified")).toBe(false);
  });
  it("converted only archives; archived is terminal", () => {
    expect(isValidTransition("converted", "archived")).toBe(true);
    expect(isValidTransition("converted", "new")).toBe(false);
    expect(allowedTransitions("archived")).toEqual([]);
  });
});

describe("fingerprint", () => {
  it("is order-insensitive and excludes volatile fields", () => {
    const a = payloadFingerprint({ x: 1, y: { b: 2, a: 1 }, turnstileToken: "t1", website: "" });
    const b = payloadFingerprint({ y: { a: 1, b: 2 }, x: 1, turnstileToken: "t2", website: "x" });
    expect(a).toBe(b);
  });
  it("canonical form sorts keys", () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });
  it("generates REQ-YYYY-###### references", () => {
    expect(generateReference(2026, 123)).toBe("REQ-2026-000123");
  });
});

describe("production preflight", () => {
  it("detects missing config", () => {
    const r = isProductionConfigComplete();
    expect(r.ok).toBe(false);
    // The studio name is a published fact now (docs/legal/, src/config/site.ts), so it
    // is no longer a required *deployment* field — but a placeholder must still fail.
    expect(r.missing).not.toContain("NEXT_PUBLIC_STUDIO_NAME");
    expect(r.missing).toContain("NEXT_PUBLIC_SITE_URL (must be https)");
    expect(r.missing).toContain("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  });

  it("still fails closed when a placeholder name is configured", async () => {
    process.env.NEXT_PUBLIC_STUDIO_NAME = "Your Studio Name";
    vi.resetModules();
    const mod = await import("@/config/site");
    expect(mod.siteConfig.isPlaceholderName).toBe(true);
    expect(mod.isProductionConfigValid().missing).toContain("NEXT_PUBLIC_STUDIO_NAME");
    delete process.env.NEXT_PUBLIC_STUDIO_NAME;
    vi.resetModules();
  });
});
