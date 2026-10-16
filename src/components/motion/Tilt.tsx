"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Subtle pointer-tracked depth for card grids (DESIGN.md §6).
 * Desktop, fine-pointer, motion-allowed only; degrades to a flat card
 * everywhere else. Writes CSS custom properties directly — never React state.
 */
export function Tilt({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const MAX = 3.5;
    let frame = 0;
    let tx = 0;
    let ty = 0;

    const apply = () => {
      frame = 0;
      el.style.setProperty("--tx", `${tx.toFixed(2)}deg`);
      el.style.setProperty("--ty", `${ty.toFixed(2)}deg`);
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      tx = ((event.clientX - rect.left) / rect.width - 0.5) * MAX * 2;
      ty = -((event.clientY - rect.top) / rect.height - 0.5) * MAX * 2;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const reset = () => {
      tx = 0;
      ty = 0;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={`tilt ${className}`.trim()}>
      {children}
    </div>
  );
}
