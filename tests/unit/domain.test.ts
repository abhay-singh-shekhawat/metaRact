import { describe, it, expect } from "vitest";
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
  it("detects placeholder config", () => {
    const r = isProductionConfigComplete();
    expect(r.ok).toBe(false);
    expect(r.missing).toContain("NEXT_PUBLIC_STUDIO_NAME");
  });
});
