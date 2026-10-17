"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/** "3 · Scope in writing" -> "Scope in writing" */
const label = (title: string) => title.replace(/^\d+\s*·\s*/, "");
/** 3 -> "03" */
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The process register (DESIGN.md §5, §6). One sequence, three read-outs, all
 * driven by the same IntersectionObserver band at the viewport centre — there
 * are no scroll listeners anywhere in this component.
 *
 *  - the file — a sticky pile of sheets where every step you pass files a
 *    numbered document behind the current one (lg and up);
 *  - the index — the rail that maps the whole sequence (lg and up);
 *  - the meter — the same read-out as a single bar below lg, where the sticky
 *    column has no room to exist.
 *
 * Meaning, not decoration: the pile is the studio's own promise — "every step
 * produces something you can read" — as a thing you can watch accumulate. It
 * is `aria-hidden` because the index and the list already state the same
 * progress as text.
 *
 * Motion is CSS transitions only, so the global reduced-motion block turns
 * every state change into an instant one rather than an animation.
 */
export function ProcessRail({ steps }: { steps: readonly (readonly [string, string])[] }) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === "undefined") return;
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-step]"));
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.step);
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [steps.length]);

  const total = steps.length;
  const current = active + 1;

  return (
    <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
      {/* ── Sticky read-out: the file grows as you read ──────────────────── */}
      <div className="hidden lg:block">
        <div className="sticky top-28">
          <p className="meta">Progress</p>

          <div className="process-stack" aria-hidden>
            {steps.map(([title], i) => {
              // > 0 = filed that many sheets back and up; otherwise it is still
              // parked just in front of the pile, waiting its turn.
              const back = Math.max(-1.5, active - i);
              const filed = active - i > 0;
              return (
                <span
                  key={title}
                  className="process-sheet process-sheet--pile"
                  style={
                    {
                      "--back": back,
                      opacity: filed ? Math.max(0.55, 1 - back * 0.09) : 0,
                      zIndex: filed ? i + 1 : 0,
                    } as CSSProperties
                  }
                >
                  <span className="process-sheet-tab">{pad(i + 1)}</span>
                </span>
              );
            })}

            <span className="process-sheet process-sheet--current">
              <span className="process-sheet-num">{pad(current)}</span>
              {/* The sheet names itself. It used to foot with "STEP 04 / 06",
                  directly above a gauge that already means 4 of 6 — the name is
                  the half of that pair a glance can actually use, and the sheet
                  is a fixed 4:3 block, so swapping costs no height at all. */}
              <span className="process-sheet-name">{label(steps[active][0])}</span>
              <span className="process-sheet-gauge">
                <i style={{ transform: `scaleX(${current / total})` }} />
              </span>
            </span>
          </div>

          {/* The index — the map of the whole sequence. */}
          <div className="relative mt-6 pl-6">
            <span aria-hidden className="absolute left-0 top-1 bottom-1 w-px bg-[var(--line)]" />
            <span
              aria-hidden
              className="absolute left-0 top-1 w-px bg-[var(--accent)] transition-[height] duration-500"
              style={{ height: `calc((100% - 0.5rem) * ${total > 1 ? active / (total - 1) : 1})` }}
            />
            {/* gap-2.5, not gap-3: the whole column must fit under the header on a
                ~620px-tall desktop viewport, where the card, its fan and six index
                rows together already fill it (see DESIGN.md §7). */}
            <ol className="grid gap-2.5">
              {steps.map(([title], i) => (
                <li key={title} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`-ml-[30px] grid h-[11px] w-[11px] place-items-center rounded-full border transition-colors duration-300 ${
                      i <= active
                        ? "border-[var(--accent)] bg-[var(--accent)]"
                        : "border-[var(--line-2)] bg-[var(--canvas)]"
                    }`}
                  />
                  <span
                    className={`text-[14px] transition-colors duration-300 ${
                      i === active ? "font-semibold text-[var(--ink)]" : "text-[var(--ink-3)]"
                    }`}
                  >
                    {label(title)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* ── Steps ────────────────────────────────────────────────────────── */}
      <div className="min-w-0 lg:pb-16">
        {/* Below lg, the same read-out as one bar. */}
        <div className="readout-meter process-meter">
          <span className="meta whitespace-nowrap">
            Step {pad(current)} / {pad(total)}
          </span>
          <span className="readout-meter-track" aria-hidden>
            <i style={{ transform: `scaleX(${current / total})` }} />
          </span>
        </div>

        <ol ref={listRef} className="border-t border-[var(--line)]">
          {steps.map(([title, body], i) => (
            <li
              key={title}
              data-step={i}
              className="relative border-b border-[var(--line)] py-8 md:py-10"
            >
              <span aria-hidden className={`process-row-rule ${i === active ? "is-active" : ""}`} />
              <div className="grid gap-4 md:grid-cols-[88px_1fr] md:gap-8">
                <p className={`meta pt-1 transition-colors duration-300 ${i === active ? "text-[var(--accent)]" : ""}`}>
                  {pad(i + 1)}
                </p>
                <div>
                  <h3 className="display-h3 text-[19px]">{label(title)}</h3>
                  <p className="mt-2.5 max-w-[64ch] text-[15px] leading-relaxed text-[var(--ink-2)]">{body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
