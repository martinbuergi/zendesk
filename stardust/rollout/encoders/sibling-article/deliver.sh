#!/bin/sh
# encode migrated customer-story siblings -> content/customer/<name>.html:
# archetype-article.py -> sanitise -> localize-links (on a temp copy of the whole content tree)
# usage: sh stardust/rollout/encoders/sibling-article/deliver.sh <name>…   (name = slug without customer-)
set -e
cd /workspace/3055ed88
T=stardust/.work/sibling-article/lc
for n in "$@"; do
  python3 -I stardust/rollout/encoders/archetype-article.py stardust/migrated/customer/$n/index.html content/customer/$n.html \
    --media-base https://content.da.live/aemcoder/3055ed88/media/customer-$n --captured stardust/current/pages/customer-$n.html
  node stardust/scripts/deploy/sanitise.js content/customer/$n.html 2>/dev/null
done
rm -rf $T && mkdir -p $T && cp -r content/. $T/
node stardust/scripts/deploy/localize-links.mjs --source-host www.zendesk.com --content $T >/dev/null
for n in "$@"; do cp $T/customer/$n.html content/customer/$n.html; done
