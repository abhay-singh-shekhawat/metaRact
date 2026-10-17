import { describe, expect, it } from "vitest";
import {
  _resetTransactionCapability,
  isTransactionUnsupported,
  transactionsEnabled,
} from "@/lib/mongodb/transaction";

/**
 * Every write in the store runs inside a transaction. On a standalone server
 * that is impossible, and the store is supposed to notice once, warn, and carry
 * on writing statement by statement. Getting that detection wrong in either
 * direction is a real failure: too narrow and a standalone deployment cannot
 * accept a single enquiry, too broad and an ordinary write error silently
 * switches off atomicity for the rest of the process.
 */
describe("transaction capability detection", () => {
  it("assumes transactions work until a write proves otherwise", () => {
    _resetTransactionCapability();
    expect(transactionsEnabled()).toBe(true);
  });

  it("recognises what a standalone mongod answers with", () => {
    // The server's reply, surfaced by the driver: IllegalOperation, code 20.
    expect(isTransactionUnsupported({ code: 20 })).toBe(true);
    expect(isTransactionUnsupported({ codeName: "IllegalOperation" })).toBe(true);
    expect(
      isTransactionUnsupported({
        message: "Transaction numbers are only allowed on a replica set member or mongos",
      })
    ).toBe(true);
    expect(isTransactionUnsupported(new Error("transactions are not supported"))).toBe(true);
  });

  it("does not mistake an ordinary write failure for a missing replica set", () => {
    // A duplicate-idempotency-key race is the one that matters most: treating
    // it as "no transactions here" would turn off atomicity after a double
    // submission.
    expect(isTransactionUnsupported({ code: 11000, codeName: "DuplicateKey" })).toBe(false);
    expect(isTransactionUnsupported(new Error("connection reset by peer"))).toBe(false);
    expect(isTransactionUnsupported(new Error("deadline exceeded"))).toBe(false);
    expect(isTransactionUnsupported(undefined)).toBe(false);
    expect(isTransactionUnsupported(null)).toBe(false);
  });
});
