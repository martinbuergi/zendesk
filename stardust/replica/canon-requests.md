# Canon change requests

## canon-a (from: service archetype, 2026-11-20)

1. **Footer "How can we help? Contact us."** — `source-spec compare` reports an EXTRA node `h3 "Contact us."`
   (footer, 1440 and 360) on every gen-A page built on the canon footer. Live markup wraps the link text in a
   span inside the heading (`<h3>How can we help?<br> <a href="/contact/"><span>Contact us.</span></a></h3>`), so
   the live inventory reads it as a link, not a heading text node. Request: in the canon footer markup
   (`.za-ftr__ask h3 a`) wrap the text in `<span>` (styles unchanged). This is the only remaining compare delta
   on service at 1440 and 360 (0 sections off, 0 nodes off, 0 missing).
2. **Footer chrome-parity / content-diff (all footer findings on service, 1440 + 360)** — the service gate's only
   remaining 🔴 / nothing-lost 🟡 are in the canon footer:
   - 🔴 MISSING ICON ×22 + 🟡 MISSING ARIA-LABEL ×22: every live footer link that opens a new tab (System status,
     Help center, Academy, Careers, Accessibility plan, Zendesk Foundation, CX Trends 2026, Product updates, and the
     six social links) carries a hidden external glyph `<svg role="img" aria-label="(opens in a new tab)" width="12"
     height="12" viewBox="0 0 12 12">` (display:none at rest; path `M10.5 8.5V10c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5V2c0-.3.2-.5.5-.5h1.5M6 6l4-4m-3.5-.5H10c.3 0 .5.2.5.5v3.5`,
     stroke currentColor, fill none). Request: add it (hidden) to those links in the canon footer markup, both the
     desktop columns and the mobile accordion copies.
   - chrome-parity PAIR deltas: live wraps each footer link's text in `<span>` (decoration none at rest; the link
     itself has radius 0); the canon `<a class="za-ftr__a">` reports `textDecorationLine: underline` + radius 4px at
     rest, and "Contact us." gets `padding-bottom: 6px` (Δh +6). At 1440 the live `<footer>` element spans the
     viewport (0→1440) with the 1150 container inside; the canon puts `id="footer"` on the container (REGION BOX
     Δx +145, Δw −290 — every footer pair then reads Δx −145).
   Footer pixel crop still passes (1440: 98.69 %, thick texture at the ±1px steps y=6971 / y=7839).

## canon-a changes by the owner (index, 2026-11-20) — FYI for gen-A pages
- `.za-ftr__acc` padding 0 8px → 0 12px (live col bxuHXs padding 12; mobile footer accordion heads at x 32).
- Footer: live shape is `div.za-ftr > footer > div.za-container` (footer element full width, no padding); link texts wrapped `<a class="za-ftr__a"><span>…</span></a>`; Contact us → `<a><span>Contact us.</span></a>` (underline on the span; old markup still styled via :not(:has(span))).
- New: `.za-linkroot` (Linkstyle LinkRoot box, 1.25em+6px line, 1.25em+8px min-height) wrapping `<span class="za-link">`.
- New: hidden Garden icons `svg.za-ext` (aria-label "(opens in a new tab)" on external links) and `svg.za-rot` (accordion rotate icon) — display:none.
- `.za-promo__cta` border-radius 4px; canon-a.js adds `.is-stuck` on the pinned `.za-hdr`.
3. **Footer @360: MISSING CTA "Cookie settings" → `#onetrust-show-cookie-settings`** (🔴, footer root) — the live
   mobile footer carries a "Cookie settings" link the canon footer lacks. Request: add it to the canon footer
   (where the live renders it at <768).

## service — status after the owner's canon-a changes
- Requests 1–3 above: resolved by the owner's footer change — service re-synced its chrome markup from the canon;
  source-spec compare 0/0/0/0, chrome-parity quiet and content-diff 0 footer findings at 1440 and 360. No open
  canon requests from service.

## canon-a (from: contact / form archetype, 2026-11-20)
4. **Slim header variant** — `/contact/` renders a reduced gen-A header: no promo bar, no secondary row
   (Sign in / Contact us / Language), no menus. Desktop (`.cPJLpn`, ≥970): sticky `top: -1px` (canon desktop is
   `-32px`), 91 px tall, grid 100px | 1fr | auto with the logo wrapper `.kAGosB` (`grid-column: 1; margin-right: auto;
   padding: 10px 0`, no translateY) + Try for free / View demo. Mobile (`.iQZsgX`, <970): logo, hamburger
   `.kpIrEN` present but `display: none`, View demo only. Authored page-locally in `contact.css` (`.ct-hdr`,
   `.ct-logo-wrap`, `.ct-hdr__toggle`); request: a canon modifier (e.g. `.za-hdr--slim`) so later form/landing
   pages share it. Note for the gate: live has no header landmark and NO promo strip here, so the index region
   `body>div:nth-of-type(1)>div>div:nth-of-type(3)` does not resolve on /contact/ — use
   `header=#__next>div>div:nth-of-type(2)|#za-hdr-d` at 1440 and `header=#__next>div>div:nth-of-type(1)|#za-hdr-m`
   at 360 (chrome-parity auto-detects the same divs).
