# DESIGN.md — Digital Services Studio

The implementation contract for the studio's front-end. Every colour, size, radius,
duration and primitive used in `src/` traces back to a token named here.

Scope note: this document governs **presentation only**. It changes no route, API,
schema, business rule or integration. See `docs/architecture.md` for the system spec.

---

## 1. Product context

A small, human-scoped digital-services studio. Five service pillars, one enquiry
form, a triage console for the two founders. The visitor arrives with a vague idea
and leaves with a **written reference number and a promise of a human reply**.

The product's whole personality is *candour*: no instant quotes, no invented
clients, no fake urgency, no black boxes. The visual language has to carry that
same feeling — precise, legible, unhurried, obviously made by people.

**Primary journey:** home → service detail → start-project → submit → reference.
**Secondary:** work, process, pricing, about, FAQ, contact, policy pages.
**Operational:** `/admin` (overview, enquiries table, enquiry detail, settings, sign-in).

## 2. Art direction — "Ink & Spec"

A drafting-table aesthetic: the calm of a spec sheet, the rhythm of an editorial
page. Ink on cool paper, hairline rules instead of boxes, monospace metadata
marking the mechanical parts (reference numbers, step indices, field hints), and
one deliberate piece of dimensional theatre that *explains the product*.

**Rejected defaults:** cold grey SaaS template, white cards on white with blue
buttons, glowing gradient blobs, glassmorphism, purple gradients, brownish
"warm craft" paper, three equal feature cards.

Deliberate inversions of the incumbent look:

- **Primary action is ink, not blue.** Buttons are near-black; cobalt is reserved
  for links, markers, focus and small signals. This reads more premium and stops
  every surface shouting "buy".
- **Hairlines over containers.** Where a border was decorative, it becomes a rule.
- **Asymmetric composition.** The hero and section headers are split
  `1.15fr / 0.85fr`, never centred, never three equal columns.
- **A dimensional object that carries meaning**, not decoration: the "scope stack"
  shows the sequence Brief → Scope → Quote → Handover, which is literally what the
  studio sells.

### 2.1 Ink & Spec in 3D (v2 — dimensional layer)

Every premium agency site is **dark neon glass** — glow, gradients, particles,
aurora. We go the other way, and that inversion is the differentiator:

> **A matte product-render aesthetic.** Paper-white surfaces, hairline ink edges,
> cobalt accents, one warm key light, subtle film grain — a precision instrument
> photographed on a drafting table.

**Coherence is the standard.** One idea carried through, not four effects stacked
(Awwwards: Studio K95). A 3D portfolio becomes a tech demo the moment it is all
camera and no work.

- **Dimensional elements are intentional, never decorative.** Every 3D object must
  explain or demonstrate something the studio actually sells. No floating cubes,
  no ambient particle fields, no meteors, no glow-for-glow's-sake.
- **Reference:** DREIRAUM's blueprint-view hero (hold to reveal the wireframe) is the
  closest fit to the drafting-table language.
- **Nothing is pictured that cannot be shown.** The studio publishes no client work
  without written permission, so by definition it owns no screenshot it may use.
  Rather than fake one, every work item is given a **generated composition plate** —
  a section-rhythm drawing derived deterministically from that item's own metadata
  (§5). A drawing is never a claim: it depicts no interface, client, metric or
  result, and it says so on its own face.
- **Rejected in 3D too:** neon, bloom-heavy gradients, glassmorphism, particle
  fields, purple/teal "AI" palettes, CDN-hosted assets.

### 2.2 Two registers (light + studio-black)

The site runs one locked **light** theme by default. Signature moments may open a
deliberate **studio-black** register — full-bleed near-black sections lit like a
product photograph. The duality is intentional and scoped: the black register is
used for *moments* (the hero object, the final CTA), never for whole page bodies,
and never mixed within a single section.

