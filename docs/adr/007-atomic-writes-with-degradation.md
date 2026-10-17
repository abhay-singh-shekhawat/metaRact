# ADR-007: Multi-document writes use transactions, and degrade loudly when they cannot

Date: 2026-10-17
Status: Accepted (resolves §6.1 of `docs/MIGRATION-VERIFICATION-REPORT.md`)

## Context

Almost every write in this application is more than one document:

- creating an enquiry writes the enquiry, its first audit event and two outbox rows;
- a status change writes the enquiry and an audit event;
- an assignment writes the enquiry and an audit event;
- a note writes the note, an audit event and a touch on the enquiry.

Written statement by statement, a process that dies between two of them leaves the console showing a status with nothing to explain it, or a created enquiry that notifies nobody. An audit trail with holes in it is worse than no audit trail, because it looks complete. The pre-migration Supabase implementation had this atomicity inside a single RPC; the relay to MongoDB lost it.

The constraint is that MongoDB provides multi-document transactions **only on a replica set**, and Atlass's shared tiers do not.

## Decision

Wrap each of the four write units in `session.withTransaction(...)` (see `src/lib/mongodb/transaction.ts`), including the create flow's reference-number draw, so a failed insert no longer burns a number.

Capability is discovered, not assumed. If a transactional statement is rejected as unsupported — `IllegalOperation`, code 20, which is what a standalone `mongod` and an Atlas shared tier both answer with — the store logs a warning **once** and re-runs the unit without a session, statement by statement. Refusing the write instead would take the site down over a billing tier.

Two deliberate details:

1. **Optimistic concurrency stays outside the transaction.** `changeStatusMongo` reads the current status, validates the transition against it, and keeps that value in the update filter. The driver retries a transaction that loses a write race; if the retry re-read the status, a losing operator could legally apply a *second* transition instead of losing cleanly. Verified by the concurrent-transition test.
2. **The callback may run more than once**, so it builds its documents from arguments rather than from state it mutates (the note and event `_id`s are allocated outside the callback for exactly this reason).

## Consequences

- On a replica set the guarantee holds; `tests/integration/mongo.test.ts` now starts a single-node replica set and asserts that a unit failing part-way leaves nothing behind — neither its probe row nor its counter bump. Against the standalone instance the suite used before, it would have been testing only the degraded path.
- **On an Atlas free/shared tier the guarantee does not hold** — the store degrades, warns, and continues. Getting real atomicity is a purchase decision (a dedicated `M10`+ cluster), and it is listed as an operator item, not presented as solved.
- Post-commit, the notification leg is now the weakest link: the outbox rows are written `pending` and marked `processing`/`sent` by the same request that sends them, and `claimNotificationMongo` only claims rows in `failed`. A crash mid-send strands a row in `processing` with no retry. Recorded as open, not fixed here.
