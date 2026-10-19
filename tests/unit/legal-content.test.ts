import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  LEGAL_DOCUMENTS,
  allText,
  documentToMarkdown,
} from "../../scripts/lib/legal-import";
import { legalDocs, otherLegalDocs } from "@/content/legal";
import { splitCrossLinks, splitInline } from "@/content/legal/inline";
import { legalConfig } from "@/config/legal";

/* ---------------------------------------------------------------------------
 * The policy pages publish supplied legal text, so the tests here are about
 * fidelity rather than behaviour: the modules the site renders must still be a
 * character-for-character transcription of docs/legal/*.md, and the inline
 * splitting that turns `**bold**` and policy names into markup must not add,
 * drop or reorder a single character.
 *
 * A wording change therefore has to be made in the markdown and re-imported with
 * `pnpm legal:import`; editing src/content/legal/ by hand fails these tests.
 * ------------------------------------------------------------------------- */

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "docs", "legal");

/** Blank lines and trailing spaces are formatting, not text. */
function normalise(markdown: string): string[] {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

describe("published policy text", () => {
  it.each(LEGAL_DOCUMENTS)("$file is published verbatim at $href", (entry) => {
    const published = legalDocs.find((doc) => doc.href === entry.href);
    if (!published) throw new Error(`nothing is published at ${entry.href}`);

    const source = readFileSync(path.join(SOURCE_DIR, entry.file), "utf8");
    expect(normalise(documentToMarkdown(published))).toEqual(normalise(source));
  });

  it("publishes every document once, with sequential anchors", () => {
    expect(legalDocs).toHaveLength(LEGAL_DOCUMENTS.length);
    expect(new Set(legalDocs.map((doc) => doc.href)).size).toBe(legalDocs.length);

    for (const doc of legalDocs) {
      const ids = doc.sections.map((section) => section.id);
      expect(ids).toEqual(doc.sections.map((_, index) => `s${index + 1}`));
      expect(doc.sections.length).toBeGreaterThan(5);
      for (const section of doc.sections) {
        expect(section.blocks.length).toBeGreaterThan(0);
        expect(section.heading.startsWith(`${section.id.slice(1)}. `)).toBe(true);
      }
    }
  });

  it("keeps titles unambiguous, so cross-links cannot be misread", () => {
    const titles = legalDocs.map((doc) => doc.title);
    expect(new Set(titles).size).toBe(titles.length);
    // The cross-link matcher is a plain alternation, so no title may contain another.
    for (const outer of titles) {
      for (const inner of titles) {
        if (outer !== inner) expect(outer.includes(inner)).toBe(false);
      }
    }
  });

  it("cross-references resolve to real routes, never to the page you are on", () => {
    const hrefs = new Set(legalDocs.map((doc) => doc.href));
    for (const doc of legalDocs) {
      const related = otherLegalDocs(doc);
      expect(related).toHaveLength(legalDocs.length - 1);
      for (const other of related) {
        expect(other.href).not.toBe(doc.href);
        expect(hrefs.has(other.href)).toBe(true);
      }
    }
  });

  it("reports the version and date it is published under", () => {
    expect(legalConfig.version).toMatch(/^\d+\.\d+$/);
    expect(legalConfig.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(`${legalConfig.updated}T00:00:00Z`).toISOString().slice(0, 10)).toBe(legalConfig.updated);
    expect(legalConfig.updatedLabel.length).toBeGreaterThan(0);
  });

  it("renders the text without altering a character", () => {
    for (const doc of legalDocs) {
      const targets = otherLegalDocs(doc).map((other) => ({ title: other.title, href: other.href }));
      for (const text of allText(doc)) {
        const expected = text.replace(/\*\*/g, "");

        const inline = splitInline(text);
        expect(inline.map((segment) => segment.text).join("")).toBe(expected);

        const linked = inline.flatMap((segment) => splitCrossLinks(segment.text, targets));
        expect(linked.map((segment) => segment.text).join("")).toBe(expected);
      }
    }
  });

  it("carries the edits approved in docs/legal/DEVIATIONS.md, and nothing else", () => {
    const text = legalDocs.flatMap(allText).join("\n");

    // Wording that was neutralised on 2026-10-18 (internal drafting notes addressed to
    // the business rather than to a reader, plus one broken sentence). See DEVIATIONS.md.
    for (const removed of [
      "requested standard rule",
      "Your stated rule distinguishes",
      "so this boundary is agreed before the project begins",
      "must be clearly shown in the quote before acceptance",
      "remain to be confirmed before launch",
      "should match the cookies and tracking tools actually enabled",
      ". within a reasonable period",
    ]) {
      expect(text).not.toContain(removed);
    }

    // Every obligation those sentences carried is still published, in the reader's voice.
    for (const kept of [
      "Metaract’s standard rule is to deduct 25% of the advance payment actually received",
      "Metaract’s standard rule is that the advance payment is non-refundable",
      "We state this rule in the quote before you accept it.",
      "and otherwise within a reasonable period after the refund amount is confirmed",
      "will be disclosed where required",
      "We keep this notice and any consent controls consistent",
    ]) {
      expect(text).toContain(kept);
    }
  });

  it("ships no placeholders or unfinished notes", () => {
    const text = legalDocs.flatMap(allText).join("\n");
    for (const unfinished of ["Your Studio Name", "TODO", "TBD", "XXX", "[", "]", "lorem"]) {
      expect(text.toLowerCase()).not.toContain(unfinished.toLowerCase());
    }
  });
});
