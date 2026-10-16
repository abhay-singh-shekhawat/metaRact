"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-linked process rail (DESIGN.md §5). Meaning, not decoration: it shows
 * where the reader is in the studio's own process. Progress is derived from an
 * IntersectionObserver band at the viewport centre — no scroll listeners.
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

  return (
    <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
      {/* Sticky index */}
      <div className="hidden lg:block">
        <div className="sticky top-28">
          <p className="meta">Progress</p>
          <div className="relative mt-5 pl-6">
            <span aria-hidden className="absolute left-0 top-1 bottom-1 w-px bg-[var(--line)]" />
            <span
              aria-hidden
              className="absolute left-0 top-1 w-px bg-[var(--accent)] transition-[height] duration-500"
              style={{ height: `calc((100% - 0.5rem) * ${total > 1 ? active / (total - 1) : 1})` }}
            />
            <ol className="grid gap-4">
              {steps.map(([title], i) => (
                <li key={title} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`-ml-[30px] grid h-[11px] w-[11px] place-items-center rounded-full border transition-colors duration-300 ${
                      i <= active ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--line-2)] bg-[var(--canvas)]"
                    }`}
                  />
                  <span
                    className={`text-[14px] transition-colors duration-300 ${
                      i === active ? "font-semibold text-[var(--ink)]" : "text-[var(--ink-3)]"
                    }`}
                  >
                    {title.replace(/^\d+\s*·\s*/, "")}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Steps */}
      <ol ref={listRef} className="border-t border-[var(--line)]">
        {steps.map(([title, body], i) => (
          <li
            key={title}
            data-step={i}
            className="group border-b border-[var(--line)] py-8 transition-colors duration-300 md:py-10"
          >
            <div className="grid gap-4 md:grid-cols-[88px_1fr] md:gap-8">
              <p className={`meta pt-1 transition-colors duration-300 ${i === active ? "text-[var(--accent)]" : ""}`}>
                {String(i + 1).padStart(2, "0")}
              </p>
              <div>
                <h3 className="display-h3 text-[19px]">{title.replace(/^\d+\s*·\s*/, "")}</h3>
                <p className="mt-2.5 max-w-[64ch] text-[15px] leading-relaxed text-[var(--ink-2)]">{body}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
