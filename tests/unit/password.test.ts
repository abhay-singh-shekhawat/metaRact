import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("admin password hashing", () => {
  it("verifies the correct password and rejects wrong ones", async () => {
    const hash = await hashPassword("a-very-strong-password-123");
    expect(hash).not.toContain("a-very-strong-password-123");
    expect(await verifyPassword("a-very-strong-password-123", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("rejects empty inputs without throwing", async () => {
    const hash = await hashPassword("another-strong-password-456");
    expect(await verifyPassword("", hash)).toBe(false);
    expect(await verifyPassword("another-strong-password-456", "")).toBe(false);
  });
});
