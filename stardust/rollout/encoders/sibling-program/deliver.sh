#!/bin/sh
# encode migrated program siblings -> content/<slug>.html:
# encode.mjs -> media.mjs (rehost images) -> sanitise -> localize-links (on a temp copy of the content tree)
# usage: sh stardust/rollout/encoders/sibling-program/deliver.sh <slug>…
#   env LEGACY="slug slug" (legacy Basestyle family: nav-legacy/footer-legacy/theme legacy)
#   env PROMO_OFF="slug slug" (live page has no promo strip)
set -e
cd /workspace/3055ed88
E=stardust/rollout/encoders/sibling-program
T=stardust/.work/sibling-program/lc
for n in "$@"; do
  F=""
  case " $LEGACY " in *" $n "*) F="--legacy";; esac
  case " $PROMO_OFF " in *" $n "*) F="$F --promo-off";; esac
  node $E/encode.mjs stardust/migrated/$n/index.html content/$n.html --page-url https://www.zendesk.com/$n/ --capture stardust/current/pages/$n.html $F
  node $E/media.mjs content/$n.html $n --dir stardust/.work/sibling-program/media
  node stardust/scripts/deploy/sanitise.js content/$n.html 2>/dev/null
done
rm -rf $T && mkdir -p $T && cp -r content/. $T/
node stardust/scripts/deploy/localize-links.mjs --source-host www.zendesk.com --content $T >/dev/null
for n in "$@"; do cp $T/$n.html content/$n.html; done
