"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------------------------
 * Copy-to-clipboard for a value that cannot be a link.
 *
 * WhatsApp usernames have no public URL form, so the contact page can only
 * print them. Copying is the one genuinely useful action left, and it is real —
 * no control is rendered that does not do something. Failure (an insecure
 * context, a denied permission) is reported, never swallowed.
 * ------------------------------------------------------------------------- */

type State = "idle" | "copied" | "failed";

/**
 * The pre-Clipboard-API path, kept for browsers that gate `writeText` behind a
 * permission the page has not been granted. Runs inside the click handler, so
 * it still has the user activation `execCommand("copy")` requires.
 */
function legacyCopy(value: string): boolean {
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "-9999px";
  area.style.opacity = "0";

  const selection = document.getSelection();
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  document.body.appendChild(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  document.body.removeChild(area);

  if (previous && selection) {
    selection.removeAllRanges();
    selection.addRange(previous);
  }
  return copied;
}

export function CopyHandle({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<State>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const copy = useCallback(async () => {
    let next: State = "copied";
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      next = legacyCopy(value) ? "copied" : "failed";
    }
    setState(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), 2400);
  }, [value]);

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        className="inline-flex min-h-[32px] min-w-[74px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line)] px-2.5 text-[12.5px] font-medium text-[var(--ink-3)] transition-colors hover:border-[var(--line-2)] hover:text-[var(--ink)]"
      >
        {state === "idle" ? "Copy" : state === "copied" ? "Copied" : "Copy failed"}
      </button>
      <span aria-live="polite" className="sr-only">
        {state === "copied" ? `${value} copied to clipboard.` : ""}
        {state === "failed" ? "Copying is not available in this browser." : ""}
      </span>
    </>
  );
}
