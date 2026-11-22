# Dynamics parity check — https://main--3055ed88--aemcoder.aem.live — 2026-11-21T17:45:43.143Z

Replayed 54 checks over 28 features · pass 54 · fail 0. Flows, not presence.

| feature | class | status | check | result | detail | third-party requests |
|---|---|---|---|---|---|---|
| header mega menus: Platform, Products, Solutions, Resources (+ aria-haspopup triggers) | M | done | dom-count | PASS | 38 × .header .za-menu > .za-mega[role=menu] a (min 38) |  |
| header mega menus: Platform, Products, Solutions, Resources (+ aria-haspopup triggers) | M | done | dom-count | PASS | 38 × .header .za-menu > .za-mega[role=menu] a (min 38) |  |
| header mega menus: Platform, Products, Solutions, Resources (+ aria-haspopup triggers) | M | done | dom-count | PASS | 38 × .header .za-menu > .za-mega[role=menu] a (min 38) |  |
| header mega menus: Platform, Products, Solutions, Resources (+ aria-haspopup triggers) | M | done | dom-count | PASS | 38 × .header .za-menu > .za-mega[role=menu] a (min 38) |  |
| header drawer: Toggle Mobile Menu (< 970px) | M | done | dom-count | PASS | 7 × #za-drawer .za-drawer-row (min 7) |  |
| header drawer: Toggle Mobile Menu (< 970px) | M | done | dom-count | PASS | 55 × #za-drawer .za-drawer-sub a (min 55) |  |
| header drawer: Toggle Mobile Menu (< 970px) | M | done | dom-count | PASS | 1 × .header .zb-mobnav-toggle (min 1) |  |
| locale variants + header Language switcher | I18N | interim | dom-count | PASS | 36 × .header .za-lang a[href^="https://www.zendesk."] (min 36) |  |
| locale variants + header Language switcher | I18N | interim | dom-count | PASS | 36 × .header .za-lang a[href^="https://www.zendesk."] (min 36) |  |
| sign-in / free-trial account links | X | interim | dom-count | PASS | 2 × header a[href="https://www.zendesk.com/login/"] (min 1) |  |
| sign-in / free-trial account links | X | interim | dom-count | PASS | 1 × header a[href="https://www.zendesk.com/register/"] (min 1) |  |
| sign-in / free-trial account links | X | interim | dom-count | PASS | 1 × header a[href="https://www.zendesk.com/login/"] (min 1) |  |
| home testimonial carousel (slick-track 9 cards) | L | done | dom-count | PASS | 9 × .hp-quotes .hp-quote (min 9) |  |
| home testimonial carousel (slick-track 9 cards) | L | done | dom-count | PASS | 4 × .sv-stories .sv-quotes-slide (min 4) |  |
| home resource rail (slick-track 4 cards) | L | done | dom-count | PASS | 4 × .hp-res .hp-rcard (min 4) |  |
| /service resource carousel (slick-track 6 cards) | L | done | dom-count | PASS | 6 × .sv-carousel .sv-res-card (min 6) |  |
| /service resource carousel (slick-track 6 cards) | L | done | dom-count | PASS | 22 × .co-carousel .co-card (min 22) |  |
| /blog category / link lists (ul 6 + ul 10) | L | done | dom-count | PASS | 16 × .bl-guides a (min 16) |  |
| /blog featured slider (regular slider 6) | L | done | dom-count | PASS | 6 × .bl-hero .bl-slide (min 6) |  |
| /blog topic tiles / grouped card rails | L | done | dom-count | PASS | 28 × .bl-group .bl-card (min 28) |  |
| /pricing FAQ accordion (12) | L | done | dom-count | PASS | 12 × .pr-faq .pr-faq-item (min 12) |  |
| dated / index candidate listings (home rail, /blog latest, /marketplace rows, /trust-center cards) | L | interim | dom-count | PASS | 3 × .hp-pillars .hp-pillar (min 3) |  |
| dated / index candidate listings (home rail, /blog latest, /marketplace rows, /trust-center cards) | L | interim | dom-count | PASS | 8 × .bl-latest .bl-card (min 8) |  |
| dated / index candidate listings (home rail, /blog latest, /marketplace rows, /trust-center cards) | L | interim | dom-count | PASS | 30 × .bl-group .bl-tile (min 30) |  |
| dated / index candidate listings (home rail, /blog latest, /marketplace rows, /trust-center cards) | L | interim | dom-count | PASS | 9 × .co-accordion.lead .za-col (min 9) |  |
| video: hosted player (Wistia popover) | V | done | video-plays | PASS | iframe/video: true · no <video> · playback requests 41 (ok) | fast.wistia.net:200×14 browser.sentry-cdn.com:200×1 fast.wistia.com:200×1 embed-cloudfront.wistia.com:200×23 pipedream.wistia.com:200×2 distillery.wistia.com:204×1 |
| video: hosted player (Wistia popover) | V | done | video-plays | PASS | iframe/video: true · no <video> · playback requests 42 (ok) | fast.wistia.net:200×14 browser.sentry-cdn.com:200×1 fast.wistia.com:200×1 embed-cloudfront.wistia.com:200×23 pipedream.wistia.com:200×2 distillery.wistia.com:204×2 |
| Storylane interactive demos (/service inline demo, /demo hub) | V | done | video-plays | PASS | iframe/video: true · no <video> · playback requests 57 (ok) | app.storylane.io:200×1 assets.storylane.io:200×33 fonts.googleapis.com:200×1 app-pages.storylane.io:200×14 fonts.gstatic.com:200×1 api.storylane.io:204×4 app-content.storylane.io:200×5 |
| Storylane interactive demos (/service inline demo, /demo hub) | V | done | video-plays | PASS | iframe/video: true · no <video> · playback requests 56 (ok) | zendesk.storylane.io:200×2 fonts.googleapis.com:200×2 assets.storylane.io:200×52 www.googletagmanager.com:200×1 api.storylane.io:204×2 cdn.cookielaw.org:200×1 |
| Reprise interactive demos (/employee-experience) | T | done | video-plays | PASS | iframe/video: true · no <video> · playback requests 4 (ok) | app.getreprise.com:200×2 static.reprise.com:200×2 fonts.googleapis.com:200×2 fonts.gstatic.com:200×1 |
| Next.js client framework / __NEXT_DATA__ payload → settled DOM | CR | done | no-page-errors | PASS | none on 9 page(s) |  |
| marketplace app search box (JS-submitted) | S | interim | dom-count | PASS | 1 × .bl-hero form[action="https://www.zendesk.com/marketplace/apps/"][method=get] input[name=query] (min 1) |  |
| marketplace app icon hosts (*.apps.zdusercontent.com, du3qakkv2rjkz.cloudfront.net) | T | done | dom-count | PASS | 29 × .bl-group .bl-tile-media img (min 29) |  |
| marketplace app icon hosts (*.apps.zdusercontent.com, du3qakkv2rjkz.cloudfront.net) | T | done | martech | PASS | no tag host requested (12 gated · 0 cross-site host(s) blocked) |  |
| marketplace app icon hosts (*.apps.zdusercontent.com, du3qakkv2rjkz.cloudfront.net) | T | done | martech | PASS | no tag host requested (12 gated · 0 cross-site host(s) blocked) |  |
| tag manager, analytics, ad / retargeting pixels and unknown third-party tag hosts (contract off) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (48 gated · 0 cross-site host(s) blocked) |  |
| tag manager, analytics, ad / retargeting pixels and unknown third-party tag hosts (contract off) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (48 gated · 0 cross-site host(s) blocked) |  |
| tag manager, analytics, ad / retargeting pixels and unknown third-party tag hosts (contract off) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (48 gated · 0 cross-site host(s) blocked) |  |
| tag manager, analytics, ad / retargeting pixels and unknown third-party tag hosts (contract off) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (48 gated · 0 cross-site host(s) blocked) |  |
| tag manager, analytics, ad / retargeting pixels and unknown third-party tag hosts (contract off) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (48 gated · 0 cross-site host(s) blocked) |  |
| tag manager, analytics, ad / retargeting pixels and unknown third-party tag hosts (contract off) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (48 gated · 0 cross-site host(s) blocked) |  |
| tag manager, analytics, ad / retargeting pixels and unknown third-party tag hosts (contract off) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (48 gated · 0 cross-site host(s) blocked) |  |
| tag manager, analytics, ad / retargeting pixels and unknown third-party tag hosts (contract off) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (48 gated · 0 cross-site host(s) blocked) |  |
| tag manager, analytics, ad / retargeting pixels and unknown third-party tag hosts (contract off) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (48 gated · 0 cross-site host(s) blocked) |  |
| tag manager, analytics, ad / retargeting pixels and unknown third-party tag hosts (contract off) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (48 gated · 0 cross-site host(s) blocked) |  |
| consent: OneTrust CMP (+ its runtime-injected iframe) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (2 gated · 0 cross-site host(s) blocked) |  |
| consent: OneTrust CMP (+ its runtime-injected iframe) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (2 gated · 0 cross-site host(s) blocked) |  |
| consent: OneTrust CMP (+ its runtime-injected iframe) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (2 gated · 0 cross-site host(s) blocked) |  |
| Zendesk messaging widget (static.zdassets.com, web-assets.zendesk.com) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (2 gated · 0 cross-site host(s) blocked) |  |
| Zendesk messaging widget (static.zdassets.com, web-assets.zendesk.com) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (2 gated · 0 cross-site host(s) blocked) |  |
| Zendesk messaging widget (static.zdassets.com, web-assets.zendesk.com) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (2 gated · 0 cross-site host(s) blocked) |  |
| RUM / error monitoring (Sentry) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (2 gated · 0 cross-site host(s) blocked) |  |
| RUM / error monitoring (Sentry) | T | scaffolded-awaiting-owner | martech | PASS | no tag host requested (2 gated · 0 cross-site host(s) blocked) |  |
| martech: consent + tag routing | T | scaffolded-off | martech | PASS | no tag host requested (2 gated · 0 cross-site host(s) blocked) |  |