**Where it opens today — the hero light box.** The hero's 3D object sits in a stage
that paints nothing in the paper register, so the object reads against the page's own
paper exactly as the CSS fallback does. The `Product / Blueprint` control opens the
register *inside that box only*: the four sheets redraw as cobalt construction
drawings on near-black, and pull apart so all four documents are legible at once.
It is the one interactive register change on the site, it is a real keyboard-operable
control (`aria-pressed`), and it never alters the surrounding page's typography,
contrast or layout.

## 3. Dials

| Dial | Value | Meaning |
|---|---|---|
| `DESIGN_VARIANCE` | 8 | Asymmetric grids, offset stacking, generous empty zones |
| `MOTION_INTENSITY` | 8 | Fluid CSS, pointer depth, scroll reveals, one WebGL signature object — no hijacking |
| `VISUAL_DENSITY` | 4 | Comfortable marketing rhythm; tighter only inside `/admin` |
| `DIMENSION` | 7 | One real 3D object per surface with product-render lighting; never decorative particles |

## 4. Tokens

Sourced in `src/styles/globals.css` (`@theme` + `:root`). Do not hard-code a hex
outside that file; use the CSS variable.

### 4.1 Colour — one locked light theme (+ studio-black register)

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0B0F17` | Headings, primary buttons, dark panels |
| `--ink-2` | `#434C60` | Body copy |
| `--ink-3` | `#6B7488` | Metadata, captions |
| `--canvas` | `#F0F2F6` | Page background (cool paper) |
| `--canvas-2` | `#E7EAF1` | Recessed areas, code blocks |
| `--surface` | `#FFFFFF` | Cards, inputs, header |
| `--surface-2` | `#F8F9FC` | Subtle fills |
| `--line` | `#DDE2EB` | Hairline rules and borders |
| `--line-2` | `#C6CDDA` | Stronger rules, input borders on focus-adjacent |
| `--accent` | `#2A3CF0` | Links, markers, focus ring, eyebrows |
| `--accent-2` | `#1B2BC4` | Accent hover |
| `--accent-soft` | `#E9ECFF` | Accent wash (selection, chips) |
| `--studio` | `#06080D` | Signature studio-black register (§2.2) |
| `--studio-2` | `#0C1018` | Raised surfaces inside the black register |
| `--studio-line` | `rgba(255,255,255,.12)` | Hairlines on black |
| `--ok` | `#0B7A47` | Confirmed / delivered |
| `--warn` | `#8A5300` | Draft / notice |
| `--danger` | `#B42318` | Errors, honeypot-free validation |

Legacy aliases (`--bg`, `--border`, `--action`, `--action-hover`) are kept because
admin and form components reference them. Same values, one system.

**Rules:** one accent, never a second hue. Status colour is never the only signal
(a label or glyph always accompanies it). No pure `#000` / `#FFF` for ink or paper.
The studio-black register is opt-in per section, never a page-wide theme.

### 4.2 Type

| Role | Family | Notes |
|---|---|---|
| Display | **Bricolage Grotesque** (`--font-display`) | Headings only. Variable. Tight tracking. |
| Body / UI | **Geist** (`--font-sans`) | Everything else. |
| Meta | system monospace (`--font-mono`) | Reference numbers, step indices, field hints. |

Scale (fluid, `clamp`):

- `--size-hero`: `clamp(2.4rem, 5.6vw, 4.25rem)`, `line-height .98`, `letter-spacing -.03em`
- `--size-h1`: `clamp(2rem, 3.6vw, 3rem)`, `line-height 1.03`, `-.02em`
- `--size-h2`: `clamp(1.5rem, 2.4vw, 2rem)`, `line-height 1.1`, `-.015em`
- `--size-h3`: `1.125rem`, `600`
- Body `16px/1.65`; lead `17px/1.6`; small `14.5px`; meta `12px` uppercase `+.14em`.

**Eyebrow restraint (hard rule):** at most one eyebrow per three sections. The
hero counts as one. If a section does not need a category label, it does not get one.

### 4.3 Space & shape

