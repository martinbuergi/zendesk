# Martech hand-off

Everything below is scaffolded **off**. To ship it, set `enabled: true` on `consent.cmp` and on each route in `stardust/martech-contract.json`, then re-run `deploy/scripts/martech-scaffold.mjs` and `dynamics/scripts/dynamics-check.mjs` to confirm the enabled tags load. Enabled tags load on `www.zendesk.com` only; preview with `?martech=on` (add `&consent=accept` to grant every category).

## Consent

- **CMP:** OneTrust · `data-domain-script` = `c84f307d-a465-4571-bbcb-8adbdf57a7ae`
- **Model `owner-decision`:** no evidence of consent gating inside the tag manager. Keep the source behaviour (route `category` null), or set a route `category` to a consent group id to load that tag manager only once the group is granted.
- **Google Consent Mode:** consent-mode calls in `tags/www.googletagmanager.com-gtm-GTM-Z4DV.js`. Check it with the owner before gating a route on a category.
- **Consent checks read by the model (evidence only; the model above comes from parsed evidence and does not change):** confirm each with the owner before choosing route categories.
  - Google Tag Manager rule OneTrust CMP (community template OT.CMP, tag_id 3205) — injects cdn.cookielaw.org/scripttemplates/otSDKStub.js?did=<Domain>, sets Google Consent Mode defaults per region (e.g. us-ca: analytics/ad storage off by default) checks `C0002`, `C0003`, `C0004` — read by the model at martech/tags/www.googletagmanager.com-gtm-GTM-Z4DV.js · tag_id 3205, vtp_URL cdn.cookielaw.org, vtp_gcmMapping
  - Google Tag Manager rule GA4 event tags (__gaawe ×63) for measurement ids G-FBP7C61M6Z, G-E0K02KWP7Y, G-WEDV4EN8N0 checks `C0002` — read by the model at martech/tags/www.googletagmanager.com-gtm-GTM-Z4DV.js · __gaawe / __googtag entries
  - Google Tag Manager rule Google Ads (AW-972607400) conversion + Floodlight (DC-15086586, DC-13351067) tags (__awct ×15, __flc ×39) checks `C0004` — read by the model at martech/tags/www.googletagmanager.com-gtm-GTM-Z4DV.js · __awct / __flc entries; macro test _re ",C0004,"
- **Categories:** no CMP configuration read — run `spec-martech.mjs` first, or decide categories with the owner.

## Routes

| id | vendor | src | CMP groups listing its host | enabled |
|---|---|---|---|---|
| google-tag-manager | Google Tag Manager | `https://www.googletagmanager.com/gtm.js?id=GTM-Z4DV` | — | false |

Also seen, not routed (loaded by the tag manager or inline on the source — confirm each still fires): analytics: Google Analytics / Ads · marketing: ad / retargeting pixel · chat: live chat widget.

## Rewrite before go-live

Nothing found (or no tag-manager library read).

## Data layer

The source pages expose `dataLayer`; keep the same global names.
Google Tag Manager (read by the model, not parsed) rules fire on data-layer pushes; the migrated pages must push the same events: `gtm.init_consent` (1) · `dataLayer custom events` (1) · `trial_created and other dataLayer events` (1).
Data elements read these data-layer paths: `window.OnetrustActiveGroups`.
Ask the owner for the tagging plan (solution design reference): each event, its payload and the interaction that pushes it. With it, add each push in the block that owns the interaction.

- Google Tag Manager rule OneTrust CMP (community template OT.CMP, tag_id 3205) — injects cdn.cookielaw.org/scripttemplates/otSDKStub.js?did=<Domain>, sets Google Consent Mode defaults per region (e.g. us-ca: analytics/ad storage off by default) — listens for `gtm.init_consent` — read by the model at martech/tags/www.googletagmanager.com-gtm-GTM-Z4DV.js · tag_id 3205, vtp_URL cdn.cookielaw.org, vtp_gcmMapping
- Google Tag Manager rule GA4 event tags (__gaawe ×63) for measurement ids G-FBP7C61M6Z, G-E0K02KWP7Y, G-WEDV4EN8N0 — listens for `dataLayer custom events` — read by the model at martech/tags/www.googletagmanager.com-gtm-GTM-Z4DV.js · __gaawe / __googtag entries
- Google Tag Manager rule Google Ads (AW-972607400) conversion + Floodlight (DC-15086586, DC-13351067) tags (__awct ×15, __flc ×39) — listens for `trial_created and other dataLayer events` — read by the model at martech/tags/www.googletagmanager.com-gtm-GTM-Z4DV.js · __awct / __flc entries; macro test _re ",C0004,"

## Tag-manager notes (read by the model, not parsed)

**Google Tag Manager:**
- [object Object]
- [object Object]
- [object Object]

Confirm everything read by the model against the owner's tagging plan.
