
## replica · extract — 2026-11-20

- `extract --prep --dynamics --pages <100 planned URLs>`: 100/100 captured live (Provenance: 100/100 live; Wait summary: 100 resolved at medium (avg 2.5s), 0 fallback). No bot walls.
- Types: article 59 (/customer/canva/), form 13 (/contact/), program 11 (/service/), listing 8 (/blog/), static 4 (/company/), unique 4 (/pricing/), landing 1 (/).
- 19 module candidates. captureGaps: none (no locale root captured).
- Two design generations coexist (A: Vanilla Sans/lime; B legacy: Sharp Sans + Proxima Nova/teal, 65 pages incl. all customer stories) — both replicated as-is.
- Open: mobile header contract partial; /contact/ form not in DOM capture; OneTrust strip visible on screenshots.

## dynamics · detect/classify/triage — 2026-11-20

- detect: dynamics-detect on home + 6 archetypes (unique = /pricing/), reach 100/100 from stardust/current → 80 findings (`stardust/current/_dynamics.json`). 0 search forms site-wide (no probe term). No blank client-rendered capture.
- classify: dynamics-plan `--martech --chrome` → 83 rows (T47 L10 V8 F6 I18N4 M3 A2 CR1 D1 X1); unknown hosts mapped to vendors where obvious, the rest kept as "inspect".
- triage: curated `stardust/dynamic-features.md` + `-plan.md`; every row has a disposition, none decided-out; decisions D1–D8 recorded as hands-off assumptions with interim tiers. Forms are lead/trial forms, not regulated-pii.
- martech: spec-martech (server HTML) found GTM-Z4DV only; OneTrust injected by GTM (domain script c84f307d-… read from the rendered script list); Adobe Web SDK self-hosted. Contract + handoff written, all parts disabled; martech-scaffold wrote scripts/martech.js (0 parts enabled).
- blocked: direct curl of /scripts/adobe-websdk.js → Cloudflare 403 twice; logged `detect blocked`, no further source fetches.

## replica · preserve-direction — 2026-11-20

- Promoted current/PRODUCT.md, DESIGN.md, DESIGN.json verbatim to the root; stardust/direction.md written (sequential phases, home first; roster = 100-page site plan; gate widths 1440,360; no target breakpoints).
- Inconsistency register: R-01 (proprietary faces, deferred, no design change) — pure replica.
- Dynamics: 83 rows, all dispositioned; decisions D1–D8 ship interim tiers (dynamic-features.md). Martech: GTM + OneTrust + Adobe Web SDK etc. carried over, every contract part disabled; scripts/martech.js scaffolded.
- The `dynamics detect blocked` line (08:10Z) was a Cloudflare 403 on a non-browser curl of /scripts/adobe-websdk.js only. Re-checked with the installed Playwright Chromium: / and /customer/canva/ answer 200 with real titles — pages are not bot-walled; cleared, run continues. Asset fetches from the source go through the browser, never curl.

## replica · recreate — article archetype (customer-canva) — 2026-11-20

- Gen-B canon (canon-b.css: tokens, legacy header/footer, story modules) + customer-canva.css. Gate PASS: 1440 pixel 0.03 % Δh 0, content-diff 0/0, clipped 0, cap-probe PASS, chrome crops 100 %; 360 pixel 0.07 % Δh 0, 0/0 (54 advisory: desktop nav hidden by CSS vs absent on live).
- Motion: sticky header, hover colour transitions, mobile menu implemented; dead hovers not implemented. Residuals: video popover wiring at delivery, newsletter interim tier.

## replica · recreate — session handover — 2026-11-20

- Done: article archetype (customer-canva) gated and approved. In progress: landing archetype (index) — canon-a.css, canon-a.js, index.css, index-proposed.html authored; source-spec compare not yet at exit 0 (last: 6 sections with height delta); no counted gate round yet. Remaining: /service/, /blog/, /contact/, /company/, /pricing/.
- Shared brief for archetype subagents: stardust/.work/recreate-brief.md. Prototype server must be restarted on :8791 from stardust/prototypes (PID file stardust/.work/proto-server.pid).

## replica · recreate — landing archetype (index) — 2026-11-20

- Gen-A canon (canon-a.css/js: tokens, header, footer, sticky header) + index.css/index.js. 360 PASS: pixel 0.33 % Δh 0, 0/0, clipped 0. 1440: pixel 0.49 % Δh 0, clipped 0, cap-probe PASS; one content red — the live hero email placeholder varies between loads — accepted as a residual at the round cap (hands-off).
- Residuals: hero animation frame + chat launcher (3.9 % band), OneTrust-rewritten footer link, lazy accordion images, trial form interim tier. Not implemented: scroll glow on learning-loop blocks, odometer roll-in. Gate note: live has no header landmark — chrome checks need an explicit --region.