- Section rhythm: `py-20` → `md:py-28`. Page hero: `pt-14 pb-16` → `md:pt-20 md:pb-20`.
- Container: `min(1200px, 100% - 2.5rem)`, `3.5rem` gutters from `md`.
- Radii (single documented scale): cards/panels `16px`, controls `10px`, chips `999px`.
- Elevation: resting = `1px var(--line)` + `0 1px 2px rgba(11,15,23,.04)`.
  Hover = `translateY(-2px)` + `0 22px 44px -28px rgba(11,15,23,.42)`. No pure-black shadows.

## 5. Primitives (`src/components/ui/primitives.tsx`)

`Section`, `SectionHeading`, `Eyebrow`, `PageHero`, `Card`, `Panel`, `Chip`,
`ButtonLink`, `Rule`, `Stat`, `Tick`, `Dash`. Data-fetching wrappers around them
stay server components; any primitive that needs pointer/observer behaviour lives
in its own `"use client"` leaf under `src/components/motion/` or
`src/components/marketing/` (`Reveal`, `HeroObject`, `ProcessRail`, `Tilt`,
`Magnetic`, `DraftingLamp`, `hero/HeroStage`, `hero/DraftingScene`).

Hero content lives in `src/components/marketing/scopeStack.ts` and is imported by
both renderings of the object — the CSS fallback and the WebGL scene — so the
picture and its accessible text can never drift apart.

The process register (`src/components/motion/ProcessRail.tsx`) renders one
sequence three ways — the sticky file, the index rail and the small-screen meter
— from a single `active` index fed by one `IntersectionObserver` band. Step copy
stays in the route and is passed in; the register never owns content.

The work register (`src/components/marketing/CompositionPlate.tsx`, geometry in
`plateArt.ts`) is the one entry above that is **not** a client leaf: it is a
server-rendered inline SVG, so it costs nothing on the wire and needs no
hydration. Each approved work item draws one plate from its own slug, which is why
the same project always draws the same sheet. `full` prints the folio, the stack
legend and the "a drawing, not a screenshot" note; `compact` drops all chrome,
because at thumbnail size any label would be illegible, and is `aria-hidden` —
in list rows it sits inside a link whose text already carries the meaning. The
plan is a rhythm study and never a chart: sections vary by *how many* grid columns
they take, never by proportional width, so nothing on the sheet can be misread as
a measurement or a result.

Client leaves may wrap server-rendered children (passed as props); they must never
import server-only code.

## 6. Motion

Brand motion identity — **Premium**.

- Signature easing `--ease-out: cubic-bezier(.16,1,.3,1)`; exits `--ease-in: cubic-bezier(.5,0,1,.5)`.
- Durations `--t-fast: 160ms`, `--t-base: 320ms`, `--t-slow: 560ms`.
- Entrance = decelerate; exit = accelerate. **Transform/opacity only** — never
  `width`/`height`/`top`/`left`/`margin`.
- Scroll reveal: `opacity 0→1`, `translateY(14px→0)`, 60 ms stagger, fires once.
- Pointer tilt: max `±6°`, damped, desktop + fine-pointer only.
- Hover feedback on interactive cards; `:active` presses `1px`.
- **Page enter:** opacity-only fade (240–320 ms, `--ease-out`). Deliberately **no
  transform** on the page wrapper: a transformed ancestor breaks `position: sticky`,
  which the sidebars on `/start-project`, `/services/[slug]`, `/work/[slug]` and
  `ProcessRail` rely on.
- **Magnetic CTA:** primary actions drift toward the pointer by ≤6 px, eased with a
  small hand-rolled rAF spring (exponential follow, no overshoot) and written as a
  full `translate3d()` string. Released back to origin on leave. Fine-pointer +
  hover only. Hand-rolled rather than pulling in an animation library: the library
  measured at **+48 kB First Load JS** on the homepage versus ~30 lines for the effect.
- **Drafting lamp:** a single soft cobalt light tracks the pointer across the hero
  grid. One absolutely-positioned element moved by `transform` only (no gradient
  repaint per frame). At rest it sits where the original static wash sat, so coarse
  pointers and no-JS get the same static look.
