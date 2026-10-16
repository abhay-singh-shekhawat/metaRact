"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Magnetic container for primary actions (DESIGN.md §6).
 *
 * Hand-rolled on purpose. Motion (the library) was measured at +48 kB of First
 * Load JS on the homepage to drive a ≤6 px nudge — the wrong trade for this
 * effect, so the spring here is ~30 lines of rAF instead of a dependency. Motion
 * arrives in a later phase, where springs, interruption and scroll-linked values
 * genuinely earn it.
 *
 * Gate: fine pointer + hover only, and off entirely under reduced motion — this
 * is pure delight laid on top of a working button, never a way to reach it.
 * Transform-only, GPU-friendly; the element settles back to its origin on leave.
 */
export function Magnetic({
  children,
  className = "",
  strength = 0.24,
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  /** Fraction of the pointer's offset-from-centre that the element follows. */
  strength?: number;
  /** Hard cap in px. Keep it small; this is a nudge, not a game. */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    let last = 0;

    const clamp = (n: number) => Math.max(-max, Math.min(max, n));
    const write = () => {
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
    };

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      // Exponential ease toward the target: spring-like, never overshoots.
      const k = 1 - Math.exp(-14 * dt);
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;
      write();
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        cx = tx;
        cy = ty;
        write();
        raf = 0;
        last = 0;
      }
    };

    const start = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (event: PointerEvent) => {
      // The rect includes the transform we are currently applying, so subtract it
      // to recover the element's home centre — otherwise the target feedback-loops
      // and jitters as the element chases the pointer.
      const rect = el.getBoundingClientRect();
      const homeX = rect.left - cx + rect.width / 2;
      const homeY = rect.top - cy + rect.height / 2;
      tx = clamp((event.clientX - homeX) * strength);
      ty = clamp((event.clientY - homeY) * strength);
      start();
    };

    const reset = () => {
      tx = 0;
      ty = 0;
      start();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    el.addEventListener("focusout", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      el.removeEventListener("focusout", reset);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, [strength, max]);

  return (
    <div ref={ref} className={`inline-flex will-change-transform ${className}`}>
      {children}
    </div>
  );
}
