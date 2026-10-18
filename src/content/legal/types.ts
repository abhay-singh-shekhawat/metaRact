/**
 * Shape of a published legal document.
 *
 * The site renders the supplied policy text verbatim. Nothing here paraphrases,
 * summarises or re-orders the source: `docs/legal/*.md` is the authority and
 * `scripts/import-legal.ts` converts it into the modules under `src/content/legal/`
 * without touching a character. `tests/unit/legal-content.test.ts` fails if the
 * published modules and the markdown ever disagree.
 */

export type LegalBlock =
  /** A paragraph. `**bold**` spans are the only inline markup the source uses. */
  | { kind: "p"; text: string }
  /**
   * A paragraph whose lines are held together by markdown hard breaks (two trailing
   * spaces) — the documents use this once, for a signature line.
   */
  | { kind: "lines"; lines: string[] }
  /** An unordered list (`- `). */
  | { kind: "bullets"; items: string[] }
  /** An ordered list (`1. `), used once, for the purposes of use in the privacy policy. */
  | { kind: "steps"; items: string[] };

export interface LegalSection {
  /** Stable anchor target, derived from the section number: `s1`, `s2`, … */
  id: string;
  /** The heading exactly as supplied, e.g. `1. Who we are`. */
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  /** The route this document is published at. */
  href: string;
  /** The document title, exactly as the source `# ` heading reads. */
  title: string;
  sections: LegalSection[];
}
