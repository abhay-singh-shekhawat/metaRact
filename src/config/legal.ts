/**
 * Publication facts for the four policy pages.
 *
 * One place, because the version is recorded against every enquiry
 * (`privacyNoticeVersion`), quoted in the enquiry form, and printed at the foot of
 * each policy page. It is a literal rather than an environment variable on purpose:
 * a non-`NEXT_PUBLIC_` env var is not visible to client bundles, so the form would
 * have shown a different version from the one the server stored.
 *
 * Revising a policy: edit `docs/legal/<file>.md`, run `pnpm legal:import`, review the
 * generated diff in `src/content/legal/`, then bump the values below.
 */
export const legalConfig = {
  version: "1.0",
  /** Machine-readable, for `<time dateTime>`. */
  updated: "2026-10-18",
  updatedLabel: "18 October 2026",
} as const;
