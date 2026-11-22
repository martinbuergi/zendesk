#!/bin/sh
# regenerate content/pricing.html: encoder -> sanitise -> localize-links (on a temp copy of the tree)
# usage: sh build.sh [prototype.html] [content/out.html]
set -e
cd /workspace/3055ed88
SRC=${1:-stardust/prototypes/pricing-proposed.html}
OUT=${2:-content/pricing.html}
python3 -I stardust/rollout/encoders/archetype-unique/gen-content.py "$SRC" "$OUT"
node stardust/scripts/deploy/sanitise.js "$OUT" 2>/dev/null
T=stardust/.work/archetype-unique/lc
rm -rf $T && mkdir -p $T && cp content/*.html $T/
node stardust/scripts/deploy/localize-links.mjs --source-host www.zendesk.com --content $T >/dev/null
cp $T/$(basename "$OUT") "$OUT"