## replica · recreate — program archetype (service) — 2026-11-20

- Gen A (imports canon-a). Counted rounds 3/3 per width: pixel 0.23 % / 0.17 %, Δh 0, main 0/0, clipped 0, 21 units 0 off, cap-probe PASS; reds were the shared footer, fixed in canon-a after the cap → uncounted re-check: compare 0, chrome parity clean, pixel 0.36 % / 0.16 %. Accept-residual, hands-off.
- Accepted findings in replica/accepted.json (carousel loop clones; hidden mobile logo tabs). Open: live tab labels "undefined testimonial" were renamed in the prototype — restore verbatim at delivery. Forms layout-only (interim), Wistia popover wiring at delivery.

## replica · recreate — form archetype (contact) — 2026-11-20

- Gen A with a reduced header and a small legal footer (page-owned in contact.css; canon requests #4–#6). PASS: 1440 pixel 0.06 % Δh 0, 0/0, clipped 0, 28 office cells 0 off, cap-probe PASS (2 rounds); 360 pixel 0.13 % Δh 0, 0/0 (1 round). Header region selector differs per page (no promo strip on /contact/).
- Form UI rebuilt with observed validation states; no backend (interim tier). Motion: validate dim, help-centre link hover, sticky header.

## replica · recreate — listing archetype (blog) — 2026-11-20

- Gen A + sticky blog sub-nav. 1440 PASS: pixel 0.40 % Δh −3, 0/0, clipped 0, cap-probe PASS, chrome parity 75/75. 360: 3 rounds, accept-residual — 11 clip findings on card text clamped at 4 lines as on live; final state 0.28 % Δh 0.
- Content-diff scoped to the five page sections (live <main> wraps the chrome). Canon requests #7–#12 open (icon span, sticky-only .is-stuck, mobile View demo 16px, mobile menu panel, locale links follow path, footer ±1px) — resolve in the foundation at delivery.

## replica · recreate — static archetype (company) — 2026-11-20

- Gen A, full header without promo strip. PASS in 2 rounds per width: 1440 pixel 0.04 % Δh 0, 0/0, clipped 0, cap-probe PASS; 360 pixel 0.12 % Δh 0, 0/0; chrome crops 100 %. OneTrust cookie-link rename logged as permanent residual in accepted.json.
- Motion: location carousel (276 px / 500 ms), card and button hovers. Canon requests C1 (icon inside label span), C2 (mobile View demo 16 px) — same as blog/contact asks; resolve in foundation.

## replica · recreate — unique archetype (pricing) — 2026-11-20

- Gen A, no promo strip. PASS: 1440 pixel 0.25 % Δh 0, 0/0, clipped 0, 19 units 0 off, cap-probe PASS (2 rounds); 360 pixel 0.16 % Δh 0, 0/0 (3 rounds). Hidden modal/compare-table/FAQ content rebuilt verbatim; billing toggle hidden as served.
- Residuals: tab pills +6 px at 1440, logo marquee speed unmeasured (40 s), modal chrome unmeasured, mobile tab prev/next inert, Contact Sales form interim (D2).

## replica · recreate — phase end — 2026-11-20

- All 7 archetypes gated and approved (hands-off): article, landing, program, listing, form, static, unique. Open canon requests (stardust/replica/canon-requests.md) — header icon span, sticky-only .is-stuck, mobile View demo 16 px, reduced header + legal footer variants, locale links per path — fold into the C0 foundation. Gen-A header region selector differs per page (promo strip or not).

## migrate · plan — 7 archetypes Path A, 93 siblings Path A′ in 15 render clusters (2026-11-20)

- In scope 100 pages: Path A (approved) 7 — index, customer-canva, service, blog, contact, company, pricing; Path A′ (sibling) 93 — article 58, form 12, program 10, listing 7, static 3, unique 3; Path B 0. All 7 archetypes gated pass at 1440/360 (replica progress.json; residuals carry causes).
- Two canon layers (canon-a gen-A, canon-b) → `--canon-css` named per render. Siblings render only after their template's C-archetype unit is done (#126). Units in stardust/migrate/progress.json.
- DA token via $ADOBE_IMS_TOKEN_FILE (--token-file), never copied.

## rollout · A-inventory — 100 pages, 7 to deliver, 93 content-pending (2026-11-20)

- Archetypes-only mode (`--state`): 7 archetypes pending, 93 siblings content-pending until their clusters render. DA target aemcoder/3055ed88@main, live host main--3055ed88--aemcoder.aem.live.

## rollout · B-block — 14 distinct module blocks, representative-first plan (2026-11-20)

- 34 instances → 14 conversions (accordion-faq×5, card-grid×5, carousel×4 most reused). Module ids are extract's candidate names; the C-archetype encoders decide the final EDS block names — gen-A (canon-a) and gen-B (canon-b, customer stories) implementations differ, so a shared candidate may become two template-scoped blocks.

## rollout · B2-dynamic — inventory verified against fresh evidence, +25 rows (2026-11-20)

- dynamics-detect --from-state (first page per type, 7 pages, all 200 in Chromium) → 89 findings; dynamics-plan --target-origin preview --migrated --martech --chrome → 92 rows, 25 new vs the triage: marketplace app search (S, D9 interim: submit to source marketplace search), 6 marketplace listing candidates (D3 interim authored), app-icon/demo embed hosts (passthrough), 1 locale-variant row (D4). Rows 84–108 appended to stardust/dynamic-features.md, every one dispositioned. Martech contract all-off + scripts/martech.js already scaffolded (preserve-direction).

## rollout · C-deliver — unit foundation done (2026-11-20)

- Foundation subagent: styles, 10 self-hosted faces (proprietary — licence alert in fonts/LICENSING.md, register R-01), favicon, header/footer blocks gen-A + gen-B (metadata nav/footer/theme switch), 7 chrome docs live (nav, nav-pricing, nav-slim, nav-legacy, footer, footer-legal, footer-legacy). Gate: chrome-parity 1440 live home vs preview 404 shell → first round footer Δy +94/Δh +134 (padding inside the landmark), fixed in the footer block markup → 0 deltas. Frozen (foundation-freeze.json).

## rollout · C-deliver — archetype units article, program, landing done (2026-11-20)

- article (customer-canva): 5 zb-* blocks, 1440 0.03% / 360 0.10%, Δh 0; encoder stardust/rollout/encoders/archetype-article.py for the 58 stories.
- program (service): 11 sv-* blocks, 1440 0.26% / 360 0.56% Δh 18; 360 header crop 20.22% = per-page promo strip content (foundation request); encoder tools in stardust/rollout/encoders/archetype-program/.
- landing (index): 13 hp-* blocks, 1440 0.56% / 360 0.65% Δh 0; Rive hero mounts only same-origin (CORS on zendesk.com .riv) — static frame on aem hosts; 3 never-captured images empty; OneTrust link class is a foundation request.
- Remaining archetype units: listing (blog), static (company), unique (pricing), form (contact).

## rollout · C-deliver — archetype unit static (company) done (2026-11-20)

- static (company): 4 co-* blocks (co-teaser hero/reverse, co-carousel, co-promo, co-cta), 1440 0.04% / 360 0.15% Δh 0, crop 0/0, chrome 0; encoder stardust/rollout/encoders/archetype-static/build.sh for 3 siblings; units.json gen-a-location-card gained the EDS selector.

## rollout · C-deliver — archetype unit form (contact) done (2026-11-20)

- form (contact): 3 fm-* blocks (fm-hero, fm-form field-row model, fm-offices), 1440 0.06% / 360 0.13% Δh 0, crop 0/0, chrome 0, first round; encoder stardust/rollout/encoders/archetype-form/build.sh tolerant of other field sets.

## rollout · C-deliver — archetype unit listing (blog) done (2026-11-20)

- listing (blog): bl-subnav, bl-hero, bl-group, bl-guides, bl-latest + reused hp-teaser; 1440 0.41% Δh -3 / 360 0.38% Δh 0; 360 clip 11 = live 4-line clamp (clip-allow.json); encoder stardust/rollout/encoders/archetype-listing/build.sh reproduces content/blog.html byte-for-byte.

## migrate · render — article-1 done (2026-11-20)

- 8 stories at sibling tier (rendered 8, refused 0); variance probe over all 58 article siblings (stardust/.work/render/article/variance.json): no computed-style variance, count-driven variants only (zb-facts three-up, zb-quotes no-facts here; later zb-quotes single, zb-facts one-up, zb-story-hero cta-secondary). Builder stardust/rollout/encoders/sibling-article/build.py; re-render siblings from `directed`, never `migrated`. Delivery needs zb-facts three-up support in block + encoder; irc-video inline Wistia needs a decision in cluster 6.

## migrate · render — program-1 done (2026-11-20)

- 5 program siblings at sibling tier (rendered 5, refused 0, 0 count drops). Variance probe over all 10 program siblings exit 2: employee-experience and sell are on Zendesk's older template (proxima nova, tinted hero) → `legacy` variant on every module; the rest count/height deltas and cols-3 grids. New sibling encoder stardust/rollout/encoders/sibling-program/encode.mjs (the archetype gen-content.py is prototype-bound). Delivery must add the variant classes and legacy face to sv- blocks; /contact/ trailing slash is delivery-lint P1.

## rollout · C-deliver — archetype unit unique (pricing) done (2026-11-20)

- unique (pricing): 8 pr-* blocks + sv-form reused; 1440 0.39% / 360 0.67% Δh -1, crop 0/0.06%, chrome 0; FAQ single-open, feature/compare modals, logo marquee checked on preview. Residuals: modal images absent from the capture; hidden-by-design blocks 0px as on live. Encoder stardust/rollout/encoders/archetype-unique/build.sh. All 7 archetype units done.

## migrate · render — article-2 done (2026-11-20)

- 8 stories at sibling tier (0 drops); variants zb-quotes single (qantas-loyalty), zb-facts one-up (asaas), zb-facts three-up (star21); motiva/star21 carry 3 stats. Builder trims trailing spaces in captured image URLs. Delivery: `sh stardust/rollout/encoders/sibling-article/deliver.sh <names>`.

## migrate · render — article-3 done (2026-11-20)

- 8 stories at sibling tier (0 drops, no deviations); zb-facts three-up on petstock, solo-by-myob, uneo, betmgm-brasil.

## migrate · render — article-4 done (2026-11-20)

- 8 stories at sibling tier (0 drops, no deviations); zb-facts three-up on coco-republic.

## migrate · render — article-5 done (2026-11-20)

- 8 stories at sibling tier; builder fix: bare body-column text kept verbatim as its own <p> (five-iron-golf lost 37 words before; decision bare-text-wrap; 32 earlier siblings re-checked, none affected). Variants zb-quotes single (inshur), zb-facts three-up (odeon-cinemas).

## migrate · render — static done (2026-11-20)

- trust-center, sitemap, what-is-zendesk at sibling tier of company (0 drops). Variance exit 2: trust-center tabs (4) + 46 accordion items + 19 tables; sitemap older design (co-legacy, no h1 in source — delivery-lint will flag, carry as deviation); what-is-zendesk co-logos, co-media--video (Wistia hrsmip8uph), co-car--desc, co-cta--lg. Delivery must extend the static encoder (tables, accordions, logos, card desc/CTA, play button) — today it drops ~345 words on trust-center.

## migrate · render — article-6 done (2026-11-20)

- 8 stories at sibling tier; irc-video body Wistia player carried as embed (xd9ux5gztv, embed-passthrough decision; player chrome not counted). Variants zb-story-hero cta-secondary (liberty-qa, miko, motel-rocks), zb-facts no-quotes + zb-article embed-wistia (irc-video). Delivery: zb-article needs to mount Wistia links as iframes.

## migrate · render — article-7 done (2026-11-20)

- 8 stories at sibling tier (0 drops); ballys 4 body sections merged (merged-sections decision, 1169/1169 words), variants cta-secondary ×4, three-up ×2, zb-article h2.

## migrate · render — article-8 done (2026-11-20)

- benevity, quickmd at sibling tier (word sequences identical). All 58 article siblings rendered; remaining render units: listing, form-1, form-2, program-2, unique.

## rollout · C-deliver — cluster-article-1 done (2026-11-20)

- 8 stories live, worst 1440 0.15% / 360 0.23%; canva re-gated 0.03%/0.10%. Encoder now emits facts/quotes variants, `zb-article body-md` (16px body on 55 of 58 stories, detected from the capture), `para-images`; relative link fix. nortek units check waived (no fact cards live or EDS). gate-all over 8 pages ≈15 min at 1440: run-bg --timeout 2400+. Deliver chain: stardust/rollout/encoders/sibling-article/deliver.sh.
- Session ended at the runner's budget boundary. Next: cluster-article-2…8 (rendered), render units listing, form-1, form-2, program-2, unique; cluster units static (encoder must gain tables/accordions/logos), program-1/2 (sv- variants + legacy face), listing, form, unique; then gate-all, final.

## migrate · render — listing done (2026-11-20)

- 7 hubs at sibling tier (rendered 7, refused 0); variance: marketplace/industries text hero, marketplace apps/partners/themes directory (breadcrumbs + filters + grid), customer/newsroom legacy tinted hero → bl-* variant classes; new `bl-filters` module declared as deviation. Builder stardust/rollout/encoders/sibling-listing/build.py. Delivery: archetype-listing encoder drops much content (card eyebrow/meta/CTA/logo, h3/h5 groups, promos after first, filters, load-more) — must be extended before PUT (`encoder-gap` decisions in _meta.json).

## migrate · render — program-2 done (2026-11-20)

- 5 program siblings at sibling tier (0 drops); sibling-program builder extended with variants only (sv-hero text legacy, sv-cards legacy per podcast season, sv-links subnav, sv-form/sv-columns modal on cxtrends). Service encoder fixed to keep form help text. Delivery: style sv-links subnav, wire `#modal.<name>` open/close, cxtrends countdown is static capture text (decision in _meta.json).

## migrate · render — form-1 done (2026-11-20)

- login, register, demo, instapage-form-demo/-contact/-trial-teaser-sell at sibling tier (0 drops); builder stardust/rollout/encoders/sibling-form/build.py, variance over all 12 form siblings (stardust/.work/render/form/variance.json): login narrow + suffix field, register split/tinted, demo modal form + Storylane, instapage-* `ct-instapage` bare (no chrome on live → `ct-bare`). Delivery: form encoder must carry radio tile labels, suffix, validation messages, register image, Storylane iframe, robots noindex on instapage pages, nav/footer off on bare pages. form-2: free-trial is a landing-like page (builder loses 11 headings/18 images) — extend first.

## migrate · render — form-2 done (2026-11-20)

- 5 instapage pages (ct-instapage ct-bare) + free-trial (`ct-sections`: ct-logos, ct-quotes, ct-faq, ct-prose deviations, full gen-A chrome) at sibling tier, 0 drops. Delivery: form encoder drops all 45 free-trial images and the Select placeholder; free-trial needs `--meta-row nav=/nav --meta-row footer=/footer`; instapage pages `robots=noindex,follow`.

## migrate · render — unique done (2026-11-20)

- intro-tour (pr-legacy, pr-bar, pr-embed Reprise iframe — needs-business-decision rows 106/107), help-center-closed (pr-split hero, pr-promo), blog-ads-api-output (raw JSON feed in pr-data <pre>, no chrome) at sibling tier, 0 drops. Pricing gen-content.py cannot encode them; new stardust/rollout/encoders/sibling-unique/encode.py. Delivery: build pr-bar, pr-promo, embed; chrome intro-tour nav off/footer-legal, help-center-closed nav-slim, blog-ads-api-output nav/footer off. All render clusters done.

## rollout · C-deliver — cluster-article-2 done (2026-11-20)

- 8 stories live, worst 1440 0.10% (liberty-tax) / 360 0.20% (motiva); canva re-gated 0.03%/0.10%. Fixes: encoder reads captures as utf-8 (recargapay quotes), `zb-quotes single` emitted + styled, `zb-facts one-up` styled. gate-all ≈30 min per width for 8 pages: run-bg --timeout 2700+.

## rollout · C-deliver — cluster-article-3 done (2026-11-20)

- 8 stories live first round, worst petstock 1440 0.5% / 360 0.74% (Δh +32 px, within bar); no block or encoder change. Pixel-gate sidecar rows need stardust/.work/cluster-article-3/pixev.mjs (gate-evidence alone records none).

## rollout · C-deliver — session end, cluster-program-1 in flight (2026-11-20)

- cluster-program-1: 5/5 live, 1440 gate all pass (partner 1.84%, platform 2.4%, employee-service 6.67%, sell 4.84%, employee-experience 8.5%), /service/ 1440 0.26% after sv- changes. 360 gate not run (stopped at session end) — fixes foreseen in rollout/progress.json `resume`. Encoder stardust/rollout/encoders/sibling-program/{encode.mjs,deliver.sh,media.mjs,tints.json}; replica/units.json service-only checks scoped. foundation request: legacy promo strip on employee-experience.
- Next: finish cluster-program-1 at 360, then cluster-article-4…8 (deliver.sh + pixev.mjs), cluster-static, program-2, listing, form-1/2, unique (their encoder gaps are in the render journal sections), gate-all, final.

## rollout · C-deliver — cluster-article-4 done (2026-11-20)

- 8 stories live, worst 1440 0.37% (docebo) / 360 0.26% (coco-republic); canva re-gated both widths. Encoder keeps text+br+image paragraphs whole; new `zb-article img-lsep` variant restores the live U+2028 line after body images (likely needed for action-property-management, britbox, easyfundraising, yape — yape only partially). Wait ~60 s after a CSS push before gating (preview CSS cache).

## rollout · C-deliver — cluster-program-1 done with residuals (2026-11-20)

- 5/5 live; 1440 all pass (worst employee-experience 8.5%); 360 partner 2.81%, platform 2.3% pass; employee-experience, employee-service, sell over the offset bound after 3 rounds (residuals in rollout/progress.json; campaign strip foundation request, sell mobile logo carousel + round closing image). /service/ 0.26%/0.56%. Legacy blocks got <768px rules; encoder: tours `desktop` variant, accordion picture pairing by file name, outline lone CTA, `dark` protect card. Program-2: margin resets at ≥768 px must be var(--za-row-gap); check migrated pages for dropped pictures first; wait for CSS cache before re-gating. These 3 pages must be revisited before gate-all.

## rollout · C-deliver — session end, cluster-article-5 in flight (2026-11-20)

- cluster-article-5: 8/8 deployed (0969768); gates not yet run (interrupted 1440 run stopped). Resume per rollout/progress.json `resume`.
- Next: gate article-5, then article-6/7/8, static, program-2, listing, form-1/2, unique; revisit program-1 360 residuals (employee-experience, employee-service, sell) before gate-all; final.

## rollout · C-deliver — cluster-article-5 done (2026-11-20)

- 8/8 stories live, all pass first round: 1440 worst 0.18% / 360 worst 0.77% (five-iron-golf, Δh −48 px within bar); crop 0%/0% and chrome 2 known logo-label deltas (lucid-software-ai); sidecar evidence recorded (a5a0a85). Encoder unchanged.

## rollout · C-deliver — cluster-static done (2026-11-20)

- trust-center, sitemap, what-is-zendesk live; 1440 worst 1.93% / 360 worst 2.97% (trust-center), clipped 0, missing 0; company re-gated 0.04%/0.15%. Encoder archetype-static/encode.py gained tabs, accordions+tables, logos, stats, cards, video teasers, link lists; new co-accordion/co-tabs/co-logos/co-stats/co-cards/co-linklist; deliver via sibling-static/deliver.sh. Residuals: sitemap no h1 (as live), trust-center 3 lint P1 one-cta-per-p.

## rollout · C-deliver — cluster-article-6 done (2026-11-20)

- 8/8 stories live; worst 1440 0.49% / 360 0.92% (zendesk-for-employee-service). irc-video: bare Wistia URL paragraph now renders as the inline 16:9 player in zb-article (13.08% → 0.23%/0.28%); units waiver (no quotes/stats on live) and @ew-exempt for the D1 lint. canva re-gated 0.03%/0.10%; crop 0%, chrome 2 known deltas.

## rollout · C-deliver — cluster-article-8 done (2026-11-20)

- benevity, quickmd live first round (1440 0.1% / 360 0.21%), crop 0%, chrome 2 known deltas. Encoder fix: meta title/description were double-escaped (literal `&amp;#x27;` on live); earlier article pages with apostrophes in metadata need re-encode + re-PUT before gate-all (todo on the gate-all unit). gate-all timeout goes on run-bg (`--timeout 2400`), not gate-all.

## rollout · C-deliver — session end, cluster-article-7 and cluster-program-2 in flight (2026-11-20)

- Done this session: cluster-article-5/6/8 and cluster-static. In flight (state in rollout/progress.json `resume`): article-7 (8/8 live; ballys 1440 re-gate, yape 360 offsets, canva re-gate, crop/chrome, evidence) and program-2 (5/5 live; 4 pages fail 1440 round 1, 360 not run, /service/ re-gate).
- Next: finish article-7 and program-2, then cluster-listing, form-1, form-2, unique; fix program-1 360 residuals; re-PUT earlier article pages with double-escaped metadata (gate-all todo); gate-all; final.

## rollout · C-deliver — cluster-article-7 done (2026-11-20)

- 8/8 stories live; gate 1440 1.06% / 360 1.06% (worst yape), all rows pass; customer-canva re-gated after the shared zb-article change (0.03% / 0.1%).
- Encoder: pull quotes now encoded as blockquote (zb-article 40px indents); img-lsep counts only in-paragraph images. Residual: yape out-of-paragraph image gains one 24px line (within bound).
- Crop 0%/0%; chrome 2 known logo-label deltas.

## rollout · C-deliver — cluster-program-2 done (2026-11-21)

- 5/5 product pages live; gate 1440 6.63% / 360 4.5% (worst page), 0 clipped, 0 missing; /service/ re-gated 0.26%/0.56%, program-1 spot-check 5/5 pass.
- Blocks gained variants (sv-cards posts/stats counter, sv-columns banner/badges, sv-hero reverse/small/landscape/bg-video/ghost-cta, sv-links subnav blog); encoder reads counters, badges, post cards, blog sub-bar, link-type buttons.
- Foundation request #2: /nav-legacy has no blog-family header (360 shows legacy header where live shows blog bar).

## rollout · C-deliver — cluster-form-1 done (2026-11-21)

- 6/6 pages live (login, register, demo, 3 instapage forms); gate 1440 1.11% / 360 2.67% (worst instapage-form-trial-teaser-sell); /contact/ re-gated 0.06%/0.13%.
- fm-hero/fm-form variants (login column, dialog-over-image, instapage skin, progress, subdomain suffix), new fm-embed (Storylane on /demo/); per-page options in encoders/archetype-form/siblings.json; nav-login and nav-slim-demo docs.
- Residuals: instapage pages have no h1 (as live); multi-step forms show step 1 only (D2 interim); /login/ footer crop 2.77% (live chat widget). Foundation requests 2 (legal-footer wordmark, slim-header mobile button) with page-scoped overrides in fm-hero.css.

## rollout · C-deliver — cluster-listing done with residuals (2026-11-21)

- 7/7 hubs and directories live; gate 1440 5.35% / 360 14.59% (worst marketplace); 5/7 pass at 1440, 4/7 at 360; /blog/ re-gated 0.41%/0.38%.
- Residuals at round cap: marketplace rails reshuffle per visit on live; themes 1440 and customer/partners 360 offsets over bound (card heights, title wrap, open filter group); directories/newsroom no h1 as live; marketplace header menus plain links (no captured dropdowns). Live result counts change daily — overrides.json waives that heading.
- Sibling encoder encoders/archetype-listing/sibling.mjs; new blocks bl-filters, bl-promo; nav-marketplace, nav-newsroom docs.
- Next session: cluster-form-2 (notes in cluster-form-1 report: siblings.json entries, instapage skin), cluster-unique, then article meta re-PUT (gate-all todo), gate-all, final.

## rollout · C-deliver — cluster-unique done (2026-11-21)

- 3/3 pages live (intro-tour, help-center-closed, blog-ads-api-output); published gate 1440 0.18% / 360 1.35% (worst help-center-closed), 0 missing, 0 clipped; /pricing/ untouched.
- sv-hero `notice` variant, new blocks un-tour (logo bar + Reprise iframe) and un-raw (bare JSON feed); new /nav-slim-help, /footer-tour docs; pr-* unit checks scoped to /pricing/.
- Also done: article metadata double-escape re-PUT for dfin, motel-rocks, uneo (verified 3/3). Foundation requests +2 (promo strip empty button slot, minimal legacy footer).

## rollout · C-deliver — cluster-form-2 done (2026-11-21)

- 6/6 pages live (5 instapage forms, free-trial); published gate 1440 1.72% / 360 3.57% (worst free-trial), all pass; /contact/ re-gated 0.06%/0.13%.
- New blocks fm-logos, fm-features, fm-quotes, fm-promo, fm-cta; fm-form variants halves/inline/loose; encoder `sections` map reuses sv-hero, hp-duo, pr-faq, hp-res on free-trial.
- Residuals: no h1 as live; webinar step 1 only (D2); free-trial header extra Language item (foundation request). Next: gate-all, then final.

## rollout · C-deliver — gate-all done (2026-11-21)

- Published-origin roster table: 1440 100/100 delivered (96 pass, 4 documented overrides), 360 100/100 delivered (96 pass, 4 overrides: nortek, irc-video absent unit families; marketplace-apps live result count; marketplace hub randomized rails).
- Wide 2560 report: 78/100 within threshold; 5 pages over 10% or off in height (trust-center, marketplace-themes, free-trial, demo, register) — report only.
- update-coverage --gate applied for both widths: 100/100 rows matched, 0 status flips; foundation-freeze check clean.

## rollout · C-deliver — final done, phase end (2026-11-21)

- C-final steps were already complete (freeze check clean, 9/12 requests applied, archetypes re-gated, gate-all both widths, coverage --gate); unit `final` recorded done.
- done-check reported pages_not_live:93: the 93 sibling coverage rows still carried the source's trailing-slash paths (`/customer/asaas/` → 404 on EDS) from the archetypes-only inventory; the pages are live at the slashless path. Aligned path + source fields from a scratch inventory of the migrated tree (delivery/gate state untouched; scratch re-inventory flags 0 stale). Gap closed.
- D-site must redirect the source's trailing-slash URLs to the slashless EDS paths.

## rollout · D-site — site assembly (2026-11-21)

- Redirects: no spec knowledge, so `stardust/redirects.tsv` was derived from coverage (source URL path ≠ delivered path): 99 trailing-slash rows → `/redirects.json` sheet, PUT + preview + live; `/customer/asaas/` etc. now 301 to the slashless page. `/` is the `index` document, 200 on .page and .live.
- Served sitemap 92 vs assembled 100: the 8 `instapage-form-*` pages carry `noindex,follow` from the source head (kept verbatim, no register entry to change it) — documented exception, all 8 live 200. The 2 extras (`/nav-promo-masterclass`, `/nav-promo-relate`) got `Robots | noindex` and were republished.
- da-library: 65 blocks (173 variants), 13 templates, config library tab written.

## rollout · D2-dynamic — parity (2026-11-21)

- `stardust/dynamics/parity.json`: 27 features + martech, all 108 curated rows mapped once; `dynamics-check` 54/54 PASS on the published origin; report in `stardust/qa/dynamics-report.md`.
- D2 lead forms verified by probe (no `form-flow` check: the interim tier sends no POST): /contact empty submit refused, filled submit shows "no form backend connected"; trial teasers hand off to /register/?email=….
- Open (interim, recorded): /demo 6-step fm-form has 0 required fields; /blog subscribe shows no notice after a valid submit; footer newsletter empty submit (deferred request); pages emit 0 hreflang alternates although D4 promises source-locale links (foundation request line); the /demo Storylane hub iframe loads its own GTM-Z4DV/OneTrust/pixels unconsented — configured in Storylane, owner D1.

## rollout · E-full-site — 100/100 verified (2026-11-21)

- verify first pass 83/17: 16 pages render no `<h1>` because the source has none (captured `headings[]` without h1) + 1 broken internal link. Register R-02 (applied): a closing `sr-heading` section with the captured page title as a visually hidden `<h1>` (styles.css rule); re-gated the 17 on the published origin at 1440 and 360 — 17/17 delivered both widths, 0 pixel/height/clip failures. `/help-center-closed` link to the out-of-scope blog post repointed to its source URL (E2 rule).
- Render check of restoreAtDelivery motion: /service sv-stories rotates (slide text changes within 12 s). The home Rive hero never mounted: the .riv was cross-origin (block mounts same-origin only) and the CSP blocked wasm. Fixed: the .riv (fetched from web-assets.zendesk.com, same file name as captured) ships at /blocks/hp-hero/hero-20260520-en-us.riv, home doc points to it, head.html CSP adds 'wasm-unsafe-eval'. Canvas mounts, .riv 200; index re-gated 0.67% @1440 / 0.65% @360.
- Correction after the end line: the re-verify read 99/1 — verify.mjs treats a root-relative `.riv` href as a broken page link (its asset-extension list lacks `.riv`). The home doc now carries the document-relative `blocks/hp-hero/hero-20260520-en-us.riv` (resolves to the same file at `/`; kept as-is by the pipeline); Rive still mounts (.riv 200) and verify reads 100/100.

## rollout · E2-link-audit — internal links local, 96/96 targets 200 (2026-11-21)

- localize-links over the whole content tree: 153 absolute source links → root-relative, 134 trailing-slash hrefs normalized, 87 docs re-published (diff touches hrefs only). 413 out-of-scope targets remain absolute source URLs — scope extension, listed in direction.md as scope debt.
- Live audit of 100 pages + 16 chrome docs: 1089 distinct hrefs, 96 internal targets all 200; verify 100/100.

## rollout · F-optimize — gate pass, 0 open P1 (2026-11-21)
- `optimize.mjs --all` over 100 delivered pages on main--3055ed88--aemcoder.aem.live: health 65, P1 0, P2 99, P3 1; 17 source-parity findings informational.
- The 99 P2 are `ai-search/jsonld`: the source pages carry JSON-LD the delivered pages lack — routed `platform-migration` to Phase G.
- Judgment layers stay null: replica never delegates to impeccable craft; marketing SEO skills are not installed.

## rollout · G-aem — source JSON-LD carried, 0 open findings (2026-11-21)
- `autofix-aem --dry-run` routed all 99 `jsonld` findings to manual. Fix: each page's source `application/ld+json` (from `current/pages/<slug>.html`, parsed, an array when the source has several) went verbatim into a `json-ld` metadata row; the pipeline renders it in `<head>`. Probe: `stardust/.work/rollout/probes/jsonld-carry.mjs`.
- 99 docs re-published live (`units/g-jsonld*.paths`, ledger `deploy/ledger-g-jsonld.json`), 0 failures; blog-ads-api-output has no source JSON-LD (parity).
- marketplace-partners title-length accepted as source parity (the source has the same title; the check missed the entity form `&amp;` vs `&#x26;`).
- verify 100/100; optimize run-2: health 100, open 0, 99 fixed.

## rollout · H-report — delivery report (2026-11-21)
- `stardust/rollout/report.md`: 100/100 verified, 14/14 blocks, health 100 with 0 open, pixel table 96 + 4 overrides per width, dynamics 54/54 PASS with the owner-held rows listed.
- `stardust/learnings.md`: 3 pending entries (parity entity compare, source JSON-LD carry, deploy-batch log dir).

## rollout · I-dashboard — dashboard written (2026-11-21)
- `stardust/rollout/dashboard/index.html` + `data.json`: 100 identified, prototyped, deployed; 83 "optimised" — the other 17 carry only informational source-parity findings (not gated, health 100).

## replica · handoff — complete (2026-11-21)
- Runner done-check: complete, 0 gaps. 100/100 pages live and verified; rollout A→I ended; report in `stardust/rollout/report.md`, dashboard in `stardust/rollout/dashboard/`.
