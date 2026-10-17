"use client";

import type { Readiness } from "./readiness";

/**
 * The brief's readiness line (DESIGN.md §5, §6).
 *
 * It is the form's masthead and it stays pinned under the site header for as
 * long as the form is on screen, which is the one thing an eight-screen enquiry
 * cannot otherwise tell you: whether it is finished. `readReadiness` derives it
 * from the live `FormData` by the same call the submit handler uses, so it
 * cannot drift from what would be sent, and it is deliberately the *only*
 * read-out on this page — a mirror of the fields beside you would be duplication
 * wearing a document costume.
 *
 * `aria-hidden`: the inputs already carry `required` and the server sends back
 * per-field errors, so this is a visual echo, and a live region that announced
 * itself on every keystroke would be worse than silence.
 */
export function ReadinessStrip({ readiness }: { readiness: Readiness }) {
  const { answered, total, ready } = readiness;
  return (
    <div className="readout-meter readiness-strip" aria-hidden>
      <span className="meta whitespace-nowrap">Your brief</span>
      <span className="readout-meter-track">
        <i style={{ transform: `scaleX(${total > 0 ? answered / total : 0})` }} />
      </span>
      <span className={`meta readiness-state whitespace-nowrap ${ready ? "is-ready" : ""}`}>
        {ready ? "Ready to send" : `${answered} of ${total} required`}
      </span>
    </div>
  );
}
