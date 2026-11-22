# rollout report — https://www.zendesk.com/ → aem-eds (2026-11-21)

```
rollout — www.zendesk.com → aem-eds
==================================================
Pages       100 total · 100 verified · 0 deployed · 0 pending · 0 content-pending · 0 stale
Templates   13 (article 58/58 · form 12/12 · program 10/10 · listing 7/7 · static 3/3 · unique 3/3 ·
            blog 1/1 · company 1/1 · contact 1/1 · customer-canva 1/1 · index 1/1 · pricing 1/1 · service 1/1)
Blocks      14 total · 14 converted · 0 pending
Quality     health 100/100 · open P1 0 / P2 0 / P3 0 (17 source-parity findings informational; 99 jsonld fixed in G)
Pixel table deployed 1440: 96/100 PASS + 4 documented overrides (pixel-only 99/100) · 360: 96/100 PASS + 4 overrides (pixel-only 99/100)
            — gates/all-1440/summary.md, gates/all-360/summary.md
To deliver  none
Content     0 pages awaiting the content track
Live        https://main--3055ed88--aemcoder.aem.live/ — all 100 pages published; redirects sheet 99 rows; sitemap served 92 (8 source-noindex form pages excluded)
```

Overrides (both widths): customer/nortek and customer/irc-video (unit families absent on the source),
marketplace/apps (live result count changes daily), marketplace hub (randomized rails per visit).

## Dynamic parity (Phase D2 — `stardust/qa/dynamics-report.md`)

54/54 replayed checks PASS over 28 features covering 108 dispositioned rows: 14 done, 9 interim,
4 scaffolded awaiting the owner (martech contract carried with every part disabled — the owner turns
parts on). Open with the owner: /demo form has 0 required fields as captured, /blog subscribe has no
post-submit notice, footer newsletter empty submit (deferred), hreflang links not emitted (foundation
request), the Storylane tour iframe loads its own GTM/OneTrust (vendor-side).

## Scope debt

413 out-of-scope link targets stay absolute to www.zendesk.com (named decision in `stardust/direction.md`).
