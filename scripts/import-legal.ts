/**
 * Import the published policy text into typed modules.
 *
 * `docs/legal/*.md` is the source of truth for the four policy pages. This script
 * converts it to `src/content/legal/*.ts` — a shape the app can render without a
 * markdown parser and without adding a dependency — and refuses to write anything if
 * the markdown is not the simple subset the documents are written in.
 *
 * Run: pnpm legal:import
 *
 * Revising a policy: edit `docs/legal/<file>.md`, run this script, review the diff in
 * `src/content/legal/`, then bump `legalConfig` in `src/config/legal.ts`.
 * `tests/unit/legal-content.test.ts` is the gate that proves the published modules
 * still match the markdown.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LEGAL_DOCUMENTS, parseLegalMarkdown, serializeLegalDoc } from "./lib/legal-import";

const SOURCE_DIR = path.join(process.cwd(), "docs", "legal");
const OUT_DIR = path.join(process.cwd(), "src", "content", "legal");

let sections = 0;
try {
  for (const entry of LEGAL_DOCUMENTS) {
    const source = readFileSync(path.join(SOURCE_DIR, entry.file), "utf8");
    const document = { ...parseLegalMarkdown(source, entry.file), href: entry.href };
    writeFileSync(path.join(OUT_DIR, entry.out), serializeLegalDoc(document, entry), "utf8");
    sections += document.sections.length;
    console.log(`${entry.file} → src/content/legal/${entry.out}  (${document.sections.length} sections)`);
  }
} catch (error) {
  console.error(`legal:import FAILED — ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

console.log(`legal:import OK — ${LEGAL_DOCUMENTS.length} documents, ${sections} sections.`);
