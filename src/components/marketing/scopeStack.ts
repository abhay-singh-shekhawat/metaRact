/* ---------------------------------------------------------------------------
 * The scope stack — the exact four documents the studio sells, in order.
 *
 * This is the single source of truth for the hero object in both of its
 * renderings: the CSS fallback (HeroObject) and the WebGL hero
 * (hero/DraftingScene). Keeping the copy here means the two can never drift
 * apart, and the accessible list always matches the picture.
 * ------------------------------------------------------------------------- */

export type ScopeStep = {
  /** Two-digit index printed in the sheet header. */
  n: string;
  /** The document's short name. */
  label: string;
  /** What the document answers — the sheet's heading. */
  k: string;
  /** The one-line explanation. Also used by the fallback list. */
  v: string;
};

export const SCOPE_STEPS: readonly ScopeStep[] = [
  {
    n: "01",
    label: "Brief",
    k: "What you send",
    v: "Two paragraphs in plain language — no tech knowledge required.",
  },
  {
    n: "02",
    label: "Scope",
    k: "What we write",
    v: "Deliverables, exclusions and assumptions, agreed in writing.",
  },
  {
    n: "03",
    label: "Quote",
    k: "What it costs",
    v: "Priced by a human after the scope, never before it.",
  },
  {
    n: "04",
    label: "Handover",
    k: "What you keep",
    v: "Source, design files or exports — whatever the quote promised.",
  },
] as const;

/** Sample reference — the same shape the enquiry form returns on success. */
export const SAMPLE_REF = "REQ-2026-000042";

/** Subject line of the sample brief shown on the top sheet of the fallback. */
export const SAMPLE_TITLE = "Landing page for a new clinic";

/** Footer line printed on every sheet. */
export const SHEET_NOTE = "Human-reviewed · one reply, from a person";

/** Label above the scope rows in the fallback document. */
export const FOLLOWS_LABEL = "What follows your brief";