## Features without checks

- lead forms: /contact 15- and 5-field, demo-request 8-field (/service, /pricing modal) (F) — interim · owner: D2 lead-form backend (Marketo / Zendesk lead API) — interim: UI + client validation, valid submit shows "no backend connected", nothing is sent. form-flow cannot pass until an endpoint exists (it requires the filled submit to POST), so no replay check.
- trial email teasers (home hero, /service hero, 1-field forms) (F) — interim · owner: D2 trial-signup hand-off — interim: submit hands off to https://www.zendesk.com/register/, nothing captured on the new host. Hand-off is a GET navigation, which form-flow does not count, so no replay check.
- newsletter sign-ups: gen-B footer (article pages) and /blog subscribe (F) — interim · owner: D2 newsletter backend — deferred. Footer is frozen foundation (open request in rollout/foundation-requests.md: #zb-newsletter-email has no required, empty submit passes silently).
- first-party data file GET /app/geo.json (D) — interim · owner: D6 geo endpoint — interim: default region (US/USD) as authored; owner provides a geo source on the new host (CDN geo header or same-origin route).
- Storylane hub on /demo fires its own GTM-Z4DV inside the iframe (T) — interim · owner: D1 — the zendesk.storylane.io hub workspace injects GTM-Z4DV + OneTrust itself, independent of the site contract; owner decides whether the hub keeps its tags on the new host (configured in Storylane, not in this repo). · environment limit: a martech gate check aborts the cross-site iframe before it loads, so it would pass vacuously; recorded here instead of as a check.
