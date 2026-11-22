---
_provenance:
  writtenBy: stardust:replica
  writtenAt: 2026-11-20T08:07:04Z
  againstInput: https://www.zendesk.com/
  readArtifacts:
    - stardust/current/PRODUCT.md
    - stardust/current/DESIGN.md
    - stardust/current/DESIGN.json
---

# Direction — preserve mode (same-design migration)

Mode: PRESERVE. The target spec is the captured current state of https://www.zendesk.com/,
promoted verbatim (no direct invocation, no creative decisions).

Promoted: current/PRODUCT.md → PRODUCT.md · current/DESIGN.md → DESIGN.md ·
current/DESIGN.json → DESIGN.json (at 2026-11-20T08:07:04Z).

Permitted deltas: ONLY the entries of stardust/replica/inconsistency-register.md
(1 entry, deferred, no design change — pure replica).

Fidelity: ia verbatim · design verbatim · content verbatim.

Hands-off: activated by --hands-off (state.json.handsOff: true). Approvals recorded as approvedBy "hands-off".

Roster: fixed by the run's site plan — 100 pages (stardust/.labs/site-plan.json), not the full site; no per-template cap applied beyond the plan.
Gate breakpoints: desktop,mobile → 1440,360. No target breakpoints (source breakpoints kept).
Ordering: sequential phases (extract first, then archetypes; home is the first archetype recreated) — the runner's phase-boundary protocol replaces the two-track first-page-first opening.
Two design generations (A current, B legacy) coexist on the source; both are replicated as captured.
Publish decision: publish (owner decision recorded in stardust/eds-conversion-log.md).
Martech: owner asks to keep analytics, tags and consent — carried over with every contract part disabled.

## E2 link audit — scope decision (2026-11-21)
Decision: internal targets outside the declared 100-page plan are NOT added to scope (SCOPE EXTENSION rule); they point at the source site as absolute `https://www.zendesk.com<path>` URLs, recorded here as scope debt.
- Localized: 153 absolute source links → root-relative in-scope URLs; normalized: 134 root-relative hrefs (87 documents changed, redeployed 87/87 live).
- Out-of-scope internal targets: 413 distinct paths (856 links), all already absolute to www.zendesk.com as captured; 0 root-relative hrefs needed repointing (helper `stardust/.work/rollout/probes/repoint-out-of-scope.mjs`).
- Top 10 out-of-scope targets (links): /public/assets/sitemaps/en/feed.xml (59), /service/ai (59), /company/agreements-and-terms/privacy-notice (21), /company/agreements-and-terms/privacy-policy (15), /service/ai/ai-agents (14), /service/quality-assurance (13), /service/knowledge (12), /service/analytics (11), /company/legal (11), /business/startups (10).
- Live audit: 96/96 distinct internal targets end 200; 537 www.zendesk.com targets well-formed; verify 100/100.