- **Process register:** progress through the sequence comes from one
  `IntersectionObserver` band at the viewport centre — still no scroll listeners.
  Each step passed files a numbered sheet behind the current document in a sticky
  CSS-3D pile, and the same index drives the rail and the small-screen meter. The
  current sheet names itself — number, step name, gauge — rather than footing with
  `STEP n / 06`, which would only restate the gauge sitting beside it; the sheet is
  a fixed 4:3 block, so the name costs no height. Only
  `transform` and `opacity` change, so it stays on the compositor. The pile is
  `aria-hidden`: the index and the list already state the same progress as text, so
  the picture is a bonus and never the only carrier of meaning (§8). Every change is
  a CSS transition, which means the global reduced-motion block turns it into an
  instant state change rather than an animation.

**Tool selection (cheapest that works):** CSS transitions/animations for hover,
state, entry and predetermined motion; small rAF springs for pointer-coupled
motion; a library only where it earns its bundle — 3D objects, layout animation,
interruption, scroll-linked values. Do not pull a library in for a fade or a nudge.

### 6.1 The dimensional layer (`three` + `@react-three/fiber`)

Governed by the same rules as everything else; the medium changes, the standard
does not.

- **Progressive enhancement, not replacement.** The server renders the CSS stack
  (`HeroObject`) exactly as before. `hero/HeroStage` then decides whether the device
  can afford the scene, and lazy-mounts it only if it can. The fallback stays in the
  DOM underneath: it defines the box (so upgrading costs **zero layout shift**) and
  it keeps four real documents in the accessibility tree, where pixels would be
  silent.
- **Gate (all must pass):** `min-width: 1024px`, `(hover: hover) and (pointer: fine)`,
  `prefers-reduced-motion: no-preference`, `navigator.connection.saveData` unset, and
  a working WebGL context. Otherwise the visitor keeps the CSS object. The scene is
  never mounted under reduced motion — the animation is not merely paused.
- **No runtime asset fetches.** Geometry is generated in code and the sheets' type is
  painted to a `<canvas>` with the fonts `next/font` already self-hosts. No model,
  texture, HDRI or font file is requested at runtime, so `default-src 'self'` holds
  and there is nothing to download but the JS.
- **Budget:** lazy chunk, never in First Load JS. `dpr={[1, 1.75]}`. The render loop
  switches to `demand` the moment the stage leaves the viewport, so a hero that has
  scrolled away costs nothing. Two lights and a rim; one 1024² shadow map.
- **Motion:** one slow idle drift, pointer parallax damped at ~4.5 s⁻¹, and a camera
  dolly that pulls back as the stack opens so the widened fan always fits the frame.
  Nothing spins, nothing loops on a short cycle, nothing hijacks scroll.
- **Text is painted, not modelled.** A `<CanvasTexture>` per sheet face, drawn at
  1024 × 798, reproduces the spec sheet in both registers from one painter — which is
  what makes the blueprint toggle read as *the same document, redrawn*.

**Reduced motion is non-negotiable.** Every animation is either gated behind
`@media (prefers-reduced-motion: no-preference)` in CSS or short-circuited in JS
via `matchMedia` / `useReducedMotion`. The global `reduce` block additionally zeroes
transition and animation durations. Pointer-reactive effects are additionally gated
to `(hover: hover) and (pointer: fine)`.

## 7. Responsive

Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.
Rules: every multi-column layout declares its `<768px` collapse; the hero uses
`min-h-[100dvh]`-free height (no full-viewport lock); the signature object falls
back to a flat stack below `lg` and on every device the WebGL gate rejects
(coarse pointer, reduced motion, data-saver, no WebGL) — see §6.1; nav renders on
one line to `1024` then collapses to a full-screen sheet; the case-study plate
prints its full chrome from `768` up and swaps to the unlabelled compact plan below
that (any label would render about 5 px tall at a 350 px sheet); the `/process`
sticky column—card + fan + six index rows—is held under `500 px` so it still fits
beneath the header on a ~620 px-tall desktop viewport, where it would otherwise
scroll its own top off-screen; nothing may
introduce horizontal scroll (`document.scrollWidth === clientWidth` is asserted in
the QA sweep).

