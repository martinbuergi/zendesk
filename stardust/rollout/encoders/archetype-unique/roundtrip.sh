#!/bin/sh
# whole-page round-trip for content/pricing.html (maps: prototype section selectors per block)
cd /workspace/3055ed88
node stardust/scripts/deploy/block-roundtrip.mjs http://localhost:8795/pricing-proposed.html content/pricing.html --width ${1:-1440} --ew \
  --map 'pr-head=.pr-tabs' --map 'pr-plans=#plans .pr-plans__grid, #addons' \
  --map 'pr-modal=#plans .pr-modal, .pr-modal[data-modal$="-modal"]' --map 'pr-split=.pr-split' --map 'pr-logos=.pr-logos' \
  --map 'pr-faq=#faqs' --map 'pr-final=#final-callout' --map 'pr-matrix=.pr-modal[data-modal="pricing-table"]' \
  --map 'sv-form=.pr-modal[data-modal="contact-sales"]'
