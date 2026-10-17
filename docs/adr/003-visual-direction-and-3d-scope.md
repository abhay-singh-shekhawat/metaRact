# ADR-003: The v2 visual direction, and where 3D is allowed

Date: 2026-10-16
Status: Accepted

## Context

The first pass at the site was competent and generic: cards, gradients, one soft shadow everywhere. A redesign was commissioned with a brief to make it distinctive without turning it into a demo reel, and under a hard constraint carried over from the existing security posture — `default-src 'self'`, no CDN runtime assets, everything self-hosted.

## Decision

**Direction: "Paper & Ink, in 3D."** Paper-white surfaces, hairline ink edges (`--line`), one cobalt accent (`--accent`), one warm key light, film grain. Depth is used to describe a physical object — a sheet of paper being laid down, numbered and filed — rather than to decorate.

3D is confined to **five signature moments**, each tied to a real idea on the page: the WebGL hero (a rotating stack of spec sheets, with a blueprint toggle), the process rail, the composition plates on the work index, the enquiry readiness strip, and the filed-sheet confirmation. Everything outside those moments is flat, typographic, and reachable without JavaScript or a GPU.

Light + studio-black duality (`--studio`, `--studio-2`, `--studio-line`) is used only inside those moments, so the contrast reads as intentional.

## Consequences

- Rejected outright: neon, glow, aurora, particle fields, and every "motion framework" install that would have brought them (see ADR-004).
- The hero renders a canvas. Because the app's CSP forbids remote assets, the scene is composed from geometry and shaders rather than a downloaded model or texture.
- Every animated surface is gated by `prefers-reduced-motion`, globally zeroing durations — including inside WebGL, which must honour the media query itself.
- The direction is deliberately unfinished on one point: the studio name, wordmark and mark are the operator's to supply, and the preflight fails closed on the `"Your Studio Name"` placeholder (see ADR-008 for the same reasoning applied to the share card).
