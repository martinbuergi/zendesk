<!-- stardust provenance: skill=stardust:dynamics · phase=plan draft · 2026-11-20T08:10:46.878Z · input stardust/current/_dynamics.json (7 pages, 83 findings) -->
# Dynamic features — draft inventory (curate into `stardust/dynamic-features.md`)

One row per detected finding. Merge duplicates, drop noise, keep every axis honest. Columns: disposition = what we do · target = the delivery form (widget where no authored rows remain) · reproducibility = what it needs · status = where it stands (reference/triage.md).

| # | id | class | feature | pages | disposition | target | reproducibility | status | pattern | decision needed | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | a-unknown-third-party-host-alb-reddit-com | A | unknown third-party host alb.reddit.com | 7/7 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 2 | a-cms-app-settings-object-datalayer | A | CMS / app settings object dataLayer | 7/7 | static-snapshot | content | self | pending | read-settings | — (keys name endpoints, ids, vendors) |  |
| 3 | a-cms-app-settings-object-next-data | A | CMS / app settings object __NEXT_DATA__ | 7/7 | static-snapshot | content | self | pending | read-settings | — (keys name endpoints, ids, vendors) |  |
| 4 | a-unknown-third-party-host-www-google-com | A | unknown third-party host www.google.com | 6/7 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 5 | a-unknown-third-party-host-cdn-segment-com | A | unknown third-party host cdn.segment.com | 6/7 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 6 | a-unknown-third-party-host-px-ads-linkedin-com | A | unknown third-party host px.ads.linkedin.com | 6/7 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 7 | a-unknown-third-party-host-c-6sc-co | A | unknown third-party host c.6sc.co | 6/7 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 8 | a-unknown-third-party-host-ipv6-6sc-co | A | unknown third-party host ipv6.6sc.co | 6/7 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 9 | a-unknown-third-party-host-api-vector-co | A | unknown third-party host api.vector.co | 6/7 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 10 | a-unknown-third-party-host-app-clearbit-com | A | unknown third-party host app.clearbit.com | 6/7 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 11 | a-unknown-third-party-host-api-segment-io | A | unknown third-party host api.segment.io | 6/7 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 12 | cr-client-framework-next | CR | client framework next | 7/7 | static-snapshot | content | self | pending | settled-dom-snapshot | inspect the consumer |  |
| 13 | d-first-party-data-file-get-app-geo-json | D | first-party data file GET /app/geo.json | 7/7 (reach 94/100) | data-fed | content | self | pending | sheet-sync | none (sync from the source origin) |  |
| 14 | f-form-formpreset-764966109-no-action-js-wired-8-fields | F | form "formpreset-764966109" → no action (JS-wired) (8 fields) | 2/7 | rebuild-native | block | needs-backend | pending | forms | production endpoint; interim capture ships now |  |
| 15 | f-form-sc-d0574c0f-2-no-action-js-wired-1-fields | F | form "sc-d0574c0f-2" → no action (JS-wired) (1 fields) | 2/7 | rebuild-native | block | needs-backend | pending | forms | production endpoint; interim capture ships now |  |
| 16 | f-form-hero-trial-teaser-no-action-js-wired-1-fields | F | form "hero-trial-teaser" → no action (JS-wired) (1 fields) | 1/7 | rebuild-native | block | needs-backend | pending | forms | production endpoint; interim capture ships now |  |
| 17 | f-form-formpreset-1057092251-no-action-js-wired-1-fields | F | form "formpreset-1057092251" → no action (JS-wired) (1 fields) | 1/7 | rebuild-native | block | needs-backend | pending | forms | production endpoint; interim capture ships now |  |
| 18 | f-form-contact-us-form-no-action-js-wired-15-fields | F | form "contact-us-form" → no action (JS-wired) (15 fields) | 1/7 | rebuild-native | block | needs-backend | pending | forms | production endpoint; interim capture ships now |  |
| 19 | f-form-contact-us-form-no-action-js-wired-5-fields | F | form "contact-us-form" → no action (JS-wired) (5 fields) | 1/7 | rebuild-native | block | needs-backend | pending | forms | production endpoint; interim capture ships now |  |
| 20 | i18n-locale-variants-en-au-pt-de-en-dk-es-es-fr-en-gb-zh-hk- | I18N | locale variants en-AU,pt,de,en-DK,es-ES,fr,en-GB,zh-HK,it,en-IN,ja,ko,es,nl,en-SE,en-SG,zh,en,en-TH,x-default | 4/7 | rebuild-native | runtime | needs-business-decision | pending | locale-tree | scope of the locale trees |  |
| 21 | i18n-locale-variants-en-dk-en-gb-en-in-en-se-en-au-en-sg-es- | I18N | locale variants en-DK,en-GB,en-IN,en-SE,en-AU,en-SG,es-ES,es,pt,fr,de,it,nl,ja,ko,zh,zh-HK,en,en-TH,x-default | 2/7 | rebuild-native | runtime | needs-business-decision | pending | locale-tree | scope of the locale trees |  |
| 22 | i18n-locale-variants-en-en-au-en-br-en-de-en-dk-en-es-en-fr- | I18N | locale variants en,en-AU,en-BR,en-DE,en-DK,en-ES,en-FR,en-GB,en-HK,en-IN,en-IT,en-JP,en-KR,en-MX,en-NL,en-SE,en-SG,en-TW,en-TH,x-default | 1/7 | rebuild-native | runtime | needs-business-decision | pending | locale-tree | scope of the locale trees |  |
| 23 | l-listing-candidate-slick-track-9-cards | L | listing candidate slick-track (9 cards) | 2/7 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 24 | l-listing-candidate-sc-e040b71c-5-cfgwcs-3-cards | L | listing candidate sc-e040b71c-5 cFgWCS (3 cards) | 1/7 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 25 | l-listing-candidate-slick-track-4-cards | L | listing candidate slick-track (4 cards) | 1/7 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 26 | l-listing-candidate-slick-track-6-cards | L | listing candidate slick-track (6 cards) | 1/7 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 27 | l-listing-candidate-sc-f9eaaf5f-0-sc-82ac2201-0-11-cards | L | listing candidate sc-f9eaaf5f-0 sc-82ac2201-0 (11 cards) | 1/7 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 28 | l-listing-candidate-ul-6-cards | L | listing candidate ul (6 cards) | 1/7 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 29 | l-listing-candidate-ul-10-cards | L | listing candidate ul (10 cards) | 1/7 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 30 | l-listing-candidate-regular-slider-6-cards | L | listing candidate regular slider (6 cards) | 1/7 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 31 | l-listing-candidate-sc-5ae68053-6-hszant-6-cards | L | listing candidate sc-5ae68053-6 hsZAnt (6 cards) | 1/7 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 32 | l-listing-candidate-styledaccordion-sc-niv9ic-0-dgzvap-12-ca | L | listing candidate StyledAccordion-sc-niv9ic-0 dgZvap (12 cards) | 1/7 | index-backed | block | needs-business-decision | pending | listing-index-backed | index-driven or editorially curated? |  |
| 33 | m-modal-trigger-aria-haspopup-chrome-only-button-content | M | modal trigger aria-haspopup (chrome only) → button:content | 7/7 (reach 100/100) | rebuild-native | runtime | self | pending | chrome-interaction | none (the header contract is the spec) |  |
| 34 | t-chat-live-chat-widget-first-party-subdomain-needs-a-cname- | T | chat: live chat widget (first-party subdomain — needs a CNAME on the new host) | 7/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 35 | t-tag-manager-google-tag-manager | T | tag manager: Google Tag Manager | 7/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 36 | t-rum-error-monitoring | T | RUM: error monitoring | 7/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 37 | t-unknown-third-party-host-www-zndsk-com | T | unknown third-party host www.zndsk.com | 7/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 38 | t-consent-onetrust | T | consent: OneTrust | 7/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | CMP domain script reuse on the new host |  |
| 39 | t-unknown-third-party-host-www-redditstatic-com | T | unknown third-party host www.redditstatic.com | 7/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 40 | t-marketing-ad-retargeting-pixel | T | marketing: ad / retargeting pixel | 7/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 41 | t-unknown-third-party-host-d1eipm3vz40hy0-cloudfront-net | T | unknown third-party host d1eipm3vz40hy0.cloudfront.net | 7/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 42 | t-analytics-google-analytics-ads | T | analytics: Google Analytics / Ads | 7/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 43 | t-chat-live-chat-widget | T | chat: live chat widget | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 44 | t-unknown-third-party-host-j-6sc-co | T | unknown third-party host j.6sc.co | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 45 | t-unknown-third-party-host-adservice-google-com | T | unknown third-party host adservice.google.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 46 | t-unknown-third-party-host-tag-clearbitscripts-com | T | unknown third-party host tag.clearbitscripts.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 47 | t-unknown-third-party-host-s-dpmsrv-com | T | unknown third-party host s.dpmsrv.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 48 | t-marketing-marketo-munchkin | T | marketing: Marketo Munchkin | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 49 | t-unknown-third-party-host-cdn-cr-relay-com | T | unknown third-party host cdn.cr-relay.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 50 | t-unknown-third-party-host-s-static-innovid-com | T | unknown third-party host s-static.innovid.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 51 | t-unknown-third-party-host-b-6sc-co | T | unknown third-party host b.6sc.co | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 52 | t-unknown-third-party-host-d2v83son8kay5v-cloudfront-net | T | unknown third-party host d2v83son8kay5v.cloudfront.net | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 53 | t-unknown-third-party-host-cdn-vector-co | T | unknown third-party host cdn.vector.co | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 54 | t-unknown-third-party-host-rtr-innovid-com | T | unknown third-party host rtr.innovid.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 55 | t-unknown-third-party-host-api-cr-relay-com | T | unknown third-party host api.cr-relay.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 56 | t-unknown-third-party-host-x-clearbitjs-com | T | unknown third-party host x.clearbitjs.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 57 | t-unknown-third-party-host-www-linkedin-com | T | unknown third-party host www.linkedin.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 58 | t-unknown-third-party-host-a-dpmsrv-com | T | unknown third-party host a.dpmsrv.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 59 | t-unknown-third-party-host-collector-43043-us-tvsquared-com | T | unknown third-party host collector-43043.us.tvsquared.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 60 | t-unknown-third-party-host-a-usbrowserspeed-com | T | unknown third-party host a.usbrowserspeed.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 61 | t-unknown-third-party-host-px4-ads-linkedin-com | T | unknown third-party host px4.ads.linkedin.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 62 | t-unknown-third-party-host-www-facebook-com | T | unknown third-party host www.facebook.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 63 | t-unknown-third-party-host-pixel-mathtag-com | T | unknown third-party host pixel.mathtag.com | 6/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 64 | t-unknown-third-party-host-dsum-sec-casalemedia-com | T | unknown third-party host dsum-sec.casalemedia.com | 5/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 65 | t-unknown-third-party-host-x-bidswitch-net | T | unknown third-party host x.bidswitch.net | 5/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 66 | t-unknown-third-party-host-simage2-pubmatic-com | T | unknown third-party host simage2.pubmatic.com | 4/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 67 | t-unknown-third-party-host-browser-sentry-cdn-com | T | unknown third-party host browser.sentry-cdn.com | 2/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 68 | t-unknown-third-party-host-js-storylane-io | T | unknown third-party host js.storylane.io | 1/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 69 | t-unknown-third-party-host-app-storylane-io | T | unknown third-party host app.storylane.io | 1/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 70 | t-unknown-third-party-host-assets-storylane-io | T | unknown third-party host assets.storylane.io | 1/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 71 | t-unknown-third-party-host-app-pages-storylane-io | T | unknown third-party host app-pages.storylane.io | 1/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 72 | t-unknown-third-party-host-api-storylane-io | T | unknown third-party host api.storylane.io | 1/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 73 | t-unknown-third-party-host-app-content-storylane-io | T | unknown third-party host app-content.storylane.io | 1/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 74 | t-unknown-third-party-host-analytics-newscred-com | T | unknown third-party host analytics.newscred.com | 1/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 75 | t-unknown-third-party-host-s3-amazonaws-com | T | unknown third-party host s3.amazonaws.com | 1/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 76 | t-unknown-third-party-host-sync-connectad-io | T | unknown third-party host sync.connectad.io | 1/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 77 | t-unknown-third-party-host-onetag-sys-com | T | unknown third-party host onetag-sys.com | 1/7 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 78 | v-iframe-without-src-runtime-injected-embed | V | iframe without src (runtime-injected embed) | 7/7 | embed-passthrough | embed | needs-human-capture | pending | embed-passthrough | resolve the runtime src from a rendered capture |  |
| 79 | v-video-hosted-player | V | video: hosted player | 2/7 | embed-passthrough | content | self | pending | media-as-url | none (player ids are public) |  |
| 80 | x-sign-in-account-links | X | sign-in / account links | 7/7 | decided-out | — | needs-backend | pending | decided-out | auth / commerce on the new host? |  |
| 81 | chrome-drawer | M | header drawer: Toggle Mobile Menu (chrome only) | 1/1 | rebuild-native | runtime | self | pending | chrome-interaction | none (the header contract is the spec) |  |
| 82 | chrome-locale | I18N | header locale: Language (chrome only) | 1/1 | rebuild-native | runtime | needs-business-decision | pending | locale-tree | which locales the switcher lists |  |
| 83 | chrome-menu | M | header menu: Platform, Products, Solutions, Resources (chrome only) | 1/1 | rebuild-native | runtime | self | pending | chrome-interaction | none (the header contract is the spec) |  |

## Triage

- **Ships autonomously (reproducibility `self`):** 8 row(s) — read-settings, settled-dom-snapshot, sheet-sync, chrome-interaction, media-as-url.
- **One owner decision batch:** 74 row(s) — inspect the XHR, add a vendor row · production endpoint; interim capture ships now · scope of the locale trees · index-driven or editorially curated? · which tags run on the new host; property ids · CMP domain script reuse on the new host.
- **Already delivered by the capture pipeline:** 0 row(s) — no work.
- **Host-bound on the target:** 0 of 0 probed API paths — the off-origin data work.
- **Martech:** OneTrust · 0/1 route(s) enabled by the owner — `stardust/martech-handoff.md`.

## Phases

- **tags** — 44
- **detect** — 11
- **listings** — 10
- **forms** — 6
- **interactive** — 4
- **locale wave** — 3
- **capture** — 1
- **data** — 1
- **embeds** — 1
- **media** — 1
- **register** — 1
