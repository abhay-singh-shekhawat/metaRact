# Third-party notices

This file records third-party source that is redistributed inside this
repository, and the licence each piece is redistributed under. It exists
because two of these licences require the notice to travel with the code.

Nothing listed here is fetched at runtime: every asset is vendored into the
build so the site keeps working under its `default-src 'self'` Content Security
Policy.

---

## React Bits — `TechText`, `GradualBlur`, `SpotlightCard`

Source: <https://reactbits.dev> — <https://github.com/DavidHDev/react-bits>

Vendored files and where they are used:

| File in this repo | Component | Used by |
| --- | --- | --- |
| `src/components/TechText.tsx` | TechText | `src/components/marketing/StudioWordmark.tsx` |
| `src/components/GradualBlur.tsx` | GradualBlur | `src/components/marketing/Header.tsx` |
| `src/components/SpotlightCard.tsx` | SpotlightCard | `src/components/marketing/SpotlightSurface.tsx` |

### Local adaptations

These are the only changes made to the vendored source, so that a future
upstream update is easy to diff:

1. `SpotlightCard.tsx` — the light theme's `shadow` value was malformed
   (`'0 1px 2px rgba(24, 24, 27, 0.04), 18px 40px -20px 0.16)'`, missing a
   colour and an offset), which made the whole `box-shadow` declaration
   invalid. Fixed to a valid shadow.
2. `SpotlightCard.tsx` — the `CARD` constant's hardcoded `rounded-3xl p-8`
   geometry was replaced with `rounded-[var(--radius-lg)]`. Padding is now the
   consumer's job, so the same card can serve the compact home bento and the
   roomier `/services` index without a second component.
3. `SpotlightCard.tsx` — upstream assigns `settingsRef.current = settings`
   during render, which this repository's ESLint config rejects
   (`react-hooks/refs`). The assignment moved into a `useEffect` declared
   immediately before the existing wake effect, so the ref is synced on commit,
   before anything reads it. No behavioural change.

Everything else — including each component's own reduced-motion handling and
pointer/touch guards — is upstream, unmodified.

### Licence

MIT License, with the Commons Clause License Condition v1.0.

```
MIT License

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

"Commons Clause" License Condition v1.0

The Software is provided to you by the Licensor under the License, as defined
below, subject to the following condition.

Without limiting other conditions in the License, the grant of rights under the
License will not include, and the License does not grant to you, the right to
Sell the Software.

For purposes of the foregoing, "Sell" means practicing any or all of the rights
granted to you under the License to provide to third parties, for a fee or
other consideration (including without limitation fees for hosting or
consulting/ support services related to the Software), a product or service
whose value derives, entirely or substantially, from the functionality of the
Software. Any license notice or attribution required by the License must also
include this Commons Clause License Condition notice.
```

**What that means here.** The Commons Clause removes the right to *sell* the
components. This site uses them inside a product, which the licence allows, and
it does not redistribute them as a component library, template, or asset pack.
The copyright and permission notice above is reproduced here so it travels with
the vendored files.

---

## Lenis

Source: <https://github.com/darkroomengineering/lenis>

Consumed as an npm dependency (`lenis`, MIT). Not vendored — the package's own
licence file ships with it in `node_modules`, and the bundler inlines only the
compiled output. Recorded here for completeness.

---

## Everything else

The remaining third-party code in this repository is consumed through npm and
owns its licence in `node_modules` (`three`, `@react-three/fiber`, `next`,
`react`, `mongodb`, `nodemailer`, `zod`, `@upstash/*`, `bcryptjs`,
`server-only`). Nothing from those packages is copied into this repository's
source tree.
