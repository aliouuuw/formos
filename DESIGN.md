---
version: alpha
name: Everest Summit
description: An institutional finance system grounded in deep forest green and mustard gold, with a sparse heritage purple accent and mountain-scale whitespace.
colors:
  primary: "#012d2a"
  secondary: "#cb9824"
  tertiary: "#dcdad2"
  mauve: "#461D4C"
  neutral: "#faf8f4"
  surface: "#FFFFFF"
  on-surface: "#0a0a0a"
  border: "#eeeeee"
  error: "#DC2626"
  muted: "#f0eee9"
  cream: "#faf6ef"
  ink-secondary: "#0a0a0acc"
  ink-tertiary: "#0a0a0a99"
typography:
  headline-display:
    fontFamily: Aptos
    fontSize: 46px
    fontWeight: 800
    lineHeight: 58px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Aptos
    fontSize: 35px
    fontWeight: 700
    lineHeight: 37px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Aptos
    fontSize: 24px
    fontWeight: 700
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Aptos
    fontSize: 20px
    fontWeight: 600
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Aptos
    fontSize: 18px
    fontWeight: 300
    lineHeight: 32px
    letterSpacing: 0em
  body-md:
    fontFamily: Aptos
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
    letterSpacing: 0.005em
  body-sm:
    fontFamily: Aptos
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0em
  label-lg:
    fontFamily: Aptos
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0.025em
  label-md:
    fontFamily: Aptos
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Aptos
    fontSize: 10px
    fontWeight: 500
    lineHeight: 13px
    letterSpacing: 0.25em
  nav-md:
    fontFamily: Aptos
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0em
  nav-sm:
    fontFamily: Aptos
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 16px
  xl: 32px
  full: 9999px
spacing:
  xs: 2px
  sm: 10px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 144px
components:
  button-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: "14px 28px"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: "14px 28px"
    height: "48px"
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0px"
    height: "auto"
  button-dark:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: "14px 28px"
    height: "48px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  chip:
    backgroundColor: "#012d2a1a"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
---

# Everest Summit

## Overview
This system feels institutional, alpine, and capital-markets precise — a regional finance brand that earns trust through restraint rather than ornament. The live site builds authority with deep forest-green fields, mustard-gold CTAs, and long stretches of warm off-white air between content clusters. A heritage purple remains in the palette as a sparse third voice — never the page default, used for selective emphasis (e.g. positioning pillars, soft violet atmospheres). Imagery is cinematic (summit peaks, market atmosphere) while UI chrome stays quiet: soft borders, pill buttons, and four-column service grids that never crowd the first viewport. It is spacious, deliberate, and directed at serious investors and corporate decision-makers who expect clarity and composure over product-marketing flash.

**Creative North Star: "Summit Authority"**

**Key Characteristics:**
- Deep green as the dominant institutional voice; gold as the action accent; heritage purple used sparingly
- Single sans family (Aptos / Plus Jakarta Sans) for headings and body
- Pill CTAs, soft-panel cards, generous section rhythm
- Alternating light ivory / pure white / deep green section planes

