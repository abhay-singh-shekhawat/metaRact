/**
 * Markdown ⇄ typed legal content.
 *
 * Kept out of the CLI so the fidelity test can use the very same parser and the very
 * same inverse: `tests/unit/legal-content.test.ts` rebuilds the markdown from the
 * published modules and compares it to `docs/legal/*.md`, so there is one definition
 * of what the documents contain and no second implementation to drift.
 */
import type { LegalBlock, LegalDoc, LegalSection } from "../../src/content/legal/types";

export interface LegalDocumentEntry {
  /** Markdown file under `docs/legal/`. */
  file: string;
  /** Route the document is published at. */
  href: string;
  /** Generated module under `src/content/legal/`. */
  out: string;
  /** Exported const name in that module. */
  exportName: string;
}

export const LEGAL_DOCUMENTS: readonly LegalDocumentEntry[] = [
  { file: "privacy-policy.md", href: "/privacy", out: "privacy-policy.ts", exportName: "privacyPolicyDoc" },
  { file: "terms-of-service.md", href: "/terms", out: "terms-of-service.ts", exportName: "termsOfServiceDoc" },
  {
    file: "cancellation-refund-policy.md",
    href: "/cancellation",
    out: "cancellation-refund-policy.ts",
    exportName: "cancellationRefundPolicyDoc",
  },
  {
    file: "intellectual-property-policy.md",
    href: "/intellectual-property",
    out: "intellectual-property-policy.ts",
    exportName: "intellectualPropertyPolicyDoc",
  },
];

const H2 = /^## (\d+)\. (.+)$/;
const STEP = /^(\d+)\. (.+)$/;

/**
 * Parse one policy document. The documents are a deliberately small markdown subset —
 * one `# ` title, numbered `## N. ` sections, paragraphs, `- ` lists, `1. ` lists and
 * `**bold**` spans — and anything outside it is rejected rather than guessed at.
 */
export function parseLegalMarkdown(markdown: string, file: string): LegalDoc {
  const lines = markdown.split(/\r?\n/);
  const titleLine = lines.find((line) => line.startsWith("# "));
  if (!titleLine) throw new Error(`${file}: no "# " title heading`);
  const title = titleLine.slice(2).trim();

  const sections: LegalSection[] = [];
  let current: LegalSection | null = null;
  let buffer: Array<{ text: string; hard: boolean }> = [];
  let list: Extract<LegalBlock, { kind: "bullets" | "steps" }> | null = null;

  const flushParagraph = () => {
    if (buffer.length === 0) return;
    if (!current) throw new Error(`${file}: paragraph before the first "## " section`);
    for (const part of buffer) {
      if (!part.text) throw new Error(`${file}: empty paragraph`);
    }
    if (buffer.length === 1) {
      current.blocks.push({ kind: "p", text: buffer[0].text });
    } else {
      // Several source lines in one paragraph: markdown renders them as one line unless
      // each is followed by a hard break. The documents only ever use hard breaks.
      for (const part of buffer.slice(0, -1)) {
        if (!part.hard) throw new Error(`${file}: soft line break inside "${part.text.slice(0, 40)}"`);
      }
      current.blocks.push({ kind: "lines", lines: buffer.map((part) => part.text) });
    }
    buffer = [];
  };

  const flushList = () => {
    if (list && current) current.blocks.push(list);
    list = null;
  };

  const flush = () => {
    flushParagraph();
    flushList();
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith("# ")) continue; // handled above

    const heading = H2.exec(line);
    if (heading) {
      flush();
      const number = Number(heading[1]);
      const expected = sections.length + 1;
      if (number !== expected) throw new Error(`${file}: section "${heading[2]}" is numbered ${number}, expected ${expected}`);
      current = { id: `s${number}`, heading: `${number}. ${heading[2].trim()}`, blocks: [] };
      sections.push(current);
      continue;
    }
    if (line.startsWith("#")) throw new Error(`${file}: unsupported heading "${line}" (only one "# " title and "## N. " sections)`);

    if (line === "") {
      flush();
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      if (list?.kind !== "bullets") {
        flushList();
        list = { kind: "bullets", items: [] };
      }
      list.items.push(line.slice(2).trim());
      continue;
    }

    const step = STEP.exec(line);
    if (step) {
      flushParagraph();
      if (list?.kind !== "steps") {
        flushList();
        list = { kind: "steps", items: [] };
      }
      if (Number(step[1]) !== list.items.length + 1) {
        throw new Error(`${file}: numbered list jumps from ${list.items.length} to ${step[1]}`);
      }
      list.items.push(step[2].trim());
      continue;
    }

    if (/^[|>`_[\]()]/.test(line) || /^\*(?!\*)/.test(line)) {
      throw new Error(`${file}: unsupported markdown at "${line.slice(0, 40)}" (links, tables, quotes, italics and code)`);
    }

    flushList();
    buffer.push({ text: line, hard: /\s{2,}$/.test(raw.replace(/\r$/, "")) });
  }
  flush();

  if (sections.length === 0) throw new Error(`${file}: no sections found`);
  for (const section of sections) {
    if (section.blocks.length === 0) throw new Error(`${file}: section "${section.heading}" has no content`);
  }

  const document: LegalDoc = { href: "", title, sections };

  // The renderer understands exactly one inline markup: **bold**.
  for (const text of allText(document)) {
    if ((text.match(/\*\*/g) ?? []).length % 2 !== 0) {
      throw new Error(`${file}: unbalanced ** in "${text.slice(0, 60)}"`);
    }
  }

  return document;
}

/** Every string a reader will see, in document order. */
export function allText(document: LegalDoc): string[] {
  return [
    document.title,
    ...document.sections.flatMap((section) => [
      section.heading,
      ...section.blocks.flatMap((block) => {
        if (block.kind === "p") return [block.text];
        if (block.kind === "lines") return block.lines;
        return block.items;
      }),
    ]),
  ];
}

/** The markdown the document claims to have come from. Used to prove fidelity. */
export function documentToMarkdown(document: LegalDoc): string {
  const out: string[] = [`# ${document.title}`];
  for (const section of document.sections) {
    out.push("", `## ${section.heading}`);
    for (const block of section.blocks) {
      out.push("");
      if (block.kind === "p") out.push(block.text);
      else if (block.kind === "lines") out.push(...block.lines);
      else if (block.kind === "bullets") out.push(...block.items.map((item) => `- ${item}`));
      else out.push(...block.items.map((item, index) => `${index + 1}. ${item}`));
    }
  }
  return `${out.join("\n")}\n`;
}

export function serializeLegalDoc(document: LegalDoc, entry: LegalDocumentEntry): string {
  const body = JSON.stringify({ href: document.href, title: document.title, sections: document.sections }, null, 2)
    // Drop the quotes around plain keys: braces stay JSON, body reads like the codebase.
    .replace(/^(\s*)"([A-Za-z_][A-Za-z0-9_]*)":/gm, "$1$2:");
  return `/**
 * GENERATED by \`pnpm legal:import\` from docs/legal/${entry.file} — do not edit by hand.
 * See docs/legal/DEVIATIONS.md for the approved edits applied to the supplied text.
 */
import type { LegalDoc } from "./types";

export const ${entry.exportName}: LegalDoc = ${body};
`;
}
