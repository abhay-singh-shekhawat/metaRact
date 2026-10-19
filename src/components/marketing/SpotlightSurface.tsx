import type { CSSProperties, ReactNode } from "react";
import SpotlightCard from "@/components/SpotlightCard";

/* ---------------------------------------------------------------------------
 * The studio's lit card surface.
 *
 * `SpotlightCard` (React Bits — see THIRD-PARTY-NOTICES.md) bound to the same
 * tokens as `.surface-link`, so a service card is the same object on the home
 * bento and on /services and the two can drift apart in their inner layout but
 * never in their chrome.
 *
 * The light is on-register rather than decoration: DESIGN.md asks for
 * product-render lighting, and this is a soft key light that follows the
 * pointer and catches the card's edge. It is off under
 * `prefers-reduced-motion` (the component handles that itself), never runs an
 * idle animation loop (`ambient` stays off), and lights the card when a
 * keyboard user focuses anything inside it.
 * ------------------------------------------------------------------------- */

export function SpotlightSurface({
  children,
  className = "",
  padding = "p-6",
}: {
  children: ReactNode;
  className?: string;
  /** Padding utility. Responsive variants are welcome (`p-7 md:p-9`). */
  padding?: string;
}) {
  return (
    <SpotlightCard
      theme="light"
      // A literal, not a variable: the component feeds this into `color-mix`,
      // and it has to be a colour the canvas-side palette can also read.
      spotlightColor="var(--accent)"
      intensity={0.5}
      // Tight enough to read as one light rather than a wash across the card.
      spotlightSize={240}
      borderGlow={0.45}
      proximity={90}
      className={`surface-spotlight h-full ${padding} ${className}`.trim()}
      style={
        {
          "--spotlight-card-surface": "var(--surface)",
          "--spotlight-card-border": "var(--line)",
          "--spotlight-card-shadow": "var(--spotlight-shadow, var(--shadow-rest))",
        } as CSSProperties
      }
    >
      {children}
    </SpotlightCard>
  );
}