## 8. Accessibility constraints

- `:focus-visible` ring: `3px var(--accent)`, offset `2px`, on every interactive element.
- Minimum target `44px`. Form labels always above inputs; errors below, tied by `aria-describedby`.
- Body contrast ≥ 4.5:1; headings ≥ 7:1 (`--ink-2` on `--canvas` = 7.4:1; white on `--ink` = 18.9:1).
- Status never colour-only. Motion never the only carrier of meaning.
- The composition plate carries a single `role="img"` label on its full variant and
  is `aria-hidden` on the compact one. Everything the sheet shows (title, stack,
  date, type) is also present as real page text, so the drawing never carries
  meaning alone — and a screen reader is never read the plate's internal labels twice.
- Decorative motion (lamp, tilt, ornament) is `aria-hidden` and keyboard-irrelevant;
  it must never gate a function. Admin retains `no-store` caching and its
  server-side auth checks untouched.

## 9. Test contract (must not break)

The Playwright suite asserts live text and roles. The redesign preserves, verbatim:
nav labels (`Services`, `Work`, `Process`, `Pricing`, `About`), the `Service`/`menu`
accessible names, the `Details` link text on `/services`, an `<h1>` on `/`,
the form labels (`Project title`, `Project summary`, `Your name`, `Email`,
privacy checkbox, `Submit enquiry`), the success copy (`Request received`, `REQ-`),
and in admin: heading `Overview`, `Change status`, `Update status`, `Saved.`,
`internal note`, `Add note`, `email`/`password`/`sign in`.

Also asserted, and never to regress: **zero horizontal overflow** at every tested
width, **no console errors**, and **one `<h1>` per page**.

## 10. Accepted debt

1. **Runtime animation dependencies, measured — not assumed.** v2 relaxes the
   original "no new runtime dependency" rule only where it pays.
   - Phase 1's pointer effects (magnetic CTA, drafting lamp, tilt) stayed CSS and
     ~30-line rAF springs. Measured: adding `motion` cost **+48 kB First Load JS** on
     the homepage for a 6 px nudge, so it was removed. Homepage First Load JS is
     unchanged by Phase 1.
   - Phase 2 adds **`three` + `@react-three/fiber`** (plus `@types/three` as a dev
     type dependency) for the hero object, nothing else. Measured: homepage First
     Load JS **109 → 111 kB**; the 3D runtime sits in its own lazy chunks and appears
     in no route's First Load JS. `@react-three/drei` was **not** adopted — its useful
     pieces (environment presets, 3D text) fetch remote assets, which the CSP forbids.
     `@react-three/postprocessing` remains optional and uninstalled.
   - Phase 3 adds **no dependency at all** — the process register is CSS 3D plus one
     `IntersectionObserver`, the same technique as Phase 1. Measured: `/process`
     First Load JS **108 kB** and shared First Load JS **103 kB**, both unchanged.
   - Phase 4 adds **no dependency at all** — the composition plate is
     server-rendered inline SVG and ships no client JS. Measured: `/work` and
     `/work/[slug]` First Load JS **107 kB** and shared First Load JS **103 kB**,
     all unchanged.
   - Any further library must be justified the same way: measure it, then decide.
2. **No icon library.** Still deliberate. Icons are typographic glyphs and simple
   geometric SVG marks only.
3. **Single light theme + scoped studio-black register** (§2.2). No user-facing theme
   switch; the console stays light.
4. **Web fonts fetched at build** (`Bricolage Grotesque`, `Geist` via `next/font`),
   self-hosted at runtime. `adjustFontFallback` keeps CLS at zero; the system stack
   is the declared fallback.
5. **`/admin` shares the marketing chrome.** A distinct shell is a product decision,
   not a styling one; the console gets its own sub-navigation instead.
