import type { ReactNode } from "react";

/**
 * Root template. Unlike a layout, a template gets a fresh instance on every
 * navigation, so the page content settles in with one short fade (DESIGN.md §6).
 *
 * Opacity only: a transform on this wrapper would create a containing block and
 * break the `position: sticky` sidebars inside pages (/start-project,
 * /services/[slug], /work/[slug]) and ProcessRail.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
