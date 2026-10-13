---
target: homepage
total_score: 22
max_score: 32
na_heuristics: 7,9
p0_count: 1
p1_count: 3
target_identity: "file:D:\\agency\\src\\app\\page.tsx"
target_fingerprint: "sha256:60eaa2d565600a158d7eee6fe17c51b84fd83b354e8e20619148e1f50e1cd5a9"
target_path: "D:\\agency\\src\\app\\page.tsx"
timestamp: 2026-10-12T19-55-39Z
slug: src-app-page-tsx
---
# Impeccable critique — homepage (src/app/page.tsx, Persuade)

Method: dual-agent (A: design review · B: detector + browser evidence). Target slug: src-app-page-tsx.
Heuristics total: 22/32 (H7, H9 n/a) — Acceptable band (69%).

## Specificity: copy authored, visuals scaffolding
Specific: brief-coaching hero card, trust-by-candour copy (concept labels, honest empty state, budget-is-signal), process-led IA. Generic: system sans + blue-on-off-white + numbered cards could be any restrained B2B; placeholder "Y / Your Studio Name" ships in UI (pre-gated launch blocker); no studio signature artifact in viewport.

## Heuristics
1 Visibility/Status: 2 — capacity pill + active nav good; no reply-time expectation.
2 Real World: 4 — "describe the outcome", scope-in-writing, handover language mirror buyers.
3 User Control: 3 — exits everywhere; nothing to undo on marketing page.
4 Consistency: 2 — one button system, but 3 labels for one action; Eyebrow unused on homepage.
5 Error Prevention: 3 — honesty patterns prevent mismatched briefs; service misroute unguarded.
6 Recognition: 3 — process/brief visible where needed; 5 services need comparison aid.
7 Flexibility: n/a (Persuade).
8 Minimalism: 3 — restrained style, 7 equally-weighted bands.
9 Error Recovery: n/a (no form on homepage).
10 Help/Docs: 2 — FAQ/process/pricing linked; no talk-to-human escape on page.

## Priority issues
1. [P0] Placeholder brand in UI — pre-gated by preflight, still the top launch blocker.
2. [P1] Proof vacuum after promise — single concept card under "Real, approved work first." Arch mandates section order; do not reorder. Mitigate by compressing section when work < 2.
3. [P1] No face/SLA at high-stakes moment — needs founder approval + business commitment; cannot ship unilaterally.
4. [P2] Six-way service choice, router tile last and quiet — emphasize/move router tile.
5. [P2] Final CTA quieter than pricing band + H2 near-duplicates H1 — swap visual weight, rewrite closer.
6. [P1→fixed] Low-contrast subtext #d6defa on #315BE8 (detector-measured 4.1:1) — set to solid white; mono label white/60→70; FAQ + marked aria-hidden.

## Personas
Jordan: loves brief-card, stalls at 5-service choice; "Start a Project" sounds committal.
Riley: hunts proof/people, finds placeholder + concept-only + no numbers; "no instant quotes" reads evasive.
Casey: full-black card before proof on mobile; 3 same-destination CTAs; uniform H2s give no skim anchors.

## Detector (Assessment B)
Static TSX scan: clean []. URL scan: 1 warning (low-contrast, fixed), 1 advisory (em-dash saturation, style choice, kept). Sweep: 200s, zero console errors, zero overflow. Live 200.
