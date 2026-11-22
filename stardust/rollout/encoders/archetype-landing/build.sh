#!/bin/sh
# regenerate content/index.html: generator -> sanitise -> localize-links (on a temp copy of the tree)
set -e
cd /workspace/3055ed88
python3 stardust/.work/archetype-landing/gen_content.py
node stardust/scripts/deploy/sanitise.js content/index.html 2>/dev/null
T=stardust/.work/archetype-landing/lc
rm -rf $T && mkdir -p $T && cp content/*.html $T/
node stardust/scripts/deploy/localize-links.mjs --source-host www.zendesk.com --content $T >/dev/null
cp $T/index.html content/index.html
