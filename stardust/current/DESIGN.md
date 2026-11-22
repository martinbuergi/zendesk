<!-- stardust:provenance
  writtenBy: stardust:extract
  writtenAt: 2026-11-20T07:50:00Z
  readArtifacts:
    - stardust/current/_computed-styles.json (census, 100 pages @1440)
    - stardust/current/_brand-extraction.json
    - stardust/current/pages/*.json
  synthesizedInputs: []
  stardustVersion: 0.42.2
  mode: descriptive (current state; replica flow — this is the design to preserve)
-->
---
name: Zendesk (current state)
description: AI-powered customer service platform. The marketing site runs two design generations side by side.
colors:
  ink: "#11110d"
  white: "#ffffff"
  lime: "#d1f470"
  cream: "#f5f5f2"
  forest: "#203524"
  ink-hairline: "#11110d1c"
  legacy-teal: "#17494d"
  legacy-teal-hover: "#06615a"
  legacy-heading: "#03363d"
  legacy-muted: "#68737d"
  legacy-link: "#3d8dae"
typography:
  display:
    fontFamily: "Vanilla Sans, Arial, sans-serif"
    fontSize: "68px"
    fontWeight: 500
    lineHeight: "71.4px"
    letterSpacing: "normal"
  headline:
    fontFamily: "Vanilla Sans, Arial, sans-serif"
    fontSize: "42px"
    fontWeight: 500
    lineHeight: "48.3px"
  title:
    fontFamily: "Vanilla Sans, Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 500
    lineHeight: "32.5px"
  label:
    fontFamily: "Vanilla Sans, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "23.2px"
  eyebrow:
    fontFamily: "Vanilla Sans, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: "18.2px"
    letterSpacing: "0.75px"
  body:
    fontFamily: "Vanilla Sans, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "23.2px"
  body-sm:
    fontFamily: "Vanilla Sans, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "19.6px"
  legacy-display:
    fontFamily: "Sharp Sans, Arial, sans-serif"
    fontSize: "72px"
    fontWeight: 700
    lineHeight: "80px"
  legacy-headline:
    fontFamily: "Sharp Sans, Arial, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: "56px"
  legacy-title:
    fontFamily: "Sharp Sans, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
  legacy-eyebrow:
    fontFamily: "Sharp Sans, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: "22px"
    letterSpacing: "2px"
  legacy-body:
    fontFamily: "Proxima Nova, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
rounded:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "40px"
  round: "50%"
  legacy: "0px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
  2xl: "64px"
  section: "88px"
components:
  button-primary:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-nav:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  chip:
    backgroundColor: "{colors.ink-hairline}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "7px 12px 9px"
  button-legacy-primary:
    backgroundColor: "{colors.legacy-teal}"
    textColor: "{colors.white}"
    rounded: "{rounded.legacy}"
    padding: "8px 24px"
  button-legacy-primary-hover:
    backgroundColor: "{colors.legacy-teal-hover}"
  button-legacy-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.legacy-teal}"
    rounded: "{rounded.legacy}"
    padding: "8px 24px 10px"
---

# Design System: Zendesk (current state)

## Overview

Zendesk's marketing site runs **two design generations side by side**, and a replica must preserve both:

- **Gen A (current)** covers home, /service/, /platform/, /pricing/, /blog/, /company/, /why-zendesk/, /employee-service/, /cxtrends/ and the marketplace. It uses one sans family (Vanilla Sans) set at medium weight (500) for display sizes, warm near-black ink `#11110d` on white and cream `#f5f5f2`, and a single loud accent, lime `#d1f470`, reserved for primary CTAs. Deep forest-green bands (`#203524`, radial gradients toward `#355e34` and lime) close pages. Soft 16px corners appear on buttons and cards.
- **Gen B (legacy)** covers all 59 customer stories, /customer/, /sell/, /sitemap/, /repeatcustomer/, /employee-experience/ and /newsroom/. Headings use bold Sharp Sans in dark teal `#03363d`, body copy uses Proxima Nova in teal `#17494d`, and buttons are square-cornered (0px) teal blocks. A light footer carries the "Enter the fold" newsletter.

The register is brand: heroes, proof (logo rows, stat rows, quotes) and trial CTAs. Source evidence is in `_computed-styles.json#aggregate` and `_brand-extraction.json`.

## Colors

- **Ink `#11110d`**: gen A text and headings, and the dark footer surface (3319 weighted uses; sources /trust-center/, /blog/, /employee-service/).
- **White `#ffffff`**: the dominant page background.
- **Lime `#d1f470`**: primary CTA fill ("Try for free", "Subscribe") on gen A pages. It appears as a background or button fill (225 uses); text on lime is ink.
- **Cream `#f5f5f2`**: gen A section panels, and headings on dark bands.
- **Forest `#203524`**: dark green CTA and feature bands on gen A (home).
- **Ink hairline `#11110d1c` / `#11110d0d`**: borders and tinted chip fills.
- **Legacy teal `#17494d`**: gen B body text, links and buttons (4521 uses). Its hover is `#06615a`.
- **Legacy heading `#03363d`**: gen B heading ink.
- **Legacy muted `#68737d`**: gen B secondary text and the utility nav. **Legacy link `#3d8dae`**: inline links in customer stories.
- Pure black `#000000` appears only in marketplace listings.

## Typography

- **Vanilla Sans** (gen A; weights 400/500/600/700; files in `assets/fonts/VanillaSans-*.woff2`, `font-display: swap`). h1 is 68/71.4 at 500. Section h2 is 42/48.3 at 500. Card titles are 26/32.5 at 500. Labels and h3–h6 are 16/23.2 at 600. The uppercase eyebrow is 14/18.2 at 700 with 0.75px tracking. Body is 16/23.2 at 400; small text is 14/19.6.
- **Sharp Sans** headings (gen B; 600/700): h1 is 72/80, h2 is 48/56, h4 is 24/32. The uppercase eyebrow h2 is 14/22 at 700 with 2px tracking (560 uses, the most frequent gen B heading).
- **Proxima Nova** body (gen B): 16/24 and 14/18 in teal.
- The scale is ad-hoc (68→42→26→16→14; ratios 1.62, 1.62, 1.63, 1.14). It is near-golden at the top and collapses below 16.
- Home has two h1s. A visually-hidden SEO h1 ("AI-powered customer service platform") sits before the visible "Build for better outcomes".

## Layout

- Content width is `--contentWidth: 1150px` (home custom property). Section padding is `88px` vertical and `24px` horizontal; the text and content margin scale is 8/16/24/48/64.
- The 12-column grid is built from Grid/Row/Col styled components on 90 pages.
- The capture viewport was 1440. The cap-probe at 2560 is recorded in DESIGN.json `extensions.breakpoints`: gen A content is capped at 1600px and the shell is fluid; the gen B customer story caps content at 1120px. Two single-module caps are listed for the inconsistency register: the home `#hero` at 1920px and the pricing social-proof block at 1552px.

## Elevation & Depth

- Elevation is mostly flat. Gen B cards use a teal-tinted lift, `rgba(23,73,77,.15) 0 20px 30px` (87 uses). Inputs use an inset 1px `#68737d` ring.
- Gen A uses no drop shadows. Depth comes from color bands: cream panels, forest bands, and the lime/green radial gradients on closing CTA bands.

## Shapes

- Gen A: buttons, chips and cards are 16px; home `--radius` is 20px; media tiles are 40px; avatars and play buttons are 50%. The cross-page count mode is 4px (6647 small chips and inputs).
- Gen B: buttons are 0px (square); cards are 4–8px.

## Components

- **Primary button (A)**: lime fill, ink text, 600 18px, 10×20 padding, 16px radius. On hover the text fades to 70% ink. The nav variant is 16px with 10×16 padding.
- **Secondary or outlined (A)**: an ink 1px outline with the same radius. The "View demo" button sits beside "Try for free".
- **Chip (A)**: 11% ink tint, 600 14px, 16px radius.
- **Legacy primary (B)**: teal fill, white Sharp Sans 600 18px, 8×24 padding, square. Hover is `#06615a`. **Legacy secondary (B)**: teal outline that fills teal on hover.
- **Header A**: mark-over-wordmark logo, mega-menu nav (Platform, Products, Solutions, Resources, Pricing), a utility row (Sign in, Contact us, Language) and a dark announcement bar. **Header B**: teal wordmark with a PrimaryNavbar and SecondaryNavbar.
- **Footer A**: near-black, five link columns and "How can we help? Contact us." **Footer B**: light, with "Champions of customer service", five columns and the "Enter the fold" newsletter (`owner.email`).
- Recurring modules include the logo row, stat row, pull quote, card grid, FAQ accordion, video link and customer-story stat block. See DESIGN.json `extensions.modules[]`.

## Do's and Don'ts

- Do keep each page on the generation it ships with today. Gen B pages keep square teal buttons and Sharp Sans.
- Do keep lime for primary CTAs only. Never set body text in lime.
- Do keep medium (500) weight for gen A display type, not bold.
- Don't merge the two footers or headers in a replica. Any unification is an inconsistency-register decision, not a silent change.
- Don't tint pure white backgrounds. The cream surface is a separate token.
