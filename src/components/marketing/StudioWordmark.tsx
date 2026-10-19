"use client";

import dynamic from "next/dynamic";
import { siteConfig } from "@/config/site";

/* The glyph-outline code is the single largest thing these four additions bring
 * in, and it lives in the footer — below the fold on every route, and invisible
 * until someone points at a letter. There is no reason for it to sit in the
 * initial bundle of every page, so it loads after hydration. The wrapper below
 * owns the final height, so nothing shifts when the chunk lands. */
const TechText = dynamic(() => import("@/components/TechText"), { ssr: false });

/* ---------------------------------------------------------------------------
 * The studio wordmark, drawn as a technical drawing (React Bits `TechText` —
 * see THIRD-PARTY-NOTICES.md).
 *
 * Idle it is a fine dashed outline of the real wordmark. Pointing at a letter
 * fills it in and reveals its baseline, x-height, cap-height and descender,
 * with the letter's measured width and height — the same drafting language the
 * hero uses. Nothing here is invented: the text is `siteConfig.studioName`.
 *
 * `sweep` is off, so there is no ambient animation loop and the wordmark is
 * completely still until someone points at it. `draggable` and `clickKick` are
 * off as well — this is a signature, not a toy. The component disables its
 * remaining motion under `prefers-reduced-motion` itself, and the outline it
 * falls back to is a real static representation of the mark.
 * ------------------------------------------------------------------------- */

export function StudioWordmark() {
  return (
    <div className="font-display h-[clamp(84px,13vw,168px)] w-full">
      <TechText
        text={siteConfig.studioName}
        color="#0b0f17"
        accentColor="#2a3cf0"
        align="center"
        strokeWidth={1.5}
        dashLength={5}
        dashGap={3}
        letterSpacing={-0.04}
        reveal="letter"
        selection
        labels
        guides
        specks={0}
        bounce={0.35}
        sweep={false}
        draggable={false}
        clickKick={false}
        intro="none"
      />
    </div>
  );
}
