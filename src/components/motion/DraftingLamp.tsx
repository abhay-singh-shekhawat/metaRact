"use client";

import { useEffect, useRef } from "react";

/**
 * The drafting lamp (DESIGN.md §6).
 *
 * One soft cobalt light that tracks the pointer across a section's grid, like a
 * lamp over a drafting table. Decorative only — `aria-hidden`, `pointer-events:
 * none`, and it changes nothing about what is reachable or legible.
 *
 * Movement is transform-only (one composited element), so no gradient is repainted
 * per frame. It listens on its own parent element and is disabled on coarse
 * pointers and under reduced motion, where the CSS default position gives the
 * exact static wash this section had before.
 */
export function DraftingLamp() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let x = 0;
    let y = 0;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--lamp-x", `${x}px`);
      el.style.setProperty("--lamp-y", `${y}px`);
    };

    const onMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    host.addEventListener("pointermove", onMove);
    return () => {
      host.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} aria-hidden className="drafting-lamp pointer-events-none" />;
}