5. **Mobile header CTA font-size** — canon `.za-hdr__ctas .za-btn { font-size: 15px }` (<1150) also hits the
   mobile View demo; live mobile CTA is `.kFGqoW.bSzcRF` without `.gNBZYc`, so 16px (chrome-parity on /contact/ @360:
   Δw −6 px on "View demo"). contact.css overrides `.ct-hdr.za-hdr--mobile .za-hdr__ctas .za-btn { font-size: 16px }`;
   request: scope the 15px rule to the desktop bar if index/service mobile headers agree.
6. **Slim legal footer** — `/contact/` uses `footer.bRykKL` (logo 100×20 + `nav[aria-label=legal-footer]`, six 14px
   links, gap 12, 24px padding, top hairline `inset 0 1px rgba(17,17,13,.11)`; centred column <768) instead of the
   big gen-A footer. Authored page-locally as `.ct-ftr*` in `contact.css`; request: move into canon-a as a footer
   variant. Chrome-parity quiet and crop 100.00 % at 1440 and 360 with the page-local version.

## canon-a (from: blog listing archetype, 2026-11-20)

1. **Secondary-row LinkText span** — live wraps the icon AND the text in the LinkText span
   (`<a><span><svg/>Sign in</span></a>`, same for Contact us and Language). The canon has `<a><svg/><span>Sign in</span></a>`;
   chrome-parity reads Δx +24 / Δw −24 per item. blog-proposed.html carries the corrected markup (header parity ✓ at 1440);
   please adopt it in the canon header markup (no CSS change needed).
2. **canon-a.js stuck state on non-sticky headers** — on /blog/ the global header is `position: relative` (the microsite
   sub-nav is the sticky bar). canon-a.js still toggles `.is-stuck` (rect.top ≤ 0 once scrolled), which swaps the logo.
   blog.js strips the class after canon's handler (motion-compare: is-stuck added ~600× on build, advisory). Request:
   only tick bars whose computed `position` is `sticky`.
3. **Mobile header "View demo" 16px on /blog/** (live 83px text box at 360; canon renders 15px). Page override in blog.css;
   check whether the home mobile bar is also 16px.
4. **Mobile menu panel content missing from the canon mobile header** — the live header (inside `main` on /blog/) carries the
   hidden mobile menu (Platform/Products/Solutions/Resources h5 triggers + every mega-menu link, eyebrows "Common use cases",
   "By business type", "Learn", "Support", "Latest News", "AI Summit 2026 now available to stream"). Content-diff with
   `--main main` lists ~200 reds from it; the blog gate scoped its content roots to the page sections instead.
5. **Language links are per-page** (live /blog/ points each locale at its own /blog/, e.g. https://www.zendesk.co.uk/blog/);
   blog-proposed.html rewrites them. The canon/platform header should take the current path.
6. **Footer ±1px steps at 1440** (y≈+45 and +913 into the footer; same as the service note) keep the 1440 footer crop at
   97.58 % on /blog/ (bar 98 %); chrome-parity footer ✓ 75/75.

## canon-a (from: company / static archetype, 2026-11-20)
C1. **Secondary nav (Sign in / Contact us / Language): icon inside the text span** — live wraps the 16px icon and the
   label in one span (`<a><span><svg/>Sign in</span></a>`), so chrome-parity measures "Sign in" 67 px wide from x 1108;
   the canon markup (`<a class="za-nav2__link"><svg/><span>Sign in</span></a>`) reports Δx +24 / Δw −24 on all three
   at 1440 (pixels identical). company-proposed.html moves the svg inside the span page-locally (styles unchanged);
   request: same in the canon header markup. On /company/ the full gen-A header renders WITHOUT the promo strip:
   regions `header=#__next>div>div:nth-of-type(2)|#za-hdr-d` (1440) and `#__next>div>div:nth-of-type(1)|#za-hdr-m` (360),
   same as /contact/.
C2. **contact #5 confirmed on /company/** — mobile header "View demo" is 16px on live (Δw −6 against the canon 15px);
   company.css overrides `.za-hdr--mobile .za-hdr__ctas .za-btn { font-size: 16px }` page-locally.

## canon-a (from: pricing / unique archetype, 2026-11-20)
- No new canon defects. /pricing/ re-confirms blog #1 (secondary-row LinkText span wraps icon + text — pricing-proposed.html
  carries the corrected markup, built by stardust/.work/pricing/tools/build.py from the service chrome) and contact #5 (mobile
  header CTA is 16px — page override in pricing.css). Pricing header CTAs differ per page: desktop "Try for free" + "Contact Sales"
  (/contact/), mobile "Try for free" only; no promo strip. Gate regions: header=#__next>div>div:nth-of-type(2)|#za-hdr-d (1440),
  #__next>div>div:nth-of-type(1)|#za-hdr-m (360) — same as /contact/. Chrome crops 100.00 % header + footer at both widths.
