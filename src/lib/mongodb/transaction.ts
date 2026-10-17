import "server-only";
import type { ClientSession, TransactionOptions } from "mongodb";
import { getClient } from "@/lib/mongodb/client";

/**
 * Multi-document atomicity.
 *
 * Almost every write in this application is more than one document. Creating an
 * enquiry writes the enquiry, its first audit event and its two outbox rows.
 * Changing a status writes the enquiry and an audit event. Adding a note writes
 * the note, an audit event and a touch on the enquiry. Written one statement at
 * a time, a process that dies between two of them leaves the console showing a
 * status with no history, or a created enquiry that notifies nobody — and the
 * audit trail is the whole point of the console, so a gap in it is worse than a
 * missing feature.
 *
 * MongoDB only provides multi-document atomicity inside a replica set. Atlas
 * always is one, so production takes this path. A standalone `mongod` — still a
 * common local setup, and possible self-hosted — rejects every transactional
 * statement with IllegalOperation, so there the write falls back to the
 * previous statement-at-a-time behaviour: once, with a warning, rather than
 * failing every submission. That fallback is a deliberate degradation, not a
 * silent one.
 */

/** `undefined` on the degraded path; every driver operation accepts it. */
export type MongoSession = ClientSession | undefined;

const TRANSACTION_OPTIONS: TransactionOptions = {
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
  maxCommitTimeMS: 10_000,
};

/** `null` until the first write has probed the deployment. */
let transactionsSupported: boolean | null = null;

/** Does this error mean "this deployment cannot do transactions at all"? */
export function isTransactionUnsupported(error: unknown): boolean {
  if (!error) return false;
  const e = error as { code?: number; codeName?: string; message?: string };
  if (e.code === 20 || e.codeName === "IllegalOperation") return true;
  const message = typeof e.message === "string" ? e.message : "";
  return (
    /transaction numbers are only allowed on a replica set member or mongos/i.test(message) ||
    /transactions are not supported/i.test(message)
  );
}

/** False once a write has discovered that this deployment is a standalone. */
export function transactionsEnabled(): boolean {
  return transactionsSupported !== false;
}

/** Test seam: forget what earlier writes learned about the deployment. */
export function _resetTransactionCapability(): void {
  transactionsSupported = null;
}

/**
 * Run `work` as one atomic unit and return its result.
 *
 * The callback may run more than once — the driver retries a transaction that
 * fails with a transient error such as a write conflict — so it must build its
 * documents from arguments rather than from anything it mutates itself.
 */
export async function runAtomically<T>(work: (session: MongoSession) => Promise<T>): Promise<T> {
  if (transactionsSupported === false) return work(undefined);

  const client = await getClient();
  const session = client.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await work(session);
    }, TRANSACTION_OPTIONS);
    transactionsSupported = true;
    return result as T;
  } catch (error) {
    if (!isTransactionUnsupported(error)) throw error;
    // The transaction was rejected before anything it wrote could commit, so
    // re-running the work without a session is safe rather than duplicating.
    transactionsSupported = false;
    console.warn(
      "[mongo] this deployment does not support transactions (standalone, not a replica set). " +
        "Multi-document writes are no longer atomic; use a replica set to keep the audit trail complete."
    );
    return work(undefined);
  } finally {
    await session.endSession();
  }
}
