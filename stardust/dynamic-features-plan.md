<!-- stardust provenance: skill=stardust:dynamics · phase=triage (curated plan) · 2026-11-20 · source stardust/dynamic-features.md · mode: hands-off -->
# Dynamic features — implementation plan (www.zendesk.com)

Static first, then wire (triage.md rule 7): every feature below already degrades to a working static page; no phase blocks the replica recreate or the static migration. Only `self` rows ship autonomously; D1–D8 are the single decision batch in `stardust/dynamic-features.md`.

## Phase A — chrome & interactive (self) · recreate stage
- Deliverables: header mega-menu (Platform / Products / Solutions / Resources), mobile drawer, `aria-haspopup` disclosure controls (rows 33, 81, 83) in `blocks/header` per `stardust/chrome/header-contract.json`; locale switcher UI rendered with D4 interim links (row 82).
- Authored carousels / accordions / link lists (8 `L` rows marked authored) as blocks: carousel, cards, accordion.
- Verify: chrome-compare against the header contract; dynamics-check `chrome-interaction`.
- Effort: S–M (part of the header block work).

## Phase B — media & embeds (self)
- Wistia players (`/service/`, `/customer/canva/`) as content URLs; Storylane inline demo on `/service/` as an embed block re-authored from `app.storylane.io/demo/htqk95bthcym` (6 Storylane rows).
- Verify: player/iframe present and sized; no blank band.
- Effort: S.

## Phase C — forms (D2, interim)
- Lead-form block (definition-driven; fields name, email, phone, company, help-desk size radios/select, country, question) used by `/contact/` and the demo-request sections on `/service/`, `/pricing/`. Interim submit: local capture + "no backend connected" message. Not regulated-pii.
- Trial email teaser widget: validates email, hands off to `https://www.zendesk.com/register/`; nothing stored.
- Owner decision D2: production endpoint (Marketo / Zendesk lead API) — then swap the submit adapter only.
- Verify: field parity vs `_dynamics.json` signatures; submit shows the interim message; no network POST to an unknown host.
- Effort: M.

## Phase D — listings (D3, interim)
- Interim: `/blog/` latest grid (11) and home latest rail (3) authored from the capture.
- Authoring contract: article pages emit `title`, `description`, `image`, `publication-date`, `category`, `author` metadata (Listings contract).
- Wire: index definition in the site config at tools.aem.live (AGENTS.md: `helix-query.yaml` retired) → listing block reads `/query-index.json` filtered by `/blog/`.
- Verify: card count and order vs source at rollout.
- Effort: M.

## Phase E — data (D6, interim)
- `/app/geo.json` consumer: client helper with default region (US/USD) fallback; owner supplies a geo source.
- Effort: S.

## Phase F — locale & auth (D4, D5, interim)
- en tree only; hreflang alternates + switcher point at source locale trees; Sign in / Free trial absolute to www.zendesk.com `/login/`, `/register/`.
- Effort: S.

## Phase G — martech (D1, D7, D8 · scaffolded-awaiting-owner)
- Done now: `stardust/martech-contract.json` (OneTrust domain script recorded, GTM-Z4DV route, all `enabled: false`), `stardust/martech-handoff.md`, `scripts/martech.js` via `martech-scaffold.mjs` (hooks in `scripts.js` loadEager, `consented.js`, `consent-check.js`). Nothing loads until the owner enables parts; preview `?martech=on&consent=accept`.
- Owner: enable GTM route (brings OneTrust + GCM defaults + all GTM tags); decide Web SDK path (D8) and the Zendesk messaging widget (D7); provide the tagging plan so blocks push the same `dataLayer` events (e.g. `trial_created`).
- Verify: `dynamics-check.mjs` `martech` feature once enabled.
- Effort: S (code) + owner time.

## Not in scope / noted
- `/pricing/` shows 6 prices; no billing-period toggle was detected as a control group — confirm at recreate; if present it is `client-only` (widget, self).
- Reconcile vs `stardust/migrated/` (rule 1) runs at rollout B2 — no migrated tree yet.
- No search anywhere on the site → no results page.
