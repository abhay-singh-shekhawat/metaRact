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

## 3. Dials

| Dial | Value | Meaning |
|---|---|---|
| `DESIGN_VARIANCE` | 8 | Asymmetric grids, offset stacking, generous empty zones |
| `MOTION_INTENSITY` | 6 | Fluid CSS, pointer-tilt depth, scroll reveals — no hijacking |
| `VISUAL_DENSITY` | 4 | Comfortable marketing rhythm; tighter only inside `/admin` |

## 4. Tokens

Sourced in `src/styles/globals.css` (`@theme` + `:root`). Do not hard-code a hex
outside that file; use the CSS variable.

### 4.1 Colour — one locked light theme

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
| `--ok` | `#0B7A47` | Confirmed / delivered |
| `--warn` | `#8A5300` | Draft / notice |
| `--danger` | `#B42318` | Errors, honeypot-free validation |

Legacy aliases (`--bg`, `--border`, `--action`, `--action-hover`, `--ink-2`) are
kept because admin and form components reference them. Same values, one system.

**Rules:** one accent, never a second hue. Status colour is never the only signal
(a label or glyph always accompanies it). No pure `#000` / `#FFF` for ink or paper.

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
`ButtonLink`, `Rule`, `Stat`, `GridBackdrop`. Data-fetching wrappers around them
stay server components; any primitive that needs pointer/observer behaviour lives
in its own `"use client"` leaf (`Reveal`, `HeroObject`, `ProcessRail`, `ServiceTilt`).

## 6. Motion

Brand motion identity — **Premium**.

- Signature easing `--ease-out: cubic-bezier(.16,1,.3,1)`; exits `--ease-in: cubic-bezier(.5,0,1,.5)`.
- Durations `--t-fast: 160ms`, `--t-base: 320ms`, `--t-slow: 560ms`.
- Entrance = decelerate; exit = accelerate. Transform/opacity only.
- Scroll reveal: `opacity 0→1`, `translateY(14px→0)`, 60 ms stagger, fires once.
- Pointer tilt: max `±6°`, damped, desktop + fine-pointer only.
- Hover feedback on interactive cards; `:active` presses `1px`.

**Reduced motion is non-negotiable.** Every animation is either gated behind
`@media (prefers-reduced-motion: no-preference)` in CSS or short-circuited in JS
via `matchMedia`. The global `reduce` block additionally zeroes transition and
animation durations.

## 7. Responsive

Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.
Rules: every multi-column layout declares its `<768px` collapse; the hero uses
`min-h-[100dvh]`-free height (no full-viewport lock); the signature 3D object is
replaced by a flat stack below `md` and on coarse pointers; nav renders on one
line to `1024` then collapses to a full-screen sheet; nothing may introduce
horizontal scroll (`document.scrollWidth === clientWidth` is asserted in the QA sweep).

## 8. Accessibility constraints

- `:focus-visible` ring: `3px var(--accent)`, offset `2px`, on every interactive element.
- Minimum target `44px`. Form labels always above inputs; errors below, tied by `aria-describedby`.
- Body contrast ≥ 4.5:1; headings ≥ 7:1 (`--ink-2` on `--canvas` = 7.4:1; white on `--ink` = 18.9:1).
- Status never colour-only. Motion never the only carrier of meaning.
- Admin retains `no-store` caching and its server-side auth checks untouched.

## 9. Test contract (must not break)

The Playwright suite asserts live text and roles. The redesign preserves, verbatim:
nav labels (`Services`, `Work`, `Process`, `Pricing`, `About`), the `Service`/`menu`
accessible names, the `Details` link text on `/services`, an `<h1>` on `/`,
the form labels (`Project title`, `Project summary`, `Your name`, `Email`,
privacy checkbox, `Submit enquiry`), the success copy (`Request received`, `REQ-`),
and in admin: heading `Overview`, `Change status`, `Update status`, `Saved.`,
`internal note`, `Add note`, `email`/`password`/`sign in`.

## 10. Accepted debt

1. **No icon library.** Deliberate: no new runtime dependency. Icons are typographic
   glyphs and simple geometric SVG marks only. A future icon set would be a single
   swap in the primitives layer.
2. **Single light theme.** Trust-first B2B plus an operational console; no dark mode.
   Tokens are theme-ready (`:root` only) if that changes.
3. **Web fonts fetched at build** (`Bricolage Grotesque`, `Geist` via `next/font`),
   self-hosted at runtime. `adjustFontFallback` keeps CLS at zero; the system stack
   is the declared fallback.
4. **`/admin` shares the marketing chrome.** A distinct shell is a product decision,
   not a styling one; the console gets its own sub-navigation instead.
