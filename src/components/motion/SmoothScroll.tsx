"use client";

import { ReactLenis } from "lenis/react";
import { usePathname } from "next/navigation";

/* ---------------------------------------------------------------------------
 * Smooth scrolling (DESIGN.md §6).
 *
 * Lenis owns the scroll axis and runs its own frame loop (the React adapter's
 * `autoRaf` default). GSAP is deliberately absent: it was installed, wired, and
 * measured at ~50 kB gzip on every page before being removed again, because
 * nothing was using it yet. It comes back in the same commit as the first real
 * scroll-driven animation, so the cost lands when the benefit does.
 *
 * Reduced motion needs no branch of ours. Lenis's `respectReducedMotion`
 * (default true) forces `lerp: 1`, so the page tracks the input device 1:1 and
 * programmatic scrolls become instant — while the loop keeps running, so
 * anything scroll-linked stays in sync instead of freezing half-applied.
 *
 * `stopInertiaOnNavigate` keeps momentum from a click from carrying into the
 * next page after a route change.
 *
 * `options` is a module constant on purpose: `ReactLenis` rebuilds the whole
 * instance whenever that object's identity changes.
 *
 * Kept off the admin surfaces — those are forms and data tables, where smooth
 * scroll is cost with no design payoff.
 * ------------------------------------------------------------------------- */

const OPTIONS = {
  stopInertiaOnNavigate: true,
} as const;

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const enabled = !pathname?.startsWith("/admin");

  if (!enabled) return <>{children}</>;

  // `root` renders children directly — no wrapper div, so the DOM is unchanged
  // and Lenis simply marks <html> with `.lenis` while it is running.
  return (
    <ReactLenis root options={OPTIONS}>
      {children}
    </ReactLenis>
  );
}
