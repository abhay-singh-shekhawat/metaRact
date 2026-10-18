/**
 * Inline markup for policy text.
 *
 * The supplied documents use exactly one inline markup — `**bold**` — plus mentions of
 * another policy's full title, which the site turns into a link. Both splittings are
 * pure and lossless: joining the segments reproduces the source text minus the `**`
 * markers, which `tests/unit/legal-content.test.ts` asserts for every published string.
 * Nothing here rewrites, summarises or reorders the supplied wording.
 */

export interface InlineSegment {
  text: string;
  bold: boolean;
}

export interface LinkSegment {
  text: string;
  /** Set when this segment names another policy. */
  href?: string;
}

export interface CrossLinkTarget {
  title: string;
  href: string;
}

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** `**bold**` → emphasis segments. Markers are dropped; every other character is kept. */
export function splitInline(text: string): InlineSegment[] {
  return text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, index) => ({ text: part, bold: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
}

/** A mention of another policy's exact title → a link segment. */
export function splitCrossLinks(text: string, targets: CrossLinkTarget[]): LinkSegment[] {
  if (targets.length === 0) return [{ text }];
  const pattern = new RegExp(`(${targets.map((target) => escapePattern(target.title)).join("|")})`, "g");
  return text
    .split(pattern)
    .map((part) => {
      const target = targets.find((candidate) => candidate.title === part);
      return target ? { text: part, href: target.href } : { text: part };
    })
    .filter((segment) => segment.text.length > 0);
}
