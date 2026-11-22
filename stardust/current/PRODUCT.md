<!-- stardust:provenance
  writtenBy: stardust:extract
  writtenAt: 2026-11-20T07:26:30Z
  readArtifacts:
    - stardust/current/pages/*.json (100 live Playwright captures)
    - stardust/current/_brand-extraction.json
    - stardust/current/_crawl-log.json
  synthesizedInputs: []
  stardustVersion: 0.42.2
  mode: descriptive (current state of https://www.zendesk.com/, replica flow)
-->
# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

_provenance: inferred — basis: hero copy, nav labels and CTA vocabulary across the 100 captured pages._

- **Customer-service and CX leaders** evaluating an AI-first service platform (home, /service/, /platform/, /pricing/, /why-zendesk/).
- **Employee-service / IT / HR leaders** (/employee-service/, /employee-experience/).
- **Sales leaders** for the CRM line (/sell/).
- **Existing admins and agents** looking for sign-in, help center, marketplace apps and partners (/login/, /marketplace/*).
- **Prospects at the bottom of the funnel**: free-trial, demo and contact-sales forms (/register/, /free-trial/, /demo/, /contact/, /instapage-form-*).

## Product Purpose

Zendesk sells an AI-powered customer (and employee) service platform: "AI-powered customer service platform" / "Build for better outcomes" (home h1s). The marketing site's job is to convert visitors into free trials ("14-day free trial. No credit card required."), demos and sales contacts, and to prove outcomes through 59 customer stories under /customer/.

## Positioning

Observed claims: "Zendesk Outcome AI™ Platform", "Zendesk Resolution Platform", "Trusted by 32,000+ customers", "Move beyond deflection with AI agents that resolve issues end-to-end", and Gartner Magic Quadrant Leader badges. The site positions on resolution outcomes rather than ticket deflection.

## Capabilities and Constraints

- The site runs on a React / styled-components front end with AEM-sourced components (`data-aem-id="aem.components.*"`). 98 of 100 pages are hydrated client-side (`_crawl-log.json#dynamicSurface`).
- There are **two concurrent chrome generations**. Header and footer A (current design: lime CTA, near-black footer) appear on about 30 pages. Header and footer B (legacy: dark-teal wordmark, light footer with an "Enter the fold" newsletter) appear on all 59 customer stories, /customer/, /sell/, /sitemap/, /repeatcustomer/, /employee-experience/ and /newsroom/.
- Forms are a core function: trial and register (18 fields), demo (17), contact, the newsletter (`owner.email` on 75 pages), and the webinar and content forms. 8 headless `instapage-form-*` fragments exist for embedding.
- The marketplace (/marketplace/apps|partners|themes/) has filter comboboxes and star ratings, which makes it a dynamic listing surface.
- Some pages are not normal marketing pages. /blog-ads-api-output/ serves raw JSON. /intro-tour/ is a Reprise embed that currently shows "Published Demos are Deactivated". /help-center-closed/ is a designed dead-end page.

## Brand Commitments

- Register: **brand**. The site reads as marketing and landing: there are heroes, logo walls, stat rows and trial CTAs above the fold, and no authentication is needed.
- Name and wordmark: "zendesk". The current design stacks the Zendesk mark over the wordmark; the legacy chrome shows the wordmark only.
- Voice: confident, outcome-led, short declaratives ("Build for better outcomes", "Sell smarter, not harder", "Launch your first AI agent today"). Customer-story headlines follow the form "<Customer> <verb>s … with Zendesk".
- Observed personality: professional-warm. The current design pairs deep forest green with a lime/chartreuse accent; the legacy design pairs dark teal with cream.
- Observed anti-references (inferred): stock "enterprise blue" SaaS palettes and dense jargon. The copy is plain-spoken.

## Evidence on Hand

- `stardust/current/pages/<slug>.json` + `.html`: 100 live captures (settled rendered DOM) with typed `slots`.
- `stardust/current/assets/screenshots/<slug>.png` (+ `-thumb*.png`): full-page captures.
- `stardust/current/assets/favicon.ico`.
- `stardust/current/_computed-styles.json`: computed-style census at 1440.
- `stardust/current/_brand-extraction.json`, `DESIGN.md`, `DESIGN.json`, `brand-review.html`.
- `stardust/chrome/header-contract*.json`: recorded header behaviour.
- Customer proof: 59 customer stories with stat blocks, pull quotes and video links. Logo walls (`LogotypeRow`) appear on 68 pages.
- Absent: no locale variants were captured. hreflang alternates such as zendesk.co.uk and zendesk.de exist, but they are out of scope and must not be fabricated.

## Product Principles

_provenance: inferred — basis: recurring structure and copy across captured pages._

1. Outcomes over features: every program page leads with a result claim, then proof (stats, logos, quotes).
2. Trial first: "Try for free" and "View demo" sit in the header and close every page in a CTA band.
3. Proof by customer: customer stories form the largest content family (59 of 100 pages).
4. One platform, many audiences: customer service, employee service, sales and contact center share one design system.

## Accessibility & Inclusion

Observed: the site links an "Accessibility Plan" in the footer on 81 pages. A consent strip ("This website uses cookies…") overlays the bottom of the first viewport on most captures. No product-specific standard was established beyond this.