## Colors
- **Primary (#012d2a):** Everest green — the dominant UI color for dark sections, footer, secondary buttons, badges, and active states. In CSS this value lives on both `--everest-green` and `--mauve` (the token name is historical; most `var(--mauve)` usages resolve to green).
- **Secondary (#cb9824):** Mustard gold (`--jaune-or`) — reserved for primary CTAs, trust markers, icon accents, and selective text highlights. Its scarcity is intentional; overuse flattens hierarchy.
- **Mauve (#461D4C):** Heritage purple — a sparse brand remnant, not a system default. Use only for deliberate moments of differentiation (positioning pillar titles/icons, purple-tinted soft atmospheres, occasional hover fills). Prefer literal `#461D4C` / `rgba(70,29,76,…)` when you mean purple; do not assume `var(--mauve)` is purple anymore.
- **Surface (#FFFFFF):** Clean white for elevated cards, form surfaces, and secondary fills on light sections.
- **Neutral (#faf8f4):** Summit ivory — the soft alternate page background that keeps long marketing pages from feeling sterile.
- **Muted (#f0eee9):** White-smoke / summit-fog panels and quiet strip backgrounds behind card grids.
- **Cream (#faf6ef):** Warmer alternate background for secondary strips when ivory alone is too cool.
- **Tertiary (#dcdad2):** Timberwolf — structural divider and soft edge tone.
- **Border (#eeeeee):** Hairline separators and quiet strokes (`--line-soft` / command borders).
- **On-surface (#0a0a0a):** Primary ink (`--night`) for body and headlines on light grounds.
- **Ink-secondary / Ink-tertiary:** `--night-80` and `--night-60` for supporting copy and tertiary labels.
- **Error (#DC2626):** Validation and destructive feedback only; keep rare.

**The Three-Voice Rule.** Green owns structure and authority. Gold owns action (CTAs, highlights) at roughly ≤10% of a viewport. Purple is optional seasoning — at most one intentional cluster per page (or none). If purple starts competing with green for chrome/borders/body UI, pull it back.

## Typography
Aptos (with Plus Jakarta Sans fallback) is the sole working voice of the system — used for hero titles, section headlines, body, nav, and labels. Fraunces remains available as `--font-display` but is reserved for rare cinematic moments, not section headings. Headlines are bold (700–800) with tight negative tracking (−0.02em to −0.03em). Body stays light-to-regular with comfortable line height (1.6–1.75). Kickers and chips use small uppercase type with wide tracking (0.2em–0.25em) for institutional cadence. No italic emphasis in headings — accent meaning with gold color spans instead.

## Layout & Spacing
The layout sits in a wide page container (`max-w-[1400px]` with responsive horizontal insets) and breathes vertically. Standard sections use `.section-py` rhythm (~56–80px); secondary strips use `.section-py-sm`. Large compositional gaps follow `--section-gap` (roughly 96–144px). Hero wrappers use `--hero-py` for top clearance under the floating nav. Content clusters prefer one job per section: one headline, one short supporting sentence, then a single grid or split. Service and expertise blocks settle into clean 4-column grids on desktop; avoid stacking multiple competing CTA bands in the first viewport.

## Elevation & Depth
Depth is hybrid but restrained. Light surfaces rely on 1px soft borders (`--command-border`) and occasional lift shadows (`--shadow-card-lift: 0 8px 24px rgba(1,45,42,0.1)`). Soft panels add a faint green-tinted ambient shadow rather than heavy drop shadows. Dark sections use tonal gradients (`--gradient-dark-section`) and image overlays instead of card stacks. Glass treatments exist for dark media cards but should stay exceptional, not default. Prefer border + spacing hierarchy over multi-layer shadows.

## Shapes
The shape language is rounded and institutional. Primary and secondary actions are full pills (`9999px`). Standard cards use 16px (`--radius-card` / `rounded-2xl`); large floating or glass panels use 32px (`--radius-card-lg`). Inputs stay modest (~8px). Circles are reserved for icon wells and trailing CTA discs. Geometry should feel composed, never playful or bubbly.

## Components
Buttons should feel decisive and legible. Use `button-primary` for the strongest CTA: gold fill, white text, medium 14px label, full-pill rounding, ~48px height with generous horizontal padding. Use `button-secondary` for supporting actions on light grounds: transparent fill, green text and soft green border, same pill geometry. Use `button-dark` when a solid green control is needed (e.g. nav or footer contexts). Use `button-tertiary` for text links and lightweight actions. Hover may lift slightly (−1px to −2px) with a soft gold glow; never invent neon glows or oversized shadows. Focus rings are gold- or green-tinted double rings for accessibility.

Cards follow quiet soft-panel language: white or muted ivory fill, 1px command border, 16px radius, ~24px padding. They are containers for interaction or scannable content — not decorative chrome. Insight cards may add a top media band and a compact category chip. Chips / PillBadges are uppercase, wide-tracked, fully rounded, with green (default), gold (dark sections), or green-tint variants. Inputs match light surfaces, modest radius, and clearer borders on focus. Navigation stays text-forward: logo left, links center, gold pill CTA right; on scroll it may adopt a soft glass treatment without becoming a heavy bar.

## Do's and Don'ts
- Do keep green as the dominant institutional color and gold as the scarce action accent.
- Do use heritage purple (`#461D4C`) sparingly for signature moments — not as page chrome.
- Do use Aptos / Plus Jakarta Sans for headings and body; keep Fraunces out of routine section titles.
- Do prefer pill CTAs and 16px card radii with soft 1px borders.
- Do alternate ivory / white / deep-green section planes with large vertical breathing room.
- Do keep the first viewport lean: brand, one headline, one supporting sentence, one CTA group, one dominant image.
- Don't treat `var(--mauve)` as purple — that CSS token is green (`#012d2a`); use `#461D4C` when you mean purple.
- Don't scale purple into a second dominant system (no purple footers, dark sections, or sitewide borders).
- Don't spray gold across backgrounds, borders, and body text — it must remain an accent.
- Don't crowd heroes with stats strips, floating badges, or multi-CTA clusters.
- Don't default to heavy glassmorphism, multi-layer shadows, or decorative card stacks on light pages.
- Don't mix expressive display serifs into standard section headings or use italic for emphasis in titles.
