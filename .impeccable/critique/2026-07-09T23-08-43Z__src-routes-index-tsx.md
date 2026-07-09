---
target: landing page / home
total_score: 20
p0_count: 2
p1_count: 2
timestamp: 2026-07-09T23-08-43Z
slug: src-routes-index-tsx
---
# Critique: Formos landing (`src/routes/index.tsx`)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Fake "En direct" feed and fabricated metrics masquerade as live status |
| 2 | Match System / Real World | 3 | Clear French verbs; "Routage Inngest" leaks builder jargon |
| 3 | User Control and Freedom | 3 | Easy exits via Admin / Se connecter / logo |
| 4 | Consistency and Standards | 2 | Three labels for one destination: "Ouvrir l'admin" / "Admin" / "Aller à Formos" |
| 5 | Error Prevention | 2 | Dual primary CTAs (admin vs login) invite the wrong door |
| 6 | Recognition Rather Than Recall | 2 | Typeform-look preview does not map to the admin staff will open |
| 7 | Flexibility and Efficiency | 2 | Header Admin helps; page still sells before the task |
| 8 | Aesthetic and Minimalist Design | 1 | Hero checklist + metric overlay + orbits + fake dashboard |
| 9 | Error Recovery | 1 | No recovery or help if admin/login fails from here |
| 10 | Help and Documentation | 2 | Short copy helps; no "what is admin?" for first-timers |
| **Total** | | **20/40** | **Below average — redesign hero honesty and density** |

## Anti-Patterns Verdict

**Yes. Reads as AI-generated SaaS marketing.** Not borderline.

**LLM assessment:** Cream/ivory + Fraunces display + gold accents (banned cluster). Hero-metric floating card (`68,4 %`). Glass/blur on metric overlay and sticky header. Fake live activity panel with letter-avatar rows and `147` / `+18,7 %`. Repeated uppercase tracked kickers. Decorative orbits, noise, radial gold. Typeform-adjacent dark preview (Entrée hint, gold Continuer). Brand "Formos" is nav-scale only; H1 is benefit copy. First-order finance reflex (green + gold + cream) and second-order editorial-lite (serif + mono numbers + ruled list).

**Deterministic scan:** `npx impeccable detect` on `src/routes/index.tsx` and `app-shell.tsx` returned **0 findings**. The detector misses compositional/layout bans (hero overlays, fake metrics, brand-first failure). Treat empty scan as a false negative for this surface, not a clean bill of health.

**Visual overlays:** Browser automation unavailable in this session; no `[Human]` overlay tab. CLI-only.

## Overall Impression

The page has the right token ingredients (everest-green, mauve, bone) and decent French directive copy, but the composition is a product-hunt pitch: dark mock, floating completion %, live lead theater. For an internal Everest tool, the biggest opportunity is to stop selling and start wayfinding: Formos at hero scale, one calm product image, one door in.

## What's Working

1. **French, short verbs** in H1 and steps (Créer / Partager / Suivre) match PRODUCT tone.
2. **Workflow list** (mono 01–03, hairline rules, no icon-card grid) is the most on-brand structure on the page.
3. **Token system** exists; dosage and composition are the problem, not the palette names.

## Priority Issues

### [P0] Hero violates first-viewport budget and brand-first
- **What:** Eyebrow + H1 + support + 2 CTAs + 3 checklist chips + FormPreview + floating `68,4 %` card + orbits. Formos is nav-only.
- **Why:** Staff cannot grasp value in <10s; eye lands on dark mock + metric, not the product name.
- **Fix:** First viewport = Formos (hero-scale) + one headline + one sentence + one CTA group + one dominant image. Kill checklist strip and metric overlay.
- **Suggested command:** `impeccable distill` then `impeccable layout`

### [P0] Fake metrics / live activity destroy financial-grade trust
- **What:** `68,4 %` overlay; section-activity "En direct"; `147` / `+18,7 %`.
- **Why:** Internal finance staff smell theater; anti-ref "generic SaaS dashboards" is implemented literally.
- **Fix:** Remove fabricated numbers. No "live" unless live. Prefer one honest product shot or a single capability line.
- **Suggested command:** `impeccable quieter` / `impeccable distill`

### [P1] Typeform-look form-preview
- **What:** Dark glass FormPreview, Entrée hint, gold Continuer pill, selected gold option.
- **Why:** PRODUCT anti-ref: match Typeform editing experience, not its look.
- **Fix:** Preview in Formos language (bone/mauve/everest) or show builder chrome staff will actually use.
- **Suggested command:** `impeccable craft` (hero visual) or `impeccable quieter`

### [P1] Typography / aesthetic lane is training-data default
- **What:** Fraunces + Plus Jakarta Sans fallback + cream radials + gold garnish.
- **Why:** Reflex-reject fonts and cream+serif+gold ban; fintech category reflex.
- **Fix:** One committed sans (not Jakarta/Inter family); gold rare; let everest-green or mauve carry voice.
- **Suggested command:** `impeccable typeset` / `impeccable colorize`

### [P2] CTA naming chaos + Inngest jargon
- **What:** "Ouvrir l'admin" / "Admin" / "Aller à Formos"; checklist "Routage Inngest".
- **Why:** Recognition fail; first-timers hesitate.
- **Fix:** One primary label everywhere (e.g. "Ouvrir Formos"). Drop Inngest from marketing surface.
- **Suggested command:** `impeccable clarify`

## Persona Red Flags

**Jordan (First-Timer):** Two equal CTAs; "Routage Inngest" / "Stats par champ" need translation; fake live panel implies a state that isn't theirs; no help for "what is admin?"

**Alex (Power User):** Marketing theater before Admin; fake metrics insult expertise; duplicate CTAs feel patronizing. Wants land → Admin in one click.

**Camille (Everest marketing, non-technical, value <10s):** Brand not hero-level; eye stolen by dark preview + metric overlay; mauve activity panel feels like a different app; primary job (open admin + understand value) fails under SaaS chrome.

## Minor Observations

- Header mauve→gold stripe and letter-mark "F" read as generic app chrome.
- `rise-in` only on left column; motion feels unfinished.
- `cta-inline` is a card for a text+button that does not need one.
- Duplicate login/admin in header and hero.
- No photographic/product imagery; CSS panels substitute.
- Footer Badge as brand crutch.

## Questions to Consider

1. If you deleted every number and the live feed, would anyone still understand Formos in 5 seconds?
2. Why is the emotional peak a Typeform clone instead of the admin staff will open?
3. Is this page for persuasion or wayfinding? Internal tools usually need a door, not a pitch deck.
4. What would quiet confidence look like with zero gold until the primary button?
