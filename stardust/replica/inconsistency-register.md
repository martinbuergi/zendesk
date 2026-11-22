# Inconsistency register — www.zendesk.com replica

No design deltas — pure replica. Everything not listed here is frozen; any design
delta found by the gate is a defect, not an improvement.

## R-01 — Proprietary brand faces self-hosted pending licence confirmation

- **Evidence:** stardust/current/assets/fonts/ — Vanilla Sans (Regular, Medium, SemiBold, Bold), Sharp Sans (SHSN, Medium, Bold), Proxima Nova (PNR, PNSB, PNB), captured from the live site's font responses.
- **Finding:** the source renders with commercial typefaces; carrying the files to the new host needs the owner's web-font licence to cover it.
- **Minimal change:** none to the design — the captured files ship as-is (fonts/LICENSING.md + deploy licensing alert); a metric-matched fallback is listed after each brand family only.
- **Status:** deferred
- **Where:** all page types (both design generations)

## R-02 — Pages whose source renders no `<h1>` get a visually hidden page-title heading

- **Evidence:** stardust/current/pages/<slug>.json `headings[]` holds no h1 for 16 pages (blog-ads-api-output, free-trial, 8 instapage-form-*, intro-tour, marketplace-apps, marketplace-partners, marketplace-themes, newsroom, sitemap); rollout verify requires exactly one `<h1>` per page (heading outline for screen readers and search).
- **Finding:** the source has no top-level heading on these pages; the delivered page reproduced that faithfully.
- **Minimal change:** one closing section per page, Section Metadata style `sr-heading`, holding `<h1>` with the page's captured `<title>` verbatim; `main > .section.sr-heading` is visually hidden (1×1 clip, out of flow) — zero visual delta, no copy reworded, no other heading changed.
- **Status:** applied (rollout E-full-site, hands-off) — revert by deleting the section from the 16 documents.
- **Where:** the 16 pages above
