# ADR-004: No animation library

Date: 2026-10-16
Status: Accepted

## Context

Three.js and React Three Fiber were already dependencies when the v2 motion work began. The tempting additions were `motion` (Framer Motion), `lenis` (smooth scroll), `@react-three/drei` and `@react-three/postprocessing`.

This is a marketing site whose entire first paint is a WebGL canvas. First Load JS at the time was 103 kB shared, with `/start-project` at 9.34 kB.

## Decision

Take none of them. Motion is written with CSS transitions/animations plus a small set of React primitives (a `Reveal` wrapper, a magnetic-button hook, a drafting-lamp light), driven by the existing tokens: `--ease-out: cubic-bezier(.16,1,.3,1)`, `--t-fast: 160ms`, `--t-base: 320ms`, `--t-slow: 560ms`.

## Rationale

- `motion` measured at **+48 kB First Load JS**, on top of a bundle that already carries three and fiber. It would have been the largest single client dependency, for easing curves CSS already has.
- Smooth scrolling (`lenis`) hijacks the platform scroller. It breaks `position: sticky`, anchor links, `scroll-margin`, and browser-level find; the site relies on sticky sheets and scroll-driven rails.
- `drei` and `postprocessing` are broad libraries pulled in for two or three helpers. The helpers used (`useFrame`, html-free labels) are a few lines each.

## Consequences

- Scroll behaviour stays native, so keyboard paging, find-in-page and reduced-motion all behave as the platform intends.
- A page-level transform must never be applied for page-enter transitions: it would create a containing block and break `position: sticky`. This is a known trap, documented at the call site.
- Anything needing spring physics has to be written by hand. Accepted.
- First Load JS after the full v2 pass: 103 kB shared, `/start-project` 9.83 kB — i.e. the redesign added ~0.5 kB to the heaviest page.
