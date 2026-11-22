# Learnings — www.zendesk.com replica run

### Source-parity title check misses an entity-form difference
- failure class: false-positive (optimize parity compare)
- evidence: `optimize.mjs` run-1 flagged P3 `seo/title-length` on marketplace-partners as in-scope; the source `<title>` carries `&amp;`, the delivered one `&#x26;` — same text, same 72 chars; resolved by hand (finding f-919596f471, accepted)
- proposed change: `skills/rollout/scripts/optimize.mjs` source-parity compare — decode HTML entities on both titles (and descriptions) before comparing
- status: pending

### Source JSON-LD dropped at migrate, then reported as 99 manual fixes
- failure class: content-loss (head metadata)
- evidence: optimize run-1 had 99 P2 `ai-search/jsonld`; every source page carried `application/ld+json` in `current/pages/<slug>.html`; `autofix-aem` marked all 99 `manual`. A `json-ld` metadata row with the parsed source JSON (an array when the source has several blocks) is rendered by the pipeline as `<script type="application/ld+json">` in `<head>`; carried on 99 docs and re-published, run-2 shows 99 fixed
- proposed change: `skills/migrate/reference/metadata-and-jsonld.md` § JSON-LD by page-type — in the replica flow, carry the captured source JSON-LD verbatim as the `json-ld` metadata row instead of composing by page type; `skills/rollout/scripts/autofix-aem.mjs` `eds-jsonld` — apply that row when the capture holds source JSON-LD
- status: pending

### deploy-batch exits fatally when the --log directory is missing
- failure class: tooling
- evidence: `deploy-batch.mjs --log stardust/.work/rollout/g-jsonld/deploy.log` → `fatal: ENOENT … deploy.log` after the PUT started for /company; a re-run after `mkdir -p` succeeded
- proposed change: `skills/deploy/scripts/deploy-batch.mjs` — `mkdirSync(dirname(log), {recursive: true})` before the first append
- status: pending
