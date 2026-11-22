# Font licensing — required before going live

The replica self-hosts the faces captured from www.zendesk.com (register R-01) for fidelity.
All of them are proprietary. Confirm the webfont / embedding licence for the served domain
before publishing to aem.live production traffic.

| File | Family / weight | Foundry | Status |
|---|---|---|---|
| VanillaSans-Regular.woff2 | Vanilla Sans 400 (gen A) | Zendesk brand face (custom) | unconfirmed |
| VanillaSans-Medium.woff2 | Vanilla Sans 500 | Zendesk brand face (custom) | unconfirmed |
| VanillaSans-SemiBold.woff2 | Vanilla Sans 600 | Zendesk brand face (custom) | unconfirmed |
| VanillaSans-Bold.woff2 | Vanilla Sans 700 | Zendesk brand face (custom) | unconfirmed |
| SHSNMedium.woff2 | Sharp Sans No1 Medium (declared 400, gen B) | Sharp Type | unconfirmed |
| SHSN.woff2 | Sharp Sans No1 Semibold (declared 600) | Sharp Type | unconfirmed |
| SHSNBold.woff2 | Sharp Sans No1 Bold (declared 700) | Sharp Type | unconfirmed |
| PNR.woff2 | Proxima Nova 400 (gen B body) | Mark Simonson Studio | unconfirmed |
| PNSB.woff2 | Proxima Nova 600 | Mark Simonson Studio | unconfirmed |
| PNB.woff2 | Proxima Nova 700 | Mark Simonson Studio | unconfirmed |

Remove path: delete the `.woff2` files above and their `@font-face` rules in
`styles/fonts.css`. Every stack names a metric-matched local fallback second
(`vanilla-sans-fallback`, `sharp-sans-fallback`, `proxima-nova-fallback` in
`styles/styles.css`, all sourcing Arial / Liberation Sans), so the pages keep their
line metrics on the fallback.

This file is not served (`*.md` is in `.hlxignore`).
