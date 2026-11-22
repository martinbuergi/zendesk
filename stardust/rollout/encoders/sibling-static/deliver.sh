#!/bin/sh
# encode migrated static-template siblings -> content/<path>.html with the archetype-static encoder:
# encode.py -> sanitise -> localize-links (on a temp copy of the whole content tree, other units' pages untouched)
# usage: sh stardust/rollout/encoders/sibling-static/deliver.sh <slug>…
# media: node stardust/rollout/encoders/archetype-static/avif2png.mjs stardust/migrated/assets/<slug> <MEDIA>/<slug>
#        (+ copy the png/jpg as-is), lowercase + '_'->'-' the names, then da-media-upload --scope <slug> --dir <MEDIA>/<slug>
# per-page encoder flags (what the sibling render could not carry) are in the case below.
set -e
cd /workspace/3055ed88
MEDIA=${MEDIA:-stardust/.work/cluster-static/media}
T=stardust/.work/sibling-static/lc
for s in "$@"; do
  case $s in
    trust-center) X="--cta-lg --tab-icons co-lock,co-shield,co-sparkle,co-doc" ;;
    sitemap) X="--meta-row nav=/nav-legacy --meta-row footer=/footer-legacy --meta-row theme=legacy" ;;
    *) X="" ;;
  esac
  mkdir -p "$MEDIA/$s"
  # shellcheck disable=SC2086
  python3 -I stardust/rollout/encoders/archetype-static/encode.py --page stardust/migrated/$s/index.html \
    --meta stardust/migrated/$s/_meta.json --scope "$s" --media-dir "$MEDIA/$s" --out content/$s.html $X
  node stardust/scripts/deploy/sanitise.js content/$s.html 2>/dev/null
done
rm -rf $T && mkdir -p $T && cp -r content/. $T/
node stardust/scripts/deploy/localize-links.mjs --source-host www.zendesk.com --content $T >/dev/null
for s in "$@"; do cp $T/$s.html content/$s.html; done
