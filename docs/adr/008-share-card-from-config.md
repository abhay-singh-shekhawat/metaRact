# ADR-008: The share card is generated from config at build time

Date: 2026-10-17
Status: Accepted

## Context

The site had no `og:image`. Two ways to give it one:

1. A hand-made PNG in `public/`, produced in a design tool.
2. A generated image, rendered by the app.

The blocker for (1) is not effort but ownership: the studio name, wordmark and mark are the operator's to supply (ADR-003), and a static asset baked with a placeholder name would have to be re-made by hand the day they supply one — the same trap the preflight guard exists to catch for `NEXT_PUBLIC_STUDIO_NAME`.

## Decision

Generate it: `src/app/opengraph-image.tsx`, using `next/og`'s `ImageResponse`. Everything on the card comes from config — studio name, tagline, `enabledServices()`, and the domain from `siteConfig.siteUrl`. Nothing is stated that the site does not already state; the eyebrow line reuses the layout's own meta description, and the service list is the same list the enquiry form offers.

Because `siteConfig` is static, the route is rendered **once at build time** and served as a file: no request-time cost, no font fetched over the network at runtime (which the CSP would forbid anyway — the display face is served by `next/font` and is not reachable from a route renderer, so the card uses the renderer's bundled default face).

The file convention makes every child route inherit the card, and emits `og:image:width/height/type/alt` and `twitter:card: summary_large_image` automatically.

## Consequences

- The card picks up the real studio name the moment `NEXT_PUBLIC_STUDIO_NAME` is set, and follows the enabled-service list automatically.
- Also fixed here, and the more serious half of the problem: the root layout set `openGraph.title`/`description` explicitly, and an explicit root value wins over a page's own resolved metadata — so **every route was shared as the homepage**. `/pricing` announced itself as "Websites, Software, Design & AI" with the enquiry-form description. Those two fields were removed from the root layout; each route now resolves its own `title` and `description` into the share preview. Verified per route, not assumed.
- A long studio name wraps rather than overflows (the left column is a flex column with a growable spacer), so no per-name tuning is required.
